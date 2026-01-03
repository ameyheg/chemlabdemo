import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, Color, MathUtils } from 'three';

// Water Droplet particle for melting effect
function WaterDroplet({ startPos, delay }: { startPos: [number, number, number], delay: number }) {
    const meshRef = useRef<Mesh>(null);
    const [active, setActive] = useState(false);
    const velocity = useRef(0);
    const position = useRef([...startPos]);

    useEffect(() => {
        const timer = setTimeout(() => setActive(true), delay * 1000);
        return () => clearTimeout(timer);
    }, [delay]);

    useFrame((_, delta) => {
        if (!active || !meshRef.current) return;

        // Gravity simulation for droplet
        velocity.current += delta * 2;
        position.current[1] -= velocity.current * delta;

        meshRef.current.position.y = position.current[1];

        // Fade out as it falls
        const mat = meshRef.current.material as any;
        if (mat.opacity > 0) {
            mat.opacity -= delta * 0.5;
        }
    });

    if (!active) return null;

    return (
        <mesh ref={meshRef} position={startPos}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial
                color="#a8e4ff"
                transparent
                opacity={0.8}
                roughness={0.1}
                metalness={0.2}
            />
        </mesh>
    );
}

// Single Ice Cube with individual melting behavior
function IceCube({
    initialPos,
    initialRot,
    melting,
    meltProgress,
    baseScale
}: {
    initialPos: [number, number, number],
    initialRot: [number, number, number],

    melting: boolean,
    meltProgress: number,
    baseScale: number
}) {
    const meshRef = useRef<Mesh>(null);

    // Each cube has slightly different melt rate based on position (top melts faster)
    const meltRate = useMemo(() => 1 + (initialPos[1] * 0.5) + (Math.random() * 0.3), [initialPos]);

    // Wobble phase offset for organic movement
    const wobbleOffset = useMemo(() => Math.random() * Math.PI * 2, []);

    // Individual cube melt progress (adjusted by rate)
    const cubeMelt = Math.min(1, meltProgress * meltRate);

    // Calculate current scale (shrinks as it melts)
    const currentScale = Math.max(0, 1 - cubeMelt * 0.95);

    // Calculate opacity (becomes more transparent)
    const opacity = MathUtils.lerp(0.85, 0.2, cubeMelt);

    // Sinking effect (cube sinks as it melts)
    const sinkAmount = cubeMelt * initialPos[1] * 0.8;

    // Color shift (gets more blue/watery as it melts)
    const color = useMemo(() => {
        const startColor = new Color('#e0f6ff');
        const endColor = new Color('#a8e4ff');
        return startColor.lerp(endColor, cubeMelt);
    }, [cubeMelt]);

    useFrame((state) => {
        if (!meshRef.current || !melting) return;

        // Wobble animation - cubes shake slightly as they melt
        const wobble = Math.sin(state.clock.elapsedTime * 3 + wobbleOffset) * 0.02 * (1 - cubeMelt);
        meshRef.current.rotation.z = initialRot[2] + wobble;
        meshRef.current.rotation.x = initialRot[0] + wobble * 0.5;
    });

    if (currentScale <= 0.05) return null;

    return (
        <mesh
            ref={meshRef}
            position={[
                initialPos[0],
                initialPos[1] - sinkAmount,
                initialPos[2]
            ]}
            rotation={initialRot}
            scale={currentScale * baseScale}
        >
            <boxGeometry args={[0.37, 0.37, 0.37]} />
            <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                roughness={0.05}
                metalness={0.15}
                envMapIntensity={1.5}
            />
            {/* Subtle inner glow effect */}
            <mesh scale={0.85}>
                <boxGeometry args={[0.37, 0.37, 0.37]} />
                <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={opacity * 0.3}
                />
            </mesh>
        </mesh>
    );
}

