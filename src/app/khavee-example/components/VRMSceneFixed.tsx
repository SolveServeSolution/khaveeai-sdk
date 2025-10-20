"use client";

import { AnimationConfig, VRMAvatar, useAudioLipSync } from "@khaveeai/react";
import { CameraControls, Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { AnimationPanel } from "./AnimationPanel";
import { QuickActions } from "./QuickActions";
import type { PhonemeData, MouthState } from "@khaveeai/core";

// Component to render VRM avatar with animations and automatic audio lip sync
function VRMAvatarWithAnimations({
  mouthState: propMouthState,
}: {
  mouthState?: MouthState;
}) {
  const mouthState = propMouthState;

  // Just provide URLs to your FBX files - that's it!
  // No useFBX, no loading, no remapping - SDK does it all! 🎉
  const animations: AnimationConfig = {
    idle: "/models/animations/Breathing Idle.fbx", // Default - plays automatically
    swingDancing: "/models/animations/Swing Dancing.fbx",
    thriller: "/models/animations/Thriller Part 2.fbx",
    fistFight: "/models/animations/Fist Fight B.fbx",
  };

  return (
    <>
      <VRMAvatar
        src="/models/male.vrm"
        animations={animations} // SDK loads, remaps, and plays! 🚀
        position={[0, -1, 0]}
        scale={[1, 1, 1]}
        enableLipSync
        mouthState={mouthState}
      />
    </>
  );
}

// Audio Lip-Sync Demo Component - Implemented directly in this file
function AudioLipSyncDemo({
  mouthState: propMouthState,
  currentPhoneme: propCurrentPhoneme,
  analyzeLipSync: propAnalyzeLipSync,
  stopLipSync: propStopLipSync,
  isAnalyzing: propIsAnalyzing,
}: {
  mouthState?: MouthState;
  currentPhoneme?: PhonemeData | null;
  analyzeLipSync?: (audioUrl: string, options?: any) => Promise<void>;
  stopLipSync?: () => void;
  isAnalyzing?: boolean;
}) {
  const hookData = useAudioLipSync();

  // Use props if provided, otherwise use hook data
  const mouthState = propMouthState || hookData.mouthState;
  const currentPhoneme = propCurrentPhoneme || hookData.currentPhoneme;
  const analyzeLipSync = propAnalyzeLipSync || hookData.analyzeLipSync;
  const stopLipSync = propStopLipSync || hookData.stopLipSync;
  const isAnalyzing = propIsAnalyzing || hookData.isAnalyzing;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [intensityMultiplier, setIntensityMultiplier] = useState(4.0);
  const [sensitivity, setSensitivity] = useState(0.1);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  const startLipSync = async () => {
    if (!audioUrl) return;

    await analyzeLipSync(audioUrl, {
      sensitivity: sensitivity,
      smoothing: 0.5,
      intensityMultiplier: intensityMultiplier,
      minIntensity: 0.2,
      onPhonemeChange: (phoneme: PhonemeData) => {
        console.log("🎵 Phoneme detected:", phoneme);
      },
      onMouthStateChange: (state: MouthState) => {
        console.log("👄 Mouth state:", state);
      },
    });
  };

  return (
    <div className="audio-lip-sync-demo">
      <h3 className="text-lg font-bold mb-4">Audio File Lip-Sync</h3>

      {/* File Upload */}
      <div className="upload-section mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {audioUrl && (
          <p className="mt-2 text-green-600">
            Audio loaded: Ready for lip-sync analysis
          </p>
        )}
      </div>

      {/* Intensity Controls */}
      <div className="intensity-controls mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="slider-group mb-4">
          <label className="block mb-2 font-semibold">
            Intensity Multiplier: {intensityMultiplier.toFixed(1)}x
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={intensityMultiplier}
              onChange={(e) =>
                setIntensityMultiplier(parseFloat(e.target.value))
              }
              disabled={isAnalyzing}
              className="w-full mt-2"
            />
          </label>
        </div>

        <div className="slider-group">
          <label className="block mb-2 font-semibold">
            Sensitivity: {(sensitivity * 100).toFixed(0)}%
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              disabled={isAnalyzing}
              className="w-full mt-2"
            />
          </label>
        </div>
      </div>

      {/* Controls */}
      <div className="controls mb-4 flex flex-wrap gap-2">
        <button
          onClick={startLipSync}
          disabled={!audioUrl || isAnalyzing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? "Analyzing..." : "Start Lip-Sync"}
        </button>

        <button
          onClick={stopLipSync}
          disabled={!isAnalyzing}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Stop
        </button>
      </div>

      {/* Debug Info */}
      <div className="debug-info bg-gray-100 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Current State:</h4>
        <p className="mb-2">
          Status:{" "}
          <span className={isAnalyzing ? "text-green-600" : "text-gray-600"}>
            {isAnalyzing ? "Analyzing" : "Stopped"}
          </span>
        </p>

        {currentPhoneme && (
          <p className="mb-2">
            Phoneme: <span className="font-mono">{currentPhoneme.phoneme}</span>
            (intensity:{" "}
            <span className="font-mono">
              {currentPhoneme.intensity.toFixed(2)}
            </span>
            )
          </p>
        )}

        <div className="mouth-state">
          <p className="font-semibold mb-2">Mouth State:</p>
          <ul className="space-y-1 font-mono text-sm">
            <li>AA (あ): {mouthState.aa.toFixed(2)}</li>
            <li>IH (い): {mouthState.ih.toFixed(2)}</li>
            <li>OU (う): {mouthState.ou.toFixed(2)}</li>
            <li>EE (え): {mouthState.ee.toFixed(2)}</li>
            <li>OH (お): {mouthState.oh.toFixed(2)}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function VRMScene() {
  const {
    mouthState,
    currentPhoneme,
    analyzeLipSync,
    stopLipSync,
    isAnalyzing,
  } = useAudioLipSync();

  return (
    <div>
      <div className="w-full h-96 bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg overflow-hidden">
        <Canvas camera={{  position: [0.25, 0.25, 2], fov: 30 }}>
          <Environment preset="studio" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
        
          <VRMAvatarWithAnimations mouthState={mouthState} />
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
      {/* <QuickActions /> */}

      {/* Animation panel */}
      {/* <AnimationPanel /> */}

      {/* Audio Lip-Sync Demo */}
      <AudioLipSyncDemo
        mouthState={mouthState}
        currentPhoneme={currentPhoneme}
        analyzeLipSync={analyzeLipSync}
        stopLipSync={stopLipSync}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
}
