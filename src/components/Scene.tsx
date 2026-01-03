// Main 3D Lab Scene Component

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { Beaker } from './Beaker';
import { TestTube } from './TestTube';
import { TestTubeRack } from './TestTubeRack';
import { Dropper } from './Dropper';
import { FilterFunnel } from './FilterFunnel';
import { ConicalFlask } from './ConicalFlask';
import { PouringSystem } from './PouringSystem';
import { ReactionEffects } from './ReactionEffects';
import { GlassRod } from './GlassRod';
import { ChinaDish } from './ChinaDish';
import { TripodStand } from './TripodStand';
import { Burner } from './Burner';
import { Tongs } from './Tongs';
import { NeutralizationDropper } from './NeutralizationDropper';
import { useLabStore } from '../store/labStore';

import { SoundManager } from '../core/SoundManager';

interface SceneProps {
    className?: string;
    isMobile?: boolean;
}

function CameraAdjuster({ position, target }: { position: [number, number, number], target: [number, number, number] }) {
    const { camera, controls } = useThree();

    useEffect(() => {
        camera.position.set(...position);
    }, [camera, position]);

    useEffect(() => {
        if (controls) {
            // @ts-ignore - controls type is generic but has target
            controls.target.set(...target);
            // @ts-ignore
            controls.update();
        }
    }, [controls, target]);

    return null;
}

function LabBench() {
    return (
        <group>
            {/* Lab bench surface */}
            <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="#8d6e63" roughness={0.8} />
            </mesh>

            {/* Grid overlay for snapping visualization */}
            <Grid
                position={[0, 0.01, 0]}
                args={[10, 10]}
                cellSize={0.5}
                cellThickness={0.5}
                cellColor="#a1887f"
                sectionSize={2}
                sectionThickness={1}
                sectionColor="#6d4c41"
                fadeDistance={15}
                fadeStrength={1}
                followCamera={false}
                infiniteGrid={false}
            />
        </group>
    );
}