// Ice Cubes for "Physical Change" (Melting)
export function IceCubes({
    scale = 1,
    melting = false,
    onMeltComplete
}: {
    scale?: number,
    melting?: boolean,
    onMeltComplete?: () => void
}) {
    const groupRef = useRef<Group>(null);
    const [meltProgress, setMeltProgress] = useState(0);
    const meltCompleteTriggered = useRef(false);

    // Ice cube positions - Natural pile of 15
    const cubes = useMemo(() => [
        // Base layer (spread out)
        { pos: [0.25, 0.16, 0.15] as [number, number, number], rot: [0.1, 0.2, 0] as [number, number, number] },
        { pos: [-0.25, 0.16, -0.15] as [number, number, number], rot: [0, 0.5, 0.1] as [number, number, number] },
        { pos: [0.25, 0.16, -0.25] as [number, number, number], rot: [0.2, 0, 0.2] as [number, number, number] },
        { pos: [-0.22, 0.16, 0.25] as [number, number, number], rot: [0, 0.3, 0] as [number, number, number] },
        { pos: [0, 0.16, 0] as [number, number, number], rot: [0.1, 0.1, 0.1] as [number, number, number] },
        { pos: [0.35, 0.16, 0] as [number, number, number], rot: [0.05, 0.4, 0] as [number, number, number] },
        { pos: [-0.35, 0.16, 0.1] as [number, number, number], rot: [0.1, 0.1, 0.2] as [number, number, number] },
        { pos: [0, 0.16, 0.35] as [number, number, number], rot: [0.2, 0.2, 0] as [number, number, number] },
        { pos: [0.1, 0.16, -0.35] as [number, number, number], rot: [0, 0.3, 0.1] as [number, number, number] },

        // Second layer (sitting in gaps)
        { pos: [0.15, 0.45, 0.15] as [number, number, number], rot: [0.5, 0.2, 0.1] as [number, number, number] },
        { pos: [-0.15, 0.45, -0.1] as [number, number, number], rot: [0.2, 0.5, 0.3] as [number, number, number] },
        { pos: [0.1, 0.45, -0.2] as [number, number, number], rot: [0.1, 0.1, 0.4] as [number, number, number] },
        { pos: [-0.1, 0.45, 0.2] as [number, number, number], rot: [0.3, 0.2, 0.1] as [number, number, number] },
        { pos: [0.2, 0.45, -0.1] as [number, number, number], rot: [0.4, 0.1, 0.2] as [number, number, number] },

        // Top scatter
        { pos: [0, 0.65, 0] as [number, number, number], rot: [0.6, 0.4, 0.2] as [number, number, number] },
    ], []);

    // Generate water droplet spawn positions
    const droplets = useMemo(() => {
        if (!melting) return [];
        return cubes.flatMap((cube, i) =>
            Array.from({ length: 3 }, (_, j) => ({
                pos: [
                    cube.pos[0] * scale + (Math.random() - 0.5) * 0.1,
                    cube.pos[1] * scale,
                    cube.pos[2] * scale + (Math.random() - 0.5) * 0.1
                ] as [number, number, number],
                delay: i * 0.3 + j * 0.5 + Math.random() * 0.5
            }))
        );
    }, [melting, cubes, scale]);

    // Update melt progress when melting is active
    useFrame((_, delta) => {
        if (melting && meltProgress < 1) {
            // Melt over ~8 seconds for a gradual, visible effect
            setMeltProgress(prev => Math.min(1, prev + delta * 0.125));
        }

        // Trigger completion callback
        if (melting && meltProgress >= 0.95 && !meltCompleteTriggered.current) {
            meltCompleteTriggered.current = true;
            onMeltComplete?.();
        }
    });

    // Reset when not melting
    useEffect(() => {
        if (!melting) {
            setMeltProgress(0);
            meltCompleteTriggered.current = false;
        }
    }, [melting]);

    return (
        <group ref={groupRef} scale={scale}>
            {/* Render ice cubes */}
            {cubes.map((cube, i) => (
                <IceCube
                    key={i}
                    initialPos={cube.pos}
                    initialRot={cube.rot}
                    melting={melting}
                    meltProgress={meltProgress}
                    baseScale={1}
                />
            ))}

            {/* Water droplets falling during melt */}
            {melting && meltProgress > 0.1 && meltProgress < 0.9 && droplets.map((droplet, i) => (
                <WaterDroplet
                    key={i}
                    startPos={droplet.pos}
                    delay={droplet.delay}
                />
            ))}

            {/* Rising water puddle effect at bottom */}
            {melting && meltProgress > 0.2 && (
                <mesh
                    position={[0, 0.02, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <circleGeometry args={[0.5 * Math.min(1, meltProgress * 1.5), 32]} />
                    <meshStandardMaterial
                        color="#a8e4ff"
                        transparent
                        opacity={Math.min(0.6, meltProgress * 0.8)}
                        roughness={0.1}
                        metalness={0.1}
                    />
                </mesh>
            )}
        </group>
    );
}

// Paper Strip for "Chemical Change" (Burning) - WORLD-CLASS ANIMATION
export function PaperStrip({ burning = false, onBurnComplete }: { burning?: boolean; onBurnComplete?: () => void }) {
    const meshRef = useRef<Mesh>(null);
    const [burnProgress, setBurnProgress] = useState(0);
    const burnCompleteTriggered = useRef(false);
    const timeRef = useRef(0);

    // Burn animation with multiple effects
    useFrame((_, delta) => {
        timeRef.current += delta;

        if (burning && burnProgress < 1) {
            setBurnProgress(prev => Math.min(1, prev + delta * 0.25)); // ~4 seconds to fully burn
        }

        if (burning && burnProgress >= 0.9 && !burnCompleteTriggered.current) {
            burnCompleteTriggered.current = true;
            onBurnComplete?.();
        }

        // Paper transformation during burning
        if (meshRef.current) {
            // Shrink as it burns
            const burnScale = Math.max(0.05, 1 - burnProgress * 0.9);
            meshRef.current.scale.set(
                1 - burnProgress * 0.4,
                burnScale,
                1
            );

            // Curl/warp effect - paper curls as it burns
            if (burning && burnProgress < 0.9) {
                meshRef.current.rotation.x = Math.sin(timeRef.current * 3) * 0.15 * burnProgress;
                meshRef.current.rotation.z = Math.sin(timeRef.current * 5) * 0.1 * (1 - burnProgress);
                // Rise slightly as it burns
                meshRef.current.position.y = -0.15 + burnProgress * 0.1;
            }
        }
    });

    // Reset when not burning
    useEffect(() => {
        if (!burning) {
            setBurnProgress(0);
            burnCompleteTriggered.current = false;
            timeRef.current = 0;
        }
    }, [burning]);

    // Dynamic color transition: cream -> orange edge -> brown -> charcoal -> black
    const paperColor = useMemo(() => {
        if (burnProgress < 0.2) {
            // Cream to light brown
            return new Color('#f5f5dc').lerp(new Color('#d4a574'), burnProgress / 0.2);
        } else if (burnProgress < 0.5) {
            // Light brown to dark brown
            return new Color('#d4a574').lerp(new Color('#5c3d2e'), (burnProgress - 0.2) / 0.3);
        } else if (burnProgress < 0.8) {
            // Dark brown to charcoal
            return new Color('#5c3d2e').lerp(new Color('#2a2a2a'), (burnProgress - 0.5) / 0.3);
        }
        return new Color('#111111');
    }, [burnProgress]);

    // Glowing edge color (the combustion front)
    const glowIntensity = burning ? Math.sin(timeRef.current * 8) * 0.3 + 0.7 : 0;

    if (burnProgress >= 0.95) return null;

    return (
        <group>
            {/* Main paper body */}
            <mesh ref={meshRef} position={[0, -0.15, 0]}>
                <boxGeometry args={[0.45, 0.35, 0.015]} />
                <meshStandardMaterial
                    color={paperColor}
                    roughness={0.9}
                    emissive={burning && burnProgress > 0.1 ? '#ff4400' : '#000000'}
                    emissiveIntensity={burning ? burnProgress * 0.3 : 0}
                />
            </mesh>

            {/* Burning edge glow - the combustion front */}
            {burning && burnProgress > 0.05 && burnProgress < 0.85 && (
                <mesh position={[0, -0.15 - (0.35 * (1 - burnProgress) * 0.5), 0]}>
                    <boxGeometry args={[0.48 * (1 - burnProgress * 0.4), 0.04, 0.02]} />
                    <meshBasicMaterial
                        color="#ff6600"
                        transparent
                        opacity={glowIntensity * 0.8}
                    />
                </mesh>
            )}

            {/* Multi-layered fire effect */}
            {burning && burnProgress > 0.08 && burnProgress < 0.88 && (
                <group position={[0, -0.15, 0]}>
                    {/* Core white-hot flame */}
                    <mesh position={[0, 0.05, 0]}>
                        <sphereGeometry args={[0.06 * (1 - burnProgress * 0.5), 12, 12]} />
                        <meshBasicMaterial
                            color="#ffffcc"
                            transparent
                            opacity={0.9 * (1 - burnProgress)}
                        />
                    </mesh>

                    {/* Inner yellow flame */}
                    <mesh position={[Math.sin(timeRef.current * 12) * 0.02, 0.08, 0]}>
                        <sphereGeometry args={[0.1 * (1 - burnProgress * 0.4), 10, 10]} />
                        <meshBasicMaterial
                            color="#ffcc00"
                            transparent
                            opacity={0.75 * (1 - burnProgress)}
                        />
                    </mesh>

                    {/* Outer orange flame - flickers */}
                    <mesh position={[Math.sin(timeRef.current * 8) * 0.03, 0.12 + Math.sin(timeRef.current * 10) * 0.02, 0]}>
                        <sphereGeometry args={[0.14 * (1 - burnProgress * 0.3), 10, 10]} />
                        <meshBasicMaterial
                            color="#ff6600"
                            transparent
                            opacity={0.6 * (1 - burnProgress)}
                        />
                    </mesh>

                    {/* Red outer glow */}
                    <mesh position={[0, 0.15, 0]}>
                        <sphereGeometry args={[0.18 * (1 - burnProgress * 0.3), 8, 8]} />
                        <meshBasicMaterial
                            color="#ff3300"
                            transparent
                            opacity={0.35 * (1 - burnProgress)}
                        />
                    </mesh>

                    {/* Dynamic fire light - flickers */}
                    <pointLight
                        color="#ff6600"
                        intensity={3 * glowIntensity * (1 - burnProgress)}
                        distance={2.5}
                        decay={2}
                    />
                    <pointLight
                        color="#ffcc00"
                        intensity={1.5 * glowIntensity * (1 - burnProgress)}
                        distance={1.5}
                        position={[0, 0.1, 0]}
                    />
                </group>
            )}

            {/* Smoke particles - rise and fade */}
            {burning && burnProgress > 0.15 && burnProgress < 0.9 && (
                <group position={[0, 0.1, 0]}>
                    {/* Multiple smoke puffs at different phases */}
                    {[0, 0.3, 0.6, 0.9].map((phase, i) => {
                        const smokeTime = (timeRef.current + phase) % 1.5;
                        const smokeY = smokeTime * 0.4;
                        const smokeOpacity = Math.max(0, 0.4 - smokeTime * 0.3) * (1 - burnProgress);
                        const smokeX = Math.sin(timeRef.current * 2 + phase * 5) * 0.05;
                        return (
                            <mesh key={i} position={[smokeX, smokeY, 0]}>
                                <sphereGeometry args={[0.04 + smokeTime * 0.03, 8, 8]} />
                                <meshBasicMaterial
                                    color="#444444"
                                    transparent
                                    opacity={smokeOpacity}
                                />
                            </mesh>
                        );
                    })}
                </group>
            )}

            {/* Flying embers/sparks */}
            {burning && burnProgress > 0.1 && burnProgress < 0.85 && (
                <group position={[0, -0.1, 0]}>
                    {[0, 1.2, 2.4, 3.6, 4.8].map((phase, i) => {
                        const emberTime = (timeRef.current * 1.5 + phase) % 2;
                        const emberY = emberTime * 0.3;
                        const emberX = Math.sin(phase * 3) * 0.15 + Math.sin(timeRef.current * 4 + phase) * 0.05;
                        const emberZ = Math.cos(phase * 2) * 0.08;
                        const emberOpacity = Math.max(0, 1 - emberTime * 0.6) * (1 - burnProgress) * 0.8;
                        return (
                            <mesh key={i} position={[emberX, emberY, emberZ]}>
                                <sphereGeometry args={[0.012, 6, 6]} />
                                <meshBasicMaterial
                                    color={i % 2 === 0 ? "#ff8800" : "#ffaa00"}
                                    transparent
                                    opacity={emberOpacity}
                                />
                            </mesh>
                        );
                    })}
                </group>
            )}

            {/* Ash particles falling */}
            {burning && burnProgress > 0.4 && burnProgress < 0.95 && (
                <group position={[0, -0.2, 0]}>
                    {[0, 0.5, 1].map((phase, i) => {
                        const ashTime = (timeRef.current * 0.8 + phase) % 1.2;
                        const ashY = -ashTime * 0.15;
                        const ashX = Math.sin(phase * 4 + timeRef.current) * 0.08;
                        const ashOpacity = Math.max(0, 0.5 - ashTime * 0.4) * burnProgress;
                        return (
                            <mesh key={i} position={[ashX, ashY, 0]} rotation={[0, 0, timeRef.current + phase]}>
                                <boxGeometry args={[0.025, 0.015, 0.002]} />
                                <meshBasicMaterial
                                    color="#222222"
                                    transparent
                                    opacity={ashOpacity}
                                />
                            </mesh>
                        );
                    })}
                </group>
            )}
        </group>
    );
}

// Magnesium Ribbon for "Chemical Change" (Burning) - WORLD-CLASS ANIMATION
// Magnesium burns with an EXTREMELY bright white light - famous for this characteristic
export function MagnesiumRibbon({ burning = false, onBurnComplete }: { burning?: boolean; onBurnComplete?: () => void }) {
    const meshRef = useRef<Mesh>(null);
    const [burnProgress, setBurnProgress] = useState(0);
    const burnCompleteTriggered = useRef(false);
    const timeRef = useRef(0);

    // Burn animation - magnesium burns very brightly
    useFrame((_, delta) => {
        timeRef.current += delta;

        if (burning && burnProgress < 1) {
            setBurnProgress(prev => Math.min(1, prev + delta * 0.2)); // ~5 seconds for dramatic effect
        }

        if (burning && burnProgress >= 0.9 && !burnCompleteTriggered.current) {
            burnCompleteTriggered.current = true;
            onBurnComplete?.();
        }

        // Ribbon transformation during burning
        if (meshRef.current) {
            if (burning) {
                // Shrink from the burning end (Bottom to Top)
                const scale = Math.max(0.05, 1 - burnProgress * 0.95);
                meshRef.current.scale.set(1, scale, 1);

                // Adjust Y position to keep the TOP fixed while bottom shrinks up
                // Original Top Y = 0.15 (Center -0.15 + HalfHeight 0.3)
                // New Center Y = Top Y - (HalfHeight * scale)
                const newY = 0.15 - (0.3 * scale);

                meshRef.current.position.y = newY;
                // Slight trembling from intense heat
                meshRef.current.position.x = Math.sin(timeRef.current * 15) * 0.005;
                meshRef.current.position.z = Math.cos(timeRef.current * 12) * 0.003;
            }
        }
    });

    // Reset when not burning
    useEffect(() => {
        if (!burning) {
            setBurnProgress(0);
            burnCompleteTriggered.current = false;
            timeRef.current = 0;
            if (meshRef.current) {
                meshRef.current.scale.set(1, 1, 1);
                meshRef.current.position.y = -0.15;
            }
        }
    }, [burning]);

    // Flash intensity - ramps up, sustains, then fades
    const flashIntensity = useMemo(() => {
        if (burnProgress < 0.15) return burnProgress / 0.15;
        if (burnProgress < 0.75) return 1;
        return Math.max(0, (1 - burnProgress) / 0.25);
    }, [burnProgress]);

    // Pulsating effect for the intense light
    const pulseIntensity = burning ? Math.sin(timeRef.current * 20) * 0.15 + 0.85 : 0;

    // Calculate fire position (bottom of the current ribbon length)
    // Starts at -0.45 and moves up to 0.15
    const fireY = -0.45 + (0.6 * burnProgress);

    if (burnProgress >= 0.95) return null;

    return (
        <group>
            {/* Magnesium ribbon - hanging from tongs with some above grip point */}
            {/* Tilted slightly toward user for natural viewing angle */}
            <group position={[0, 0, 0]} rotation={[-0.2, 0, 0]}>
                {/* The metallic ribbon - gripped in MIDDLE, extends up and down */}
                {/* position Y=-0.15 means center is below grip, so top extends above grip */}
                <mesh ref={meshRef} position={[0, -0.15, 0]}>
                    {/* Ribbon: 8cm wide, 60cm long */}
                    <boxGeometry args={[0.08, 0.6, 0.015]} />
                    <meshStandardMaterial
                        color={burning ? '#ffffff' : '#b8b8b8'}
                        metalness={0.95}
                        roughness={0.15}
                        emissive={burning ? '#ffffff' : '#000000'}
                        emissiveIntensity={burning ? flashIntensity * 4 : 0}
                    />
                </mesh>

                {/* Burning consumption front - white hot tip tracking the burn */}
                {burning && burnProgress > 0.05 && burnProgress < 0.9 && (
                    <mesh position={[0, fireY + 0.02, 0]}>
                        <sphereGeometry args={[0.04, 10, 10]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                )}
            </group>

            {/* INTENSE BURNING EFFECTS - Magnesium burns BLINDINGLY bright */}
            {/* Move effects group to track the fireY */}
            {burning && burnProgress > 0.05 && burnProgress < 0.88 && (
                <group position={[0, fireY + 0.05, 0]}>
                    {/* Blue-white core - hottest part, characteristic of Mg flame */}
                    <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[0.08 * flashIntensity * pulseIntensity, 16, 16]} />
                        <meshBasicMaterial
                            color="#e0e8ff"
                            transparent
                            opacity={0.95 * flashIntensity}
                        />
                    </mesh>

                    {/* Pure white intense core */}
                    <mesh position={[Math.sin(timeRef.current * 18) * 0.01, 0.02, 0]}>
                        <sphereGeometry args={[0.12 * flashIntensity, 16, 16]} />
                        <meshBasicMaterial
                            color="#ffffff"
                            transparent
                            opacity={0.9 * flashIntensity * pulseIntensity}
                        />
                    </mesh>

                    {/* Bright white outer glow - the famous Mg brilliance */}
                    <mesh position={[0, 0.03, 0]}>
                        <sphereGeometry args={[0.2 * flashIntensity, 16, 16]} />
                        <meshBasicMaterial
                            color="#ffffff"
                            transparent
                            opacity={0.7 * flashIntensity}
                        />
                    </mesh>

                    {/* Warm white secondary glow */}
                    <mesh position={[0, 0.05, 0]}>
                        <sphereGeometry args={[0.3 * flashIntensity, 12, 12]} />
                        <meshBasicMaterial
                            color="#fffaf0"
                            transparent
                            opacity={0.5 * flashIntensity}
                        />
                    </mesh>

                    {/* Large ambient glow - illuminates surroundings */}
                    <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[0.5 * flashIntensity, 12, 12]} />
                        <meshBasicMaterial
                            color="#ffffee"
                            transparent
                            opacity={0.25 * flashIntensity}
                        />
                    </mesh>

                    {/* INTENSE lighting - multiple point lights for realism */}
                    <pointLight
                        color="#ffffff"
                        intensity={15 * flashIntensity * pulseIntensity}
                        distance={6}
                        decay={2}
                    />
                    <pointLight
                        color="#e8f0ff"
                        intensity={8 * flashIntensity}
                        distance={4}
                        position={[0, 0.1, 0]}
                    />
                    {/* Subtle blue tint for scientific accuracy */}
                    <pointLight
                        color="#ccddff"
                        intensity={3 * flashIntensity}
                        distance={3}
                        position={[0, -0.1, 0]}
                    />
                </group>
            )}

            {/* Intense white sparks flying off - characteristic of Mg burning */}
            {burning && burnProgress > 0.08 && burnProgress < 0.85 && (
                <group position={[0, -0.2, 0]}>
                    {[0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8, 5.6].map((phase, i) => {
                        const sparkTime = (timeRef.current * 2 + phase) % 1.5;
                        const sparkY = sparkTime * 0.5;
                        const sparkX = Math.sin(phase * 2.5) * 0.2 + Math.sin(timeRef.current * 6 + phase) * 0.08;
                        const sparkZ = Math.cos(phase * 1.8) * 0.15;
                        const sparkOpacity = Math.max(0, 1 - sparkTime * 0.8) * flashIntensity;
                        const sparkSize = 0.015 + Math.random() * 0.005;
                        return (
                            <mesh key={i} position={[sparkX, sparkY, sparkZ]}>
                                <sphereGeometry args={[sparkSize, 6, 6]} />
                                <meshBasicMaterial
                                    color="#ffffff"
                                    transparent
                                    opacity={sparkOpacity}
                                />
                            </mesh>
                        );
                    })}
                </group>
            )}

            {/* White smoke/oxide particles rising */}
            {burning && burnProgress > 0.15 && burnProgress < 0.9 && (
                <group position={[0, 0.1, 0]}>
                    {[0, 0.4, 0.8, 1.2].map((phase, i) => {
                        const smokeTime = (timeRef.current * 0.8 + phase) % 2;
                        const smokeY = smokeTime * 0.5;
                        const smokeX = Math.sin(timeRef.current * 1.5 + phase * 3) * 0.1;
                        const smokeOpacity = Math.max(0, 0.5 - smokeTime * 0.25) * flashIntensity * 0.6;
                        return (
                            <mesh key={i} position={[smokeX, smokeY, 0]}>
                                <sphereGeometry args={[0.05 + smokeTime * 0.04, 8, 8]} />
                                <meshBasicMaterial
                                    color="#f8f8f8"
                                    transparent
                                    opacity={smokeOpacity}
                                />
                            </mesh>
                        );
                    })}
                </group>
            )}

            {/* Falling MgO particles (white powder) */}
            {burning && burnProgress > 0.3 && burnProgress < 0.95 && (
                <group position={[0, -0.3, 0]}>
                    {[0, 0.6, 1.2].map((phase, i) => {
                        const oxideTime = (timeRef.current * 0.6 + phase) % 1.5;
                        const oxideY = -oxideTime * 0.2;
                        const oxideX = Math.sin(phase * 3 + timeRef.current * 0.8) * 0.1;
                        const oxideOpacity = Math.max(0, 0.7 - oxideTime * 0.5) * burnProgress;
                        return (
                            <mesh key={i} position={[oxideX, oxideY, 0]} rotation={[timeRef.current + phase, 0, timeRef.current * 0.5]}>
                                <boxGeometry args={[0.02, 0.01, 0.015]} />
                                <meshBasicMaterial
                                    color="#ffffff"
                                    transparent
                                    opacity={oxideOpacity}
                                />
                            </mesh>
                        );
                    })}
                </group>
            )}
        </group>
    );
}

// Ash/Burnt Residue - small flat blackened piece held by tongs
export function AshPile() {
    return (
        <group>
            {/* Small flat burnt residue - what's left of paper/magnesium */}
            <mesh position={[0, -0.1, 0]}>
                <boxGeometry args={[0.15, 0.08, 0.01]} />
                <meshStandardMaterial color="#1a1a1a" roughness={1} />
            </mesh>
            {/* Crumbly ash bits */}
            <mesh position={[0.05, -0.12, 0]}>
                <boxGeometry args={[0.06, 0.04, 0.01]} />
                <meshStandardMaterial color="#333" roughness={1} />
            </mesh>
            <mesh position={[-0.04, -0.13, 0]}>
                <boxGeometry args={[0.05, 0.03, 0.01]} />
                <meshStandardMaterial color="#2a2a2a" roughness={1} />
            </mesh>
        </group>
    );
}
