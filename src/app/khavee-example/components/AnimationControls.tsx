"use client";

import React from 'react';
import { useAnimation } from '@khaveeai/react';
import { ANIM_REGISTRY } from '../../../animationRegistry';

export function AnimationControls() {
  const { animate, currentAnimation } = useAnimation();

  const animationCategories = {
    'Emotions': ['smile_soft', 'laugh', 'sad', 'surprised', 'thinking'],
    'Greetings': ['wave_small', 'nod_yes', 'shake_no'],
    'Actions': ['punch', 'swing_dance', 'thriller_dance'],
    'Basic': ['idle']
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-4 mt-4">
      <h2 className="text-xl font-bold mb-4 text-center">Animation Controls</h2>
      
      {currentAnimation && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <div className="text-sm font-medium text-blue-800">Currently Playing:</div>
          <div className="text-blue-600">{currentAnimation}</div>
        </div>
      )}

      {Object.entries(animationCategories).map(([category, animations]) => (
        <div key={category} className="mb-4">
          <h3 className="font-medium text-gray-700 mb-2">{category}</h3>
          <div className="grid grid-cols-2 gap-2">
            {animations.map((animName) => {
              const animInfo = ANIM_REGISTRY[animName as keyof typeof ANIM_REGISTRY];
              return (
                <button
                  key={animName}
                  onClick={() => {
                    console.log(`🎯 Manual animation trigger: ${animName}`);
                    animate(animName);
                  }}
                  className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded text-left transition-colors"
                  title={animInfo?.description || animName}
                >
                  {animInfo?.name || animName}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Debug section */}
      <div className="mt-4 border-t pt-4">
        <h3 className="text-sm font-medium mb-2">Debug Actions:</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              console.log("🔄 Force idle animation");
              animate("idle");
            }}
            className="p-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            🔄 Reset to Idle
          </button>
          <button
            onClick={() => {
              console.log("🎭 Testing swing dance");
              animate("swing_dance");
            }}
            className="p-2 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          >
            🎭 Test Dance
          </button>
        </div>
      </div>
    </div>
  );
}