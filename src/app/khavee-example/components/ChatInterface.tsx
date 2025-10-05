"use client";

import React, { useState } from 'react';
import { useLLM, useVoice, useAnimation } from '@khaveeai/react';

export function ChatInterface() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { streamChat } = useLLM();
  const { speak } = useVoice();
  const { animate } = useAnimation();

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      let assistantResponse = '';
      
      // Stream the LLM response
      for await (const chunk of streamChat({ messages: newMessages })) {
        if (chunk.type === 'text') {
          assistantResponse += chunk.delta;
        }
      }

      // Check for animation triggers in the response
      const animationMatch = assistantResponse.match(/\*trigger_animation:\s*(\w+)\*/);
      if (animationMatch) {
        const animationName = animationMatch[1];
        console.log(`🎭 Triggering animation: ${animationName}`);
        animate(animationName);
        
        // Remove the animation trigger from the displayed text
        assistantResponse = assistantResponse.replace(/\*trigger_animation:\s*\w+\*/g, '');
      }

      // Add assistant response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: assistantResponse }]);

      // Speak the response (will use mock TTS)
      await speak({ text: assistantResponse });

    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Chat with VRM Avatar</h2>
      
      {/* Chat messages */}
      <div className="h-64 overflow-y-auto mb-4 p-3 bg-gray-50 rounded">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center">
            Start a conversation with your VRM avatar!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded max-w-xs ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}>
                <div className="text-xs opacity-70 mb-1">
                  {msg.role === 'user' ? 'You' : 'Avatar'}
                </div>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
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

      {/* Input area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
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
        >
          👋 Say Hello
        </button>
        <button
          onClick={() => setInput("Can you dance for me?")}
          className="p-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
        >
          💃 Ask to Dance
        </button>
        <button
          onClick={() => setInput("I'm feeling sad today")}
          className="p-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          😢 Share Feelings
        </button>
        <button
          onClick={() => setInput("That's amazing!")}
          className="p-2 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
        >
          😊 Express Joy
        </button>
      </div>

      {/* Expression test buttons */}
      <div className="mt-4 border-t pt-4">
        <h3 className="text-sm font-medium mb-2">Test Expressions:</h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              console.log("Testing happy expression");
              animate("smile_soft");
            }}
            className="p-2 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
          >
            😊 Happy
          </button>
          <button
            onClick={() => {
              console.log("Testing sad expression");
              animate("sad");
            }}
            className="p-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            😢 Sad
          </button>
          <button
            onClick={() => {
              console.log("Testing angry expression");
              animate("punch");
            }}
            className="p-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            😠 Angry
          </button>
        </div>
      </div>
    </div>
  );
}