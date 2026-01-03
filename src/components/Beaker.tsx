// Beaker 3D Component - Renders a beaker with liquid visualization

import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Mesh, DoubleSide, Group, Vector3, Vector2, Plane, Raycaster, Color } from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useLabStore } from '../store/labStore';
import { IceCubes } from './PhysicalChemicalItems';

interface BeakerProps {
    vesselId: string;
}

export function Beaker({ vesselId }: BeakerProps) {
    const meshRef = useRef<Mesh>(null);
    const groupRef = useRef<Group>(null);
    const liquidRef = useRef<Group>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isMoving, setIsMoving] = useState(false); // New: moving mode
    const [dragStartY, setDragStartY] = useState(0);

    const { camera, gl } = useThree();

    // Subscribe to specific vessel properties for proper reactivity
    const vessel = useLabStore((state) => state.vessels.get(vesselId));
    const contents = useLabStore((state) => state.vessels.get(vesselId)?.contents ?? []);
    const selectedVesselId = useLabStore((state) => state.selectedVesselId);
    const selectVessel = useLabStore((state) => state.selectVessel);
    const updateVesselTilt = useLabStore((state) => state.updateVesselTilt);
    const updateVesselPosition = useLabStore((state) => state.updateVesselPosition);
    const isStirring = useLabStore((state) => state.isStirring);
    const experimentActions = useLabStore((state) => state.experimentActions);
    const currentExperiment = useLabStore((state) => state.currentExperiment);
    const bunsenBurnerOn = useLabStore((state) => state.bunsenBurnerOn);
    const checkExperimentReaction = useLabStore((state) => state.checkExperimentReaction);
    const neutralizationDropCount = useLabStore((state) => state.neutralizationDropCount);

    // Track if salt has been dissolved (stir completed)
    const saltDissolved = experimentActions.includes('stir') && !isStirring;

    // Stir animation progress (0 to 1) for gradual dissolution
    const [stirProgress, setStirProgress] = useState(0);
    // Settling animation progress (0 to 1) for gradual sand settling after stir ends
    const [settlingProgress, setSettlingProgress] = useState(0);
    const [wasStirring, setWasStirring] = useState(false);

    // Ice melting progress (0 to 1) - tracks water from melted ice
    const [iceMeltProgress, setIceMeltProgress] = useState(0);
    const [iceMeltCompleted, setIceMeltCompleted] = useState(false);

    // Ripple effect for Neutralization
    const [ripples, setRipples] = useState<{ id: number, time: number }[]>([]);
    // State for splash particles
    const [splashes, setSplashes] = useState<{ id: number, time: number, x: number, z: number }[]>([]);
    const lastDropCount = useRef(0);

    useEffect(() => {
        if (currentExperiment?.id === 'neutralization' && neutralizationDropCount > lastDropCount.current) {
            // Check if THIS beaker contains the reactants
            const hasNaOH = contents.some(c => c.chemical.id === 'naoh');
            const hasPhenol = contents.some(c => c.chemical.id === 'phenolphthalein');

            if (hasNaOH && hasPhenol) {
                // New drop impact!
                const impactTime = Date.now();

                // Add ripple
                setRipples(prev => [...prev.slice(-10), { id: impactTime, time: impactTime }]);

                // Add splash
                setSplashes(prev => [...prev.slice(-5), { id: impactTime, time: impactTime, x: (Math.random() - 0.5) * 0.1, z: (Math.random() - 0.5) * 0.1 }]);

                // Sound feedback
                import('../core/SoundManager').then(({ SoundManager }) => {
                    SoundManager.playDropSound();
                });
            }

            lastDropCount.current = neutralizationDropCount;
        }
    }, [neutralizationDropCount, currentExperiment?.id, contents]);

    // Animation loop for ripples and splashes
    useFrame(() => {
        const now = Date.now();

        // Update ripples
        setRipples(prev => prev.filter(r => now - r.id < 600)); // Faster cleanup for ripples reaching beaker edge

        // Update splashes
        setSplashes(prev => prev.filter(s => now - s.time < 800));
    });

    const isSelected = selectedVesselId === vesselId;


    // Stir animation - rotate liquid and track progress for particle dissolution
    useFrame((_, delta) => {
        if (isStirring && liquidRef.current) {
            liquidRef.current.rotation.y -= delta * 5; // Spin effect (reversed to match rod)
            // Increase stir progress for gradual dissolution (4 second stir = progress 0 to 1)
            setStirProgress(prev => Math.min(prev + delta / 4, 1));
            setWasStirring(true);
            setSettlingProgress(0); // Reset settling while stirring
        } else if (wasStirring && !isStirring && settlingProgress < 1) {
            // Settling animation after stirring stops (2 seconds to settle)
            setSettlingProgress(prev => Math.min(prev + delta / 2, 1));
        }

        // Ice melting - update progress when hot (temp > 50)
        const temp = vessel?.temperature || 25;
        const hasIceContent = contents.some(c => c.chemical.id === 'ice');
        if (temp > 50 && hasIceContent && iceMeltProgress < 1) {
            // Melt over ~8 seconds for visible effect
            const newProgress = Math.min(iceMeltProgress + delta * 0.125, 1);
            setIceMeltProgress(newProgress);

            // When ice fully melts, turn off burner automatically and trigger reaction
            if (newProgress >= 0.95 && !iceMeltCompleted) {
                setIceMeltCompleted(true);

                // Turn off burner to prevent boiling
                if (bunsenBurnerOn) {
                    // Use store directly to turn off burner
                    useLabStore.getState().toggleBunsenBurner();
                }

                // Trigger experiment reaction check for physical-chemical experiment
                if (currentExperiment?.id === 'physical-chemical') {
                    setTimeout(() => checkExperimentReaction(), 500);
                }
            }
        }

        // Animate ripples
        if (ripples.length > 0) {
            // Update time, remove old ripples (> 1.5s)
            setRipples(prev => prev.map(r => ({ ...r, time: r.time + delta })).filter(r => r.time < 1.5));
        }
    });

    // Beaker dimensions
    const beakerHeight = 2;
    const beakerRadius = 0.8;

    // Get position from vessel
    const position = vessel?.position || [0, 0, 0];
    const capacity = vessel?.capacity || 500;
    const temperature = vessel?.temperature || 25;

    // Get original ice volume (before melting)
    const originalIceVolume = useMemo(() => {
        return contents.reduce((acc, curr) => {
            if (curr.chemical.id === 'ice') return acc + curr.volume;
            return acc;
        }, 0);
    }, [contents]);

    // Calculate liquid volume (excluding solid ice, but adding melted ice water)
    const liquidVolume = useMemo(() => {
        const nonIceVolume = contents.reduce((acc, curr) => {
            if (curr.chemical.id === 'ice') return acc;
            return acc + curr.volume;
        }, 0);

        // Add water from melted ice proportional to melt progress
        // Use 40% of ice volume to match visual size of ice cubes
        // (3D ice cubes appear smaller than equivalent liquid cylinder)
        const visualIceRatio = 0.4;
        const meltedWaterVolume = originalIceVolume * visualIceRatio * iceMeltProgress;

        return nonIceVolume + meltedWaterVolume;
    }, [contents, originalIceVolume, iceMeltProgress]);

    // Calculate liquid height based on liquid volume
    const liquidHeight = useMemo(() => {
        if (liquidVolume === 0) return 0;
        const fillRatio = liquidVolume / capacity;
        return fillRatio * (beakerHeight - 0.2);
    }, [liquidVolume, capacity, beakerHeight]);

    // Calculate liquid color - shows water when ice melting, or other chemical colors
    const liquidColor = useMemo(() => {
        // If ice is melting, show water blue
        if (originalIceVolume > 0 && iceMeltProgress > 0) {
            return '#a8e4ff'; // Clear water blue from melted ice
        }

        if (contents.length === 0) return '#4fc3f7';

        // Neutralization Color Interpolation
        if (currentExperiment?.id === 'neutralization') {
            const neutralizationComplete = useLabStore.getState().neutralizationComplete;

            // If experiment is marked complete, force the colorless state
            if (neutralizationComplete) return '#f5f5f5';

            const hasNaOH = contents.some(c => c.chemical.id === 'naoh');
            const hasPhenol = contents.some(c => c.chemical.id === 'phenolphthalein');

            if (hasNaOH && hasPhenol) {
                const baseColor = new Color('#ff69b4'); // Pink (Phenolphthalein in base)
                const targetColor = new Color('#f5f5f5'); // Colorless (Neutral/Acidic)

                // Abrupt transition (titration endpoint realism):
                // Drops 1-4: Stay pinkish (very slight fade)
                // Drop 5: Turn colorless
                let displayProgress = 0;
                if (neutralizationDropCount >= 5) {
                    displayProgress = 1.0;
                } else {
                    displayProgress = neutralizationDropCount * 0.08; // Very subtle fading
                }

                const lerped = baseColor.clone().lerp(targetColor, displayProgress);
                return '#' + lerped.getHexString();
            }
        }

        const primaryContent = contents.reduce((prev, curr) =>
            curr.volume > prev.volume ? curr : prev
        );

        // Check for salt content
        const hasSaltContent = contents.some(c =>
            (c.chemical.name?.toLowerCase().includes('salt') || c.chemical.id === 'salt') &&
            !c.chemical.name?.toLowerCase().includes('solution')
        );

        // Milky if salt dissolved
        const isDissolved = experimentActions.includes('stir') && !isStirring && hasSaltContent;

        if (isDissolved) {
            return '#e0f0ff'; // Milky/cloudy white-blue
        }

        return primaryContent.chemical.color;
    }, [contents, experimentActions, isStirring, originalIceVolume, iceMeltProgress, currentExperiment, neutralizationDropCount]);

    // Check if there are particles (salt, sand) that should be visible
    const hasSalt = useMemo(() => {
        return contents.some(c => {
            const name = c.chemical.name?.toLowerCase() || '';
            const id = c.chemical.id?.toLowerCase() || '';
            return (name.includes('salt') || id === 'salt') && !name.includes('solution');
        });
    }, [contents]);

    const hasSand = useMemo(() => {
        return contents.some(c => {
            const name = c.chemical.name?.toLowerCase() || '';
            const id = c.chemical.id?.toLowerCase() || '';
            return name.includes('sand') || id === 'sand';
        });
    }, [contents]);

    const hasIce = useMemo(() => {
        return contents.some(c => c.chemical.id === 'ice');
    }, [contents]);

    const hasParticles = hasSalt || hasSand;

    // Get particle color based on type
    const particleColor = useMemo(() => {
        if (hasSand) return '#c4a465'; // Tan/brown for sand
        if (hasSalt) return '#ffffff'; // Bright white for salt crystals
        return '#ffffff';
    }, [hasSalt, hasSand]);

    // Generate particle positions for salt/sand crystals using seeded pseudo-random values
    // IMPORTANT: Salt dissolves (particles shrink during stir, disappear after) but sand settles
    const particlePositions = useMemo(() => {
        if (!hasParticles || liquidHeight === 0) return [];
        const positions: [number, number, number][] = [];

        // Simple seeded random for deterministic positions
        const seededRandom = (seed: number) => {
            const x = Math.sin(seed * 9999) * 10000;
            return x - Math.floor(x);
        };

        if (hasSalt && !hasSand) {
            // Salt: no particles if already dissolved
            if (saltDissolved) return [];

            // During stirring: particles are still generated (they shrink via particleScale)
            // Before stirring: normal particles
            const saltParticleCount = 100;
            for (let i = 0; i < saltParticleCount; i++) {
                // Particles rotate with the group, no extra offset needed
                const angle = (i / saltParticleCount) * Math.PI * 2 + seededRandom(i * 7) * 0.5;
                const radius = 0.15 + seededRandom(i * 13) * 0.35;

                // If stirring: particles swirl throughout liquid
                // If not stirring (initial): particles settle at bottom
                const height = isStirring
                    ? 0.15 + seededRandom(i * 17) * (liquidHeight * 0.6)
                    : 0.05 + seededRandom(i * 17) * 0.1; // Settled at bottom initially

                positions.push([Math.cos(angle) * radius, height, Math.sin(angle) * radius]);
            }
        } else if (hasSand) {
            // Sand: particles stay visible and settle at bottom (insoluble)
            const sandParticleCount = 200;
            for (let i = 0; i < sandParticleCount; i++) {
                const angle = (i / sandParticleCount) * Math.PI * 2 + seededRandom(i * 7) * 0.5;
                const radius = 0.15 + seededRandom(i * 13) * 0.4;

                // Gradual settling: interpolate from swirling height to settled height
                const swirlingHeight = 0.2 + seededRandom(i * 17) * (liquidHeight * 0.5);
                const settledHeight = 0.05 + seededRandom(i * 17) * 0.1;

                let height: number;
                if (isStirring) {
                    height = swirlingHeight;
                } else {
                    // Gradually settle using settlingProgress (0 = still swirling, 1 = fully settled)
                    height = swirlingHeight + (settledHeight - swirlingHeight) * settlingProgress;
                }

                positions.push([Math.cos(angle) * radius, height, Math.sin(angle) * radius]);
            }
        }

        return positions;
    }, [hasParticles, hasSalt, hasSand, liquidHeight, isStirring, saltDissolved, stirProgress, settlingProgress]);

    // Particle scale - salt shrinks during stirring, sand stays same size
    const particleScale = useMemo(() => {
        if (hasSalt && !hasSand && isStirring) {
            // Shrink from 0.06 to 0 over stir duration
            return 0.06 * (1 - stirProgress);
        }
        return hasSalt ? 0.06 : 0.03; // Smaller salt crystals, tiny sand particles
    }, [hasSalt, hasSand, isStirring, stirProgress]);

    // Get tilt angle in radians
    const tiltAngle = vessel?.tiltAngle || 0;
    const tiltRadians = (tiltAngle * Math.PI) / 180;

    // Handle click to select
    const handleClick = useCallback((e: any) => {
        e.stopPropagation();
        selectVessel(vesselId);
    }, [vesselId, selectVessel]);

    // Handle pointer down for drag
    const handlePointerDown = useCallback((e: any) => {
        e.stopPropagation();
        if (!isSelected) {
            selectVessel(vesselId);
            return;
        }

        // Disable tilt/move for salt-dissolution and filtration experiments
        // (For filtration, we only want Hold-to-Pour automation, not manual drag)
        if (currentExperiment?.id === 'salt-dissolution' || currentExperiment?.id === 'filtration' || currentExperiment?.id === 'physical-chemical') {
            return;
        }

        // Check if Shift is held for moving mode
        const shiftHeld = e.shiftKey || e.nativeEvent?.shiftKey;
        setIsMoving(shiftHeld);
        setIsDragging(true);
        setDragStartY(e.clientY || e.nativeEvent?.clientY || 0);

        if (e.target?.setPointerCapture && e.pointerId !== undefined) {
            e.target.setPointerCapture(e.pointerId);
        }
    }, [isSelected, vesselId, selectVessel, currentExperiment]);

    // Raycaster for ground plane intersection
    const raycaster = useMemo(() => new Raycaster(), []);
    const groundPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);

    // Handle pointer move for tilt or move
    const handlePointerMove = useCallback((e: any) => {
        if (!isDragging || !isSelected) return;
        e.stopPropagation();

        if (isMoving) {
            // Moving mode: drag beaker on ground plane (XZ movement)
            const rect = gl.domElement.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(new Vector2(mouseX, mouseY), camera);
            const intersection = new Vector3();
            raycaster.ray.intersectPlane(groundPlane, intersection);

            if (intersection) {
                // Clamp to reasonable bounds
                const newX = Math.max(-4, Math.min(4, intersection.x));
                const newZ = Math.max(-4, Math.min(4, intersection.z));

                // Check if beaker is in the heating zone (centered at burner position)
                // Burner is at [0, 0, 2], platform is at Y=1.0
                const heatingZoneX = 0;
                const heatingZoneZ = 2.0;
                const heatingZoneRadius = 0.8;
                const standHeight = 1.0; // Height of tripod stand platform

                const distToHeatingZone = Math.sqrt(
                    Math.pow(newX - heatingZoneX, 2) + Math.pow(newZ - heatingZoneZ, 2)
                );

                // Snap to center and elevate if in heating zone
                if (distToHeatingZone < heatingZoneRadius) {
                    // Snap to center of the stand
                    updateVesselPosition(vesselId, [heatingZoneX, standHeight, heatingZoneZ]);
                } else {
                    updateVesselPosition(vesselId, [newX, 0, newZ]);
                }
            }
        } else {
            // Tilt mode (original behavior)
            const currentY = e.clientY || e.nativeEvent?.clientY || 0;
            const deltaY = dragStartY - currentY;
            const sensitivity = 0.5;
            // Clamp to 0-70 degrees (don't go fully horizontal)
            const newTilt = Math.max(0, Math.min(70, tiltAngle + deltaY * sensitivity));

            updateVesselTilt(vesselId, newTilt);
            setDragStartY(currentY);
        }
    }, [isDragging, isSelected, isMoving, vesselId, tiltAngle, updateVesselTilt, updateVesselPosition, dragStartY, camera, gl, raycaster, groundPlane]);

    // Handle pointer up
    const handlePointerUp = useCallback((e: any) => {
        if (isDragging) {
            e.stopPropagation();
            setIsDragging(false);
            setIsMoving(false);
            if (e.target?.releasePointerCapture && e.pointerId !== undefined) {
                e.target.releasePointerCapture(e.pointerId);
            }
        }
    }, [isDragging]);

    if (!vessel) return null;

    // Heat glow indicator
    const isHot = temperature > 50;
    const isBoiling = temperature >= 100;

    // Auto-Pour Logic
    const isAutoPouring = useLabStore((state) => state.isAutoPouring);

    // Animate auto-pour
    useFrame((_, delta) => {
        if (!groupRef.current) return;

        // Check if this beaker should auto-pour (source with muddy water in filtration)
        const isSourceCandidate = contents.some(c => c.chemical.id === 'muddy-water');

        if (isAutoPouring && isSourceCandidate) {
            // Target Position (Above Funnel)
            // Funnel is usually at [0, Y, 0]? 
            // Target Position - Aligned to pour into the filter funnel
            // Positioned at [1.0, 2.6, 0] to overlap correctly with the funnel
            const targetPos = new Vector3(1.0, 2.6, 0);
            const targetTilt = -Math.PI / 2.2; // ~80 degrees

            // Lerp Position
            groupRef.current.position.lerp(targetPos, delta * 4);

            // Lerp Rotation (Outer Group)
            // Use MathUtils.lerp for scalar rotation
            groupRef.current.rotation.z += (targetTilt - groupRef.current.rotation.z) * delta * 4;

        } else if (!isDragging && !isMoving) {
            // Return to shelf position or resting state
            // Only if we were auto-pouring?
            // We check if rotation is non-zero (from auto-pour)
            if (Math.abs(groupRef.current.rotation.z) > 0.01) {
                groupRef.current.rotation.z += (0 - groupRef.current.rotation.z) * delta * 4;
            }
            // Position is handled by React props (position={position}) 
            // unless we manually overrode it.
            // If we stop writing to position, it might snap back on re-render.
            // But smoothly returning is better.
            // We can let React prop take over, but 'position' prop won't change.
            // So if current.position != prop.position, lerp back?
            const defaultPos = new Vector3(position[0], position[1], position[2]);
            if (groupRef.current.position.distanceTo(defaultPos) > 0.1) {
                groupRef.current.position.lerp(defaultPos, delta * 4);
            }
        }
    });

    return (
        <group
            ref={groupRef}
            name={vesselId} // Required for PouringSystem to find this object
            position={position as [number, number, number]}
        >
            {/* Negative Z rotation tilts the beaker to the RIGHT (toward positive X) */}
            <group rotation={[0, 0, -tiltRadians]}>

                {/* Selection indicator ring at base */}
                {isSelected && (
                    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[beakerRadius + 0.1, beakerRadius + 0.25, 32]} />
                        <meshBasicMaterial color={isMoving ? "#ffaa00" : "#00ff88"} transparent opacity={0.9} />
                    </mesh>
                )}

                {/* Heat glow under beaker */}
                {isHot && (
                    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[beakerRadius * 1.2, 32]} />
                        <meshBasicMaterial
                            color={isBoiling ? "#ff4400" : "#ff8800"}
                            transparent
                            opacity={0.3}
                        />
                    </mesh>
                )}

                {/* Beaker body - glass cylinder */}
                <mesh
                    ref={meshRef}
                    position={[0, beakerHeight / 2, 0]}
                    onClick={handleClick}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    <cylinderGeometry
                        args={[beakerRadius, beakerRadius * 0.9, beakerHeight, 32, 1, true]}
                    />
                    <meshBasicMaterial
                        color={isSelected ? "#aaffcc" : isHot ? "#ffccaa" : "#c8e6f8"}
                        transparent
                        opacity={isSelected ? 0.3 : 0.2}
                        side={DoubleSide}
                        depthWrite={false}
                    />
                </mesh>

                {/* Beaker bottom */}
                <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[beakerRadius * 0.9, 32]} />
                    <meshBasicMaterial
                        color="#c8e6f8"
                        transparent
                        opacity={0.25}
                        depthWrite={false}
                    />
                </mesh>

                {/* Beaker rim */}
                <mesh position={[0, beakerHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[beakerRadius - 0.05, beakerRadius + 0.02, 32]} />
                    <meshBasicMaterial color="#e0e0e0" />
                </mesh>

                {/* Pour spout indicator when tilted - on the RIGHT side where pour happens */}
                {tiltAngle > 30 && (
                    <mesh position={[-beakerRadius * 0.8, beakerHeight + 0.1, 0]}>
                        <sphereGeometry args={[0.1, 12, 12]} />
                        <meshBasicMaterial color={tiltAngle > 45 ? "#ff4444" : "#ffaa00"} />
                    </mesh>
                )}

                {/* Graduation marks */}
                {[0.25, 0.5, 0.75].map((ratio, index) => (
                    <mesh
                        key={index}
                        position={[beakerRadius - 0.02, ratio * beakerHeight + 0.1, 0]}
                    >
                        <boxGeometry args={[0.15, 0.02, 0.01]} />
                        <meshBasicMaterial color="#888888" />
                    </mesh>
                ))}

                {/* Ice Cubes - show while melting until fully melted */}
                {hasIce && iceMeltProgress < 0.95 && (
                    <group position={[0, 0.05, 0]}>
                        <IceCubes scale={0.8} melting={isHot} />
                    </group>
                )}

                {/* Liquid inside beaker - wrapped for stir animation */}
                {liquidHeight > 0 && (
                    <group ref={liquidRef}>
                        <mesh position={[0, liquidHeight / 2 + 0.05, 0]} renderOrder={1}>
                            <cylinderGeometry
                                args={[beakerRadius * 0.82, beakerRadius * 0.80, liquidHeight, 32]}
                            />
                            <meshBasicMaterial
                                color={liquidColor}
                                transparent
                                opacity={0.85}
                            />
                        </mesh>

                        {/* Liquid surface (top) */}
                        <mesh
                            position={[0, liquidHeight + 0.05, 0]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            renderOrder={2}
                        >
                            <circleGeometry args={[beakerRadius * 0.82, 32]} />
                            <meshBasicMaterial
                                color={liquidColor}
                                transparent
                                opacity={0.95}
                            />

                        </mesh>

                        {/* Ripples for Neutralization */}
                        {ripples.map(r => {
                            const elapsed = (Date.now() - r.id) / 1000;
                            return (
                                <mesh
                                    key={r.id}
                                    rotation={[-Math.PI / 2, 0, 0]}
                                    position={[0, liquidHeight + 0.052, 0]}
                                    renderOrder={3}
                                >
                                    <ringGeometry args={[0.05 + elapsed * 1.6, 0.15 + elapsed * 1.6, 32]} />
                                    <meshBasicMaterial
                                        color="white"
                                        transparent
                                        opacity={Math.max(0, 0.4 - elapsed * 0.3)}
                                        side={DoubleSide}
                                    />
                                </mesh>
                            );
                        })}

                        {/* Splashes for Neutralization */}
                        {splashes.map(s => {
                            const elapsed = (Date.now() - s.id) / 1000;
                            // 5 particles per splash
                            return [0, 1, 2, 3, 4].map(idx => {
                                const angle = (idx / 5) * Math.PI * 2;
                                const spread = elapsed * 0.8;
                                const height = Math.sin(elapsed * Math.PI) * 0.4;
                                return (
                                    <mesh
                                        key={`${s.id}_${idx}`}
                                        position={[
                                            s.x + Math.cos(angle) * spread,
                                            liquidHeight + height + 0.06,
                                            s.z + Math.sin(angle) * spread
                                        ]}
                                    >
                                        <sphereGeometry args={[0.02 * (1 - elapsed), 8, 8]} />
                                        <meshBasicMaterial color="white" transparent opacity={1 - elapsed} />
                                    </mesh>
                                );
                            });
                        })}

                        {/* Salt/Sand particles - salt shrinks during stir, sand stays */}
                        {particlePositions.map((pos, i) => (
                            <mesh key={i} position={pos} renderOrder={10}>
                                <boxGeometry args={[particleScale, particleScale, particleScale]} />
                                <meshBasicMaterial
                                    color={particleColor}
                                    transparent
                                    opacity={1}
                                    depthTest={false}
                                    depthWrite={false}
                                />
                            </mesh>
                        ))}
                    </group>
                )}
            </group>
        </group>
    );
}
