"use client";

import { AnimationConfig, VRMAvatar, useLipSync } from "@khaveeai/react";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { AnimationPanel } from "./AnimationPanel";
import { QuickActions } from "./QuickActions";

// Component to render VRM avatar with animations and automatic audio lip sync
function VRMAvatarWithAnimations() {
  const { mouthState, currentPhoneme } = useLipSync();

  // Just provide URLs to your FBX files - that's it!
  // No useFBX, no loading, no remapping - SDK does it all! 🎉
  const animations: AnimationConfig = {
    idle: "/models/animations/Breathing Idle.fbx", // Default - plays automatically
    swingDancing: "/models/animations/Swing Dancing.fbx",
    thriller: "/models/animations/Thriller Part 2.fbx",
    fistFight: "/models/animations/Fist Fight B.fbx",
  };

  // Debug log mouth state changes
  useEffect(() => {
    if (mouthState && Object.values(mouthState).some((v) => v > 0)) {
      console.log("VRM Mouth State Update:", mouthState);
      if (currentPhoneme) {
        console.log("Current Phoneme:", currentPhoneme);
      }
    }
  }, [mouthState, currentPhoneme]);

  return (
    <VRMAvatar
      src="/models/male.vrm"
      animations={animations} // SDK loads, remaps, and plays! 🚀
      position={[0, -1, 0]}
      scale={[1, 1, 1]}
    />
  );
}

export function VRMScene() {
  return (
    <div>
      <div className="w-full h-96 bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg overflow-hidden">
        <Canvas camera={{ position: [3, 4, 5], fov: 30 }}>
          <Environment preset="studio" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          <VRMAvatarWithAnimations />

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={1}
            maxDistance={5}
            target={[0, 0.5, 0]}
          />
        </Canvas>
      </div>

      {/* Quick Actions for preset combinations */}
      <QuickActions />

      {/* Animation panel */}
      <AnimationPanel />
    </div>
  );
}
