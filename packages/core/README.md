# @khaveeai/core

[![npm version](https://badge.fury.io/js/%40khaveeai%2Fcore.svg)](https://badge.fury.io/js/%40khaveeai%2Fcore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Core types, interfaces, and utilities for the KhaveeAI SDK. This package provides the foundational TypeScript definitions used across all KhaveeAI packages.

## Installation

```bash
npm install @khaveeai/core
```

## Features

- 📝 **TypeScript Types** - Complete type definitions for all SDK features
- 🎭 **Provider Interfaces** - Standard interfaces for LLM, TTS, and Realtime providers
- 🎬 **Animation Types** - Type-safe animation configuration
- 💬 **Conversation Types** - Structured conversation and message types
- 🔊 **Audio Types** - Phoneme, mouth state, and lip sync types

## API Reference

### Core Types

#### Audio & Lip Sync

```typescript
import type { 
  PhonemeData,
  MouthState,
  AudioProvider 
} from '@khaveeai/core';

// Detected phoneme from audio analysis
interface PhonemeData {
  phoneme: 'aa' | 'ee' | 'ih' | 'ou' | 'oh' | 'sil'; // Detected sound
  intensity: number;        // 0-1 strength
  timestamp: number;        // Detection time
  duration: number;         // Phoneme duration (ms)
}

// VRM mouth shape state
interface MouthState {
  aa: number;  // Open mouth (0-1)
  ih: number;  // Smile (0-1)
  ou: number;  // Pucker (0-1)
  ee: number;  // Half open (0-1)
  oh: number;  // Round (0-1)
}
```

#### Conversation

```typescript
import type { 
  Conversation,
  ChatStatus 
} from '@khaveeai/core';

// Message in conversation history
interface Conversation {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  isFinal: boolean;
  status: 'speaking' | 'final' | 'thinking';
}

// Current chat state
type ChatStatus = 'stopped' | 'ready' | 'listening' | 'thinking' | 'speaking';
```

#### Realtime Provider

```typescript
import type { 
  RealtimeProvider,
  RealtimeTool,
  RealtimeConfig 
} from '@khaveeai/core';

// Configuration for realtime voice providers
interface RealtimeConfig {
  apiKey: string;
  model?: string;
  voice?: string;
  instructions?: string;
  temperature?: number;
  tools?: RealtimeTool[];
  language?: string;
  turnServers?: RTCIceServer[];
}

// Custom function/tool for AI
interface RealtimeTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any) => Promise<any>;
}
```

#### Provider Interfaces

```typescript
import type { 
  LLMProvider,
  TTSProvider,
  VoiceProvider 
} from '@khaveeai/core';

// Base provider interfaces for extensibility
interface LLMProvider {
  generateResponse(prompt: string): Promise<string>;
}

interface TTSProvider {
  synthesize(text: string): Promise<AudioBuffer>;
}

interface VoiceProvider {
  startListening(): void;
  stopListening(): void;
}
```

### Animation Types

```typescript
import type { AnimationConfig } from '@khaveeai/core';

// Animation configuration for VRM avatars
type AnimationConfig = Record<string, string>;

// Example usage
const animations: AnimationConfig = {
  idle: '/animations/idle.fbx',
  walk: '/animations/walk.fbx',
  talking: '/animations/talking.fbx'
};
```

## Usage

This package is typically used indirectly through other KhaveeAI packages, but you can import types directly:

```typescript
import type { 
  PhonemeData,
  MouthState,
  Conversation,
  ChatStatus,
  RealtimeProvider,
  RealtimeTool
} from '@khaveeai/core';

// Use types for type-safe development
function handlePhoneme(phoneme: PhonemeData) {
  console.log(`Detected ${phoneme.phoneme} at ${phoneme.intensity}`);
}

function handleMessage(message: Conversation) {
  console.log(`${message.role}: ${message.text}`);
}
```

## Package Structure

```
@khaveeai/core/
├── src/
│   ├── index.ts           # Main exports
│   ├── types/
│   │   ├── audio.ts       # Audio & lip sync types
│   │   ├── conversation.ts # Chat & message types
│   │   ├── providers.ts   # Provider interfaces
│   │   ├── realtime.ts    # Realtime API types
│   │   ├── qdrant.ts      # Vector DB types
│   │   └── index.ts       # Type exports
│   └── tools/
│       └── animate.ts     # Animation utilities
```

## Dependencies

This is a types-only package with minimal dependencies:

```json
{
  "peerDependencies": {
    "typescript": ">=4.5.0"
  }
}
```

## TypeScript Configuration

For best experience, use these TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  }
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/SolveServeSolution/khaveeai-sdk/blob/main/CONTRIBUTING.md).

## License

MIT © [KhaveeAI](https://github.com/SolveServeSolution/khaveeai-sdk)