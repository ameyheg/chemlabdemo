// FilterFunnel - For filtration experiments with filter paper
// Visualizes the funnel, filter paper, muddy water, runoff drops, and residue
// Physics-based animation driven by pendingFiltrationVolume in LabStore

import { useRef } from 'react';
import { useLabStore } from '../store/labStore';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface FilterFunnelProps {
    position: [number, number, number];
}

export function FilterFunnel({ position }: FilterFunnelProps) {
    const placedApparatus = useLabStore((state) => state.placedApparatus);
    // Note: We do NOT subscribe to pendingFiltrationVolume here to avoid re-renders.
    // We read it directly in useFrame.
    const hasFunnel = placedApparatus.includes('funnel');
    const hasFilterPaper = placedApparatus.includes('filter-paper');

    // Check if we have poured at least once to show guidance/residue logic eventually
    const hasPoured = useLabStore((state) => state.experimentActions.includes('pour'));

    // Refs for animation targets to avoid re-renders
    const liquidMeshRef = useRef<THREE.Mesh>(null);
    const residueMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const dropsGroupRef = useRef<THREE.Group>(null);

    const wasFilteringRef = useRef(false);
    const maxLevelRef = useRef(0);
    const residueMeshRef = useRef<THREE.Mesh>(null);

    // Filter Capacity (ml) for visual scaling
    const FUNNEL_CAPACITY = 120; // Reduced to 120 so 112.5ml looks nearly full
    // Filtration Rate (ml/sec)


    useFrame((_, delta) => {
        // Direct Store Access for Performance
        const pendingVolume = useLabStore.getState().pendingFiltrationVolume || 0;
        const addFiltrate = useLabStore.getState().addFiltrate;
        const performExperimentAction = useLabStore.getState().performExperimentAction;
        const checkExperimentReaction = useLabStore.getState().checkExperimentReaction;

        // Visual Logic
        if (pendingVolume > 0.1) {
            wasFilteringRef.current = true;

            // 1. Draining Logic (Physics)
            // Dynamic Rate: Slow while pouring (to build up), Fast when stopped (to finish)
            const isPouring = useLabStore.getState().isPouringActive;
            const effectiveRate = isPouring ? 12 : 20;

            // Transfer volume from Pending -> Collection Beaker
            const transferAmount = effectiveRate * delta;
            addFiltrate(transferAmount);

            // 2. Visual Level Logic
            // Level 0..1 based on Volume / Capacity
            const level = Math.min(pendingVolume / FUNNEL_CAPACITY, 1.0);

            // Track max level reached for residue
            if (level > maxLevelRef.current) {
                maxLevelRef.current = level;
            }

            if (liquidMeshRef.current) {
                liquidMeshRef.current.visible = true; // Ensure visible
                // Uniform scaling for draining cone (radius shrinks with height)
                // Minimum visual scale to ensure visibility even at low volumes
                const visualLevel = Math.max(level, 0.2);
                // Reduced scale to 0.90 to avoid z-fighting with paper
                liquidMeshRef.current.scale.set(0.90 * visualLevel, visualLevel, 0.90 * visualLevel);
                // Position shift to keep Apex fixed inside paper (Apex Y ~ -0.51)
                // Formula: ApexY + HalfHeight * ScaleY = -0.51 + 0.6 * ScaleY
                liquidMeshRef.current.position.y = -0.51 + 0.6 * visualLevel;
            }
        }

        // 3. Residue Animation (Always update to ensure persistence)
        if (residueMatRef.current && residueMeshRef.current && maxLevelRef.current > 0) {
            // Ensure opacity sticks (or increases if still filtering)
            if (pendingVolume > 0.1) {
                residueMatRef.current.opacity = Math.min(residueMatRef.current.opacity + delta * 0.2, 0.9);
            }

            // Height logic - Residue stain grows with liquid max height
            const residueLevel = Math.max(maxLevelRef.current, 0.15);
            // Reduced scale to 0.88 to avoid z-fighting with paper and visible gap from liquid
            residueMeshRef.current.scale.set(0.88 * residueLevel, residueLevel, 0.88 * residueLevel);
            // Position shift to keep Apex fixed inside paper
            residueMeshRef.current.position.y = -0.51 + 0.6 * residueLevel;

            // Force visibility if needed
            residueMeshRef.current.visible = true;
        }

        if (pendingVolume > 0.1) {
            // 4. Drops Animation
            if (dropsGroupRef.current) {
                dropsGroupRef.current.visible = true;
                dropsGroupRef.current.children.forEach((child, _) => {
                    const mesh = child as THREE.Mesh;
                    // Fall speed
                    mesh.position.y -= delta * 3;

                    // Reset loop
                    if (mesh.position.y < -2.5) {
                        mesh.position.y = -0.9 - Math.random() * 0.2;
                        mesh.visible = true;
                    }
                });
            }
        } else {
            // Not filtering (Empty)
            if (liquidMeshRef.current) {
                if (liquidMeshRef.current.visible) liquidMeshRef.current.visible = false;
            }
            if (dropsGroupRef.current) {
                if (dropsGroupRef.current.visible) dropsGroupRef.current.visible = false;
            }

            // Detect Completion Edge Case
            if (wasFilteringRef.current) {
                wasFilteringRef.current = false;

                // Only trigger completion if source beaker is essentially empty
                const vessels = useLabStore.getState().vessels;
                const sourceBeakers = Array.from(vessels.values())
                    .filter(v => v.type === 'beaker' && v.id !== 'collection_beaker');

                let totalSourceVolume = 0;
                sourceBeakers.forEach(b => totalSourceVolume += b.currentVolume);

                if (totalSourceVolume < 5) {
                    performExperimentAction('filter');
                    checkExperimentReaction();
                }
            }
        }
    });

    if (!hasFunnel) return null;

    return (
        <group position={position}>
            {/* FUNNEL GROUP */}
            <group position={[0, 1.5, 0]}>
                {/* Visuals - Rotated 180 (Apex Down) */}

                {/* 1. Main Glass Cone */}
                <mesh rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[1.0, 1.2, 32, 1, true]} />
                    <meshBasicMaterial color="#c8e6f8" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>

                {/* 2. Rim (Top) */}
                <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.95, 1.05, 32]} />
                    <meshBasicMaterial color="#e0e0e0" side={THREE.DoubleSide} />
                </mesh>

                {/* 3. Stem (Bottom) */}
                <mesh position={[0, -0.9, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 1.0, 16]} />
                    <meshBasicMaterial color="#c8e6f8" transparent opacity={0.4} depthWrite={false} />
                </mesh>

                {/* FILTER PAPER & CONTENTS */}
                {hasFilterPaper && (
                    <group>
                        {/* Paper Cone - Outer Layer */}
                        <mesh position={[0, 0.05, 0]} scale={[0.95, 0.95, 0.95]} rotation={[Math.PI, 0, 0]}>
                            <coneGeometry args={[1.0, 1.2, 32, 1, true]} />
                            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.4} depthWrite={false} />
                        </mesh>

                        {/* Muddy Water - Inner Layer */}
                        <mesh
                            ref={liquidMeshRef}
                            position={[0, 0, 0]} // Updated by useFrame
                            rotation={[Math.PI, 0, 0]}
                            visible={false} // Hidden initially
                        >
                            <coneGeometry args={[0.92, 1.12, 32, 1]} />
                            <meshBasicMaterial color="#8b7355" />
                        </mesh>

                        {/* Residue Layer - Middle Layer with Polygon Offset */}
                        <group>
                            <mesh
                                ref={residueMeshRef}
                                position={[0, 0.06, 0]}
                                scale={[0, 0, 0]} // Start invisible (logic triggers growth)
                                rotation={[Math.PI, 0, 0]}
                                visible={false} // Start hidden
                            >
                                <coneGeometry args={[0.96, 1.18, 32, 1, true]} />
                                <meshBasicMaterial
                                    ref={residueMatRef}
                                    color="#5d4037"
                                    side={THREE.DoubleSide}
                                />
                            </mesh>
                        </group>
                    </group>
                )}

                {/* DROPS GROUP - Animated via Ref */}
                <group ref={dropsGroupRef} visible={false}>
                    {[...Array(8)].map((_, i) => (
                        <mesh key={i} position={[0, -0.9 - i * 0.4, 0]} scale={[0.8, 0.8, 0.8]}>
                            <sphereGeometry args={[0.05, 8, 8]} />
                            <meshBasicMaterial color="#c8e0ff" />
                        </mesh>
                    ))}
                </group>
            </group>

            {/* GUIDANCE LABELS */}
            {hasFunnel && !hasFilterPaper && (
                <Html position={[0, 2.0, 0]} center>
                    <div className="text-xs text-white bg-black/60 px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap border border-white/20 select-none pointer-events-none">
                        Add Filter Paper
                    </div>
                </Html>
            )}
            {hasFilterPaper && !hasPoured && (
                <Html position={[0, 2.0, 0]} center>
                    <div className="text-xs text-white bg-black/60 px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap border border-white/20 select-none pointer-events-none">
                        Pour from Beaker
                    </div>
                </Html>
            )}
        </group>
    );
}
