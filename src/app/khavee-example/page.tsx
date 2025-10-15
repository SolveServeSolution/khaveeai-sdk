"use client";

import React from 'react';
import Link from 'next/link';
import { KhaveeProvider } from '@khaveeai/react';
import { MockLLM, MockTTS } from '@khaveeai/providers-mock';

// Import components
import { ChatInterface } from './components/ChatInterface';
import { AnimationControls } from './components/AnimationControls';
import { VRMScene } from './components/VRMSceneFixed';
import { DebugPanel } from './components/DebugPanel';

// Configuration for Khavee SDK with mock providers
const khaveeConfig = {
  llm: new MockLLM(),
  tts: new MockTTS(),
  tools: []
};

// Main example page
export default function KhaveeExamplePage() {
  return (
    <KhaveeProvider config={khaveeConfig}>
      <div className="min-h-screen bg-gray-100 p-4">
        {/* Back navigation */}
        <div className="max-w-6xl mx-auto mb-4">
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            ← Back to Main Demo
          </Link>
        </div>

        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Khavee SDK Example
            </h1>
            <p className="text-lg text-gray-600">
              Interactive VRM Avatar with AI Chat and Animations
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* VRM Avatar Scene */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-xl font-bold mb-4">VRM Avatar</h2>
                <VRMScene />
                <div className="mt-4 text-sm text-gray-600">
                  <p>🎭 <strong>Features:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>VRM model rendering with animations</li>
                    <li>Multiple animation presets (Idle, Dancing, Fighting)</li>
                    <li>Smooth animation transitions (0.5s fade)</li>
                    <li>Interactive expression controls</li>
                    <li>3D camera controls (zoom, rotate)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="space-y-4">
              <ChatInterface />
              <AnimationControls />
              <DebugPanel />
            </div>
          </div>

          {/* SDK Information */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">About This Example</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">🚀 SDK Features Demonstrated</h3>
                <ul className="space-y-2 text-sm">
                  <li>✅ <strong>KhaveeProvider:</strong> Context provider for SDK configuration</li>
                  <li>✅ <strong>VRMAvatar:</strong> 3D VRM model rendering with Three.js</li>
                  <li>✅ <strong>Animation System:</strong> Play, stop, and transition animations</li>
                  <li>✅ <strong>Expression Controls:</strong> Dynamic facial expressions</li>
                  <li>✅ <strong>useLLM:</strong> AI chat streaming</li>
                  <li>✅ <strong>useVoice:</strong> Text-to-speech with mock provider</li>
                  <li>✅ <strong>Mock Providers:</strong> Development without API keys</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">🎮 Try These Interactions</h3>
                <ul className="space-y-2 text-sm">
                  <li>💬 <strong>Chat:</strong> Type messages to get AI responses</li>
                  <li>🔊 <strong>Voice:</strong> Mock TTS simulates realistic timing</li>
                  <li>🎬 <strong>Animations:</strong> Play different character animations</li>
                  <li>😊 <strong>Expressions:</strong> Control facial expressions in real-time</li>
                  <li>🖱️ <strong>3D Controls:</strong> Zoom and rotate the VRM model</li>
                  <li>📝 <strong>Components:</strong> Well-organized, modular structure</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
              <h4 className="font-semibold mb-2 text-blue-900">🎬 Animation System</h4>
              <p className="text-sm text-gray-700 mb-2">
                The new animation system is fully integrated! Features include:
              </p>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li><strong>Animation Registry:</strong> User-provided animation library</li>
                <li><strong>Auto-play Idle:</strong> Default "idle" animation plays automatically</li>
                <li><strong>Smooth Transitions:</strong> 0.5s fade between animations</li>
                <li><strong>Simple API:</strong> <code className="bg-blue-100 px-1 rounded">animate('name')</code> function</li>
                <li><strong>4 Presets:</strong> Idle, Swing Dancing, Thriller, Fist Fight</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </KhaveeProvider>
  );
}