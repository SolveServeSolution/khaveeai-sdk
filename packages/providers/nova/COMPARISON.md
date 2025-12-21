# Nova Provider vs Amazon Workshop - Comparison

## Overview

This document shows how the Nova Provider maps to the Amazon Nova Workshop code (`react-client` folder), making it easy to understand the implementation.

## Architecture Comparison

### Workshop (React Class Component)
```
react-client/
├── s2s.js                    # Main component with WebSocket logic
├── helper/
│   ├── s2sEvents.js         # Event builder
│   ├── audioPlayer.js       # Audio playback
│   ├── audioHelper.js       # Audio conversion
│   └── config.js            # Configuration
```

### Nova Provider (TypeScript SDK)
```
packages/providers/nova/
├── NovaProvider.ts          # Main provider (like s2s.js)
├── NovaEventBuilder.ts      # Event builder (like s2sEvents.js)
├── NovaAudioPlayer.ts       # Audio playback (like audioPlayer.js)
├── NovaToolExecutor.ts      # Tool management (extracted)
└── audioHelpers.ts          # Audio conversion (like audioHelper.js)
```

## Code Mapping

### 1. WebSocket Connection

**Workshop (s2s.js)**
```javascript
connectWebSocket() {
  this.socket = new WebSocket(ws_url);
  this.socket.onopen = () => {
    this.sendEvent(S2sEvent.sessionStart(...));
    this.sendEvent(S2sEvent.promptStart(...));
    // ...
  };
}
```

**Nova Provider**
```typescript
private async connectWebSocket(): Promise<void> {
  this.socket = new WebSocket(this.config.websocketUrl);
  this.socket.onopen = () => {
    this.sendEvent(NovaEventBuilder.sessionStart(...));
    this.sendEvent(NovaEventBuilder.promptStart(...));
    // ...
  };
}
```

### 2. Event Builder

**Workshop (s2sEvents.js)**
```javascript
class S2sEvent {
  static sessionStart(inferenceConfig, turnSensitivity) {
    return {
      event: {
        sessionStart: {
          inferenceConfiguration: inferenceConfig
        }
      }
    };
  }
}
```

**Nova Provider**
```typescript
export class NovaEventBuilder {
  static sessionStart(
    inferenceConfig: NovaInferenceConfig,
    turnSensitivity: 'LOW' | 'MEDIUM' | 'HIGH'
  ) {
    return {
      event: {
        sessionStart: {
          inferenceConfiguration: inferenceConfig,
        },
      },
    };
  }
}
```

### 3. Audio Playback

**Workshop (audioPlayer.js)**
```javascript
class AudioPlayer {
  async start() {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    await this.audioContext.audioWorklet.addModule(workletUrl);
    this.workletNode = new AudioWorkletNode(...);
  }
  
  playAudio(samples) {
    this.workletNode.port.postMessage({
      type: "audio",
      audioData: samples,
    });
  }
}
```

**Nova Provider**
```typescript
export class NovaAudioPlayer {
  async start(): Promise<void> {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    // Inline worklet code
    await this.audioContext.audioWorklet.addModule(workletUrl);
    this.workletNode = new AudioWorkletNode(...);
  }
  
  playAudio(samples: Float32Array): void {
    this.workletNode.port.postMessage({
      type: 'audio',
      audioData: samples,
    });
  }
}
```

### 4. Message Handling

**Workshop (s2s.js)**
```javascript
handleIncomingMessage(message) {
  const eventType = Object.keys(message?.event)[0];
  switch (eventType) {
    case 'textOutput':
      // Handle text
      break;
    case 'audioOutput':
      const audioData = base64ToFloat32Array(base64Data);
      this.audioPlayer.playAudio(audioData);
      break;
    // ...
  }
}
```

**Nova Provider**
```typescript
private async handleIncomingMessage(message: any): Promise<void> {
  const eventType = Object.keys(message?.event || {})[0];
  switch (eventType) {
    case 'textOutput':
      this.handleTextOutput(...);
      break;
    case 'audioOutput':
      this.handleAudioOutput(content);
      break;
    // ...
  }
}
```

### 5. Microphone Recording

**Workshop (s2s.js)**
```javascript
startMicrophone() {
  this.mediaRecorder = new MediaRecorder(this.audioStream);
  this.mediaRecorder.ondataavailable = async (event) => {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const samples = audioBuffer.getChannelData(0);
    const base64Audio = float32ArrayToBase64(samples);
    this.sendEvent(S2sEvent.audioInput(..., base64Audio));
  };
}
```

**Nova Provider**
```typescript
private startMicrophone(): void {
  this.mediaRecorder = new MediaRecorder(this.audioStream);
  this.mediaRecorder.ondataavailable = async (event) => {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    let samples = audioBuffer.getChannelData(0);
    const base64Audio = float32ArrayToBase64(samples);
    this.sendEvent(NovaEventBuilder.audioInput(..., base64Audio));
  };
}
```

## Key Improvements

### 1. Type Safety
- **Workshop**: No types, easy to make mistakes
- **Nova Provider**: Full TypeScript with interfaces and type checking

### 2. Error Handling
- **Workshop**: Basic error handling
- **Nova Provider**: Comprehensive try-catch blocks and error callbacks

### 3. API Design
- **Workshop**: React component with state management
- **Nova Provider**: Clean provider pattern, framework-agnostic

### 4. Event System
- **Workshop**: React setState callbacks
- **Nova Provider**: Event handlers (onConnect, onMessage, etc.)

### 5. Modularity
- **Workshop**: Tightly coupled to React
- **Nova Provider**: Reusable in any JavaScript/TypeScript project

### 6. Documentation
- **Workshop**: Minimal comments
- **Nova Provider**: Comprehensive JSDoc and README

### 7. Testing
- **Workshop**: UI-based testing only
- **Nova Provider**: Can be unit tested independently

## Usage Comparison

### Workshop Usage
```javascript
// In React component
class S2sChatBot extends React.Component {
  connectWebSocket() { /* ... */ }
  startMicrophone() { /* ... */ }
  // Component-specific logic
}
```

### Nova Provider Usage
```typescript
// Clean, framework-agnostic
const nova = new NovaProvider({
  websocketUrl: 'ws://localhost:8081',
  voice: 'matthew',
});

await nova.connect();
// Works in React, Vue, vanilla JS, Node.js, etc.
```

## Tool/Function Calling

### Workshop
```javascript
// Tools defined in config.js
const toolConfig = {
  tools: [{
    toolSpec: {
      name: "getDateTool",
      inputSchema: { json: "..." }
    }
  }]
};

// Tool execution in backend
```

### Nova Provider
```typescript
// Tools defined with execution logic
const nova = new NovaProvider({
  tools: [{
    name: 'get_date',
    description: 'Get current date',
    parameters: {},
    execute: async (args) => ({
      success: true,
      message: new Date().toLocaleString()
    })
  }]
});

// Tools executed in provider
nova.onToolCall = (name, args, result) => {
  console.log(`Tool ${name} returned:`, result);
};
```

## Conclusion

The Nova Provider takes the solid foundation from the Amazon Workshop and:
- ✅ Adds type safety
- ✅ Improves modularity
- ✅ Enhances error handling
- ✅ Makes it framework-agnostic
- ✅ Provides better documentation
- ✅ Follows SDK patterns
- ✅ Enables easier testing

**Result**: Production-ready provider that's easier to use and maintain!
