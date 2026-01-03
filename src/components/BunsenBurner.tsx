// BunsenBurner - 3D Bunsen burner with tripod stand and animated flame

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLabStore } from '../store/labStore';
import * as THREE from 'three';

interface FlameParticle {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    size: number;
}

export function BunsenBurner() {
    const burnerOn = useLabStore((state) => state.bunsenBurnerOn);
    const toggleBurner = useLabStore((state) => state.toggleBunsenBurner);
    const flameRef = useRef<THREE.InstancedMesh>(null);
    const particlesRef = useRef<FlameParticle[]>([]);
    const timeRef = useRef(0);

    const particleCount = 40;
    // Position: centered at X=0, in front of beakers at Z=2
    const burnerPosition: [number, number, number] = [0, 0, 2];

    // Initialize flame particles
    useMemo(() => {
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 0.12,
                Math.random() * 0.3,
                (Math.random() - 0.5) * 0.12
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.008,
                0.025 + Math.random() * 0.02,
                (Math.random() - 0.5) * 0.008
            ),
            life: Math.random(),
            maxLife: 0.4 + Math.random() * 0.3,
            size: 0.025 + Math.random() * 0.035,
        }));
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((_, delta) => {
        if (!flameRef.current || !burnerOn) return;

        timeRef.current += delta;

        particlesRef.current.forEach((particle, i) => {
            particle.life += delta / particle.maxLife;
            particle.position.add(particle.velocity);
            particle.position.x += Math.sin(timeRef.current * 12 + i) * 0.002;
            particle.position.z += Math.cos(timeRef.current * 10 + i * 0.5) * 0.002;

            if (particle.life >= 1) {
                particle.position.set(
                    (Math.random() - 0.5) * 0.1,
                    0.02,
                    (Math.random() - 0.5) * 0.1
                );
                particle.life = 0;
                particle.velocity.y = 0.025 + Math.random() * 0.02;
            }

            const lifeCurve = particle.life < 0.3
                ? particle.life / 0.3
                : 1 - (particle.life - 0.3) / 0.7;
            const scale = particle.size * lifeCurve;

            dummy.position.copy(particle.position);
            dummy.scale.setScalar(Math.max(0.001, scale));
            dummy.updateMatrix();
            flameRef.current!.setMatrixAt(i, dummy.matrix);
        });

        flameRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group position={burnerPosition}>
            {/* Heating zone indicator - centered at burner position */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.9, 1.1, 32]} />
                <meshBasicMaterial
                    color={burnerOn ? "#ff4400" : "#555555"}
                    transparent
                    opacity={burnerOn ? 0.3 : 0.15}
                />
            </mesh>

            {/* Burner base - black cylinder */}
            <mesh position={[0, 0.12, 0]} onClick={() => toggleBurner()}>
                <cylinderGeometry args={[0.18, 0.22, 0.24, 16]} />
                <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.3} />
            </mesh>

            {/* Burner tube */}
            <mesh position={[0, 0.42, 0]} onClick={() => toggleBurner()}>
                <cylinderGeometry args={[0.07, 0.09, 0.36, 16]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Burner top nozzle */}
            <mesh position={[0, 0.62, 0]} onClick={() => toggleBurner()}>
                <cylinderGeometry args={[0.1, 0.07, 0.04, 16]} />
                <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Tripod legs - 3 legs evenly spaced at 120 degrees */}
            {[0, 1, 2].map((i) => {
                // Offset by 30 degrees so one leg faces forward
                const angle = (i * Math.PI * 2) / 3 + Math.PI / 6;
                const legLength = 1.0;
                const spreadRadius = 0.6; // How far legs spread at bottom

                // Bottom and top points of leg
                const bottomX = Math.cos(angle) * spreadRadius;
                const bottomZ = Math.sin(angle) * spreadRadius;
                const topX = 0;
                const topZ = 0;

                // Calculate center point and rotation
                const midX = (bottomX + topX) / 2;
                const midZ = (bottomZ + topZ) / 2;
                const midY = 0.5;

                // Tilt angle - legs lean outward
                const tiltAngle = Math.atan2(spreadRadius, legLength);

                return (
                    <mesh
                        key={i}
                        position={[midX, midY, midZ]}
                        rotation={[0, -angle, tiltAngle]}
                    >
                        <cylinderGeometry args={[0.03, 0.03, legLength, 8]} />
                        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
                    </mesh>
                );
            })}

            {/* Wire gauze platform - centered above burner */}
            <group position={[0, 1.0, 0]}>
                {/* Solid ring */}
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.6, 0.75, 32]} />
                    <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.4} />
                </mesh>

                {/* Wire mesh (grid pattern) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <circleGeometry args={[0.6, 32]} />
                    <meshStandardMaterial
                        color="#666666"
                        metalness={0.7}
                        roughness={0.5}
                        wireframe
                    />
                </mesh>

                {/* Inner support ring */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                    <ringGeometry args={[0.1, 0.15, 16]} />
                    <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.3} />
                </mesh>
            </group>

            {/* Flame (only when on) */}
            {burnerOn && (
                <group position={[0, 0.65, 0]}>
                    <instancedMesh ref={flameRef} args={[undefined, undefined, particleCount]}>
                        <sphereGeometry args={[1, 8, 8]} />
                        <meshBasicMaterial color="#3399ff" transparent opacity={0.85} />
                    </instancedMesh>

                    {/* Inner cone flame */}
                    <mesh position={[0, 0.18, 0]}>
                        <coneGeometry args={[0.06, 0.35, 8]} />
                        <meshBasicMaterial color="#66ccff" transparent opacity={0.9} />
                    </mesh>

                    {/* Outer cone flame */}
                    <mesh position={[0, 0.22, 0]}>
                        <coneGeometry args={[0.1, 0.45, 8]} />
                        <meshBasicMaterial color="#0066cc" transparent opacity={0.4} />
                    </mesh>

                    {/* Flame point light */}
                    <pointLight
                        position={[0, 0.25, 0]}
                        color="#4488ff"
                        intensity={2.5}
                        distance={3}
                        decay={2}
                    />
                </group>
            )}

            {/* Click indicator when off */}
            {!burnerOn && (
                <mesh position={[0, 1.3, 0]}>
                    <sphereGeometry args={[0.08, 12, 12]} />
                    <meshBasicMaterial color="#66ff66" transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    );
}
