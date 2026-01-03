// Dropper - For precise drop-by-drop chemical additions

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLabStore } from '../store/labStore';
import { CHEMICALS } from '../core/ReactionManager';
import * as THREE from 'three';

interface DropperProps {
    position: [number, number, number];
}

export function Dropper({ position }: DropperProps) {
    const [isDropping, setIsDropping] = useState(false);
    const [selectedChemical] = useState<keyof typeof CHEMICALS>('phenolphthalein');
    const dropRef = useRef<THREE.Mesh>(null);
    const dropProgress = useRef(0);

    const selectedVesselId = useLabStore((state) => state.selectedVesselId);
    const fillVessel = useLabStore((state) => state.fillVessel);
    const vessels = useLabStore((state) => state.vessels);

    const _selectedVessel = selectedVesselId ? vessels.get(selectedVesselId) : null;
    void _selectedVessel; // Used for future expansion

    // Handle dropping animation
    useFrame((_, delta) => {
        if (!isDropping || !dropRef.current) return;

        dropProgress.current += delta * 3;

        if (dropProgress.current < 1) {
            // Drop falling
            dropRef.current.position.y = 1.5 - dropProgress.current * 2;
            dropRef.current.scale.setScalar(1 - dropProgress.current * 0.5);
        } else {
            // Drop landed - add chemical to vessel
            if (selectedVesselId) {
                const chemical = CHEMICALS[selectedChemical];
                if (chemical) {
                    fillVessel(selectedVesselId, chemical, 10); // 10ml per drop
                }
            }
            setIsDropping(false);
            dropProgress.current = 0;
        }
    });

    const handleDrop = () => {
        if (!isDropping && selectedVesselId) {
            setIsDropping(true);
            dropProgress.current = 0;
        }
    };

    const chemicalColor = CHEMICALS[selectedChemical]?.color || '#ffccff';

    return (
        <group position={position}>
            {/* Dropper body - glass bulb */}
            <mesh position={[0, 2.2, 0]} onClick={handleDrop}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshStandardMaterial color="#333333" roughness={0.3} />
            </mesh>

            {/* Rubber bulb on top */}
            <mesh position={[0, 2.45, 0]} onClick={handleDrop}>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshStandardMaterial color="#8B0000" roughness={0.8} />
            </mesh>

            {/* Glass tube */}
            <mesh position={[0, 1.7, 0]} onClick={handleDrop}>
                <cylinderGeometry args={[0.03, 0.02, 1, 8]} />
                <meshBasicMaterial color="#e8e8ff" transparent opacity={0.5} />
            </mesh>

            {/* Liquid inside tube */}
            <mesh position={[0, 1.75, 0]}>
                <cylinderGeometry args={[0.025, 0.015, 0.8, 8]} />
                <meshBasicMaterial color={chemicalColor} transparent opacity={0.8} />
            </mesh>

            {/* Tip */}
            <mesh position={[0, 1.15, 0]}>
                <coneGeometry args={[0.025, 0.1, 8]} />
                <meshBasicMaterial color="#e8e8ff" transparent opacity={0.6} />
            </mesh>

            {/* Falling drop */}
            {isDropping && (
                <mesh ref={dropRef} position={[0, 1.5, 0]}>
                    <sphereGeometry args={[0.04, 8, 8]} />
                    <meshBasicMaterial color={chemicalColor} />
                </mesh>
            )}

            {/* Base/stand */}
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.2, 0.25, 0.2, 16]} />
                <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
            </mesh>

            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
                <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Click indicator */}
            {selectedVesselId && (
                <mesh position={[0, 2.7, 0]}>
                    <sphereGeometry args={[0.06, 8, 8]} />
                    <meshBasicMaterial color="#00ff00" transparent opacity={0.6} />
                </mesh>
            )}
        </group>
    );
}
