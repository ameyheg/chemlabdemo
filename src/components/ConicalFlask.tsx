// ConicalFlask (Erlenmeyer Flask) - Classic lab flask with narrow neck

import { useRef, useMemo, useState, useCallback } from 'react';
import { Mesh, DoubleSide, Group, Vector3, Vector2, Plane, Raycaster } from 'three';
import { useThree } from '@react-three/fiber';
import { useLabStore } from '../store/labStore';

interface ConicalFlaskProps {
    vesselId: string;
}

export function ConicalFlask({ vesselId }: ConicalFlaskProps) {
    const meshRef = useRef<Mesh>(null);
    const groupRef = useRef<Group>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);

    const { camera, gl } = useThree();

    const vessel = useLabStore((state) => state.vessels.get(vesselId));
    const currentVolume = useLabStore((state) => state.vessels.get(vesselId)?.currentVolume ?? 0);
    const contents = useLabStore((state) => state.vessels.get(vesselId)?.contents ?? []);
    const selectedVesselId = useLabStore((state) => state.selectedVesselId);
    const selectVessel = useLabStore((state) => state.selectVessel);
    const updateVesselTilt = useLabStore((state) => state.updateVesselTilt);
    const updateVesselPosition = useLabStore((state) => state.updateVesselPosition);

    const isSelected = selectedVesselId === vesselId;

    // Flask dimensions
    const flaskHeight = 1.8;
    const baseRadius = 0.6;
    const neckRadius = 0.15;

    const position = vessel?.position || [0, 0, 0];
    const capacity = vessel?.capacity || 250;
    const temperature = vessel?.temperature || 25;

    const liquidHeight = useMemo(() => {
        if (currentVolume === 0) return 0;
        const fillRatio = currentVolume / capacity;
        return fillRatio * (flaskHeight * 0.6); // Liquid only in bottom portion
    }, [currentVolume, capacity, flaskHeight]);

    const liquidColor = useMemo(() => {
        if (contents.length === 0) return '#4fc3f7';
        const primaryContent = contents.reduce((prev, curr) =>
            curr.volume > prev.volume ? curr : prev
        );
        return primaryContent.chemical.color;
    }, [contents]);

    const tiltAngle = vessel?.tiltAngle || 0;
    const tiltRadians = (tiltAngle * Math.PI) / 180;

    const handleClick = useCallback((e: any) => {
        e.stopPropagation();
        selectVessel(vesselId);
    }, [vesselId, selectVessel]);

    const handlePointerDown = useCallback((e: any) => {
        e.stopPropagation();
        if (!isSelected) {
            selectVessel(vesselId);
            return;
        }
        const shiftHeld = e.shiftKey || e.nativeEvent?.shiftKey;
        setIsMoving(shiftHeld);
        setIsDragging(true);
        setDragStartY(e.clientY || e.nativeEvent?.clientY || 0);
        if (e.target?.setPointerCapture && e.pointerId !== undefined) {
            e.target.setPointerCapture(e.pointerId);
        }
    }, [isSelected, vesselId, selectVessel]);

    const raycaster = useMemo(() => new Raycaster(), []);
    const groundPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);

    const handlePointerMove = useCallback((e: any) => {
        if (!isDragging || !isSelected) return;
        e.stopPropagation();

        if (isMoving) {
            const rect = gl.domElement.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(new Vector2(mouseX, mouseY), camera);
            const intersection = new Vector3();
            raycaster.ray.intersectPlane(groundPlane, intersection);

            if (intersection) {
                const newX = Math.max(-4, Math.min(4, intersection.x));
                const newZ = Math.max(-4, Math.min(4, intersection.z));

                const heatingZoneX = 0;
                const heatingZoneZ = 2.0;
                const heatingZoneRadius = 0.8;
                const standHeight = 1.0;

                const distToHeatingZone = Math.sqrt(
                    Math.pow(newX - heatingZoneX, 2) + Math.pow(newZ - heatingZoneZ, 2)
                );

                if (distToHeatingZone < heatingZoneRadius) {
                    updateVesselPosition(vesselId, [heatingZoneX, standHeight, heatingZoneZ]);
                } else {
                    updateVesselPosition(vesselId, [newX, 0, newZ]);
                }
            }
        } else {
            const currentY = e.clientY || e.nativeEvent?.clientY || 0;
            const deltaY = dragStartY - currentY;
            const sensitivity = 0.5;
            const newTilt = Math.max(0, Math.min(70, tiltAngle + deltaY * sensitivity));
            updateVesselTilt(vesselId, newTilt);
            setDragStartY(currentY);
        }
    }, [isDragging, isSelected, isMoving, vesselId, tiltAngle, updateVesselTilt, updateVesselPosition, dragStartY, camera, gl, raycaster, groundPlane]);

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

    const isHot = temperature > 50;

    return (
        <group ref={groupRef} position={position as [number, number, number]}>
            <group rotation={[0, 0, -tiltRadians]}>
                {/* Selection ring */}
                {isSelected && (
                    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[baseRadius + 0.05, baseRadius + 0.15, 24]} />
                        <meshBasicMaterial color={isMoving ? "#ffaa00" : "#00ff88"} transparent opacity={0.9} />
                    </mesh>
                )}

                {/* Flask body - conical shape */}
                <mesh
                    ref={meshRef}
                    position={[0, flaskHeight * 0.35, 0]}
                    onClick={handleClick}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    <cylinderGeometry args={[neckRadius, baseRadius, flaskHeight * 0.7, 24, 1, true]} />
                    <meshBasicMaterial
                        color={isSelected ? "#aaffcc" : isHot ? "#ffccaa" : "#c8e6f8"}
                        transparent
                        opacity={isSelected ? 0.3 : 0.2}
                        side={DoubleSide}
                        depthWrite={false}
                    />
                </mesh>

                {/* Neck */}
                <mesh position={[0, flaskHeight * 0.8, 0]}>
                    <cylinderGeometry args={[neckRadius, neckRadius, flaskHeight * 0.25, 16, 1, true]} />
                    <meshBasicMaterial color="#c8e6f8" transparent opacity={0.25} side={DoubleSide} depthWrite={false} />
                </mesh>

                {/* Bottom */}
                <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[baseRadius, 24]} />
                    <meshBasicMaterial color="#c8e6f8" transparent opacity={0.2} depthWrite={false} />
                </mesh>

                {/* Rim */}
                <mesh position={[0, flaskHeight * 0.92, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[neckRadius - 0.02, neckRadius + 0.02, 16]} />
                    <meshBasicMaterial color="#ffffff" />
                </mesh>

                {/* Liquid */}
                {liquidHeight > 0 && (
                    <>
                        <mesh position={[0, liquidHeight / 2 + 0.05, 0]} renderOrder={1}>
                            <cylinderGeometry
                                args={[
                                    baseRadius * 0.5 * (1 - liquidHeight / flaskHeight),
                                    baseRadius * 0.85,
                                    liquidHeight,
                                    24
                                ]}
                            />
                            <meshBasicMaterial color={liquidColor} transparent opacity={0.85} />
                        </mesh>
                        <mesh position={[0, liquidHeight + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
                            <circleGeometry args={[baseRadius * 0.85 * (1 - liquidHeight / flaskHeight / 2), 24]} />
                            <meshBasicMaterial color={liquidColor} transparent opacity={0.95} />
                        </mesh>
                    </>
                )}
            </group>
        </group>
    );
}
