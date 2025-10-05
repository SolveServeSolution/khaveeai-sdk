# 🤖 @khaveeai/react - VRM AI Avatar SDK

> Transform your VRM avatars into interactive AI characters with voice, animations, and LLM integration.

[![npm version](https://badge.fury.io/js/%40khaveeai%2Freact.svg)](https://badge.fury.io/js/%40khaveeai%2Freact)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-black?style=flat&logo=three.js&logoColor=white)](https://threejs.org/)

## ✨ Features

- 🎭 **Interactive VRM Avatars** - Drop-in React component for VRM models
- 🤖 **LLM Integration** - Real-time AI conversation with context awareness
- �️ **Voice Synthesis** - High-quality TTS with automatic lip-sync
- 💃 **Animation System** - Registry-based animations triggered by AI or manual control
- 🎨 **Expression Control** - Dynamic facial expressions and emotions
- 🔌 **Provider System** - Pluggable LLM and TTS providers (OpenAI, Azure, Mock)
- ⚡ **Performance Optimized** - Built on Three.js and React Three Fiber
- 🛠️ **Developer Friendly** - TypeScript support, mock providers, minimal setup

## �🚀 Quick Start

### 1. Installation

```bash
# Core packages
pnpm add @khaveeai/react @khaveeai/core

# Provider packages (choose what you need)
pnpm add @khaveeai/providers-openai     # For OpenAI LLM
pnpm add @khaveeai/providers-azure      # For Azure TTS
pnpm add @khaveeai/providers-mock       # For development/testing

# Peer dependencies
pnpm add three @pixiv/three-vrm @react-three/fiber @react-three/drei
```

### 2. Setup Provider

```tsx
// app/providers.tsx
"use client";

import { KhaveeProvider } from "@khaveeai/react";
import { LLMOpenAI } from "@khaveeai/providers-openai";
import { TTSAzure } from "@khaveeai/providers-azure";
import { ANIM_REGISTRY } from "@/animationRegistry";
import { toolAnimate } from "@khaveeai/core";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <KhaveeProvider
      config={{
        llm: new LLMOpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY! }),
        tts: new TTSAzure({
          key: process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
          region: process.env.NEXT_PUBLIC_AZURE_REGION!,
        }),
        tools: [toolAnimate],
        animationRegistry: ANIM_REGISTRY,
      }}
    >
      {children}
    </KhaveeProvider>
  );
}
```

### 5. Render the VRM Avatar

```tsx
// components/AvatarStage.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, CameraControls } from "@react-three/drei";
import { VRMAvatar } from "@khaveeai/react";

export default function AvatarStage() {
  return (
    <div className="h-[500px] w-full">
      <Canvas camera={{ position: [0, 1.5, 3] }}>
        <Environment preset="sunset" />
        <directionalLight intensity={2} position={[10, 10, 5]} />
        
        <VRMAvatar 
          src="/models/yumi.vrm" 
          autoplayIdle
          position={[0, -1, 0]}
        />
        
        <CameraControls 
          maxPolarAngle={Math.PI / 2}
          minDistance={1}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
}
```

### 6. Add Chat Interface

```tsx
// components/ChatBox.tsx
"use client";

import { useState } from "react";
import { useLLM, useVoice, useAnimation } from "@khaveeai/react";

export default function ChatBox() {
  const { streamChat } = useLLM();
  const { speak, speaking } = useVoice();
  const { animate, pulse } = useAnimation();
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    
    setMessages(prev => [...prev, { role: "user", text }]);
    setLoading(true);

    // Subtle thinking animation
    pulse("thinking", 0.3, 2000);

    try {
      let response = "";
      
      // Stream LLM response
      for await (const chunk of streamChat({ 
        messages: [{ role: "user", content: text }] 
      })) {
        if (chunk.type === "text") {
          response += chunk.delta;
        }
      }

      setMessages(prev => [...prev, { role: "assistant", text: response }]);

      // Speak response with auto lip-sync
      await speak({ 
        text: response, 
        voice: "ja-JP-NanamiNeural" 
      });

      // Manual animation (AI can also trigger via *trigger_animation: name*)
      animate("wave_small");
      
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="h-80 overflow-y-auto bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          }`}>
            <div className={`max-w-xs rounded-lg px-3 py-2 ${
              msg.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border'
            }`}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg px-3 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const text = formData.get('message') as string;
        sendMessage(text);
        e.currentTarget.reset();
      }}>
        <div className="flex gap-2">
          <input
            name="message"
            placeholder="Ask me something..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
      
      {speaking && (
        <div className="mt-2 text-center text-sm text-blue-600">
          🔊 Speaking...
        </div>
      )}
    </div>
  );
}
```

### 4. Add Chat Interface

```tsx
// components/ChatBox.tsx
"use client";