function Lighting() {
    return (
        <>
            {/* Ambient light for overall illumination */}
            <ambientLight intensity={0.5} />

            {/* Main directional light (simulating overhead lab lights) */}
            <directionalLight
                position={[5, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />

            {/* Fill light from the opposite side */}
            <directionalLight
                position={[-5, 5, -5]}
                intensity={0.3}
            />

            {/* Subtle rim light for glass reflections */}
            <pointLight position={[0, 5, -5]} intensity={0.5} color="#ffffff" />
        </>
    );
}

function VesselsRenderer({ isGuidedMode }: { isGuidedMode?: boolean }) {
    const vessels = useLabStore((state) => state.vessels);

    const beakers = Array.from(vessels.values()).filter(v => v.type === 'beaker');
    const testTubes = Array.from(vessels.values()).filter(v => v.type === 'test_tube');
    const flasks = Array.from(vessels.values()).filter(v => v.type === 'flask');

    return (
        <>
            {/* Beakers */}
            {beakers.map((vessel) => (
                <Beaker key={vessel.id} vesselId={vessel.id} />
            ))}

            {/* Test tubes */}
            {testTubes.map((vessel) => (
                <TestTube key={vessel.id} vesselId={vessel.id} />
            ))}

            {/* Test tube rack - only show in sandbox mode or if there are test tubes */}
            {!isGuidedMode && <TestTubeRack position={[-1.9, 0, -1]} />}

            {/* Conical flasks */}
            {flasks.map((vessel) => (
                <ConicalFlask key={vessel.id} vesselId={vessel.id} />
            ))}
        </>
    );
}

// Heating system - monitors vessels near burner and increases temperature
function HeatingSystem() {
    const vessels = useLabStore((state) => state.vessels);
    const bunsenBurnerOn = useLabStore((state) => state.bunsenBurnerOn);
    const updateVesselTemperature = useLabStore((state) => state.updateVesselTemperature);
    const addEffect = useLabStore((state) => state.addEffect);
    const activeEffects = useLabStore((state) => state.activeEffects);

    const lastBoilTime = useRef(0);
    // Heating zone centered at burner position [0, 0, 2]
    const heatingZone = [0, 0, 2.0];
    const heatingDistance = 0.7;

    useFrame((_, delta) => {
        if (!bunsenBurnerOn) {
            // Cool down all vessels when burner is off
            vessels.forEach((vessel) => {
                if (vessel.temperature > 25) {
                    const newTemp = Math.max(25, vessel.temperature - delta * 5);
                    updateVesselTemperature(vessel.id, newTemp);
                }
            });
            return;
        }

        // Check each vessel's distance to heating zone
        vessels.forEach((vessel) => {
            const dx = vessel.position[0] - heatingZone[0];
            const dz = vessel.position[2] - heatingZone[2];
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < heatingDistance) {
                // Heat the vessel
                const heatingRate = 15 * (1 - distance / heatingDistance); // Closer = faster heating
                const newTemp = Math.min(120, vessel.temperature + delta * heatingRate);
                updateVesselTemperature(vessel.id, newTemp);

                // Check for boiling (water at 100°C) - but skip if vessel has ice (melting experiment)
                const hasIce = vessel.contents.some(c => c.chemical.id === 'ice');
                if (vessel.temperature >= 100 && vessel.currentVolume > 0 && !hasIce) {
                    const now = Date.now();
                    // Add boiling effect every 5 seconds
                    if (now - lastBoilTime.current > 5000) {
                        const hasBoilingEffect = activeEffects.some(
                            e => e.vesselId === vessel.id && (e.type === 'boiling' || e.type === 'steam')
                        );
                        if (!hasBoilingEffect) {
                            addEffect({ type: 'boiling', vesselId: vessel.id, duration: 5000 });
                            addEffect({ type: 'steam', vesselId: vessel.id, duration: 5000 });
                            SoundManager.playBoiling(`boiling_${vessel.id}`, 5000);
                            lastBoilTime.current = now;
                        }
                    }
                }
            } else {
                // Cool down vessel if not near burner
                if (vessel.temperature > 25) {
                    const newTemp = Math.max(25, vessel.temperature - delta * 3);
                    updateVesselTemperature(vessel.id, newTemp);
                }
            }
        });
    });

    return null;
}

export function Scene({ className, isMobile = false }: SceneProps) {
    const experimentMode = useLabStore((state) => state.experimentMode);
    const currentExperiment = useLabStore((state) => state.currentExperiment);

    const isGuidedMode = experimentMode === 'guided' && currentExperiment !== null;

    // Get placed apparatus for guided mode visibility checks
    const placedApparatus = useLabStore((state) => state.placedApparatus);

    // Dynamic Camera Focus Point (Target)
    // For Filtration, shift right to see both beaker (0,0,0) and funnel (3.5,0,0)
    const cameraTarget: [number, number, number] = useMemo(() => {
        if (currentExperiment?.id === 'neutralization') return [0, 1.5, 0];
        if (isMobile && currentExperiment?.id === 'filtration') return [1.75, 0, 0];
        return [0, 0, 0];
    }, [isMobile, currentExperiment?.id]);

    // Dynamic Camera Position
    const cameraPosition: [number, number, number] = useMemo(() => {
        if (!isMobile) {
            return currentExperiment?.id === 'neutralization' ? [5, 6, 8] : [4, 5, 6];
        }

        if (currentExperiment?.id === 'evaporation' || currentExperiment?.id === 'salt-dissolution') {
            return [2.6, 3.6, 3.6]; // ~1.5x zoom centered at 0
        }
        if (currentExperiment?.id === 'filtration') {
            return [4.5, 4.0, 4.5]; // Centered at 1.75, offset by [2.75, 4, 4.5] for good view
        }
        if (currentExperiment?.id === 'neutralization') {
            return [6, 7, 9]; // Further back on mobile to see the full dropper
        }
        return [4, 5, 6];
    }, [isMobile, currentExperiment?.id]);

    // Check if apparatus should be visible
    // In guided mode: only show if actually placed by user
    // In sandbox mode: always show
    const needsFilterFunnel = !isGuidedMode ||
        placedApparatus.includes('funnel');
    const needsDropper = (!isGuidedMode || placedApparatus.includes('dropper')) &&
        currentExperiment?.id !== 'neutralization';

    return (
        <div className={className}>
            <Canvas
                camera={{ position: cameraPosition, fov: 50 }}
                shadows
                style={{ background: 'linear-gradient(to bottom, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)', touchAction: 'none' }}
            >
                <CameraAdjuster position={cameraPosition} target={cameraTarget} />
                {/* Environment for realistic reflections */}
                <Environment preset="studio" />

                {/* Lighting setup */}
                <Lighting />

                {/* Lab bench with grid */}
                <LabBench />

                {/* Tripod Stand - shows when placed in guided mode, always in sandbox */}
                {(!isGuidedMode || placedApparatus.includes('tripod-stand')) && <TripodStand />}

                {/* Burner - shows when placed (under tripod stand) */}
                {(!isGuidedMode || placedApparatus.includes('burner')) && <Burner />}

                {/* Keep old BunsenBurner for sandbox mode for backward compatibility */}
                {/* {needsBunsenBurner && <BunsenBurner />} */}

                {/* Heating system */}
                <HeatingSystem />

                {/* All vessels from store */}
                <VesselsRenderer isGuidedMode={isGuidedMode} />

                {/* Pouring system for liquid transfer */}
                <PouringSystem />

                {/* Reaction visual effects */}
                <ReactionEffects />

                {/* Glass rod for stirring - appears in guided mode when placed */}
                {isGuidedMode && <GlassRod />}

                {/* Dropper for precise additions - only in sandbox or if experiment needs it */}
                {needsDropper && <Dropper position={[2.5, 0, -1]} />}

                {/* Filter funnel setup - only in sandbox or if experiment needs it */}
                {needsFilterFunnel && <FilterFunnel position={[3.5, 0, 0]} />}

                {/* China dish for evaporation - only when placed */}
                {placedApparatus.includes('china-dish') && <ChinaDish />}

                {/* Tongs for holding paper/magnesium - only when placed */}
                {placedApparatus.includes('tongs') && <Tongs />}

                {/* Neutralization Dropper - handles its own visibility (animating state) */}
                <NeutralizationDropper />

                {/* Camera controls */}
                <OrbitControls
                    makeDefault
                    // target is handled by CameraAdjuster
                    minPolarAngle={0.1}
                    maxPolarAngle={Math.PI / 2 - 0.1}
                    minDistance={3}
                    maxDistance={15}
                    enablePan={true}
                    panSpeed={0.5}
                />
            </Canvas>
        </div>
    );
}
