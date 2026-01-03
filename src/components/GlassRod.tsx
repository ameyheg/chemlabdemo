// GlassRod.tsx - 3D Glass stirring rod that appears when placed or during stirring

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { useLabStore } from '../store/labStore';

export function GlassRod() {
    const groupRef = useRef<Group>(null);
    const isStirring = useLabStore((state) => state.isStirring);
    const placedApparatus = useLabStore((state) => state.placedApparatus);
    const vessels = useLabStore((state) => state.vessels);
    const isPlaced = placedApparatus.includes('glass-rod');

    // Get actual beaker position from vessels
    const beaker = Array.from(vessels.values()).find(v => v.type === 'beaker' && v.id !== 'collection_beaker');
    const beakerPosition: [number, number, number] = beaker?.position as [number, number, number] || [0, 0, 0];

    // Stirring animation - circular motion
    useFrame((state) => {
        if (groupRef.current && isStirring) {
            const time = state.clock.elapsedTime;
            // Circular stirring motion CENTERED on beaker
            const radius = 0.2;
            const speed = 4;
            groupRef.current.position.x = beakerPosition[0] + Math.cos(time * speed) * radius;
            groupRef.current.position.y = beakerPosition[1] + 0.8;
            groupRef.current.position.z = beakerPosition[2] + Math.sin(time * speed) * radius;
            // Slight tilt as it stirs
            groupRef.current.rotation.x = Math.sin(time * speed) * 0.15;
            groupRef.current.rotation.z = Math.cos(time * speed) * 0.15;
        } else if (groupRef.current && isPlaced) {
            // Resting position - inside beaker, leaning against inner wall
            groupRef.current.position.x = beakerPosition[0] + 0.25;
            groupRef.current.position.y = beakerPosition[1] + 0.6;
            groupRef.current.position.z = beakerPosition[2];
            groupRef.current.rotation.x = 0;
            groupRef.current.rotation.z = 0.4; // Tilted, leaning against beaker wall
        }
    });

    // Only show if placed OR stirring
    if (!isPlaced && !isStirring) return null;

    const rodLength = 2.5;
    const rodRadius = 0.04;

    return (
        <group
            ref={groupRef}
            position={[beakerPosition[0] + 0.25, beakerPosition[1] + 0.6, beakerPosition[2]]}
            rotation={[0, 0, 0.4]}
        >
            {/* Glass rod body */}
            <mesh position={[0, rodLength / 2 - 0.5, 0]}>
                <cylinderGeometry args={[rodRadius, rodRadius, rodLength, 16]} />
                <meshStandardMaterial
                    color="#e8e8e8"
                    transparent
                    opacity={0.7}
                    roughness={0.1}
                    metalness={0.3}
                />
            </mesh>

            {/* Rod tip (slightly thicker for visibility) */}
            <mesh position={[0, -0.5, 0]}>
                <sphereGeometry args={[rodRadius * 1.3, 12, 12]} />
                <meshStandardMaterial
                    color="#d0d0d0"
                    transparent
                    opacity={0.8}
                    roughness={0.1}
                />
            </mesh>

            {/* Handle end */}
            <mesh position={[0, rodLength - 0.5, 0]}>
                <sphereGeometry args={[rodRadius * 1.2, 12, 12]} />
                <meshStandardMaterial
                    color="#f0f0f0"
                    transparent
                    opacity={0.9}
                />
            </mesh>
        </group>
    );
}
