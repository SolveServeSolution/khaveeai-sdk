"use client";

import React from 'react';
import Link from 'next/link';
import { KhaveeProvider } from '@khaveeai/react';
import { OpenAIRealtimeProvider } from '@khaveeai/providers-openai-realtime';
import type { RealtimeTool } from '@khaveeai/core';

// Import components
import { ChatInterface } from './components/ChatInterface';
import { AnimationControls } from './components/AnimationControls';
import { VRMScene } from './components/VRMSceneFixed';
import { DebugPanel } from './components/DebugPanel';

// Example tool for weather information
const weatherTool: RealtimeTool = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    location: {
      type: 'string',
      required: true,
      description: 'The city and state/country'
    }
  },
  execute: async (args: { location: string }) => {
    // Mock weather data
    return {
      success: true,
      message: `The weather in ${args.location} is sunny with 72°F temperature.`
    };
  }
};

// Configuration for Khavee SDK with realtime provider
const realtimeProvider = new OpenAIRealtimeProvider({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'your-api-key-here',
  voice: 'shimmer',
  instructions: 'You are a helpful AI assistant integrated with a VRM avatar. Be friendly and conversational. Keep responses concise.',
  enableLipSync: true,
  tools: [weatherTool]
});

const khaveeConfig = {
  realtime: realtimeProvider,
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
              Khavee SDK Realtime Example
            </h1>
            <p className="text-lg text-gray-600">
              Interactive VRM Avatar with OpenAI Realtime API and Lip Sync
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
                    <li>VRM model with realtime lip sync (aa, i, u, e, o phonemes)</li>
                    <li>WebRTC-based voice chat with OpenAI Realtime API</li>
                    <li>Automatic mouth movement during AI speech</li>
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
                  <li>✅ <strong>Realtime Chat:</strong> OpenAI Realtime API with WebRTC</li>
                  <li>✅ <strong>Lip Sync:</strong> Automatic phoneme detection (aa, i, u, e, o)</li>
                  <li>✅ <strong>Animation System:</strong> Play, stop, and transition animations</li>
                  <li>✅ <strong>Expression Controls:</strong> Dynamic facial expressions</li>
                  <li>✅ <strong>useRealtime:</strong> Voice chat with streaming</li>
                  <li>✅ <strong>useLipSync:</strong> Real-time mouth movement</li>
                  <li>✅ <strong>Function Calling:</strong> Custom tool integration</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">🎮 Try These Interactions</h3>
                <ul className="space-y-2 text-sm">
                  <li>🎤 <strong>Voice Chat:</strong> Click connect and speak naturally</li>
                  <li>👄 <strong>Lip Sync:</strong> Watch automatic mouth movement during AI speech</li>
                  <li>⚡ <strong>Real-time:</strong> Interrupt AI responses anytime</li>
                  <li>�️ <strong>Tools:</strong> Ask about weather to see function calling</li>
                  <li>🎬 <strong>Animations:</strong> Play different character animations</li>
                  <li>😊 <strong>Expressions:</strong> Control facial expressions in real-time</li>
                  <li>🖱️ <strong>3D Controls:</strong> Zoom and rotate the VRM model</li>
                  <li>� <strong>Debug:</strong> View phoneme detection and audio levels</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-orange-50 rounded border border-orange-200">
              <h4 className="font-semibold mb-2 text-orange-900">🔑 Setup Required</h4>
              <p className="text-sm text-gray-700 mb-2">
                To use the OpenAI Realtime API, you need to:
              </p>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Set <code className="bg-orange-100 px-1 rounded">NEXT_PUBLIC_OPENAI_API_KEY</code> in your environment</li>
                <li>Have an OpenAI API key with Realtime API access</li>
                <li>Install dependencies: <code className="bg-orange-100 px-1 rounded">pnpm install</code></li>
                <li>Build packages: <code className="bg-orange-100 px-1 rounded">pnpm build:packages</code></li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
              <h4 className="font-semibold mb-2 text-blue-900">� Realtime Voice Chat</h4>
              <p className="text-sm text-gray-700 mb-2">
                Experience the power of OpenAI Realtime API with automatic lip synchronization:
              </p>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li><strong>WebRTC Connection:</strong> Direct voice chat with GPT-4o Realtime</li>
                <li><strong>Phoneme Detection:</strong> Real-time audio analysis for Japanese vowels</li>
                <li><strong>Lip Sync:</strong> Automatic mouth movement (aa, i, u, e, o visemes)</li>
                <li><strong>Function Calling:</strong> Tools like weather queries work seamlessly</li>
                <li><strong>Interruption:</strong> Natural conversation flow with interrupt capability</li>
                <li><strong>Provider Pattern:</strong> Clean, configurable architecture</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </KhaveeProvider>
  );
}