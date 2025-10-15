"use client";

import React from 'react';

export function DebugPanel() {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-4 mt-4">
      <h2 className="text-xl font-bold mb-4 text-center">Debug Panel</h2>
      
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          🔍 Debug panel is ready for when you implement your new animation system.
        </p>
      </div>
    </div>
  );
}