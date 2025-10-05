# 🎭 Animation Guide - @khaveeai/react

## Overview

The animation system in @khaveeai/react provides a powerful way to bring your VRM avatars to life through:

- **Registry-based animations** - Centralized animation definitions
- **LLM integration** - AI can automatically trigger appropriate animations  
- **Manual control** - Direct animation triggers via hooks
- **Expression system** - Facial expressions and emotions
- **Lip-sync** - Automatic viseme generation for speech

## Animation Registry

### Basic Structure

```typescript
// animationRegistry.ts
import { AnimationRegistry } from '@khaveeai/core';

export const ANIM_REGISTRY: AnimationRegistry = {
  animation_name: {
    name: "animation_name",           // Unique identifier
    description: "What it does",     // For LLM context
    tags: ["category", "emotion"],   // For LLM selection
    duration: 3.0,                   // Seconds (optional)
    fbxPath: "/path/to/file.fbx"     // Animation file (optional)
  }
};
```

### Complete Example Registry

```typescript
export const ANIM_REGISTRY: AnimationRegistry = {
  // === BASIC STATES ===
  idle: {
    name: "idle",
    description: "Default breathing idle animation",
    tags: ["idle", "neutral", "breathing"],
    fbxPath: "/models/animations/Breathing Idle.fbx"
  },
  
  // === GREETINGS ===
  wave_small: {
    name: "wave_small",
    description: "Small friendly wave gesture",
    tags: ["greeting", "friendly", "hello", "wave"],
    duration: 2.0
  },
  
  wave_big: {
    name: "wave_big", 
    description: "Enthusiastic big wave with both hands",
    tags: ["greeting", "enthusiastic", "hello", "excited"],
    duration: 3.0
  },
  
  bow: {
    name: "bow",
    description: "Polite bow greeting",
    tags: ["greeting", "polite", "formal", "respect"],
    duration: 2.5
  },
  
  // === EMOTIONS ===
  happy_bounce: {
    name: "happy_bounce",
    description: "Bouncy happy movement showing joy",
    tags: ["happy", "joy", "celebration", "positive"],
    duration: 2.0
  },
  
  laugh: {
    name: "laugh",
    description: "Laughing animation with body movement",
    tags: ["happy", "laugh", "amusement", "funny"],
    duration: 3.0
  },
  
  sad_slump: {
    name: "sad_slump",
    description: "Sad slumped posture showing disappointment",
    tags: ["sad", "disappointed", "melancholy", "down"],
    duration: 4.0
  },
  
  surprised_jump: {
    name: "surprised_jump",
    description: "Surprised reaction with quick jump back",
    tags: ["surprised", "shock", "startled", "unexpected"],
    duration: 1.5
  },
  
  // === AGREEMENT/DISAGREEMENT ===
  nod_yes: {
    name: "nod_yes",
    description: "Nodding head to show agreement",
    tags: ["agreement", "yes", "approval", "confirm"],
    duration: 1.5
  },
  
  shake_no: {
    name: "shake_no", 
    description: "Shaking head to show disagreement",
    tags: ["disagreement", "no", "denial", "reject"],
    duration: 2.0
  },
  
  shrug: {
    name: "shrug",
    description: "Shoulder shrug showing uncertainty",
    tags: ["uncertain", "dunno", "maybe", "confused"],
    duration: 2.0
  },
  
  // === THINKING ===
  thinking: {
    name: "thinking",
    description: "Thoughtful pose with hand to chin",
    tags: ["thinking", "contemplating", "pondering", "considering"],
    duration: 3.0
  },
  
  head_scratch: {
    name: "head_scratch",
    description: "Scratching head showing confusion",
    tags: ["confused", "puzzled", "thinking", "uncertain"],
    duration: 2.5
  },
  
  // === DANCE/MOVEMENT ===
  swing_dance: {
    name: "swing_dance",
    description: "Energetic swing dancing movement",
    tags: ["dance", "energetic", "party", "celebration", "music"],
    fbxPath: "/models/animations/Swing Dancing.fbx",
    duration: 8.0
  },
  
  thriller_dance: {
    name: "thriller_dance",
    description: "Classic thriller dance moves",
    tags: ["dance", "dramatic", "performance", "halloween", "spooky"],
    fbxPath: "/models/animations/Thriller Part 2.fbx", 
    duration: 10.0
  },
  
  // === ACTION ===
  point_forward: {
    name: "point_forward",
    description: "Pointing forward to indicate direction",
    tags: ["pointing", "direction", "showing", "indicating"],
    duration: 2.0
  },
  
  clap: {
    name: "clap",
    description: "Clapping hands in appreciation",
    tags: ["applause", "appreciation", "celebration", "approval"],
    duration: 3.0
  },
  
  stretch: {
    name: "stretch", 
    description: "Stretching arms and body",
    tags: ["stretch", "tired", "relaxing", "comfortable"],
    duration: 4.0
  },
  
  // === COMBAT/PLAYFUL ===
  punch: {
    name: "punch",
    description: "Playful punching motion",
    tags: ["action", "playful", "energetic", "fighting"],
    fbxPath: "/models/animations/Fist Fight B.fbx",
    duration: 2.0
  }
};
```

