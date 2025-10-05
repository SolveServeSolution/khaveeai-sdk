
export const ANIM_REGISTRY = {
  // Idle/Basic animations
  idle: {
    name: "idle",
    description: "Default idle breathing animation",
    tags: ["idle", "breathing", "neutral"],
    fbxPath: "/models/animations/Breathing Idle.fbx"
  },
  
  // Dance animations  
  swing_dance: {
    name: "swing_dance",
    description: "Energetic swing dancing movement",
    tags: ["dance", "energetic", "happy", "celebration"],
    fbxPath: "/models/animations/Swing Dancing.fbx"
  },
  
  thriller_dance: {
    name: "thriller_dance", 
    description: "Classic thriller dance moves",
    tags: ["dance", "dramatic", "performance", "halloween"],
    fbxPath: "/models/animations/Thriller Part 2.fbx"
  },

  // Combat/Action animations
  punch: {
    name: "punch",
    description: "Fighting punching motion",
    tags: ["action", "combat", "aggressive", "fight"],
    fbxPath: "/models/animations/Fist Fight B.fbx"
  },

  // Greeting animations
  wave_small: {
    name: "wave_small",
    description: "Small friendly wave gesture",
    tags: ["greeting", "friendly", "wave", "hello"]
    
  },

  nod_yes: {
    name: "nod_yes", 
    description: "Nodding head to indicate agreement",
    tags: ["agreement", "yes", "approval", "nod"]
  },

  shake_no: {
    name: "shake_no",
    description: "Shaking head to indicate disagreement", 
    tags: ["disagreement", "no", "denial", "shake"]
  },

  // Emotional expressions
  smile_soft: {
    name: "smile_soft",
    description: "Gentle, soft smile expression",
    tags: ["happy", "gentle", "smile", "pleasant"]
  },

  laugh: {
    name: "laugh",
    description: "Laughing animation with body movement",
    tags: ["happy", "laugh", "joy", "amusement"]
  },

  sad: {
    name: "sad", 
    description: "Sad, downcast expression and posture",
    tags: ["sad", "melancholy", "down", "disappointed"]
  },

  surprised: {
    name: "surprised",
    description: "Surprised reaction with raised eyebrows",
    tags: ["surprised", "shock", "amazement", "unexpected"]
  },

  thinking: {
    name: "thinking",
    description: "Thoughtful pose with hand to chin", 
    tags: ["thinking", "contemplation", "pondering", "consideration"]
  }
};

// Helper function to get animation by tags
export function getAnimationsByTag(tag: string): string[] {
  return Object.entries(ANIM_REGISTRY)
    .filter(([_, info]) => info.tags.includes(tag))
    .map(([name, _]) => name);
}

// Helper function to get random animation by emotion
export function getRandomAnimationByEmotion(emotion: string): string | null {
  const animations = getAnimationsByTag(emotion);
  if (animations.length === 0) return null;
  return animations[Math.floor(Math.random() * animations.length)];
}