import { useState } from "react";
import { useLLM, useVoice, useAnimation } from "@khaveeai/react";

export default function ChatBox() {
  const { streamChat } = useLLM();
  const { speak, speaking } = useVoice();
  const { animate, pulse } = useAnimation();
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);

  const send = async (text: string) => {
    setMessages((m) => [...m, { role: "user", text }]);
    pulse("smile_soft");

    let answer = "";
    for await (const chunk of streamChat({ messages: [{ role: "user", content: text }] })) {
      if (chunk.type === "text") {
        answer += chunk.delta;
      }
    }

    setMessages((m) => [...m, { role: "assistant", text: answer }]);
    await speak({ text: answer, voice: "ja-JP-NanamiNeural" });
    animate("wave_small");
  };

  return (
    <div className="p-4">
      <div className="h-64 overflow-y-auto bg-gray-100 rounded-lg mb-2 p-2">
        {messages.map((m, i) => (
          <p key={i}>
            <strong>{m.role}:</strong> {m.text}
          </p>
        ))}
      </div>
      <form onSubmit={(e) => { /* handle submit */ }}>
        <input name="msg" placeholder="Ask me something..." className="border rounded p-2 w-full" />
      </form>
      {speaking && <div className="mt-1 text-sm text-gray-500">🔊 speaking...</div>}
    </div>
  );
}
```

## 📦 Packages

- **@khaveeai/core** - Core types and utilities
- **@khaveeai/react** - React components and hooks  
- **@khaveeai/providers-openai** - OpenAI LLM integration
- **@khaveeai/providers-azure** - Azure TTS integration

## 🎭 Animation Registry

Create an animation registry to define available animations:

```typescript
// animationRegistry.ts
import { AnimationRegistry } from '@khaveeai/core';

export const ANIM_REGISTRY: AnimationRegistry = {
  idle: {
    name: "idle",
    description: "Default idle breathing animation", 
    tags: ["idle", "breathing", "neutral"],
    fbxPath: "/models/animations/Breathing Idle.fbx"
  },
  wave_small: {
    name: "wave_small",
    description: "Small friendly wave gesture",
    tags: ["greeting", "friendly", "wave", "hello"]
  },
  // Add more animations...
};
```

## 🎣 Available Hooks

### `useLLM()`
- `streamChat({ messages })` - Stream chat completions

### `useVoice()`  
- `speak({ text, voice })` - Text-to-speech with lip sync
- `speaking` - Boolean indicating if currently speaking

### `useAnimation()`
- `animate(name)` - Trigger named animation
- `pulse(expression, intensity, duration)` - Pulse facial expression
- `setViseme(viseme, value)` - Set lip sync viseme
- `setExpression(expression, value)` - Set facial expression

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_OPENAI_KEY=your_openai_key
NEXT_PUBLIC_AZURE_SPEECH_KEY=your_azure_speech_key  
NEXT_PUBLIC_AZURE_REGION=your_azure_region
```

### Animation Registry Format

Each animation entry should include:
- `name` - Unique identifier
- `description` - What the animation does (for LLM context)
- `tags` - Categories for LLM selection
- `fbxPath` - Path to FBX animation file (optional)

## ✨ Features

- **Minimal DX** - Just wrap provider and drop in components
- **Auto Lip Sync** - Speech automatically drives visemes  
- **LLM Animations** - AI chooses appropriate animations
- **Streaming Chat** - Real-time conversation
- **Voice Synthesis** - High-quality TTS
- **Expression Control** - Facial expressions and emotions
- **Performance Optimized** - Built on Three.js and React Three Fiber

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build:packages

# Develop with hot reload
pnpm dev:packages
```

## 📄 License

MIT