# @khaveeai/providers-openai-realtime

[![npm version](https://badge.fury.io/js/@khaveeai%2Fproviders-openai-realtime.svg)](https://badge.fury.io/js/@khaveeai%2Fproviders-openai-realtime)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

OpenAI Realtime API provider for Khavee AI SDK. Seamlessly integrate real-time voice conversations with VRM avatars in React applications using OpenAI's GPT-4o Realtime API.

## ✨ Features

- 🎙️ **Real-time Voice Chat** - WebRTC-based audio streaming with OpenAI
- 🗣️ **Automatic Lip Sync** - Built-in phoneme detection for VRM avatar mouth movements
- ⚛️ **React First** - Designed specifically for React applications with hooks
- 🛠️ **Function Calling** - Support for OpenAI function/tool calling
- 📝 **Live Transcription** - Real-time speech-to-text conversion
- 🎛️ **Status Management** - Comprehensive chat status tracking
- 🎯 **Zero Config** - No additional API endpoints or backend required

## 📦 Installation

```bash
npm install @khaveeai/providers-openai-realtime @khaveeai/react @khaveeai/core
```

## 🚀 Quick Start with React + VRM

Here's how to create a complete VRM avatar with voice chat in just a few lines:

```tsx
"use client";
import { KhaveeProvider, VRMAvatar, useRealtime } from "@khaveeai/react";
import { OpenAIRealtimeProvider } from "@khaveeai/providers-openai-realtime";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

// 1. Create the provider
const realtime = new OpenAIRealtimeProvider({
  apiKey: process.env.OPENAI_API_KEY || "",
  instructions: "You are a helpful AI assistant.",
  voice: "coral"
});

// 2. Chat component using useRealtime hook
function Chat() {
  const { 
    sendMessage, 
    conversation, 
    chatStatus, 
    isConnected,
    connect,
    disconnect
  } = useRealtime();

  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect to AI</button>
      ) : (
        <div>
          <div>Status: {chatStatus}</div>
          {conversation.map((msg, i) => (
            <div key={i}>{msg.role}: {msg.text}</div>
          ))}
          <button onClick={() => sendMessage("Hello!")}>Say Hello</button>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}

// 3. Main app with VRM avatar
export default function App() {
  return (
    <KhaveeProvider config={{ realtime }}>
      {/* 3D VRM Avatar with automatic lip sync */}
      <Canvas>
        <VRMAvatar
          src="./models/avatar.vrm"
          position-y={-1.25}
        />
        <Environment preset="sunset" />
        <ambientLight intensity={0.5} />
      </Canvas>
      
      {/* Chat UI */}
      <Chat />
    </KhaveeProvider>
  );
}
```

That's it! Your VRM avatar will automatically lip sync with the AI's voice responses.

## 🎭 VRM Avatar Integration

### Basic Setup

```tsx
import { KhaveeProvider, VRMAvatar } from "@khaveeai/react";
import { OpenAIRealtimeProvider } from "@khaveeai/providers-openai-realtime";

const provider = new OpenAIRealtimeProvider({
  apiKey: "your-openai-api-key",
  voice: "coral", // Choose from: coral, shimmer, alloy, nova, echo, sage
  instructions: "Your AI personality instructions"
});

function App() {
  return (
    <KhaveeProvider config={{ realtime: provider }}>
      <Canvas>
        <VRMAvatar 
          src="./models/your-avatar.vrm"
        />
      </Canvas>
    </KhaveeProvider>
  );
}
```

## Configuration

### RealtimeConfig

```typescript
interface RealtimeConfig {
  apiKey: string;                    // OpenAI API key
  model?: string;                    // Model to use (default: 'gpt-4o-realtime-preview')
  voice?: string;                    // Voice to use (default: 'shimmer')
  instructions?: string;             // System instructions
  temperature?: number;              // Response creativity (0-1)
  speed?: number;                   // Speech speed (0.25-4.0)
  language?: string;                // Language code (default: 'en')
  tools?: RealtimeTool[];           // Available functions/tools
  turnServers?: RTCIceServer[];     // Custom TURN servers
}
```

### Available Voices

- `coral` - Warm, friendly voice
- `shimmer` - Clear, professional voice
- `alloy` - Balanced, versatile voice
- `nova` - Energetic, youthful voice
- `echo` - Deep, resonant voice
- `sage` - Wise, calm voice

## ⚛️ React Hook API

The `useRealtime()` hook provides everything you need for voice chat:

```tsx
import { useRealtime } from "@khaveeai/react";

function ChatComponent() {
  const {
    // Connection
    isConnected,
    connect,
    disconnect,
    
    // Messaging
    sendMessage,
    conversation,
    chatStatus,
    
    // Lip sync (automatic with VRM)
    currentPhoneme,
    startAutoLipSync,
    stopAutoLipSync
  } = useRealtime();

  return (
    <div>
      {/* Connection Status */}
      <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
        {chatStatus}
        {currentPhoneme && (
          <span>
            [{currentPhoneme.phoneme}] {(currentPhoneme.intensity * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {/* Connection Controls */}
      {!isConnected ? (
        <button onClick={connect}>Connect to AI</button>
      ) : (
        <div>
          <button onClick={disconnect}>Disconnect</button>
          <button onClick={startAutoLipSync}>Restart Lip Sync</button>
          <button onClick={stopAutoLipSync}>Stop Lip Sync</button>
        </div>
      )}

      {/* Conversation */}
      <div className="messages">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.text}
          </div>
        ))}
      </div>

      {/* Send Message */}
      <input
        type="text"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.target.value);
            e.target.value = '';
          }
        }}
        disabled={!isConnected || chatStatus === "thinking"}
        placeholder="Type a message or just talk..."
      />
    </div>
  );
}
```

### Hook Return Values

| Property | Type | Description |
|----------|------|-------------|
| `isConnected` | `boolean` | Connection status to OpenAI |
| `chatStatus` | `string` | Current status: 'stopped', 'starting', 'ready', 'listening', 'thinking', 'speaking' |
| `conversation` | `Array` | Full conversation history |
| `currentPhoneme` | `Object` | Current phoneme for lip sync: `{phoneme: string, intensity: number}` |
| `connect()` | `Function` | Connect to OpenAI Realtime API |
| `disconnect()` | `Function` | Disconnect from API |
| `sendMessage(text)` | `Function` | Send text message to AI |
| `startAutoLipSync()` | `Function` | Manually restart lip sync |
| `stopAutoLipSync()` | `Function` | Stop lip sync |

## ⚙️ Configuration

### Provider Configuration

```tsx
const realtime = new OpenAIRealtimeProvider({
  apiKey: process.env.OPENAI_API_KEY || "",
  
  // Voice & Model
  voice: "coral",                           // coral, shimmer, alloy, nova, echo, sage
  model: "gpt-4o-realtime-preview-2025-06-03",
  
  // AI Behavior
  instructions: "You are a helpful AI assistant.",
  temperature: 0.8,                         // 0-1, creativity level
  speed: 1.4,                              // 0.25-4.0, speech speed
  
  // Language & Tools
  language: "en",                          // Language code
  tools: [],                               // Function calling tools
});
```

### Environment Variables

```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key_here
```

### Available Voices

| Voice | Description |
|-------|-------------|
| `coral` | Warm, friendly voice (recommended) |
| `shimmer` | Clear, professional voice |
| `alloy` | Balanced, versatile voice |
| `nova` | Energetic, youthful voice |
| `echo` | Deep, resonant voice |
| `sage` | Wise, calm voice |

## 🛠️ Function Calling

Add custom functions that the AI can call during conversation:

```tsx
// Define a weather tool
const weatherTool = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    location: {
      type: 'string',
      description: 'City name'
    }
  },
  execute: async (args) => {
    const weather = await fetchWeather(args.location);
    return {
      success: true,
      message: `The weather in ${args.location} is ${weather.description} with temperature ${weather.temp}°C`
    };
  }
};

// Add to provider
const realtime = new OpenAIRealtimeProvider({
  apiKey: process.env.OPENAI_API_KEY || "",
  tools: [weatherTool],
  instructions: "You can help with weather information and general questions."
});

// Or register after creation
realtime.registerFunction(weatherTool);
```

## 📱 Chat Status States

The `chatStatus` property provides real-time feedback:

| Status | Description |
|--------|-------------|
| `stopped` | Not connected or inactive |
| `starting` | Initializing connection to OpenAI |
| `ready` | Connected and ready for input |
| `listening` | Actively listening to user speech |
| `thinking` | Processing user input |
| `speaking` | AI is speaking (avatar lip syncs automatically) |

## 🎯 Automatic Lip Sync

The provider automatically handles lip sync with VRM avatars:

- **Phoneme Detection**: Real-time MFCC analysis of AI speech
- **Automatic Mapping**: Maps phonemes to VRM mouth expressions
- **Zero Config**: Works out of the box with `VRMAvatar` component
- **Manual Control**: Use `startAutoLipSync()` and `stopAutoLipSync()` for custom control

### Current Phoneme Info

```tsx
const { currentPhoneme } = useRealtime();

// currentPhoneme structure:
{
  phoneme: "aa" | "ee" | "ou" | "ih" | "oh" | "sil", // Current phoneme
  intensity: 0.75 // Intensity level (0-1)
}
```

## 🌐 Browser Support

- ✅ Chrome 80+
- ✅ Firefox 78+  
- ✅ Safari 14+
- ✅ Edge 80+

**Requirements:**
- WebRTC support
- Web Audio API
- Microphone access (HTTPS required)

## 🐛 Troubleshooting

### Common Issues

**"Connection Failed"**
```bash
# Check your API key
OPENAI_API_KEY=sk-...your_key_here

# Verify you have GPT-4o Realtime API access
# Contact OpenAI support if needed
```

**"Microphone Not Working"**
- Ensure HTTPS is enabled (required for microphone access)
- Check browser permissions for microphone
- Test with other voice apps first

**"Avatar Not Lip Syncing"**
```tsx
// Try manual restart
const { startAutoLipSync } = useRealtime();
startAutoLipSync();

// Check if phonemes are detected
const { currentPhoneme } = useRealtime();
console.log(currentPhoneme); // Should show phoneme data
```

**"No Audio Output"**
- Check browser audio settings
- Verify speakers/headphones are working
- Try refreshing the page

### Debug Mode

Enable detailed logging:

```tsx
// Log all provider messages
const realtime = new OpenAIRealtimeProvider({
  apiKey: "your-key",
  // ... other config
});

// Add message logging
realtime.onMessage = (message) => {
  console.log('OpenAI message:', message);
};

// Add error logging  
realtime.onError = (error) => {
  console.error('Provider error:', error);
};
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

- [GitHub Issues](https://github.com/SolveServeSolution/khaveeai-sdk/issues)
- [Documentation](https://github.com/SolveServeSolution/khaveeai-sdk#readme)
- Email: support@khaveeai.com

## 🚀 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests to our [GitHub repository](https://github.com/SolveServeSolution/khaveeai-sdk).