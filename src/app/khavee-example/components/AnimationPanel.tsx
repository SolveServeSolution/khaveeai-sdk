"use client";

import React from 'react';
import { useVRMAnimations } from '@khaveeai/react';

/**
 * Animation Panel Component
 * 
 * Provides UI controls for playing VRM animations
 * Uses the useVRMAnimations hook from the SDK
 */
export function AnimationPanel() {
  const { currentAnimation, animate, stopAnimation, availableAnimations } = useVRMAnimations();

  // Animation presets with metadata
  const animations = [
    {
      name: 'idle',
      label: 'Idle',
      icon: '🧘',
      description: 'Breathing idle animation',
      color: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
      activeColor: 'bg-blue-500 text-white'
    },
    {
      name: 'swingDancing',
      label: 'Swing Dancing',
      icon: '💃',
      description: 'Swing dance animation',
      color: 'bg-purple-100 hover:bg-purple-200 text-purple-800',
      activeColor: 'bg-purple-500 text-white'
    },
    {
      name: 'thriller',
      label: 'Thriller',
      icon: '🧟',
      description: 'Thriller dance animation',
      color: 'bg-pink-100 hover:bg-pink-200 text-pink-800',
      activeColor: 'bg-pink-500 text-white'
    },
    {
      name: 'fistFight',
      label: 'Fist Fight',
      icon: '🥊',
      description: 'Fighting animation',
      color: 'bg-red-100 hover:bg-red-200 text-red-800',
      activeColor: 'bg-red-500 text-white'
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">🎬 Animation Controls</h3>
        <p className="text-sm text-gray-600 mt-1">
          Control your VRM avatar's animations
        </p>
      </div>

      {/* Current Animation Status */}
      <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Now Playing
            </p>
            <p className="text-lg font-bold text-indigo-900 mt-1">
              {currentAnimation ? (
                <>
                  {animations.find(a => a.name === currentAnimation)?.icon || '🎭'}{' '}
                  {animations.find(a => a.name === currentAnimation)?.label || currentAnimation}
                </>
              ) : (
                <span className="text-gray-400">No animation</span>
              )}
            </p>
          </div>
          {currentAnimation && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Playing</span>
            </div>
          )}
        </div>
      </div>

      {/* Animation Grid */}
      <div className="space-y-3 mb-4">
        <p className="text-sm font-medium text-gray-700">Select Animation:</p>
        
        <div className="grid grid-cols-2 gap-3">
          {animations.map((anim) => {
            const isActive = currentAnimation === anim.name;
            
            return (
              <button
                key={anim.name}
                onClick={() => {
                  console.log(`Playing animation: ${anim.name}`);
                  animate(anim.name);
                }}
                className={`
                  relative group
                  px-4 py-3 rounded-lg
                  transition-all duration-200
                  font-medium text-sm
                  ${isActive ? anim.activeColor : anim.color}
                  ${isActive ? 'ring-2 ring-offset-2 ring-indigo-400 shadow-lg scale-105' : ''}
                `}
                title={anim.description}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-2xl">{anim.icon}</span>
                  <span className="text-xs font-semibold">{anim.label}</span>
                </div>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => {
            console.log('Stopping all animations');
            stopAnimation();
          }}
          disabled={!currentAnimation}
          className={`
            w-full px-4 py-3 rounded-lg
            font-medium text-sm
            transition-all duration-200
            ${currentAnimation 
              ? 'bg-gray-700 hover:bg-gray-800 text-white shadow-md hover:shadow-lg' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          ⏹️ Stop Animation
        </button>
      </div>

      {/* Available Animations Info */}
      {availableAnimations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <details className="group">
            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800 select-none">
              📋 Available animations ({availableAnimations.length})
            </summary>
            <div className="mt-2 flex flex-wrap gap-1">
              {availableAnimations.map((name) => (
                <span 
                  key={name}
                  className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {name}
                </span>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800">
          <strong>💡 Tip:</strong> The "idle" animation should play automatically when the VRM loads. 
          If you don't see movement, check the browser console for errors and make sure to rebuild the SDK with <code className="bg-amber-100 px-1">pnpm --filter @khaveeai/react build</code>
        </p>
      </div>
    </div>
  );
}
