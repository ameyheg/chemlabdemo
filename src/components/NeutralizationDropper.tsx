// Neutralization Dropper - Enhanced Version
// Features: Realistic geometry, glass material, squeeze animation, drop stretching

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLabStore } from '../store/labStore';
import * as THREE from 'three';

export function NeutralizationDropper() {
    const dropRef = useRef<THREE.Mesh>(null);
    const bulbRef = useRef<THREE.Mesh>(null);
    const dropProgress = useRef(0);
    const lastDropTime = useRef(0);
    const squeezeProgress = useRef(0);

    // Store state
    const neutralizationAnimating = useLabStore(state => state.neutralizationAnimating);
    const neutralizationDropCount = useLabStore(state => state.neutralizationDropCount);
    const incrementNeutralizationDrops = useLabStore(state => state.incrementNeutralizationDrops);
    const placedApparatus = useLabStore(state => state.placedApparatus);
    const currentExperiment = useLabStore(state => state.currentExperiment);

    // Animation constants
    const DROP_INTERVAL = 1200; // Slower, more deliberate drops
    const TOTAL_DROPS = 5;

    // Materials
    const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0.1,
        transmission: 0.9, // Glass-like
        thickness: 0.1,
        transparent: true,
        opacity: 0.3
    }), []);

    const rubberMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#222222',
        roughness: 0.9,
        metalness: 0.1
    }), []);

    const liquidMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: '#e8f4fc', // HCl clear liquid
        transmission: 0.8,
        thickness: 0.2,
        roughness: 0.1,
        transparent: true,
        opacity: 0.7
    }), []);

    // Handle dropping animation
    useFrame((state, delta) => {
        if (!neutralizationAnimating || neutralizationDropCount >= TOTAL_DROPS) return;

        const now = state.clock.elapsedTime * 1000;

        // Squeeze animation logic (linked to drop cycle)
        // Cycle: 0-20% Squeeze, 20-40% Form Drop, 40-100% Fall/Recover

        const timeSinceLastDrop = now - lastDropTime.current;

        if (dropProgress.current === 0) {
            // Waiting phase
            if (timeSinceLastDrop > DROP_INTERVAL) {
                // Start new drop cycle
                dropProgress.current = 0.01;
            }

            // Reset bulb squeeze when waiting
            if (squeezeProgress.current > 0) {
                squeezeProgress.current = Math.max(0, squeezeProgress.current - delta * 3);
            }

            if (dropRef.current) dropRef.current.visible = false;

        } else {
            // Drop cycle active
            if (dropRef.current) dropRef.current.visible = true;

            // 1. Squeeze Bulb (Start of cycle)
            if (dropProgress.current < 0.2) {
                squeezeProgress.current = Math.min(1, squeezeProgress.current + delta * 5);
            } else {
                // Relax bulb
                squeezeProgress.current = Math.max(0, squeezeProgress.current - delta * 2);
            }

            // 2. Drop Animation
            dropProgress.current += delta * 1.8; // Faster, snappier drops

            if (dropRef.current) {
                // Drop stages:
                // 0.0 - 0.25: Forming at tip (grow scale + hang)
                // 0.25 - 1.0: Falling (acceleration + trail)

                if (dropProgress.current < 0.25) {
                    // Forming
                    const formRatio = dropProgress.current / 0.25;
                    dropRef.current.position.y = 2.15;
                    // Grow and sag slightly
                    dropRef.current.scale.set(
                        0.7 * (1 + Math.sin(formRatio * Math.PI) * 0.1),
                        0.8 * formRatio,
                        0.7 * (1 + Math.sin(formRatio * Math.PI) * 0.1)
                    );
                } else {
                    // Falling
                    const fallRatio = (dropProgress.current - 0.25) / 0.75;
                    const startY = 2.15;
                    const endY = 0.5;

                    // Gravity acceleration
                    const yPos = startY - ((startY - endY) * (fallRatio * fallRatio));
                    dropRef.current.position.y = yPos;

                    // Motion blur / Stretch (extreme at high speed)
                    const stretch = 1 + fallRatio * 1.2;
                    dropRef.current.scale.set(0.6 / stretch, 0.8 * stretch, 0.6 / stretch);
                }

                if (dropProgress.current >= 1) {
                    // Impact
                    incrementNeutralizationDrops();
                    lastDropTime.current = state.clock.elapsedTime * 1000;
                    dropProgress.current = 0;
                }
            }
        }

        // Update bulb scale for squeeze effect (with slight recoil)
        if (bulbRef.current) {
            const squeeze = squeezeProgress.current * 0.22;
            const recoil = Math.max(0, Math.sin(state.clock.elapsedTime * 15) * 0.03 * (1 - squeezeProgress.current));
            bulbRef.current.scale.set(1 + squeeze + recoil, 1 - squeeze + recoil, 1 + squeeze + recoil);
        }
    });

    const vessels = useLabStore(state => state.vessels);
    const beaker = Array.from(vessels.values()).find(v => v.type === 'beaker');
    const targetPos = beaker ? beaker.position : [0, 0, 0];
    const dropPosition = [targetPos[0], targetPos[1], targetPos[2]]; // Clone to avoid ref issues

    const showDropper = neutralizationAnimating || (placedApparatus.includes('dropper') && currentExperiment?.id === 'neutralization');

    if (!showDropper) return null;

    return (
        <group position={dropPosition as [number, number, number]}>
            {/* Dropper Assembly - Hovering above beaker */}
            <group position={[0, 2.8, 0]}>

                {/* Rubber Bulb */}
                <mesh ref={bulbRef} position={[0, 0.65, 0]}>
                    <sphereGeometry args={[0.16, 24, 24]} />
                    <primitive object={rubberMaterial} />
                </mesh>

                {/* Connector Cap */}
                <mesh position={[0, 0.48, 0]}>
                    <cylinderGeometry args={[0.07, 0.07, 0.15, 16]} />
                    <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.2} />
                </mesh>

                {/* Glass Tube Body */}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.05, 0.04, 0.9, 16]} />
                    <primitive object={glassMaterial} />
                </mesh>

                {/* Glass Tip (Tapered) */}
                <mesh position={[0, -0.6, 0]}>
                    <cylinderGeometry args={[0.04, 0.015, 0.3, 16]} />
                    <primitive object={glassMaterial} />
                </mesh>

                {/* Liquid Inside */}
                <group>
                    {/* Main body liquid */}
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.04, 0.03, 0.85, 12]} />
                        <primitive object={liquidMaterial} />
                    </mesh>
                    {/* Tip liquid */}
                    <mesh position={[0, -0.58, 0]}>
                        <cylinderGeometry args={[0.03, 0.005, 0.25, 12]} />
                        <primitive object={liquidMaterial} />
                    </mesh>
                </group>
            </group>

            {/* The Drop Shadow on liquid surface */}
            {dropRef.current?.visible && (
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, 1.45, 0]} // Fixed at liquid surface approx
                >
                    <circleGeometry args={[0.06, 16]} />
                    <meshBasicMaterial
                        color="black"
                        transparent
                        opacity={dropRef.current.position.y > 0.6 ? 0.3 * (1 - (dropRef.current.position.y - 0.6) / 2) : 0}
                    />
                </mesh>
            )}

            {/* The Drop */}
            <mesh ref={dropRef} position={[0, 1.35, 0]} visible={false}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <primitive object={liquidMaterial} />
            </mesh>
        </group>
    );
}
