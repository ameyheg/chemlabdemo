// PouringSystem - Handles liquid transfer detection and visualization

import { useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useLabStore } from '../store/labStore';
import { SoundManager } from '../core/SoundManager';

const POUR_THRESHOLD_ANGLE = 45; // degrees
const POUR_DISTANCE_THRESHOLD = 5; // units (Increased to ensure detection)
const POUR_RATE = 0.825; // Increased by another 20% (0.6875 * 1.2)

export function PouringSystem() {
    const { scene } = useThree();
    const lastPourTime = useRef(0);

    // Subscribe to state
    const vessels = useLabStore((state) => state.vessels);
    const transferLiquid = useLabStore((state) => state.transferLiquid);
    const setPouringState = useLabStore((state) => state.setPouringState);
    const isPouringActive = useLabStore((state) => state.isPouringActive);
    const pouringSourceId = useLabStore((state) => state.pouringSourceId);
    const pouringTargetId = useLabStore((state) => state.pouringTargetId);

    // Check for pouring opportunities each frame
    useFrame((_, delta) => {
        const now = performance.now();

        // Throttle to prevent too frequent updates
        if (now - lastPourTime.current < 16) return; // ~60fps
        lastPourTime.current = now;

        const vesselsArray = Array.from(vessels.values());
        let foundPour = false;

        // Find any vessel that is tilted enough to pour
        for (const source of vesselsArray) {
            // Get actual object from scene for smooth animation sync
            const sourceObj = scene.getObjectByName(source.id);
            if (!sourceObj) continue;

            // Calculate tilt from Object rotation
            // Beaker tilts Z axis negative: <group rotation={[0, 0, -tiltRadians]}>
            const tilt = Math.abs(sourceObj.rotation.z * (180 / Math.PI));

            if (tilt < POUR_THRESHOLD_ANGLE || source.currentVolume <= 0) {
                continue;
            }

            const sourcePos = sourceObj.position; // Use Scene Position

            for (const target of vesselsArray) {
                if (target.id === source.id) continue;

                const targetObj = scene.getObjectByName(target.id);
                const targetPos = targetObj ? targetObj.position : new Vector3(...target.position);

                const distance = sourcePos.distanceTo(targetPos);

                if (distance < POUR_DISTANCE_THRESHOLD) {
                    // Check if target has room
                    if (target.currentVolume >= target.capacity) continue;

                    const directionToTarget = targetPos.x - sourcePos.x;

                    // Allow overhead pouring (filtration requires source to be above)
                    // Simplified check: ensure roughly aligned horizontally
                    // Increased range to +/- 3 to allow pouring from x=1.0 to funnel at x=3.5
                    if (directionToTarget > -3 && directionToTarget < 3) {
                        // Activate pouring
                        if (!isPouringActive || pouringSourceId !== source.id || pouringTargetId !== target.id) {
                            setPouringState(true, source.id, target.id);
                            SoundManager.playPour('pouring');
                        }

                        const tiltFactor = Math.min((tilt - POUR_THRESHOLD_ANGLE) / 45, 1);
                        const pourAmount = POUR_RATE * tiltFactor * delta * 60;

                        transferLiquid(source.id, target.id, pourAmount);
                        foundPour = true;
                        break;
                    }
                }
            }
            if (foundPour) break;
        }

        if (!foundPour && isPouringActive) {
            setPouringState(false);
            SoundManager.stopSound('pouring');
        }
    });

    return null;
}
