# 📖 API Reference - @khaveeai/react

## Components

### `<KhaveeProvider>`

The root provider component that configures the SDK.

```tsx
import { KhaveeProvider } from '@khaveeai/react';

interface KhaveeConfig {
  llm: LLMProvider;                     // LLM provider instance
  tts: TTSProvider;                     // TTS provider instance
  tools: any[];                         // LLM tools array
  animationRegistry: AnimationRegistry; // Animation definitions
}

interface KhaveeProviderProps {
  config: KhaveeConfig;
  children: React.ReactNode;
}
```

**Example:**
```tsx
<KhaveeProvider config={{
  llm: new LLMOpenAI({ apiKey: "..." }),
  tts: new TTSAzure({ key: "...", region: "..." }),
  tools: [toolAnimate],
  animationRegistry: ANIM_REGISTRY
}}>
  <App />
</KhaveeProvider>
```

### `<VRMAvatar>`

The main VRM avatar component with automatic optimization and animation support.

```tsx
import { VRMAvatar } from '@khaveeai/react';

interface VRMAvatarProps {
  src: string;                           // VRM model URL or path
  autoplayIdle?: boolean;               // Auto-play idle animation (default: true)
  position?: [number, number, number];  // 3D position (default: [0, 0, 0])
  rotation?: [number, number, number];  // 3D rotation (default: [0, Math.PI, 0])
  scale?: [number, number, number];     // 3D scale (default: [1, 1, 1])
  [key: string]: any;                   // Additional Three.js props
}
```

**Example:**
```tsx
<Canvas>
  <VRMAvatar 
    src="/models/character.vrm"
    autoplayIdle
    position={[0, -1, 0]}
    rotation={[0, Math.PI, 0]}
  />
</Canvas>
```

**Features:**
- Automatic VRM loading and optimization
- Built-in animation system integration
- Expression and viseme support
- Performance optimizations (frustum culling, mesh combining)

## Hooks

### `useKhavee()`

Access the global KhaveeAI configuration.

```tsx
import { useKhavee } from '@khaveeai/react';

const { config } = useKhavee();
// config.llm, config.tts, config.animationRegistry, config.tools
```

### `useLLM()`

Interface with the configured LLM provider.

```tsx
import { useLLM } from '@khaveeai/react';

const { streamChat } = useLLM();

// Stream chat completions
async function chat() {
  for await (const chunk of streamChat({ 
    messages: [{ role: "user", content: "Hello!" }] 
  })) {
    if (chunk.type === 'text') {
      console.log(chunk.delta); // Streaming text
    }
  }
}
```

**Types:**
```tsx
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface StreamChunk {
  type: 'text';
  delta: string;
}

function streamChat({ messages }: { 
  messages: ChatMessage[] 
}): AsyncIterable<StreamChunk>
```

### `useVoice()`

Text-to-speech with automatic lip synchronization.

```tsx
import { useVoice } from '@khaveeai/react';

const { speak, speaking } = useVoice();

// Speak text with automatic lip-sync
await speak({ 
  text: "Hello world!", 
  voice: "ja-JP-NanamiNeural" 
});

// Check speaking status
if (speaking) {
  console.log('Avatar is currently speaking');
}
```

**Types:**
```tsx
interface SpeakParams {
  text: string;
  voice?: string; // TTS voice name
}

function speak(params: SpeakParams): Promise<void>
const speaking: boolean; // Current speaking state
```

**Supported Voices:**
- `ja-JP-NanamiNeural` (Japanese, Female)
- `en-US-JennyNeural` (English US, Female)
- `en-US-GuyNeural` (English US, Male)
- And many more Azure voices...

### `useAnimation()`

Control avatar animations, expressions, and visemes.

```tsx
import { useAnimation } from '@khaveeai/react';

const { 
  animate, 
  pulse, 
  setViseme, 
  setExpression,
  currentAnimation,
  visemes,
  expressions 
} = useAnimation();
```

**Methods:**

#### `animate(name: string)`
Trigger a named animation from the registry.

```tsx
animate("wave_small");  // Play wave animation
animate("dance");       // Play dance animation
```

#### `pulse(expression: string, intensity?: number, duration?: number)`
Briefly animate a facial expression.

```tsx
pulse("happy", 0.8, 2000);    // Happy expression for 2 seconds
pulse("surprised", 1.0, 1000); // Surprised for 1 second
```

#### `setViseme(viseme: string, value: number)`
Set lip-sync viseme values (0-1).

```tsx
setViseme("aa", 0.5);  // Open mouth (A sound)
setViseme("oh", 0.8);  // O mouth shape
setViseme("ss", 0.3);  // S mouth shape
```

**Common Visemes:**
- `aa` - Open mouth (A, E sounds)
- `ih` - Closed mouth (I sound)
- `ou` - Rounded mouth (O, U sounds)
- `ee` - Wide mouth (E sound)
- `oh` - Open rounded (O sound)
- `PP` - Closed lips (P, B, M sounds)
- `FF` - Teeth on lip (F, V sounds)
- `TH` - Tongue between teeth (TH sound)
- `SS` - Narrow opening (S, Z sounds)

#### `setExpression(expression: string, value: number)`
Set facial expression values (0-1).

```tsx
setExpression("happy", 0.7);     // 70% happy
setExpression("angry", 0.0);     // No anger
setExpression("blink", 1.0);     // Full blink
```

**Common Expressions:**
- `happy` - Smile/joy
- `angry` - Frown/anger
- `sad` - Sadness
- `surprised` - Surprise/shock
- `blink` / `blinkLeft` / `blinkRight` - Eye blinking
- `lookUp` / `lookDown` / `lookLeft` / `lookRight` - Eye direction

