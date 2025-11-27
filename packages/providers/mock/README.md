# @khaveeai/providers-mock

[![npm version](https://badge.fury.io/js/%40khaveeai%2Fproviders-mock.svg)](https://badge.fury.io/js/%40khaveeai%2Fproviders-mock)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Mock providers for KhaveeAI SDK development and testing. Perfect for developing VRM avatar applications without requiring API keys or external services.

## ✨ Features

- 🎭 **MockLLM** - Simulated AI chat with context-aware responses
- 🔊 **MockTTS** - Simulated text-to-speech with viseme logging
- 🎬 **Animation Triggers** - Embedded animation commands in responses
- 🚀 **Zero Config** - No API keys or setup required
- 📊 **Development Logging** - Detailed console output for debugging
- ⚡ **Fast Iteration** - Test UI and animations without API calls
- 🎯 **Context-Aware** - Responds intelligently to keywords in messages

## 📦 Installation

```bash
npm install @khaveeai/providers-mock @khaveeai/react @khaveeai/core
```

## 🚀 Quick Start

### Basic Setup

```tsx
import { KhaveeProvider, VRMAvatar } from "@khaveeai/react";
import { MockLLM, MockTTS } from "@khaveeai/providers-mock";
import { Canvas } from "@react-three/fiber";

function App() {
  const mockConfig = {
    llm: new MockLLM(),
    tts: new MockTTS(),
  };

  return (
    <KhaveeProvider config={mockConfig}>
      <Canvas>
        <VRMAvatar src="/models/avatar.vrm" />
      </Canvas>
      {/* Your UI components */}
    </KhaveeProvider>
  );
}
```

### With Chat Interface

```tsx
"use client";
import { useState } from "react";
import { KhaveeProvider, VRMAvatar } from "@khaveeai/react";
import { MockLLM, MockTTS } from "@khaveeai/providers-mock";
import { Canvas } from "@react-three/fiber";

function Chat() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const mockLLM = new MockLLM();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Stream response from MockLLM
    let response = "";
    for await (const chunk of mockLLM.streamChat({ 
      messages: [...messages, userMessage] 
    })) {
      if (chunk.type === "text") {
        response += chunk.delta;
      }
    }

    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
  };

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <KhaveeProvider config={{ llm: new MockLLM(), tts: new MockTTS() }}>
      <div className="app">
        <Canvas className="canvas">
          <VRMAvatar src="/models/avatar.vrm" />
          <ambientLight intensity={0.5} />
        </Canvas>
        <Chat />
      </div>
    </KhaveeProvider>
  );
}
```

## 📖 API Reference

### MockLLM

Simulated Large Language Model with context-aware responses and animation triggers.

```tsx
import { MockLLM } from "@khaveeai/providers-mock";

const mockLLM = new MockLLM();

// Stream chat responses
for await (const chunk of mockLLM.streamChat({ 
  messages: [{ role: "user", content: "Hello!" }] 
})) {
  console.log(chunk); // { type: 'text', delta: 'H' }
}
```

#### Context-Aware Responses

MockLLM intelligently responds based on keywords in your messages:

| Keyword | Response Type | Animation Trigger |
|---------|--------------|-------------------|
| `hello`, `hi`, `hey` | Greeting | `wave_small` 👋 |
| `dance`, `move` | Dancing | `swing_dance` 💃 |
| `sad`, `cry`, `upset` | Empathy | `sad` 💙 |
| `happy`, `good`, `great` | Celebration | `laugh` 😊 |
| `fight`, `angry`, `mad` | Conflict | `punch` 🥊 |
| `think`, `question`, `wonder` | Thoughtful | `thinking` 🤔 |
| `yes`, `agree`, `correct` | Agreement | `nod_yes` ✓ |
| `no`, `disagree`, `wrong` | Disagreement | `shake_no` ✗ |
| *anything else* | Random response | Various |

#### Animation Triggers

Responses include embedded animation commands in the format `*trigger_animation: animation_name*`:

```typescript
// Example responses
"Hello! *trigger_animation: wave_small* 👋"
"I'd love to dance! *trigger_animation: swing_dance* 💃"
"Let me think... *trigger_animation: thinking* 🤔"
```

You can parse these triggers in your UI to play corresponding VRM animations:

```tsx
const parseAnimationTrigger = (text: string) => {
  const match = text.match(/\*trigger_animation:\s*(\w+)\*/);
  return match ? match[1] : null;
};

// Usage
const animation = parseAnimationTrigger(response);
if (animation) {
  animate(animation); // Play VRM animation
}
```

### MockTTS

Simulated Text-to-Speech with realistic timing and viseme logging.

```tsx
import { MockTTS } from "@khaveeai/providers-mock";

const mockTTS = new MockTTS();

// Simulate speech
await mockTTS.speak({ 
  text: "Hello, I'm a VRM avatar!",
  voice: "mock-voice" 
});
```

#### Console Output

MockTTS provides detailed logging for development:

```
🔊 [Mock TTS] Speaking with mock-voice:
"Hello, I'm a VRM avatar!"
👄 [Mock Visemes] Simulating lip-sync patterns...
   📊 Detected: 7 vowels, 11 consonants
   🎭 Viseme sequence: Hello, I'm a VRM avatar!
⏱️  [Mock TTS] Speech duration: 1600ms
✅ [Mock TTS] Speech completed
```

#### Viseme Simulation

MockTTS simulates phoneme/viseme data for lip-sync development:

```typescript
// Vowel mapping
'a' → 'aa' (open mouth)
'e' → 'ee' (half open)
'i' → 'ih' (smile)
'o' → 'oh' (round)
'u' → 'ou' (pucker)

// Consonant mapping
'b', 'm', 'p' → 'PP' (lips together)
'f', 'v' → 'FF' (teeth on lip)
't', 'd', 'n', 'l' → 'TH' (tongue)
's', 'z' → 'SS' (hiss)
// ... and more
```

## 🎯 Use Cases

### 1. Development Without API Keys

Perfect for building UI and testing animations without OpenAI API costs:

```tsx
// Development environment
const isDev = process.env.NODE_ENV === "development";

const config = isDev
  ? { llm: new MockLLM(), tts: new MockTTS() }
  : { realtime: new OpenAIRealtimeProvider({ apiKey: process.env.OPENAI_API_KEY! }) };

<KhaveeProvider config={config}>
  <VRMAvatar src="/models/avatar.vrm" />
</KhaveeProvider>
```

### 2. Animation System Testing

Test your animation system with predictable triggers:

```tsx
import { MockLLM } from "@khaveeai/providers-mock";
import { useVRMAnimations } from "@khaveeai/react";

function AnimationTest() {
  const { animate } = useVRMAnimations();
  const mockLLM = new MockLLM();

  const testAnimations = async () => {
    const testMessages = [
      "Say hello",      // Triggers wave animation
      "Let's dance",    // Triggers dance animation
      "Are you sad?",   // Triggers sad animation
      "That's great!",  // Triggers happy animation
    ];

    for (const msg of testMessages) {
      let response = "";
      for await (const chunk of mockLLM.streamChat({ 
        messages: [{ role: "user", content: msg }] 
      })) {
        if (chunk.type === "text") response += chunk.delta;
      }

      // Parse and trigger animation
      const match = response.match(/\*trigger_animation:\s*(\w+)\*/);
      if (match) {
        console.log(`Playing animation: ${match[1]}`);
        animate(match[1]);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  return <button onClick={testAnimations}>Test Animations</button>;
}
```

### 3. UI Development

Focus on UI/UX without worrying about API integration:

```tsx
function DevelopmentUI() {
  return (
    <KhaveeProvider config={{ llm: new MockLLM() }}>
      {/* Design your UI components */}
      <ChatInterface />
      <ExpressionControls />
      <AnimationPanel />
      
      {/* Avatar responds with mock data */}
      <Canvas>
        <VRMAvatar src="/models/avatar.vrm" />
      </Canvas>
    </KhaveeProvider>
  );
}
```

### 4. Automated Testing

Write tests without external API dependencies:

```tsx
import { MockLLM, MockTTS } from "@khaveeai/providers-mock";

describe("Chat Component", () => {
  it("should respond to user messages", async () => {
    const mockLLM = new MockLLM();
    const messages = [{ role: "user", content: "Hello" }];
    
    let response = "";
    for await (const chunk of mockLLM.streamChat({ messages })) {
      if (chunk.type === "text") response += chunk.delta;
    }
    
    expect(response).toContain("Hello");
    expect(response).toContain("wave_small");
  });

  it("should simulate TTS with proper timing", async () => {
    const mockTTS = new MockTTS();
    const start = Date.now();
    
    await mockTTS.speak({ text: "Test message" });
    
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThan(0);
  });
});
```

## 🎬 Pre-configured Responses

MockLLM includes 8 built-in responses with various animations:

1. General greeting with introduction
2. Thinking animation trigger
3. Waving animation trigger
4. Nodding yes animation trigger
5. Smiling animation trigger
6. Surprised animation trigger
7. Sad expression animation trigger
8. Dancing animation trigger

These are randomly selected when no specific keyword matches, ensuring variety in development.

## 🔧 Customization

### Extending MockLLM

Add your own responses and behaviors:

```tsx
import { MockLLM } from "@khaveeai/providers-mock";

class CustomMockLLM extends MockLLM {
  async *streamChat({ messages }: { messages: any[] }) {
    const lastMessage = messages[messages.length - 1]?.content || "";
    
    // Add custom logic
    if (lastMessage.includes("your-keyword")) {
      const response = "Your custom response! *trigger_animation: your_animation*";
      for (const char of response) {
        await new Promise(resolve => setTimeout(resolve, 30));
        yield { type: "text", delta: char };
      }
      return;
    }
    
    // Fall back to default behavior
    yield* super.streamChat({ messages });
  }
}

// Use custom implementation
const config = { llm: new CustomMockLLM() };
```

### Custom TTS Timing

Adjust speech simulation duration:

```tsx
import { MockTTS } from "@khaveeai/providers-mock";

class CustomMockTTS extends MockTTS {
  async speak({ text, voice = "custom-voice" }: { text: string; voice?: string }) {
    console.log(`Speaking: "${text}"`);
    
    // Custom timing logic
    const words = text.split(" ").length;
    const duration = (words / 120) * 60 * 1000; // 120 WPM
    
    await new Promise(resolve => setTimeout(resolve, duration));
    console.log("Done speaking");
  }
}
```

## 💡 Best Practices

### 1. Environment-Based Configuration

Use mock providers in development, real providers in production:

```tsx
const getConfig = () => {
  if (process.env.NODE_ENV === "development") {
    return {
      llm: new MockLLM(),
      tts: new MockTTS(),
    };
  }
  
  return {
    realtime: new OpenAIRealtimeProvider({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
    }),
  };
};

<KhaveeProvider config={getConfig()}>
  {/* Your app */}
</KhaveeProvider>
```

### 2. Animation Trigger Parsing

Extract animation commands from responses:

```tsx
const extractAnimations = (text: string): string[] => {
  const matches = text.matchAll(/\*trigger_animation:\s*(\w+)\*/g);
  return Array.from(matches, m => m[1]);
};

// Usage
const animations = extractAnimations(response);
animations.forEach(anim => animate(anim));
```

### 3. Realistic Delays

Add realistic delays between interactions:

```tsx
const handleChat = async (message: string) => {
  // Simulate "thinking" time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Stream response
  for await (const chunk of mockLLM.streamChat({ messages })) {
    // Process chunk
  }
};
```

## 🐛 Debugging

Enable verbose logging:

```tsx
import { MockLLM, MockTTS } from "@khaveeai/providers-mock";

const mockLLM = new MockLLM();
const mockTTS = new MockTTS();

// All console output is automatically logged
// Check browser console for:
// - 🔊 TTS speaking events
// - 👄 Viseme simulations
// - ⏱️ Duration estimates
// - ✅ Completion confirmations
```

## 📦 TypeScript Support

Full TypeScript support with proper interfaces:

```typescript
import type { LLMProvider, TTSProvider } from "@khaveeai/core";
import { MockLLM, MockTTS } from "@khaveeai/providers-mock";

const llm: LLMProvider = new MockLLM();
const tts: TTSProvider = new MockTTS();

// Type-safe streaming
async function chat(messages: Array<{ role: string; content: string }>) {
  for await (const chunk of llm.streamChat({ messages })) {
    if (chunk.type === "text") {
      console.log(chunk.delta); // TypeScript knows this is a string
    }
  }
}
```

## 🔗 Related Packages

- **[@khaveeai/react](../react)** - React components and hooks
- **[@khaveeai/core](../core)** - Core types and interfaces
- **[@khaveeai/providers-openai-realtime](../openai-realtime)** - OpenAI Realtime API provider

## 📝 Examples

Check out complete examples in the [examples directory](../../examples):

- `basic-mock` - Simple mock provider setup
- `animation-testing` - Testing animations with mock responses
- `development-workflow` - Development environment setup

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/SolveServeSolution/khaveeai-sdk/blob/main/CONTRIBUTING.md).

## 📄 License

MIT © [KhaveeAI](https://github.com/SolveServeSolution/khaveeai-sdk)

---

**Need help?** [Open an issue](https://github.com/SolveServeSolution/khaveeai-sdk/issues) or check our [documentation](https://github.com/SolveServeSolution/khaveeai-sdk).
