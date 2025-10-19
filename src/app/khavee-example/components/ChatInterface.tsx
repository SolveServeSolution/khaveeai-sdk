"use client";

import React, { useState } from 'react';
import { useRealtime, useLipSync } from '@khaveeai/react';

export function ChatInterface() {
  const [input, setInput] = useState('');
  
  const { 
    isConnected, 
    chatStatus, 
    conversation, 
    currentVolume,
    connect, 
    disconnect, 
    sendMessage, 
    interrupt 
  } = useRealtime();
  
  const { mouthState, currentPhoneme } = useLipSync();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !isConnected) return;

    try {
      await sendMessage(input);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInterrupt = () => {
    interrupt();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Realtime Voice Chat</h2>
      
      {/* Connection Status */}
      <div className="mb-4 p-3 rounded bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Status:</span>
          <span className={`text-sm px-2 py-1 rounded ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Chat:</span>
          <span className={`text-sm px-2 py-1 rounded ${
            chatStatus === 'ready' ? 'bg-green-100 text-green-700' :
            chatStatus === 'listening' ? 'bg-blue-100 text-blue-700' :
            chatStatus === 'speaking' ? 'bg-purple-100 text-purple-700' :
            chatStatus === 'thinking' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {chatStatus}
          </span>
        </div>

        {/* Audio Level */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Audio:</span>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-2 bg-gray-200 rounded">
              <div 
                className="h-full bg-blue-500 rounded transition-all duration-100"
                style={{ width: `${Math.min(currentVolume * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {Math.round(currentVolume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Connection Controls */}
      <div className="mb-4 flex gap-2">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            🎤 Connect
          </button>
        ) : (
          <>
            <button
              onClick={handleDisconnect}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              ❌ Disconnect
            </button>
            <button
              onClick={handleInterrupt}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              disabled={chatStatus !== 'speaking'}
            >
              ⏹️ Stop
            </button>
          </>
        )}
      </div>

      {/* Chat messages */}
      <div className="h-64 overflow-y-auto mb-4 p-3 bg-gray-50 rounded">
        {conversation.length === 0 ? (
          <div className="text-gray-500 text-center">
            Connect and start speaking with your VRM avatar!
          </div>
        ) : (
          conversation.map((msg, index) => (
            <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded max-w-xs ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}>
                <div className="text-xs opacity-70 mb-1">
                  {msg.role === 'user' ? 'You' : 'Avatar'}
                </div>
                {msg.text}
              </div>
            </div>
          ))
        )}
        {chatStatus === 'thinking' && (
          <div className="text-left">
            <div className="inline-block p-2 rounded bg-gray-200 text-gray-800">
              <div className="text-xs opacity-70 mb-1">Avatar</div>
              <div className="flex items-center">
                <div className="animate-pulse">Thinking...</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Text Input (fallback) */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type message (or use voice)..."
          className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!isConnected}
        />
        <button
          onClick={handleSendMessage}
          disabled={!isConnected || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>

      {/* Quick action buttons */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setInput("Hello! How are you today?")}
          className="p-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
          disabled={!isConnected}
        >
          👋 Say Hello
        </button>
        <button
          onClick={() => setInput("What's the weather like?")}
          className="p-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          disabled={!isConnected}
        >
          🌤️ Ask Weather
        </button>
        <button
          onClick={() => setInput("Tell me a joke!")}
          className="p-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          disabled={!isConnected}
        >
          😄 Tell a Joke
        </button>
        <button
          onClick={() => setInput("Can you help me?")}
          className="p-2 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
          disabled={!isConnected}
        >
          🤝 Ask for Help
        </button>
      </div>

      {/* Lip Sync Debug Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
        <p className="text-blue-800 font-medium mb-2">
          🎤 Realtime Features:
        </p>
        <ul className="text-blue-700 space-y-1 text-xs">
          <li>• <strong>Voice Chat:</strong> Speak naturally, AI responds with voice</li>
          <li>• <strong>Lip Sync:</strong> Watch automatic mouth movement</li>
          <li>• <strong>Interruption:</strong> Stop AI anytime by clicking Stop</li>
          <li>• <strong>Tools:</strong> Try asking about weather</li>
        </ul>
        
        {currentPhoneme && (
          <div className="mt-2 pt-2 border-t border-blue-200">
            <span className="text-blue-600 text-xs">
              Current phoneme: <strong>{currentPhoneme.phoneme}</strong> (intensity: {Math.round(currentPhoneme.intensity * 100)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}