## LLM Integration

### Automatic Animation Triggers

The LLM can automatically trigger animations by including special syntax in responses:

```
*trigger_animation: wave_small* Hello there!
*trigger_animation: thinking* Let me think about that...
*trigger_animation: dance* Let's celebrate!
```

### How LLM Chooses Animations

The LLM uses the `description` and `tags` from your registry to choose appropriate animations:

1. **Context matching** - Based on conversation context
2. **Emotion detection** - Matching emotional state
3. **Action relevance** - Relevant to what's being discussed

Example LLM reasoning:
- User says "Hello!" → LLM chooses `wave_small` (tags: greeting, friendly)
- User asks "Do you agree?" → LLM chooses `nod_yes` (tags: agreement, yes)
- User says "I'm confused" → LLM chooses `head_scratch` (tags: confused, puzzled)

### Optimizing for LLM Selection

Write clear descriptions and comprehensive tags:

```typescript
// ❌ Poor: Vague description and tags
unclear_anim: {
  name: "unclear_anim", 
  description: "Some movement",
  tags: ["move"]
}

// ✅ Good: Clear description and comprehensive tags
excited_celebration: {
  name: "excited_celebration",
  description: "Energetic celebration with arms raised, perfect for good news or achievements",
  tags: ["celebration", "excited", "happy", "achievement", "success", "victory", "joy"]
}
```

## Manual Animation Control

### Using the Hook

```tsx
import { useAnimation } from '@khaveeai/react';

function MyComponent() {
  const { animate, pulse, currentAnimation } = useAnimation();
  
  return (
    <div>
      <button onClick={() => animate('wave_small')}>
        Wave Hello
      </button>
      
      <button onClick={() => animate('dance')}>
        Dance
      </button>
      
      <button onClick={() => pulse('happy', 0.8, 2000)}>
        Show Happiness
      </button>
      
      <p>Current: {currentAnimation || 'None'}</p>
    </div>
  );
}
```

### Animation Sequencing

```tsx
const playSequence = async () => {
  animate('wave_small');
  
  // Wait for animation to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  animate('thinking');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  animate('happy_bounce');
};
```

### Conditional Animations

```tsx
const reactToMessage = (message: string) => {
  const lower = message.toLowerCase();
  
  if (lower.includes('hello') || lower.includes('hi')) {
    animate('wave_small');
  } else if (lower.includes('dance') || lower.includes('party')) {
    animate('swing_dance');
  } else if (lower.includes('sad') || lower.includes('sorry')) {
    animate('sad_slump');
  } else if (lower.includes('thank')) {
    animate('bow');
  } else {
    pulse('thinking', 0.5, 1000);
  }
};
```

## Expression System

### Facial Expressions

```tsx
const { setExpression, pulse } = useAnimation();

// Set permanent expression
setExpression('happy', 0.7);     // 70% happiness
setExpression('surprised', 0.0); // No surprise

// Temporary expression pulse
pulse('blink', 1.0, 500);        // Quick blink
pulse('surprised', 0.9, 2000);   // 2-second surprise
```

### Common Expressions

| Expression | Description | Range |
|------------|-------------|-------|
| `happy` | Smile/joy | 0.0 - 1.0 |
| `angry` | Frown/anger | 0.0 - 1.0 |
| `sad` | Sadness | 0.0 - 1.0 |
| `surprised` | Surprise/shock | 0.0 - 1.0 |
| `blink` | Both eyes blink | 0.0 - 1.0 |
| `blinkLeft` | Left eye blink | 0.0 - 1.0 |
| `blinkRight` | Right eye blink | 0.0 - 1.0 |
| `lookUp` | Look upward | 0.0 - 1.0 |
| `lookDown` | Look downward | 0.0 - 1.0 |
| `lookLeft` | Look left | 0.0 - 1.0 |
| `lookRight` | Look right | 0.0 - 1.0 |

### Expression Combinations

```tsx
// Complex emotional states
const showWorried = () => {
  setExpression('sad', 0.3);
  setExpression('surprised', 0.4);
  pulse('blinkLeft', 1.0, 200);
};

const showExcited = () => {
  setExpression('happy', 0.9);
  setExpression('surprised', 0.6);
  animate('happy_bounce');
};
```

## Lip Sync & Visemes

### Automatic Lip Sync

When using `speak()`, visemes are automatically generated:

```tsx
const { speak } = useVoice();

// Automatic lip-sync
await speak({ 
  text: "Hello, how are you today?",
  voice: "ja-JP-NanamiNeural" 
});
```

### Manual Viseme Control

```tsx
const { setViseme } = useAnimation();

// Manually control mouth shapes
setViseme('aa', 0.8);  // Open mouth for "ah" sound
setViseme('oh', 0.6);  // Rounded mouth for "oh" sound
setViseme('ss', 0.4);  // Narrow mouth for "s" sound
```

### Viseme Reference

