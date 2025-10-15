# 🎭 Khavee AI - VRM Avatar SDK

**Transform VRM 3D avatars into interactive AI characters with expressions, animations, and voice.**

Build immersive AI experiences with realistic 3D avatars that can talk, express emotions, and respond intelligently to users.

[![NPM Version](https://img.shields.io/npm/v/@khaveeai/react)](https://www.npmjs.com/package/@khaveeai/react)
[![License](https://img.shields.io/npm/l/@khaveeai/react)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

---

## ✨ Features

- 🎨 **Facial Expressions** - Control 30+ VRM expressions with smooth transitions
- 💃 **Body Animations** - Load and play Mixamo animations via simple URLs
- 🤖 **LLM Integration** - Built-in chat streaming with any LLM provider
- 🗣️ **Text-to-Speech** - Voice synthesis with expression sync
- 🎯 **Simple API** - URL-based animations, no complex setup
- 📦 **Provider System** - Plug-and-play OpenAI, Azure, or custom providers
- 🎭 **Auto-Remapping** - Mixamo animations work out of the box
- 💪 **TypeScript** - Full type safety and IntelliSense support
- ⚡ **React Three Fiber** - Built on the industry-standard 3D React framework

---

## 📦 Installation

### Required Dependencies

First, install the core 3D rendering libraries:

```bash
npm install three @react-three/fiber @react-three/drei
# or
pnpm add three @react-three/fiber @react-three/drei
# or
yarn add three @react-three/fiber @react-three/drei
```

### Install Khavee AI SDK

```bash
npm install @khaveeai/react @khaveeai/core
# or
pnpm add @khaveeai/react @khaveeai/core
# or
yarn add @khaveeai/react @khaveeai/core
```

### Optional: LLM/TTS Providers

```bash
# For OpenAI
npm install @khaveeai/providers-openai

# For Azure
npm install @khaveeai/providers-azure

# For development/testing
npm install @khaveeai/providers-mock
```

### Peer Dependencies

The SDK requires these peer dependencies (most React projects already have them):

```json
{
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "three": "^0.160.0"
}
```

---

## 🚀 Quick Start

### Basic VRM Avatar

```tsx
import { Canvas } from '@react-three/fiber';
import { KhaveeProvider, VRMAvatar } from '@khaveeai/react';

export default function App() {
  return (
    <KhaveeProvider>
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />
        
        <VRMAvatar 
          src="/models/character.vrm"
          position={[0, -1, 0]}
        />
      </Canvas>
    </KhaveeProvider>
  );
}
```

### With Animations

```tsx
const animations = {
  idle: '/animations/idle.fbx',        // Auto-plays on load
  walk: '/animations/walk.fbx',
  dance: '/animations/dance.fbx',
};

function App() {
  return (
    <KhaveeProvider>
      <Canvas>
        <VRMAvatar 
          src="/models/character.vrm"
          animations={animations}
        />
      </Canvas>
    </KhaveeProvider>
  );
}
```

### With LLM & Voice

```tsx
import { KhaveeProvider, VRMAvatar, useLLM, useVoice } from '@khaveeai/react';
import { OpenAIProvider } from '@khaveeai/providers-openai';

const config = {
  llm: new OpenAIProvider({ apiKey: 'your-key' }),
  voice: new OpenAIProvider({ apiKey: 'your-key' }),
};

function ChatInterface() {
  const { streamChat } = useLLM();
  const { speak } = useVoice();

  const handleChat = async (userMessage: string) => {
    let response = '';
    
    // Stream LLM response
    for await (const chunk of streamChat({ 
      messages: [{ role: 'user', content: userMessage }] 
    })) {
      if (chunk.type === 'text') {
        response += chunk.delta;
      }
    }
    
    // Speak the response
    await speak({ text: response });
  };

  return (
    <button onClick={() => handleChat('Hello!')}>
      Say Hello
    </button>
  );
}

export default function App() {
  return (
    <KhaveeProvider config={config}>
      <Canvas>
        <VRMAvatar src="/models/character.vrm" />
      </Canvas>
      <ChatInterface />
    </KhaveeProvider>
  );
}
```

---

## 🎨 Control Expressions

```tsx
import { useVRMExpressions } from '@khaveeai/react';

function ExpressionControls() {
  const { setExpression, resetExpressions, setMultipleExpressions } = useVRMExpressions();

  return (
    <div>
      {/* Single expression */}
      <button onClick={() => setExpression('happy', 1)}>
        😊 Happy
      </button>
      
      {/* Partial intensity */}
      <button onClick={() => setExpression('happy', 0.5)}>
        🙂 Slightly Happy
      </button>
      
      {/* Multiple expressions */}
      <button onClick={() => setMultipleExpressions({
        happy: 0.8,
        surprised: 0.4
      })}>
        😲 Excited
      </button>
      
      {/* Reset all */}
      <button onClick={() => resetExpressions()}>
        😐 Neutral
      </button>
    </div>
  );
}
```

---

## 💃 Play Animations

```tsx
import { useVRMAnimations } from '@khaveeai/react';

function AnimationControls() {
  const { animate, stopAnimation, currentAnimation } = useVRMAnimations();

  return (
    <div>
      <button onClick={() => animate('walk')}>
        🚶 Walk
      </button>
      <button onClick={() => animate('dance')}>
        💃 Dance
      </button>
      <button onClick={() => animate('idle')}>
        🧍 Idle
      </button>
      <button onClick={() => stopAnimation()}>
        ⏹️ Stop
      </button>
      
      <p>Current: {currentAnimation || 'none'}</p>
    </div>
  );
}
```

---

## 🗂️ Project Structure

```
your-project/
├── public/
│   ├── models/
│   │   └── character.vrm          # Your VRM model
│   └── animations/
│       ├── idle.fbx               # Mixamo animations
│       ├── walk.fbx
│       └── dance.fbx
├── src/
│   ├── app/
│   │   └── page.tsx               # Your main component
│   └── ...
└── package.json
```

---

## 📚 API Reference

### Components

#### `<KhaveeProvider>`

Root provider that manages VRM state and optional LLM/TTS configuration.

```tsx
<KhaveeProvider config={config}>
  {children}
</KhaveeProvider>
```

**Props:**
- `config?` - Optional LLM/TTS provider configuration
- `children` - React children

#### `<VRMAvatar>`

Renders a VRM 3D character with animations and expressions.

```tsx
<VRMAvatar
  src="/models/character.vrm"
  animations={animations}
  position={[0, -1, 0]}
  rotation={[0, Math.PI, 0]}
  scale={[1, 1, 1]}
/>
```

**Props:**
- `src` - URL to VRM model file (required)
- `animations?` - Animation configuration (URLs to FBX files)
- `position?` - 3D position `[x, y, z]` (default: `[0, 0, 0]`)
- `rotation?` - 3D rotation `[x, y, z]` (default: `[0, Math.PI, 0]`)
- `scale?` - 3D scale `[x, y, z]` (default: `[1, 1, 1]`)

---

### Hooks

#### `useVRMExpressions()`

Control facial expressions with smooth transitions.

```tsx
const { 
  expressions,           // Current expression values
  setExpression,         // Set single expression
  resetExpressions,      // Reset all to neutral
  setMultipleExpressions // Set multiple at once
} = useVRMExpressions();
```

**Example:**
```tsx
setExpression('happy', 1);              // Full happiness
setExpression('happy', 0.5);            // Partial
setMultipleExpressions({                // Multiple
  happy: 0.8,
  surprised: 0.3
});
resetExpressions();                     // Reset all
```

#### `useVRMAnimations()`

Play and control body animations.

```tsx
const { 
  animate,              // Play animation by name
  stopAnimation,        // Stop all animations
  currentAnimation      // Currently playing animation name
} = useVRMAnimations();
```

**Example:**
```tsx
animate('walk');       // Play walk animation
animate('dance');      // Play dance animation
stopAnimation();       // Stop all
```

#### `useLLM()`

Stream chat responses from LLM providers.

```tsx
const { streamChat } = useLLM();

// Usage
for await (const chunk of streamChat({ messages })) {
  if (chunk.type === 'text') {
    console.log(chunk.delta);
  }
}
```

#### `useVoice()`

Text-to-speech with speaking state tracking.

```tsx
const { speak, speaking } = useVoice();

// Usage
await speak({ text: 'Hello world!' });
await speak({ text: 'Hello!', voice: 'female' });
```

#### `useVRM()`

Access the raw VRM instance for advanced use cases.

```tsx
const vrm = useVRM();

if (vrm) {
  console.log('VRM loaded:', vrm.meta.name);
}
```

#### `useKhavee()`

Access all SDK functionality at once.

```tsx
const { 
  vrm,
  setExpression,
  animate,
  // ... all functions
} = useKhavee();
```

---

## 🎯 Common Patterns

### Talking Avatar with Expressions

```tsx
function TalkingAvatar() {
  const { speak } = useVoice();
  const { setExpression, resetExpressions } = useVRMExpressions();

  const sayHello = async () => {
    setExpression('happy', 1);
    await speak({ text: 'Hello! How are you today?' });
    resetExpressions();
  };

  return <button onClick={sayHello}>Say Hello</button>;
}
```

### Animation + Expression Combo

```tsx
function DanceWithJoy() {
  const { animate } = useVRMAnimations();
  const { setExpression } = useVRMExpressions();

  const danceHappily = () => {
    animate('dance');
    setExpression('happy', 1);
  };

  return <button onClick={danceHappily}>Dance!</button>;
}
```

### LLM Chat with Voice Response

```tsx
function ChatBot() {
  const { streamChat } = useLLM();
  const { speak } = useVoice();
  const { setExpression } = useVRMExpressions();

  const chat = async (userMessage: string) => {
    let response = '';
    
    // Stream response
    for await (const chunk of streamChat({ 
      messages: [{ role: 'user', content: userMessage }] 
    })) {
      if (chunk.type === 'text') {
        response += chunk.delta;
      }
    }
    
    // Speak with expression
    setExpression('happy', 0.8);
    await speak({ text: response });
  };

  return (
    <input 
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          chat(e.currentTarget.value);
        }
      }}
    />
  );
}
```

---

## 🔌 Providers

### Mock Provider (Development)

Perfect for testing without API keys:

```tsx
import { MockProvider } from '@khaveeai/providers-mock';

const config = {
  llm: new MockProvider(),
  voice: new MockProvider(),
};
```

### OpenAI Provider

```tsx
import { OpenAIProvider } from '@khaveeai/providers-openai';

const config = {
  llm: new OpenAIProvider({ 
    apiKey: process.env.OPENAI_API_KEY 
  }),
  voice: new OpenAIProvider({ 
    apiKey: process.env.OPENAI_API_KEY 
  }),
};
```

### Azure Provider

```tsx
import { AzureProvider } from '@khaveeai/providers-azure';

const config = {
  llm: new AzureProvider({ 
    apiKey: process.env.AZURE_API_KEY,
    endpoint: process.env.AZURE_ENDPOINT 
  }),
  voice: new AzureProvider({ 
    apiKey: process.env.AZURE_API_KEY 
  }),
};
```

### Custom Provider

Create your own provider:

```tsx
import { LLMProvider, VoiceProvider } from '@khaveeai/core';

class CustomProvider implements LLMProvider, VoiceProvider {
  async *streamChat({ messages }) {
    // Your implementation
    yield { type: 'text', delta: 'Hello!' };
  }

  async speak({ text, voice }) {
    // Your implementation
    return Promise.resolve();
  }
}
```

---

## 🎨 Where to Get Assets

### VRM Models
- [VRoid Hub](https://hub.vroid.com/) - Free VRM characters
- [VRoid Studio](https://vroid.com/en/studio) - Create your own
- [Booth.pm](https://booth.pm/) - Buy premium models

### Mixamo Animations
1. Go to [Mixamo](https://www.mixamo.com/)
2. Select any animation
3. Download as **FBX** format
4. No skeleton, just animation
5. Use the URL in your `animations` config

**Recommended Animations:**
- Idle → Breathing Idle
- Walk → Walking
- Dance → Hip Hop Dancing, Swing Dancing
- Talk → Talking with Hands
- Wave → Waving

---

## 🛠️ Troubleshooting

### VRM not rendering?

**Check these:**
1. ✅ VRM file is valid (test in [VRoid Hub](https://hub.vroid.com/))
2. ✅ Wrapped in `<Canvas>` from `@react-three/fiber`
3. ✅ Wrapped in `<KhaveeProvider>`
4. ✅ Lights added to scene (`<ambientLight>`, `<directionalLight>`)

### Animations not playing?

**Check these:**
1. ✅ FBX files are from Mixamo
2. ✅ Downloaded as **FBX** (not BVH)
3. ✅ "Without Skin" option selected
4. ✅ URLs are correct and accessible
5. ✅ Animation name matches config key

### Expressions not working?

**Check these:**
1. ✅ VRM model has expression support
2. ✅ Expression names are correct (check VRM in VRoid Hub)
3. ✅ Values between 0 and 1
4. ✅ Called inside component wrapped by `<KhaveeProvider>`

### LLM/Voice not working?

**Check these:**
1. ✅ Provider configured in `<KhaveeProvider config={...}>`
2. ✅ API keys are valid
3. ✅ Called `useLLM()` or `useVoice()` inside provider

---

## 📖 Full Documentation

- [API Reference](./docs/API_REFERENCE.md) - Complete API docs
- [Examples](./src/app/khavee-example/) - Working examples
- [Function Documentation](./COMPLETE_FUNCTION_DOCS.md) - All functions documented
- [IntelliSense Guide](./INTELLISENSE_PREVIEW.md) - IDE integration guide

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

---

## 📄 License

MIT © [Khavee AI](https://github.com/SolveServeSolution/khaveeai-sdk)

---

## 🌟 Examples

Check out our [example app](./src/app/khavee-example/) to see:
- ✅ Expression controls
- ✅ Animation panel
- ✅ LLM chat integration
- ✅ Voice synthesis
- ✅ Combined interactions

---

## 💬 Support

- 📧 Email: support@khaveeai.com
- 💬 Discord: [Join our community](https://discord.gg/khaveeai)
- 🐛 Issues: [GitHub Issues](https://github.com/SolveServeSolution/khaveeai-sdk/issues)

---

**Built with ❤️ by the Khavee AI Team**
