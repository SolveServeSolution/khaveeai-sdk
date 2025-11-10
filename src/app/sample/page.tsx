"use client";
import { KhaveeProvider, VRMAvatar } from "@khaveeai/react";
import { CameraControls, Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import Animation from "./components/Animation";
import Expression from "./components/Expression";
import LipSync from "./components/Lipsync";
import { OpenAIRealtimeProvider } from "@khaveeai/providers-openai-realtime";
import Chat from "./components/Chat";
import ModelSelector, { Model } from "@/app/sample/components/ModelSelector";
import { useRef, useState } from "react";
import { searchKnowledgeBase } from "./lib/rag"; // Import server action

export default function page() {
  const controls = useRef(null);
  const [currentModel, setCurrentModel] = useState(
    "/models/male/nongkhavee_male_01.vrm"
  );
  const [showModelSelector, setShowModelSelector] = useState(false);

  const realtime = new OpenAIRealtimeProvider({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
    instructions:
      "พูดคุยกับผู้ใช้เป็นกันเอง ใช้ search_knowledge_base tool เมื่อผู้ใช้ถามคำถามที่ต้องการข้อมูลเฉพาะเจาะจง",
    tools: [
      {
        name: "search_knowledge_base",
        description:
          "Search the knowledge base for relevant information to answer questions accurately",
        parameters: {
          query: {
            type: "string",
            description: "The search query to find relevant information",
            required: true,
          },
        },
        execute: async (args: { query: string }) => {
          console.log("🔍 RAG Search:", args.query);
          const result = await searchKnowledgeBase(args.query);
          console.log("📊 Found:", result.success);
          console.log("📄 Context:", result.message);
          return result;
        },
      },
    ],
  });

  const animations = {
    idle: "/models/animations/idle.fbx",
    fight: "/models/animations/Fist Fight B.fbx",
    talking: "/models/animations/talking.fbx",
    // talking1: "/models/animations/talking1.fbx",
  };

  const handleModelSelect = (model: Model) => {
    setCurrentModel(model.path);
    setShowModelSelector(false);
  };
  return (
    <KhaveeProvider
      config={{
        realtime: realtime,
      }}
    >
      <Canvas camera={{ position: [0.25, 0.25, 2], fov: 30 }}>
        <CameraControls
          ref={controls}
          maxPolarAngle={Math.PI / 2}
          minDistance={1}
          maxDistance={10}
        />
        {/* <VRMAvatar
          src={currentModel}
          animations={animations}
          position-y={-1.25}
          enableBlinking={true}
        /> */}
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
        {/* Model Selector Button */}
        {/* <button
          onClick={() => setShowModelSelector(!showModelSelector)}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg mb-2 transition-colors"
        >
          {showModelSelector ? "Hide Models" : "Change Avatar"}
        </button> */}
      </div>

      {/* Model Selector Modal */}
      {showModelSelector && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <ModelSelector
              onModelSelect={handleModelSelect}
              currentModel={currentModel}
            />
            <div className="text-center mt-4">
              <button
                onClick={() => setShowModelSelector(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </KhaveeProvider>
  );
}
