"use client";

import React from 'react';
import { useAnimation } from '@khaveeai/react';

export function DebugPanel() {
  const { currentAnimation, animationExpressions, expressions, visemes } = useAnimation();

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-4 mt-4">
      <h2 className="text-xl font-bold mb-4 text-center">Debug Panel</h2>
      
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-medium text-gray-700 mb-1">Current Animation:</h3>
          <code className="text-sm text-blue-600">
            {currentAnimation || "null"}
          </code>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-medium text-gray-700 mb-1">Animation Expressions:</h3>
          <code className="text-sm text-green-600">
            {JSON.stringify(animationExpressions, null, 2)}
          </code>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-medium text-gray-700 mb-1">Manual Expressions:</h3>
          <code className="text-sm text-purple-600">
            {JSON.stringify(expressions, null, 2)}
          </code>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-medium text-gray-700 mb-1">Visemes:</h3>
          <code className="text-sm text-orange-600">
            {JSON.stringify(visemes, null, 2)}
          </code>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>💡 Check the browser console for detailed animation logs</p>
      </div>
    </div>
  );
}