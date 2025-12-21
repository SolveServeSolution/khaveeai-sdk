# Quick Start Guide - Nova Provider

## Installation

```bash
cd /Users/whitemalt/Documents/vrm
pnpm install
```

The Nova provider is now installed as `@khaveeai/providers-nova`.

## Simple Usage Example

```typescript
import { NovaProvider } from '@khaveeai/providers-nova';

// Create provider
const nova = new NovaProvider({
  websocketUrl: 'ws://localhost:8081', // Your Nova WebSocket server
  voice: 'matthew',
  systemPrompt: 'You are a helpful assistant.',
});

// Set up event handlers
nova.onConnect = () => console.log('Connected!');
nova.onConversationUpdate = (conversation) => {
  console.log('Conversation:', conversation);
};

// Connect and start
await nova.connect();

// Send a message
await nova.sendMessage('Hello!');

// Disconnect
await nova.disconnect();
```

## Using with React and VRM Avatars

```typescript
import { NovaProvider } from '@khaveeai/providers-nova';
import { VRMAvatar } from '@khaveeai/react';

function App() {
  const [nova] = useState(() => new NovaProvider({
    websocketUrl: 'ws://localhost:8081',
    voice: 'ruth',
  }));

  const [audioAnalyser, setAudioAnalyser] = useState(null);

  useEffect(() => {
    nova.onAudioData = (analyser, audioContext) => {
      setAudioAnalyser({ analyser, audioContext });
    };
  }, []);

  return (
    <div>
      <VRMAvatar 
        modelUrl="/models/avatar.vrm"
        audioAnalyser={audioAnalyser?.analyser}
        audioContext={audioAnalyser?.audioContext}
      />
      <button onClick={() => nova.connect()}>Start</button>
    </div>
  );
}
```

## WebSocket Server

You need a WebSocket server that implements the Amazon Nova protocol. Reference:
- The `react-client` folder contains the workshop example
- Server should handle Nova Sonic speech-to-speech events
- See Amazon Nova workshop for server implementation

## Available Voices

- `matthew` - Male, warm (en-US)
- `joanna` - Female, friendly (en-US)
- `ruth` - Female, conversational (en-US)
- `gregory` - Male, authoritative (en-US)
- `kendra` - Female, confident (en-US)
- `stephen` - Male, clear (en-US)
- `tiffany` - Female, professional (en-US)

## Key Features

✅ Real-time speech-to-speech  
✅ WebSocket-based communication  
✅ Tool/function calling support  
✅ Audio streaming with lip sync  
✅ Easy microphone control  
✅ VRM avatar integration  

For more examples, see:
- `/packages/providers/nova/examples/basic.ts`
- `/packages/providers/nova/examples/tools.ts`
- `/packages/providers/nova/examples/react-example.tsx`
