"use client";
import { KhaveeProvider, VRMAvatar } from "@khaveeai/react";
import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import Animation from "./components/Animation";
import Expression from "./components/Expression";
import LipSync from "./components/Lipsync";
import { OpenAIRealtimeProvider } from "@khaveeai/providers-openai-realtime";
import Chat from "./components/Chat";

export default function page() {
  const realtime = new OpenAIRealtimeProvider({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
    instructions : "พูดหยาบ พูดกระแทกด้วยน้ำเสียงดุดัน พูดแทนตัวเองว่ากู มึง ด่าได้เสมอ เราชอบมากๆ",
  });
  const animations = {
    idle: "/models/animations/Breathing Idle.fbx",
    fight: "/models/animations/Fist Fight B.fbx",
  };
  return (
    <KhaveeProvider
      config={{
        realtime: realtime,
      }}
    >
      <Canvas camera={{ position: [0.25, 0.25, 2], fov: 30 }}>
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
      <div className="absolute bottom-10 left-10 flex gap-10 items-end">
        <Animation />
        <Expression />
        <LipSync />
      </div>
      <div className="absolute bottom-10 right-10">
        <Chat />
      </div>
    </KhaveeProvider>
  );
}
