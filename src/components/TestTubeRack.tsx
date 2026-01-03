// TestTubeRack - Holds test tubes in a wooden rack

// import { useLabStore } from '../store/labStore'; // Reserved for future use

interface TestTubeRackProps {
    position: [number, number, number];
}

export function TestTubeRack({ position }: TestTubeRackProps) {
    // Test tubes from vessels available for future use

    const rackWidth = 1.2;
    const rackDepth = 0.4;
    const rackHeight = 0.3;
    const holeSpacing = 0.25;

    return (
        <group position={position}>
            {/* Rack base */}
            <mesh position={[0, rackHeight / 2, 0]}>
                <boxGeometry args={[rackWidth, rackHeight, rackDepth]} />
                <meshStandardMaterial color="#8B4513" roughness={0.8} />
            </mesh>

            {/* Rack top with holes */}
            <mesh position={[0, rackHeight + 0.05, 0]}>
                <boxGeometry args={[rackWidth, 0.1, rackDepth]} />
                <meshStandardMaterial color="#A0522D" roughness={0.7} />
            </mesh>

            {/* Holes for test tubes (visual indicators) */}
            {[-1.5, -0.5, 0.5, 1.5].map((offset, i) => (
                <mesh
                    key={i}
                    position={[offset * holeSpacing, rackHeight + 0.11, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <ringGeometry args={[0.08, 0.12, 16]} />
                    <meshBasicMaterial color="#333333" />
                </mesh>
            ))}

            {/* Front rail */}
            <mesh position={[0, rackHeight + 0.2, rackDepth / 2 - 0.03]}>
                <boxGeometry args={[rackWidth, 0.08, 0.06]} />
                <meshStandardMaterial color="#8B4513" roughness={0.8} />
            </mesh>

            {/* Back rail */}
            <mesh position={[0, rackHeight + 0.2, -rackDepth / 2 + 0.03]}>
                <boxGeometry args={[rackWidth, 0.08, 0.06]} />
                <meshStandardMaterial color="#8B4513" roughness={0.8} />
            </mesh>
        </group>
    );
}
