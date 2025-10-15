"use client";

import React, { useState } from 'react';
import { useVRMAnimations, useVRMExpressions } from '@khaveeai/react';

/**
 * Quick Actions Component
 * 
 * Provides preset combinations of animations + expressions
 * for quick character state changes
 */
export function QuickActions() {
  const { animate } = useVRMAnimations();
  const { setExpression, resetExpressions, setMultipleExpressions } = useVRMExpressions();
  const [lastAction, setLastAction] = useState<string | null>(null);

  const actions = [
    {
      name: 'Happy Idle',
      icon: '😊',
      color: 'bg-yellow-400 hover:bg-yellow-500',
      action: () => {
        animate('idle');
        setExpression('happy', 1);
      }
    },
    {
      name: 'Angry Fight',
      icon: '😠',
      color: 'bg-red-400 hover:bg-red-500',
      action: () => {
        animate('fistFight');
        setExpression('angry', 1);
      }
    },
    {
      name: 'Happy Dance',
      icon: '💃',
      color: 'bg-pink-400 hover:bg-pink-500',
      action: () => {
        animate('swingDancing');
        setExpression('happy', 0.8);
      }
    },
    {
      name: 'Thriller Time',
      icon: '🧟',
      color: 'bg-purple-400 hover:bg-purple-500',
      action: () => {
        animate('thriller');
        setMultipleExpressions({
          surprised: 0.6,
          happy: 0.3
        });
      }
    },
    {
      name: 'Reset All',
      icon: '🔄',
      color: 'bg-gray-400 hover:bg-gray-500',
      action: () => {
        animate('idle');
        resetExpressions();
      }
    }
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-lg p-4 border border-indigo-200">
      <div className="mb-3">
        <h3 className="text-lg font-bold text-indigo-900">⚡ Quick Actions</h3>
        <p className="text-xs text-indigo-700 mt-1">
          Preset combinations of animations + expressions
        </p>
      </div>

      {lastAction && (
        <div className="mb-3 p-2 bg-white rounded border border-indigo-200 animate-pulse">
          <p className="text-xs text-indigo-800">
            ✨ Activated: <strong>{lastAction}</strong>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {actions.map((action) => (
          <button
            key={action.name}
            onClick={() => {
              action.action();
              setLastAction(action.name);
              setTimeout(() => setLastAction(null), 2000);
            }}
            className={`
              ${action.color}
              text-white rounded-lg p-3
              transition-all duration-200
              hover:shadow-lg hover:scale-105
              active:scale-95
              font-medium text-sm
            `}
          >
            <div className="flex flex-col items-center space-y-1">
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-semibold text-center leading-tight">
                {action.name}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-3 p-2 bg-white rounded text-xs text-gray-600">
        💡 Each button triggers both animation and expression changes simultaneously
      </div>
    </div>
  );
}
