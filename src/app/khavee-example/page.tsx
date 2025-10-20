"use client";

import {  KhaveeProvider } from "@khaveeai/react";
import Link from "next/link";
import { VRMScene } from "./components/VRMSceneFixed";
import ExpressionControls from "./components/ExpressionControls";

// Main example page
export default function KhaveeExamplePage() {
  return (
    <KhaveeProvider>
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
              </div>
            </div>

            {/* Controls Panel */}
            <div className="space-y-4">{/* <ChatInterface /> */}

              <ExpressionControls/>
            </div>
          </div>
        </div>
      </div>
    </KhaveeProvider>
  );
}
