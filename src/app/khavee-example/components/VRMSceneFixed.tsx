"use client";

import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { VRMAvatar, useVRMExpressions, useLipSync, useVoice, AnimationConfig } from '@khaveeai/react';
import { AnimationPanel } from './AnimationPanel';
import { QuickActions } from './QuickActions';

// Lip sync debug panel
function LipSyncDebugPanel() {
  const { mouthState, currentPhoneme } = useLipSync();
  const { setExpression } = useVRMExpressions();
  const { speaking } = useVoice();
  
  const testPhoneme = (phoneme: string) => {
    console.log(`Testing ${phoneme} phoneme`);
    setExpression(phoneme, 1);
    setTimeout(() => setExpression(phoneme, 0), 5000);
  };
  
  return (
    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
      <h3 className="text-lg font-bold mb-3 text-green-800">🎤 Realtime Lip Sync</h3>
      
      {/* TTS Speaking Status */}
      <div className="mb-3">
        <strong className="text-green-700">TTS Status:</strong>
        <span className={`ml-2 px-2 py-1 rounded text-sm ${
          speaking 
            ? 'bg-red-200 text-red-800' 
            : 'bg-gray-200 text-gray-600'
        }`}>
          {speaking ? '🔊 Speaking' : '🔇 Silent'}
        </span>
      </div>
      
      {/* Current phoneme */}
      <div className="mb-3">
        <strong className="text-green-700">Current Phoneme:</strong>
        {currentPhoneme ? (
          <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 rounded text-sm">
            {currentPhoneme.phoneme} (intensity: {(currentPhoneme.intensity * 100).toFixed(1)}%)
          </span>
        ) : (
          <span className="ml-2 text-gray-500">None detected</span>
        )}
      </div>
      
      {/* Mouth state visualization */}
      <div className="mb-3">
        <strong className="text-green-700">Mouth State (Visemes):</strong>
        <div className="mt-2 space-y-2">
          {Object.entries(mouthState || {}).map(([viseme, value]) => (
            <div key={viseme} className="flex items-center">
              <span className="w-8 text-sm font-mono text-green-700">{viseme}:</span>
              <div className="flex-1 mx-2 h-2 bg-gray-200 rounded">
                <div 
                  className="h-full bg-green-500 rounded transition-all duration-100"
                  style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
                />
              </div>
              <span className="text-xs text-green-600 w-12">
                {(value * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Manual test buttons */}
      <div className="mt-3 grid grid-cols-5 gap-2">
        <button
          onClick={() => testPhoneme('aa')}
          className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs hover:bg-green-300"
        >
          Test AA
        </button>
        <button
          onClick={() => testPhoneme('ih')}
          className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs hover:bg-green-300"
        >
          Test I
        </button>
        <button
          onClick={() => testPhoneme('ou')}
          className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs hover:bg-green-300"
        >
          Test U
        </button>
        <button
          onClick={() => testPhoneme('ee')}
          className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs hover:bg-green-300"
        >
          Test E
        </button>
        <button
          onClick={() => testPhoneme('oh')}
          className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs hover:bg-green-300"
        >
          Test O
        </button>
      </div>
      
      {/* Status */}
      <div className="text-sm text-green-600 mt-3">
        {mouthState && Object.values(mouthState).some(v => v > 0) ? (
          '🟢 Lip sync active (Realtime)'
        ) : (
          '⚪ Using TTS-based lip sync'
        )}
      </div>
    </div>
  );
}

// Expression controls that will be properly in VRM context
function ExpressionControls() {
  const { setExpression, resetExpressions, expressions } = useVRMExpressions();

  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-3">VRM Expression Controls</h3>
      
      {/* Current expressions display */}
      <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
        <strong>Active expressions:</strong>
        {Object.keys(expressions).length > 0 ? (
          <div className="mt-1">
            {Object.entries(expressions).map(([name, value]) => (
              <span key={name} className="inline-block mr-2 px-2 py-1 bg-blue-100 rounded text-xs">
                {name}: {value.toFixed(2)}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-500 ml-2">None</span>
        )}
      </div>

      {/* Expression buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <button
          onClick={() => {
            console.log("Setting happy expression");
            setExpression("happy", 1);
          }}
          className="px-4 py-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors font-medium"
        >
          😊 Happy
        </button>
        <button
          onClick={() => {
            console.log("Setting sad expression");
            setExpression("sad", 1);
          }}
          className="px-4 py-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors font-medium"
        >
          😢 Sad
        </button>
        <button
          onClick={() => {
            console.log("Setting angry expression");
            setExpression("angry", 1);
          }}
          className="px-4 py-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors font-medium"
        >
          😠 Angry
        </button>
        <button
          onClick={() => {
            console.log("Setting surprised expression");
            setExpression("surprised", 1);
          }}
          className="px-4 py-3 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors font-medium"
        >
          😲 Surprised
        </button>
      </div>

      {/* Intensity controls */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Quick Intensities:</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setExpression("happy", 0.3)}
            className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 text-sm"
          >
            😊 30%
          </button>
          <button
            onClick={() => setExpression("happy", 0.6)}
            className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm"
          >
            😊 60%
          </button>
          <button
            onClick={() => setExpression("happy", 1)}
            className="px-3 py-2 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300 text-sm"
          >
            😊 100%
          </button>
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={() => {
          console.log("Resetting all expressions");
          resetExpressions();
        }}
        className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
      >
        🔄 Reset All Expressions
      </button>
    </div>
  );
}

// Component to render VRM avatar with animations and lip sync
function VRMAvatarWithAnimations() {
  const { mouthState, currentPhoneme } = useLipSync();
  const { setExpression } = useVRMExpressions();
  const { speaking } = useVoice(); // Track TTS speaking state
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Just provide URLs to your FBX files - that's it!
  // No useFBX, no loading, no remapping - SDK does it all! 🎉
  const animations: AnimationConfig = {
    idle: '/models/animations/Breathing Idle.fbx',           // Default - plays automatically
    swingDancing: '/models/animations/Swing Dancing.fbx',
    thriller: '/models/animations/Thriller Part 2.fbx',
    fistFight: '/models/animations/Fist Fight B.fbx',
  };

  // Track speaking state
  useEffect(() => {
    setIsSpeaking(speaking);
    console.log('TTS Speaking state changed:', speaking);
  }, [speaking]);

  // Debug log mouth state changes
  useEffect(() => {
    if (mouthState && Object.values(mouthState).some(v => v > 0)) {
      console.log('VRM Mouth State Update:', mouthState);
      if (currentPhoneme) {
        console.log('Current Phoneme:', currentPhoneme);
      }
    }
  }, [mouthState, currentPhoneme]);

  // Create realistic speaking animation when TTS is active
  useEffect(() => {
    let animationFrame: number;
    
    const animateSpeaking = () => {
      if (isSpeaking) {
        const time = Date.now() * 0.008; // Slower for more realistic speech
        
        // Create more realistic speech pattern
        const baseIntensity = 0.4;
        const variation = Math.sin(time) * 0.3;
        const intensity = Math.max(0.1, baseIntensity + variation);
        
        // Cycle through phonemes in a more speech-like pattern
        const speechPattern = ['aa', 'ih', 'aa', 'ou', 'ee', 'aa', 'oh', 'ih'];
        const phonemeIndex = Math.floor(time * 2) % speechPattern.length;
        const currentViseme = speechPattern[phonemeIndex];
        
        // Clear other visemes and set current one
        ['aa', 'ih', 'ou', 'ee', 'oh'].forEach(viseme => {
          if (viseme === currentViseme) {
            setExpression(viseme, intensity);
          } else {
            setExpression(viseme, 0);
          }
        });
        
        animationFrame = requestAnimationFrame(animateSpeaking);
      } else {
        // Not speaking, close mouth
        ['aa', 'ih', 'ou', 'ee', 'oh'].forEach(viseme => {
          setExpression(viseme, 0);
        });
      }
    };

    animateSpeaking();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isSpeaking, setExpression]);

  return (
    <VRMAvatar
      src="/models/male.vrm"
      animations={animations}  // SDK loads, remaps, and plays! 🚀
      position={[0, -1, 0]}
      scale={[1, 1, 1]}
      enableLipSync={true}  // Enable lip sync
      mouthState={mouthState}  // Pass mouth state from realtime
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
        
        {/* Lip Sync Debug Panel */}
        <LipSyncDebugPanel />
        
        {/* Expression controls */}
        <ExpressionControls />
      </div>
  );
}