| Viseme | Mouth Shape | Sounds |
|--------|-------------|---------|
| `aa` | Open | A, E sounds |
| `ih` | Slightly open | I sound |
| `ou` | Rounded | O, U sounds |
| `ee` | Wide | E sound |
| `oh` | Open rounded | O sound |
| `PP` | Closed | P, B, M sounds |
| `FF` | Teeth on lip | F, V sounds |
| `TH` | Tongue visible | TH sounds |
| `SS` | Narrow opening | S, Z sounds |
| `RR` | Slightly rounded | R sound |
| `CH` | Narrow, forward | SH, CH sounds |
| `kk` | Neutral | Silent, K, G |

## Performance Optimization

### Efficient Animation Loading

```tsx
// Preload important animations
useEffect(() => {
  const preloadAnimations = async () => {
    const criticalAnims = ['idle', 'wave_small', 'thinking'];
    
    for (const animName of criticalAnims) {
      const animInfo = ANIM_REGISTRY[animName];
      if (animInfo.fbxPath) {
        await useFBX.preload(animInfo.fbxPath);
      }
    }
  };
  
  preloadAnimations();
}, []);
```

### Animation Pooling

```tsx
// Reuse animation instances
const animationPool = new Map();

const getAnimation = (name: string) => {
  if (!animationPool.has(name)) {
    const clip = createAnimationClip(name);
    animationPool.set(name, clip);
  }
  return animationPool.get(name);
};
```

### Throttled Updates

```tsx
// Throttle expression updates
const throttledSetExpression = useMemo(
  () => throttle(setExpression, 16), // 60fps max
  [setExpression]
);
```

## Debugging Animations

### Animation Debug Panel

```tsx
function AnimationDebugPanel() {
  const { animate, currentAnimation } = useAnimation();
  const [filter, setFilter] = useState('');
  
  const filteredAnimations = Object.entries(ANIM_REGISTRY)
    .filter(([name, info]) => 
      name.includes(filter) || 
      info.tags.some(tag => tag.includes(filter))
    );
  
  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded shadow-lg max-w-sm">
      <h3 className="font-bold mb-2">Animation Debug</h3>
      
      <input
        type="text"
        placeholder="Filter animations..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      
      <p className="text-sm text-gray-600 mb-2">
        Current: {currentAnimation || 'None'}
      </p>
      
      <div className="max-h-60 overflow-y-auto space-y-1">
        {filteredAnimations.map(([name, info]) => (
          <button
            key={name}
            onClick={() => animate(name)}
            className="w-full text-left p-2 text-xs rounded bg-gray-100 hover:bg-blue-100"
            title={info.description}
          >
            <div className="font-medium">{name}</div>
            <div className="text-gray-500 text-xs">
              {info.tags.join(', ')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Console Logging

```tsx
// Log animation state changes
const { currentAnimation } = useAnimation();

useEffect(() => {
  if (currentAnimation) {
    console.log(`🎭 Animation started: ${currentAnimation}`);
    const info = ANIM_REGISTRY[currentAnimation];
    console.log(`   Description: ${info?.description}`);
    console.log(`   Tags: ${info?.tags.join(', ')}`);
  }
}, [currentAnimation]);
```

## Best Practices

### 1. Organize by Categories

Group animations logically in your registry:

```typescript
export const ANIM_REGISTRY: AnimationRegistry = {
  // Idle states
  idle: { /* ... */ },
  idle_bored: { /* ... */ },
  
  // Greetings  
  wave_small: { /* ... */ },
  wave_big: { /* ... */ },
  bow: { /* ... */ },
  
  // Emotions
  happy_bounce: { /* ... */ },
  sad_slump: { /* ... */ },
  
  // Actions
  point_forward: { /* ... */ },
  clap: { /* ... */ }
};
```

### 2. Use Descriptive Names

```typescript
// ❌ Poor naming
anim1: { name: "anim1", ... }
move: { name: "move", ... }

// ✅ Good naming  
excited_celebration: { name: "excited_celebration", ... }
polite_bow_greeting: { name: "polite_bow_greeting", ... }
```

### 3. Comprehensive Tags

```typescript
// ❌ Minimal tags
dance: { tags: ["dance"] }

// ✅ Comprehensive tags
dance: { 
  tags: ["dance", "energetic", "party", "celebration", "music", "fun", "movement"] 
}
```

### 4. Test with LLM

Regularly test how well the LLM selects animations:

```typescript
// Test prompts
const testPrompts = [
  "Hello there!",           // Should trigger greeting
  "I'm so happy!",          // Should trigger happy animation
  "Let me think...",        // Should trigger thinking
  "Do you agree?",          // Should trigger nod_yes
  "Let's celebrate!",       // Should trigger celebration/dance
];
```

### 5. Fallback Animations

Always have fallback animations for common scenarios:

```typescript
// Ensure you have these basics
const requiredAnimations = [
  'idle',           // Default state
  'wave_small',     // Basic greeting
  'thinking',       // Considering response
  'nod_yes',        // Agreement
  'shake_no',       // Disagreement
  'happy',          // Positive emotion
  'confused'        // When uncertain
];
```