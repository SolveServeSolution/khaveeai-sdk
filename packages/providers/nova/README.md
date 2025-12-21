# @khaveeai/providers-nova

Amazon Nova Speech-to-Speech provider for Khavee AI SDK with real-time voice interaction.

## 🎯 Zero Configuration Setup

**No separate WebSocket server needed!** Use Nova directly from your Next.js app.

## Features

✅ **No External Server** - Works with Next.js API routes  
✅ **Real-time Speech-to-Speech** - Powered by Amazon Nova Sonic  
✅ **Secure** - AWS credentials stay server-side  
✅ **Tool/Function Calling** - Extensible with custom tools  
✅ **Audio Streaming** - Continuous audio input/output  
✅ **Easy Integration** - Simple API compatible with Khavee SDK  
✅ **TypeScript Support** - Full type safety

## Quick Start (5 Minutes)

### 1. Install

```bash
pnpm add @khaveeai/providers-nova ws @aws-sdk/client-bedrock-runtime
```

### 2. Create API Route

Create `pages/api/nova.ts`:

```typescript
import { createNovaProxyHandler } from '@khaveeai/providers-nova/server';

const proxy = createNovaProxyHandler({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default function handler(req, res) {
  if (req.headers.upgrade === 'websocket') {
    const { socket, head } = req as any;
    proxy.handleUpgrade(req, socket, head, () => {});
    return;
  }
  res.status(200).json({ status: 'ok' });
}

export const config = {
  api: { bodyParser: false },
};
```

### 3. Add Environment Variables

Create `.env.local`:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 4. Use in Your App

```typescript
import { NovaProvider } from '@khaveeai/providers-nova';

const nova = new NovaProvider({
  websocketUrl: 'ws://localhost:3000/api/nova', // Your API route!
  voice: 'matthew',
});

await nova.connect();
```

**That's it!** No separate server, no complex setup. Just works! 🎉

## Full Example

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete examples including:
- Next.js integration
- Express server
- React components
- Deployment guides

## Configuration

```typescript
interface NovaConfig {
  // Required: Your WebSocket server URL
  websocketUrl: string;
  
  // Voice settings
  voice?: 'matthew' | 'joanna' | 'ruth' | 'gregory' | 'kendra' | 'stephen' | 'tiffany';
  
  // Conversation settings
  systemPrompt?: string;
  temperature?: number; // 0.0 to 1.0
  maxTokens?: number;
  topP?: number;
  
  // Audio configuration
  audioInput?: {
    sampleRate?: number;  // Default: 16000
    sampleSize?: number;  // Default: 16
    channels?: number;    // Default: 1
  };
  
  audioOutput?: {
    sampleRate?: number;  // Default: 24000
    sampleSize?: number;  // Default: 16
    channels?: number;    // Default: 1
  };
  
  // Turn detection
  turnSensitivity?: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Tools/Functions
  tools?: RealtimeTool[];
  
  // Chat history
  enableChatHistory?: boolean;
  initialChatHistory?: Array<{
    role: 'USER' | 'ASSISTANT';
    content: string;
  }>;
}
```

## Available Voices

- **matthew** (en-US) - Male, warm and professional
- **joanna** (en-US) - Female, friendly and clear
- **ruth** (en-US) - Female, conversational
- **gregory** (en-US) - Male, authoritative
- **kendra** (en-US) - Female, confident
- **stephen** (en-US) - Male, clear
- **tiffany** (en-US) - Female, professional

## Adding Custom Tools

```typescript
const nova = new NovaProvider({
  websocketUrl: 'ws://localhost:8081',
  tools: [
    {
      name: 'get_weather',
      description: 'Get weather information for a location',
      parameters: {
        location: {
          type: 'string',
          required: true,
          description: 'City name or zip code',
        },
      },
      execute: async (args) => {
        const weather = await fetchWeather(args.location);
        return {
          success: true,
          message: `The weather in ${args.location} is ${weather.temp}°F`,
        };
      },
    },
  ],
});

// Tool calls are automatically handled
nova.onToolCall = (toolName, args, result) => {
  console.log(`Tool ${toolName} called with:`, args);
  console.log('Result:', result);
};
```

## Audio Analysis

Access audio analysis for visualizations or lip sync:

```typescript
nova.onAudioData = (analyser, audioContext) => {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  
  // Use for visualizations, lip sync, etc.
  const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
  console.log('Audio volume:', volume);
};
```

## Events

```typescript
// Connection events
nova.onConnect = () => console.log('Connected');
nova.onDisconnect = () => console.log('Disconnected');
nova.onError = (error) => console.error('Error:', error);

// Conversation events
nova.onMessage = (message) => console.log('Message:', message);
nova.onConversationUpdate = (conversation) => {
  console.log('Conversation:', conversation);
};

// Audio events
nova.onAudioStart = () => console.log('AI started speaking');
nova.onAudioEnd = () => console.log('AI finished speaking');

// Status changes
nova.onChatStatusChange = (status) => {
  console.log('Status:', status); // 'starting' | 'started' | 'stopping' | 'stopped'
};
```

## Advanced Usage

### Interrupting the AI

```typescript
// Interrupt the AI's current response
nova.interrupt();
```

### Microphone Control

```typescript
// Toggle microphone on/off
const isMuted = nova.toggleMicrophone();

// Enable/disable explicitly
nova.enableMicrophone();
nova.disableMicrophone();

// Check status
if (nova.isMicrophoneEnabled()) {
  console.log('Microphone is active');
}
```

### Manual Text Input

```typescript
// Send text without using microphone
await nova.sendMessage('Tell me a joke');
```

## WebSocket Server Setup

This provider requires a WebSocket server that implements the Amazon Nova protocol. See the [Amazon Nova Workshop](https://github.com/aws-samples/amazon-nova-samples) for server implementation examples.

Basic server requirements:
- WebSocket endpoint for bidirectional communication
- Support for Nova Sonic speech-to-speech events
- Audio streaming (base64 encoded LPCM)
- Tool execution handling

## License

MIT © KhaveeAI
