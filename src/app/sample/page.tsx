"use client";
import { KhaveeProvider, VRMAvatar } from "@khaveeai/react";
import { CameraControls, Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import Animation from "./components/Animation";
import Expression from "./components/Expression";
import LipSync from "./components/Lipsync";

export default function page() {
  const controls = useRef(null);

  const animations = {
    idle: "/models/animations/Breathing Idle.fbx",
    fight: "/models/animations/Fist Fight B.fbx",
  };
  return (
    <KhaveeProvider>
      <Canvas camera={{ position: [0.25, 0.25, 2], fov: 30 }}>
        <CameraControls
          ref={controls}
          maxPolarAngle={Math.PI / 2}
          minDistance={1}
          maxDistance={10}
        />
        <VRMAvatar
          src="./models/male.vrm"
          animations={animations}
          position-y={-1.25}
        />
        <ambientLight intensity={0.5} />
        <Environment preset="sunset" />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <color attach="background" args={["#333"]} />
      </Canvas>
      <div className="absolute bottom-10 left-10 flex gap-10">
        <Animation />
        <Expression />
        <LipSync />
      </div>
    </KhaveeProvider>
  );
}
