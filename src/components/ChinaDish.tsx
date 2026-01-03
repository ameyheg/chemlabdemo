// ChinaDish.tsx - 3D China dish for evaporation experiment

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLabStore } from '../store/labStore';
import { SoundManager } from '../core/SoundManager';
import * as THREE from 'three';

interface ChinaDishProps {
    position?: [number, number, number];
}

export function ChinaDish({ position = [0, 1.1, 2] }: ChinaDishProps) {
    const addedChemicals = useLabStore((state) => state.addedChemicals);
    const bunsenBurnerOn = useLabStore((state) => state.bunsenBurnerOn);
    const setDishCracked = useLabStore((state) => state.setDishCracked);

    const steamRef = useRef<THREE.InstancedMesh>(null);
    const [evaporationProgress, setEvaporationProgress] = useState(0);

    const hasSaltSolution = addedChemicals.includes('salt-solution');
    // Evaporation happens when burner is on AND salt solution is in the dish
    const isHeating = bunsenBurnerOn && hasSaltSolution;

    // Track if fully evaporated (either via action or progress reaching 1)
    const [fullyEvaporated, setFullyEvaporated] = useState(false);

    // Crack logic: prolonged heating without liquid breaks the dish
    const [isBroken, setIsBroken] = useState(false);
    const dryHeatTimer = useRef(0);
    const CRACK_THRESHOLD = 5.0; // Seconds of dry heating to cause crack

    // Get functions to trigger experiment completion
    const performExperimentAction = useLabStore((state) => state.performExperimentAction);
    const checkExperimentReaction = useLabStore((state) => state.checkExperimentReaction);

    // Steam particle count
    const steamParticleCount = 30;

    // Shards for realistic thermal cracking (4 pieces)
    const SHARD_COUNT = 4;
    const shardRefs = useRef<THREE.Group[]>([]);

    // Track crack separation progress
    const crackOffset = useRef(0);

    // Initial shard layout (Unequal 4 pieces)
    // Renamed state to ensure clean re-render
    const [brokenShards] = useState(() => {
        // Generate 4 random weights for unequal shards
        const weights = Array.from({ length: SHARD_COUNT }, () => 0.5 + Math.random());
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        let currentAngle = 0;
        return weights.map(w => {
            const length = (w / totalWeight) * Math.PI * 2;
            const start = currentAngle;
            const mid = start + length / 2;
            currentAngle += length;

            return {
                startOffset: start, // Rotation for container
                arcLength: length,  // Geometry size
                midAngle: mid       // Direction to slide out
            };
        });
    });

    // Define particle interface inline since it's local
    type SteamParticle = {
        position: THREE.Vector3;
        velocity: THREE.Vector3;
        life: number;
    };

    const steamParticles = useRef<SteamParticle[]>([]);

    // Initialize steam particles
    useMemo(() => {
        steamParticles.current = Array.from({ length: steamParticleCount }, () => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 0.4,
                0.1 + Math.random() * 0.3,
                (Math.random() - 0.5) * 0.4
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                0.04 + Math.random() * 0.03,
                (Math.random() - 0.5) * 0.02
            ),
            life: Math.random(),
        }));
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Synthetic shatter sound
    const playShatterSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            // Create noise buffer
            const bufferSize = ctx.sampleRate * 0.4; // Shorter snappy crack
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            // Filter for "crack"
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1500; // Sharper sound

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.8, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            noise.start();
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    };

    const toggleBunsenBurner = useLabStore((state) => state.toggleBunsenBurner);

    // Animate steam and track evaporation when burner is on
    useFrame((_, delta) => {
        // Breakage Logic: If heating and dry (or empty), increment timer
        if (bunsenBurnerOn && !isBroken) {
            // Considered dry if: No salt solution OR (Has Salt Solution AND Fully Evaporated)
            // Note: If solution is present but not full, it's not dry.
            const isDry = !hasSaltSolution || fullyEvaporated;

            if (isDry) {
                dryHeatTimer.current += delta;
                if (dryHeatTimer.current > CRACK_THRESHOLD) {
                    setIsBroken(true);
                    setDishCracked(true);  // Set global state so chemicals are disabled
                    playShatterSound();

                    // Show Safety Warning after 2.5 seconds (let the user process the break)
                    setTimeout(() => {
                        SoundManager.playWarning(); // Play "Uh-oh" sound
                        useLabStore.getState().showSafetyWarning(
                            "Oops! Thermal Shock! 💥",
                            "The dish got too hot and CRACKED! 🌡️\n\nAlways keep some liquid inside to keep it safe. 💧"
                        );
                    }, 2500);

                    // Auto-turn off burner to prevent further 'damage' or just for effect
                    if (useLabStore.getState().bunsenBurnerOn) {
                        toggleBunsenBurner();
                    }
                }
            } else {
                // Reset timer if liquid is added/present (re-hydration? maybe not realistic but safe)
                dryHeatTimer.current = 0;
            }
        }

        // Animate Shards - Just separate slightly (crack open) and stay put
        if (isBroken) {
            // Lerp crack offset to 0.03 (visible gap)
            crackOffset.current = THREE.MathUtils.lerp(crackOffset.current, 0.03, delta * 5);

            shardRefs.current.forEach((ref, i) => {
                if (ref) {
                    const shard = brokenShards[i];
                    // Move radially outward based on BISECTOR angle (midAngle)
                    ref.position.set(
                        Math.cos(shard.midAngle) * crackOffset.current,
                        0, // Stay securely on the tripod
                        Math.sin(shard.midAngle) * crackOffset.current
                    );
                }
            });
        }

        // Progress evaporation when heating (8 seconds to fully evaporate)
        if (isHeating && !fullyEvaporated && !isBroken) { // Don't evaporate if broken
            setEvaporationProgress(prev => {
                const newProgress = Math.min(prev + delta / 8, 1);
                if (newProgress >= 1 && !fullyEvaporated) {
                    setFullyEvaporated(true);
                    // Reset dry heat timer when evaporation finishes so we start counting dry heat time from NOW
                    dryHeatTimer.current = 0;

                    // Delay experiment completion so fumes stop first, then show result
                    setTimeout(() => {
                        performExperimentAction('heat');
                        performExperimentAction('evaporate');
                        // Turn off burner automatically to stop "fumes"/heat ring
                        if (useLabStore.getState().bunsenBurnerOn) {
                            toggleBunsenBurner();
                        }
                        setTimeout(() => checkExperimentReaction(), 100);
                    }, 2000);
                }
                return newProgress;
            });
        }

        // Safety: ensure steam is hidden if logic dictates
        if (steamRef.current) {
            if (!isHeating || fullyEvaporated || liquidLevel <= 0.05 || isBroken) {
                steamRef.current.visible = false;
                return;
            } else {
                steamRef.current.visible = true;
            }
        }

        // Animate steam particles
        if (!steamRef.current || !isHeating || fullyEvaporated || isBroken) return;

        steamParticles.current.forEach((particle, i) => {
            particle.life += delta * 0.5;
            particle.position.add(particle.velocity.clone().multiplyScalar(delta * 20));

            if (particle.life >= 1) {
                particle.position.set(
                    (Math.random() - 0.5) * 0.4,
                    0.2, // Raise start height slightly
                    (Math.random() - 0.5) * 0.4
                );
                particle.life = 0;
            }

            const scale = 0.06 * (1 - particle.life * 0.5);

            dummy.position.copy(particle.position);
            dummy.scale.setScalar(Math.max(0.001, scale));
            dummy.updateMatrix();
            steamRef.current!.setMatrixAt(i, dummy.matrix);
        });

        steamRef.current.instanceMatrix.needsUpdate = true;
    });

    // Liquid level decreases as evaporation progresses (0 = empty, 1 = full)
    const liquidLevel = 1 - evaporationProgress;

    return (
        <group position={position}>
            {/* China Dish Physical Construction */}

            {/* 1. Base Body - Sitting on y=0 (tripod gauze) - Hides when broken */}
            {!isBroken && (
                <>
                    <mesh position={[0, 0.025, 0]}>
                        <cylinderGeometry args={[0.5, 0.42, 0.05, 32]} />{/* Tapered slightly like a bowl base */}
                        <meshStandardMaterial
                            color="#5d4037"
                            roughness={0.4}
                            metalness={0.1}
                        />
                    </mesh>

                    {/* 2. Rolled Rim (Lip) - Creates depth */}
                    <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.5, 0.025, 16, 50]} />
                        <meshStandardMaterial color="#5d4037" roughness={0.4} />
                    </mesh>
                </>
            )}

            {/* 3. Inner Surface (Fill cylinder top) - Hides when broken */}
            {!isBroken && (
                <mesh position={[0, 0.051, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.5, 32]} />
                    <meshStandardMaterial
                        color={"#5d4037"} // Always dark brown interior
                        roughness={0.4}
                        metalness={0.1}
                    />
                </mesh>
            )}

            {/* Salt solution liquid - physically INSIDE the rim - Hides when broken */}
            {!isBroken && hasSaltSolution && liquidLevel > 0.01 && (
                <mesh
                    position={[0, 0.05 + (0.005 * liquidLevel), 0]} // Keep bottom rooted at 0.05
                    scale={[1, liquidLevel, 1]} // Shrink height
                >
                    <cylinderGeometry args={[0.47, 0.47, 0.01, 32]} />
                    <meshStandardMaterial
                        color="#aaddff" // More realistic water color
                        transparent
                        opacity={0.1 + 0.5 * liquidLevel} // Fades from 0.6 to 0.1
                        roughness={0.02}
                        metalness={0.1}
                    />
                </mesh>
            )}

            {/* Salt crystals (visible gradually during evaporation) - Hides when broken */}
            {!isBroken && (hasSaltSolution || fullyEvaporated) && (
                <group position={[0, 0.052, 0]}>
                    {/* Realistic crystal shapes scattered naturally - Dense center, sparse edges */}
                    {Array.from({ length: 150 }).map((_, i) => {
                        // High-frequency hash to break any symmetry pattern
                        const h1 = Math.sin(i * 12.9898) * 43758.5453;
                        const h2 = Math.cos(i * 78.233) * 43758.5453;
                        const h3 = Math.sin(i * 37.719) * 43758.5453;

                        const rand1 = Math.abs(h1 - Math.floor(h1));
                        const rand2 = Math.abs(h2 - Math.floor(h2));
                        const rand3 = Math.abs(h3 - Math.floor(h3));

                        // Radius: Use linear random (rand1) instead of sqrt to bias density towards center
                        // This creates a natural "pile" effect without a fake cone
                        const r = rand1 * 0.45;
                        const theta = rand2 * Math.PI * 2;

                        // Varied sizes - slightly larger on average
                        const size = 0.01 + rand3 * 0.02;
                        const shapeType = i % 3;

                        // Calculate visibility factor
                        const visibilityFactor = fullyEvaporated ? 1 : Math.max(0, (evaporationProgress - 0.6) * 2.5);

                        if (visibilityFactor <= 0) return null;

                        return (
                            <mesh
                                key={i}
                                position={[
                                    r * Math.cos(theta),
                                    size / 2, // Sit on surface
                                    r * Math.sin(theta)
                                ]}
                                rotation={[rand3 * Math.PI, rand1 * Math.PI, rand2 * Math.PI]}
                                scale={[visibilityFactor, visibilityFactor, visibilityFactor]}
                            >
                                {shapeType === 0 && <boxGeometry args={[size, size, size]} />}
                                {shapeType === 1 && <tetrahedronGeometry args={[size * 0.8]} />}
                                {shapeType === 2 && <dodecahedronGeometry args={[size * 0.6]} />}
                                <meshStandardMaterial
                                    color="#ffffff"
                                    roughness={0.2}
                                    metalness={0.1}
                                    emissive="#eeeeee"
                                    emissiveIntensity={0.1 * visibilityFactor}
                                    transparent
                                    opacity={visibilityFactor}
                                />
                            </mesh>
                        );
                    })}
                </group>
            )}

            {/* Steam particles (when heating and liquid still present) */}
            {isHeating && !fullyEvaporated && liquidLevel > 0.05 && (
                <group position={[0, 0.15, 0]}>
                    <instancedMesh ref={steamRef} args={[undefined, undefined, steamParticleCount]}>
                        <sphereGeometry args={[1, 8, 8]} />
                        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
                    </instancedMesh>
                </group>
            )}
            {/* Shards (Realistic Broken Pieces - 4 Distinct Wedges) */}
            {isBroken && brokenShards.map((shard, i) => (
                <group
                    key={`shard-${i}`}
                    ref={(el) => { if (el) shardRefs.current[i] = el; }}
                    rotation={[0, shard.startOffset, 0]} // Rotate to start angle
                >
                    {/* Pivot Wrapper */}
                    <group position={[0, 0, 0]}>
                        {/* Combined Body + Rim into one visual unit per shard */}
                        <mesh position={[0, 0.025, 0]}>
                            {/* Wedge Base: Start=0, Length=arcLength */}
                            <cylinderGeometry args={[0.5, 0.42, 0.05, 16, 1, false, 0, shard.arcLength]} />
                            <meshStandardMaterial color="#5d4037" roughness={0.4} metalness={0.1} side={THREE.DoubleSide} />
                        </mesh>
                        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                            {/* Wedge Rim: Arc=arcLength */}
                            <torusGeometry args={[0.5, 0.025, 8, shard.arcLength]} />
                            <meshStandardMaterial color="#5d4037" roughness={0.4} side={THREE.DoubleSide} />
                        </mesh>
                    </group>
                </group>
            ))}
        </group>
    );
}