**State:**
```tsx
const currentAnimation: string | null;        // Currently playing animation
const visemes: Record<string, number>;        // Current viseme values
const expressions: Record<string, number>;    // Current expression values
```

## Types

### Core Interfaces

```tsx
// Animation registry entry
interface AnimationClipInfo {
  name: string;        // Unique identifier
  description: string; // Description for LLM context
  tags: string[];      // Tags for categorization
  duration?: number;   // Animation duration in seconds
  fbxPath?: string;    // Path to FBX animation file
  clip?: AnimationClip; // Pre-loaded Three.js animation clip
}

// Animation registry
interface AnimationRegistry {
  [key: string]: AnimationClipInfo;
}

// LLM provider interface
interface LLMProvider {
  streamChat(params: { 
    messages: { role: string; content: string }[] 
  }): AsyncIterable<{ type: string; delta: string }>;
}

// TTS provider interface
interface TTSProvider {
  speak(params: { 
    text: string; 
    voice?: string 
  }): Promise<void>;
}

// Main configuration
interface KhaveeConfig {
  llm: LLMProvider;
  tts: TTSProvider;
  tools: any[];
  animationRegistry: AnimationRegistry;
}
```

## Providers

### LLM Providers

#### `LLMOpenAI`

```tsx
import { LLMOpenAI } from '@khaveeai/providers-openai';

interface LLMOpenAIConfig {
  apiKey: string;      // OpenAI API key
  model?: string;      // Model name (default: "gpt-4")
  baseURL?: string;    // Custom API endpoint
  mock?: boolean;      // Enable mock mode
}

const llm = new LLMOpenAI({
  apiKey: process.env.OPENAI_KEY!,
  model: "gpt-4-turbo",
  mock: false
});
```

#### `MockLLM`

```tsx
import { MockLLM } from '@khaveeai/providers-mock';

const llm = new MockLLM();
// No configuration needed - provides realistic mock responses
```

### TTS Providers

#### `TTSAzure`

```tsx
import { TTSAzure } from '@khaveeai/providers-azure';

interface TTSAzureConfig {
  key: string;         // Azure Speech key
  region: string;      // Azure region
  mock?: boolean;      // Enable mock mode
}

const tts = new TTSAzure({
  key: process.env.AZURE_SPEECH_KEY!,
  region: "eastus",
  mock: false
});
```

#### `MockTTS`

```tsx
import { MockTTS } from '@khaveeai/providers-mock';

const tts = new MockTTS();
// No configuration needed - simulates speech timing and visemes
```

## Tools

### `toolAnimate`

LLM tool that enables AI to trigger animations.

```tsx
import { toolAnimate } from '@khaveeai/core';

// Add to KhaveeProvider config
const config = {
  tools: [toolAnimate],
  // ...
};
```

**Usage in LLM responses:**
```
*trigger_animation: wave_small* Hello there!
*trigger_animation: dance* Let's party!
```

## Utilities

### Animation Helpers

```tsx
import { 
  getAnimationsByTag, 
  getRandomAnimationByEmotion 
} from '@khaveeai/core';

// Get animations by tag
const greetings = getAnimationsByTag('greeting');
// Returns: ['wave_small', 'bow', 'nod_yes']

// Get random animation by emotion
const happyAnim = getRandomAnimationByEmotion('happy');
// Returns: 'laugh' or 'dance' or other happy animations
```

### VRM Utilities

```tsx
import { remapMixamoAnimationToVrm } from '@khaveeai/core';

// Convert Mixamo animation to VRM format
const vrmClip = remapMixamoAnimationToVrm(vrm, mixamoAsset);
```

## Error Handling

### Common Errors

```tsx
// Provider not configured
try {
  const { streamChat } = useLLM();
  // ...
} catch (error) {
  if (error.message.includes('LLM provider not configured')) {
    // Handle missing LLM provider
  }
}

// Animation not found
try {
  animate('non_existent_animation');
} catch (error) {
  console.warn('Animation not found in registry');
}

// TTS failure
try {
  await speak({ text: "Hello" });
} catch (error) {
  console.error('Speech synthesis failed:', error);
}
```

### Error Recovery

```tsx
// Graceful fallback to mock providers
const createLLMProvider = () => {
  try {
    return new LLMOpenAI({ apiKey: process.env.OPENAI_KEY! });
  } catch {
    console.warn('Falling back to mock LLM');
    return new MockLLM();
  }
};

const createTTSProvider = () => {
  try {
    return new TTSAzure({ 
      key: process.env.AZURE_KEY!, 
      region: process.env.AZURE_REGION! 
    });
  } catch {
    console.warn('Falling back to mock TTS');
    return new MockTTS();
  }
};
```

## Performance Tips

### VRM Optimization

```tsx
// Pre-load VRM models
useEffect(() => {
  const preloadVRM = async () => {
    await useGLTF.preload('/models/character.vrm');
  };
  preloadVRM();
}, []);

// Limit update frequency
const { vrm } = useVRM();
useFrame((state, delta) => {
  if (vrm && delta < 0.1) { // Skip frames if too much time passed
    vrm.update(delta);
  }
});
```

### Memory Management

```tsx
// Clean up animations
useEffect(() => {
  return () => {
    // Cleanup animations when component unmounts
    Object.values(actions).forEach(action => {
      action?.stop();
      action?.getClip()?.dispose();
    });
  };
}, [actions]);
```