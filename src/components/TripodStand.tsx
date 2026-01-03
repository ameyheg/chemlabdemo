// TripodStand.tsx - Tripod stand with wire gauze platform for heating experiments

interface TripodStandProps {
    position?: [number, number, number];
}

export function TripodStand({ position = [0, 0, 2] }: TripodStandProps) {
    return (
        <group position={position}>
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
        </group>
    );
}
