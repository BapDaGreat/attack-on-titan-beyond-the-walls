"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ExplorationMode } from "@/data/world";
import { resolveWorldCollision, sampleGroundHeight } from "@/engine/collision";

export type CameraControlMode = "orbit" | "walk" | "fly" | "tour";

export interface CameraTargetPose {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  id: string;
}

interface CameraRigProps {
  mode: ExplorationMode;
  controlMode: CameraControlMode;
  targetPose: CameraTargetPose;
  reducedMotion: boolean;
  /** Touch virtual joystick deltas [-1..1] for mobile Free Explore */
  touchMoveInput: { x: number; y: number };
  onExitWalkMode?: () => void;
}

/**
 * Authoritative Single-Owner Camera Rig (`3d-virtual-tour` & `build-game-camera-controls`).
 * - Transitions smoothly between authored viewpoints when mode/tour/landmark changes.
 * - Supports Orbit inspection AND true Walk/Fly exploration (WASD, Shift sprint, Space/C ascend/descend,
 *   drag-to-look, mobile touch stick, and circle-vs-AABB building/wall collision).
 */
export const CameraRig: React.FC<CameraRigProps> = ({
  mode,
  controlMode,
  targetPose,
  reducedMotion,
  touchMoveInput,
}) => {
  const { camera, gl } = useThree();
  const orbitRef = useRef<OrbitControlsImpl>(null);

  // Smooth transition state for Orbit/Tour arrivals
  const transRef = useRef<{
    active: boolean;
    lastPoseId: string;
    goalPos: THREE.Vector3;
    goalTarget: THREE.Vector3;
    goalFov: number;
  }>({
    active: false,
    lastPoseId: "",
    goalPos: new THREE.Vector3(...targetPose.position),
    goalTarget: new THREE.Vector3(...targetPose.target),
    goalFov: targetPose.fov,
  });

  // Walk / Fly free-exploration input & orientation state
  const keysRef = useRef<Record<string, boolean>>({});
  const lookRef = useRef<{ yaw: number; pitch: number; dragging: boolean; lastX: number; lastY: number }>({
    yaw: 0,
    pitch: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  // Trigger camera glide whenever targetPose changes
  useEffect(() => {
    const tr = transRef.current;
    if (tr.lastPoseId !== targetPose.id) {
      tr.lastPoseId = targetPose.id;
      tr.goalPos.set(...targetPose.position);
      tr.goalTarget.set(...targetPose.target);
      tr.goalFov = targetPose.fov;
      tr.active = true;

      if (reducedMotion || controlMode === "walk" || controlMode === "fly") {
        camera.position.copy(tr.goalPos);
        if (orbitRef.current) {
          orbitRef.current.target.copy(tr.goalTarget);
          orbitRef.current.update();
        } else {
          camera.lookAt(tr.goalTarget);
        }
        if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
          (camera as THREE.PerspectiveCamera).fov = tr.goalFov;
          (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        }
        tr.active = false;
      }

      // Synchronize yaw/pitch when switching into Walk/Fly
      const dir = new THREE.Vector3().subVectors(tr.goalTarget, tr.goalPos).normalize();
      lookRef.current.yaw = Math.atan2(-dir.x, -dir.z);
      lookRef.current.pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -0.92, 0.92));
    }
  }, [targetPose, camera, reducedMotion, controlMode]);

  // Keyboard & pointer look listeners for Walk/Fly exploration mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") {
        return;
      }
      keysRef.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (controlMode !== "walk" && controlMode !== "fly") return;
    const dom = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      lookRef.current.dragging = true;
      lookRef.current.lastX = e.clientX;
      lookRef.current.lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!lookRef.current.dragging) return;
      const dx = e.clientX - lookRef.current.lastX;
      const dy = e.clientY - lookRef.current.lastY;
      lookRef.current.lastX = e.clientX;
      lookRef.current.lastY = e.clientY;
      lookRef.current.yaw -= dx * 0.0042;
      lookRef.current.pitch = THREE.MathUtils.clamp(
        lookRef.current.pitch - dy * 0.0042,
        -1.38,
        1.38
      );
    };
    const onPointerUp = () => {
      lookRef.current.dragging = false;
    };

    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [controlMode, gl]);

  const fwd = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const tr = transRef.current;

    if (controlMode === "walk" || controlMode === "fly") {
      // Cancel pending guided transition once player steers manually
      tr.active = false;

      const k = keysRef.current;
      const sprint = k["ShiftLeft"] || k["ShiftRight"] ? 2.4 : 1.0;
      const baseSpeed = mode === "paradis" ? 42 : controlMode === "fly" ? 18 : 7.2;
      const speed = baseSpeed * sprint * dt;

      const forwardInput =
        (k["KeyW"] || k["ArrowUp"] ? 1 : 0) -
        (k["KeyS"] || k["ArrowDown"] ? 1 : 0) -
        touchMoveInput.y;
      const strafeInput =
        (k["KeyD"] || k["ArrowRight"] ? 1 : 0) -
        (k["KeyA"] || k["ArrowLeft"] ? 1 : 0) +
        touchMoveInput.x;

      euler.current.set(lookRef.current.pitch, lookRef.current.yaw, 0, "YXZ");
      camera.quaternion.setFromEuler(euler.current);

      fwd.current.set(0, 0, -1).applyQuaternion(camera.quaternion);
      if (controlMode === "walk") fwd.current.y = 0;
      if (fwd.current.lengthSq() > 0.0001) fwd.current.normalize();

      right.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
      right.current.y = 0;
      right.current.normalize();

      let nx = camera.position.x + (fwd.current.x * forwardInput + right.current.x * strafeInput) * speed;
      let nz = camera.position.z + (fwd.current.z * forwardInput + right.current.z * strafeInput) * speed;
      let ny = camera.position.y;

      if (controlMode === "fly") {
        const upInput = (k["Space"] ? 1 : 0) - (k["KeyC"] || k["ControlLeft"] ? 1 : 0);
        ny += (fwd.current.y * forwardInput + upInput) * speed;
        const floor = sampleGroundHeight(mode, nx, nz) + 1.0;
        ny = Math.max(floor, Math.min(340, ny));
      } else {
        const floor = sampleGroundHeight(mode, nx, nz);
        ny = THREE.MathUtils.lerp(ny, floor + 1.7, 1 - Math.exp(-12 * dt));
      }

      const resolved = resolveWorldCollision(mode, nx, ny - 1.7, nz, 0.6);
      camera.position.set(resolved.x, ny, resolved.z);
      return;
    }

    // Orbit / Tour damped camera glide
    if (tr.active) {
      const alpha = 1 - Math.exp(-4.8 * dt);
      camera.position.lerp(tr.goalPos, alpha);
      if (orbitRef.current) {
        orbitRef.current.target.lerp(tr.goalTarget, alpha);
        orbitRef.current.update();
      } else {
        camera.lookAt(tr.goalTarget);
      }
      if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const persp = camera as THREE.PerspectiveCamera;
        persp.fov = THREE.MathUtils.lerp(persp.fov, tr.goalFov, alpha);
        persp.updateProjectionMatrix();
      }

      const distPos = camera.position.distanceTo(tr.goalPos);
      const distTgt = orbitRef.current
        ? orbitRef.current.target.distanceTo(tr.goalTarget)
        : 0;
      if (distPos < 0.05 && distTgt < 0.05) {
        tr.active = false;
      }
    }
  });

  if (controlMode === "walk" || controlMode === "fly") {
    return null;
  }

  return (
    <OrbitControls
      ref={orbitRef}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      maxPolarAngle={Math.PI * 0.495}
      minDistance={mode === "characters" ? 1.4 : mode === "paradis" ? 40 : 2.2}
      maxDistance={mode === "paradis" ? 420 : mode === "scale" ? 360 : 220}
      onStart={() => {
        // Immediately yield camera ownership to user drag!
        transRef.current.active = false;
      }}
    />
  );
};
