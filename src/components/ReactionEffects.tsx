// ReactionEffects - 3D visual effects for chemical reactions

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLabStore, type ActiveEffect } from '../store/labStore';
import * as THREE from 'three';

interface BubbleParticle {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    baseSize: number;
    phase: number;
    wobbleSpeed: number;
    wobbleAmount: number;
}

interface HeatParticle {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    rotationSpeed: number;
    spiralRadius: number;
}

function BubblesEffect({ vesselId, startTime, duration }: { vesselId: string; startTime: number; duration: number }) {
    const vessel = useLabStore((state) => state.vessels.get(vesselId));
    const particlesRef = useRef<BubbleParticle[]>([]);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const timeRef = useRef(0);

    const particleCount = 50;

    // Initialize particles with more variety
    useMemo(() => {
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 1.2,
                Math.random() * 0.3,
                (Math.random() - 0.5) * 1.2
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.008,
                0.015 + Math.random() * 0.025,
                (Math.random() - 0.5) * 0.008
            ),
            baseSize: 0.02 + Math.random() * 0.06,
            phase: Math.random() * Math.PI * 2,
            wobbleSpeed: 2 + Math.random() * 3,
            wobbleAmount: 0.01 + Math.random() * 0.02,
        }));
    }, [vesselId]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((_, delta) => {
        if (!meshRef.current || !vessel) return;

        timeRef.current += delta;
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;

        // Smooth fade in and out
        let fadeMultiplier = 1;
        if (progress < 0.1) {
            fadeMultiplier = progress / 0.1; // Fade in
        } else if (progress > 0.8) {
            fadeMultiplier = 1 - (progress - 0.8) / 0.2; // Fade out
        }

        particlesRef.current.forEach((particle, i) => {
            // Update position with smooth movement
            particle.position.add(particle.velocity);

            // Add natural wobble motion
            const wobbleX = Math.sin(timeRef.current * particle.wobbleSpeed + particle.phase) * particle.wobbleAmount;
            const wobbleZ = Math.cos(timeRef.current * particle.wobbleSpeed + particle.phase + 1) * particle.wobbleAmount;

            // Apply wobble
            particle.position.x += wobbleX;
            particle.position.z += wobbleZ;

            // Reset particle when it goes too high - with staggered timing
            if (particle.position.y > 2.5) {
                particle.position.set(
                    (Math.random() - 0.5) * 1.0,
                    0.1 + Math.random() * 0.2,
                    (Math.random() - 0.5) * 1.0
                );
                particle.velocity.y = 0.015 + Math.random() * 0.025;
                particle.baseSize = 0.02 + Math.random() * 0.06;
            }

            // Bubbles grow slightly as they rise, then shrink before popping
            const heightRatio = particle.position.y / 2.5;
            const sizeModifier = heightRatio < 0.7
                ? 1 + heightRatio * 0.3
                : 1.3 - (heightRatio - 0.7) * 2;

            const finalSize = particle.baseSize * sizeModifier * fadeMultiplier;

            dummy.position.set(
                particle.position.x,
                particle.position.y,
                particle.position.z
            );
            dummy.scale.setScalar(Math.max(0.001, finalSize));
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!vessel) return null;

    return (
        <group position={vessel.position as [number, number, number]}>
            <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
                <sphereGeometry args={[1, 12, 12]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.5}
                    roughness={0}
                    metalness={0}
                    transmission={0.9}
                    thickness={0.5}
                    ior={1.33}
                />
            </instancedMesh>
        </group>
    );
}

function HeatEffect({ vesselId, startTime, duration }: { vesselId: string; startTime: number; duration: number }) {
    const vessel = useLabStore((state) => state.vessels.get(vesselId));
    const particlesRef = useRef<HeatParticle[]>([]);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const glowRef = useRef<THREE.PointLight>(null);
    const timeRef = useRef(0);

    const particleCount = 35;

    // Initialize particles with spiral motion
    useMemo(() => {
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 0.8,
                Math.random() * 0.5,
                (Math.random() - 0.5) * 0.8
            ),
            velocity: new THREE.Vector3(0, 0.02 + Math.random() * 0.03, 0),
            life: Math.random(),
            maxLife: 0.8 + Math.random() * 0.4,
            rotationSpeed: (Math.random() - 0.5) * 4,
            spiralRadius: 0.1 + Math.random() * 0.3,
        }));
    }, [vesselId]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((_, delta) => {
        if (!meshRef.current || !vessel) return;

        timeRef.current += delta;
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;

        // Overall fade
        let fadeMultiplier = 1;
        if (progress < 0.1) {
            fadeMultiplier = progress / 0.1;
        } else if (progress > 0.75) {
            fadeMultiplier = 1 - (progress - 0.75) / 0.25;
        }

        // Pulsing glow
        if (glowRef.current) {
            const pulse = Math.sin(timeRef.current * 8) * 0.3 + 0.7;
            glowRef.current.intensity = 3 * pulse * fadeMultiplier;
        }

        particlesRef.current.forEach((particle, i) => {
            // Update life
            particle.life += delta / particle.maxLife;

            // Spiral upward motion
            const angle = timeRef.current * particle.rotationSpeed + i;
            const spiralX = Math.cos(angle) * particle.spiralRadius * (1 - particle.life * 0.5);
            const spiralZ = Math.sin(angle) * particle.spiralRadius * (1 - particle.life * 0.5);

            particle.position.y += particle.velocity.y;

            // Reset particle
            if (particle.life >= 1 || particle.position.y > 3) {
                particle.position.set(
                    (Math.random() - 0.5) * 0.6,
                    0.2 + Math.random() * 0.3,
                    (Math.random() - 0.5) * 0.6
                );
                particle.life = 0;
                particle.velocity.y = 0.02 + Math.random() * 0.03;
                particle.spiralRadius = 0.1 + Math.random() * 0.3;
            }

            // Size based on life (grow then shrink)
            const lifeCurve = particle.life < 0.3
                ? particle.life / 0.3
                : 1 - (particle.life - 0.3) / 0.7;
            const scale = 0.06 * lifeCurve * fadeMultiplier;

            dummy.position.set(
                particle.position.x + spiralX,
                particle.position.y,
                particle.position.z + spiralZ
            );
            dummy.scale.setScalar(Math.max(0.001, scale));
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!vessel) return null;

    return (
        <group position={vessel.position as [number, number, number]}>
            {/* Heat particles */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshBasicMaterial
                    color="#ff6b35"
                    transparent
                    opacity={0.85}
                />
            </instancedMesh>

            {/* Inner glow particles (smaller, brighter) */}
            <instancedMesh args={[undefined, undefined, 15]}>
                <sphereGeometry args={[0.03, 6, 6]} />
                <meshBasicMaterial color="#ffcc00" transparent opacity={0.9} />
            </instancedMesh>

            {/* Dynamic glow light */}
            <pointLight
                ref={glowRef}
                position={[0, 1, 0]}
                color="#ff4400"
                intensity={3}
                distance={4}
                decay={2}
            />

            {/* Secondary ambient glow */}
            <pointLight
                position={[0, 0.5, 0]}
                color="#ff8800"
                intensity={1.5}
                distance={2}
                decay={2}
            />
        </group>
    );
}

// Steam effect - white/gray particles rising slowly
function SteamEffect({ vesselId, startTime, duration }: { vesselId: string; startTime: number; duration: number }) {
    const vessel = useLabStore((state) => state.vessels.get(vesselId));
    const particlesRef = useRef<{ position: THREE.Vector3; velocity: THREE.Vector3; life: number; size: number }[]>([]);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const timeRef = useRef(0);

    const particleCount = 25;

    useMemo(() => {
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 0.6,
                1.5 + Math.random() * 0.5,
                (Math.random() - 0.5) * 0.6
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.005,
                0.01 + Math.random() * 0.01,
                (Math.random() - 0.5) * 0.005
            ),
            life: Math.random(),
            size: 0.05 + Math.random() * 0.08,
        }));
    }, [vesselId]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((_, delta) => {
        if (!meshRef.current || !vessel) return;

        timeRef.current += delta;
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        const fade = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1;

        particlesRef.current.forEach((particle, i) => {
            particle.position.add(particle.velocity);
            particle.life += 0.008;

            // Drift sideways slightly
            particle.position.x += Math.sin(timeRef.current + i) * 0.002;

            if (particle.life >= 1 || particle.position.y > 4) {
                particle.position.set(
                    (Math.random() - 0.5) * 0.5,
                    1.5,
                    (Math.random() - 0.5) * 0.5
                );
                particle.life = 0;
            }

            const scale = particle.size * (1 - particle.life * 0.5) * fade;
            dummy.position.copy(particle.position);
            dummy.scale.setScalar(Math.max(0.001, scale));
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!vessel) return null;

    return (
        <group position={vessel.position as [number, number, number]}>
            <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshBasicMaterial color="#dddddd" transparent opacity={0.3} />
            </instancedMesh>
        </group>
    );
}

// Boiling effect - rapid bubbles in liquid
function BoilingEffect({ vesselId, startTime, duration }: { vesselId: string; startTime: number; duration: number }) {
    const vessel = useLabStore((state) => state.vessels.get(vesselId));
    const particlesRef = useRef<{ position: THREE.Vector3; velocity: THREE.Vector3; size: number }[]>([]);
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const particleCount = 30;

    useMemo(() => {
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 0.6,
                0.1 + Math.random() * 0.5,
                (Math.random() - 0.5) * 0.6
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.01,
                0.02 + Math.random() * 0.03,
                (Math.random() - 0.5) * 0.01
            ),
            size: 0.02 + Math.random() * 0.04,
        }));
    }, [vesselId]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(() => {
        if (!meshRef.current || !vessel) return;

        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        const fade = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1;

        // Get liquid height
        const liquidHeight = (vessel.currentVolume / vessel.capacity) * 1.8;

        particlesRef.current.forEach((particle, i) => {
            particle.position.add(particle.velocity);

            // Reset when reaching liquid surface
            if (particle.position.y > liquidHeight) {
                particle.position.set(
                    (Math.random() - 0.5) * 0.5,
                    0.1,
                    (Math.random() - 0.5) * 0.5
                );
                particle.velocity.y = 0.02 + Math.random() * 0.03;
            }

            const scale = particle.size * fade;
            dummy.position.copy(particle.position);
            dummy.scale.setScalar(Math.max(0.001, scale));
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!vessel) return null;

    return (
        <group position={vessel.position as [number, number, number]}>
            <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
                <sphereGeometry args={[1, 6, 6]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
            </instancedMesh>
        </group>
    );
}

// Precipitate effect - white particles settling to bottom
function PrecipitateEffect({ vesselId, startTime, duration }: { vesselId: string; startTime: number; duration: number }) {
    const vessel = useLabStore((state) => state.vessels.get(vesselId));
    const particlesRef = useRef<{ position: THREE.Vector3; velocity: THREE.Vector3; size: number; settled: boolean }[]>([]);
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const particleCount = 40;

    useMemo(() => {
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 0.8,
                0.5 + Math.random() * 1.0, // Start in the middle of liquid
                (Math.random() - 0.5) * 0.8
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.002,
                -0.005 - Math.random() * 0.01, // Fall down
                (Math.random() - 0.5) * 0.002
            ),
            size: 0.02 + Math.random() * 0.03,
            settled: false,
        }));
    }, [vesselId]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(() => {
        if (!meshRef.current || !vessel) return;

        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        const fadeIn = Math.min(1, progress * 3);

        particlesRef.current.forEach((particle, i) => {
            if (!particle.settled) {
                // Drift down with slight wobble
                particle.position.add(particle.velocity);
                particle.position.x += Math.sin(Date.now() * 0.002 + i) * 0.001;

                // Settle at bottom
                if (particle.position.y <= 0.15) {
                    particle.position.y = 0.1 + Math.random() * 0.1;
                    particle.settled = true;
                }
            }

            const scale = particle.size * fadeIn;
            dummy.position.copy(particle.position);
            dummy.scale.setScalar(Math.max(0.001, scale));
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!vessel) return null;

    return (
        <group position={vessel.position as [number, number, number]}>
            <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
                <sphereGeometry args={[1, 6, 6]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
            </instancedMesh>
        </group>
    );
}

function EffectRenderer({ effect }: { effect: ActiveEffect }) {
    const elapsed = Date.now() - effect.startTime;
    if (elapsed >= effect.duration) return null;

    switch (effect.type) {
        case 'bubbles':
            return <BubblesEffect vesselId={effect.vesselId} startTime={effect.startTime} duration={effect.duration} />;
        case 'heat':
            return <HeatEffect vesselId={effect.vesselId} startTime={effect.startTime} duration={effect.duration} />;
        case 'steam':
            return <SteamEffect vesselId={effect.vesselId} startTime={effect.startTime} duration={effect.duration} />;
        case 'boiling':
            return <BoilingEffect vesselId={effect.vesselId} startTime={effect.startTime} duration={effect.duration} />;
        case 'precipitate':
            return <PrecipitateEffect vesselId={effect.vesselId} startTime={effect.startTime} duration={effect.duration} />;
        default:
            return null;
    }
}

export function ReactionEffects() {
    const activeEffects = useLabStore((state) => state.activeEffects);
    const clearExpiredEffects = useLabStore((state) => state.clearExpiredEffects);

    // Periodically clean up expired effects
    useFrame(() => {
        clearExpiredEffects();
    });

    return (
        <>
            {activeEffects.map((effect) => (
                <EffectRenderer key={effect.id} effect={effect} />
            ))}
        </>
    );
}
