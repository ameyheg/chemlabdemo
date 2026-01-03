// Tongs component - properly oriented in 3D space
// BoxGeometry: [width=X, height=Y, depth=Z]
// Paper at world [0, 1.35, 2], tongs grip from left side (-X direction)

import { useRef, useEffect } from 'react';
import { Group } from 'three';
import { useLabStore } from '../store/labStore';
import { PaperStrip, MagnesiumRibbon, AshPile } from './PhysicalChemicalItems';

export function Tongs() {
    const groupRef = useRef<Group>(null);

    const vessels = useLabStore((state) => state.vessels);
    const bunsenBurnerOn = useLabStore((state) => state.bunsenBurnerOn);
    const checkExperimentReaction = useLabStore((state) => state.checkExperimentReaction);

    const tongsVessel = Array.from(vessels.values()).find(v => v.type === 'tongs');

    const hasPaper = tongsVessel?.contents.some(c => c.chemical.id === 'paper');
    const hasMagnesium = tongsVessel?.contents.some(c => c.chemical.id === 'magnesium');
    const hasAsh = tongsVessel?.contents.some(c =>
        c.chemical.id === 'ash' || c.chemical.id === 'magnesium-oxide'
    );
    const hasAnything = hasPaper || hasMagnesium || hasAsh;
    const isHeating = bunsenBurnerOn && hasAnything;

    const burnCheckRef = useRef(false);
    useEffect(() => {
        if (isHeating && !burnCheckRef.current) {
            burnCheckRef.current = true;
            const timer = setTimeout(() => {
                checkExperimentReaction();
            }, 3000);
            return () => clearTimeout(timer);
        }
        if (!isHeating) {
            burnCheckRef.current = false;
        }
    }, [isHeating, checkExperimentReaction]);

    // Tongs group - gripping tips at local origin
    // Y=1.5 so ribbon bottom (~0.5 down) reaches flame tip (~Y=1.0-1.2)
    return (
        <group ref={groupRef} position={[0, 1.5, 2]}>
            {/* Top arm: extends from tip (0,0,0) to handle (-0.6, 0.15, 0) */}
            {/* Box centered at midpoint, rotated to follow the line */}
            <mesh
                position={[-0.3, 0.075, 0]}
                rotation={[0, 0, Math.atan2(0.15, 0.6)]}
            >
                <boxGeometry args={[0.62, 0.025, 0.025]} />
                <meshStandardMaterial color="#5a5a5a" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Bottom arm: extends from tip (0,0,0) to handle (-0.6, -0.15, 0) */}
            <mesh
                position={[-0.3, -0.075, 0]}
                rotation={[0, 0, -Math.atan2(0.15, 0.6)]}
            >
                <boxGeometry args={[0.62, 0.025, 0.025]} />
                <meshStandardMaterial color="#5a5a5a" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Pivot/rivet where arms cross - slightly inside from handles */}
            <mesh position={[-0.45, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.04, 12]} />
                <meshStandardMaterial color="#333" metalness={0.95} roughness={0.15} />
            </mesh>

            {/* Paper at tip (local origin = world [0, 1.35, 2]) */}
            <group position={[0, 0, 0]}>
                {hasPaper && <PaperStrip burning={isHeating} />}
                {hasMagnesium && <MagnesiumRibbon burning={isHeating} />}
                {hasAsh && <AshPile />}
            </group>
        </group>
    );
}
