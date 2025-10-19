import { VRMLoaderPlugin, VRMUtils, VRM } from "@pixiv/three-vrm";
import { useGLTF, useAnimations, useFBX } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { lerp } from "three/src/math/MathUtils.js";
import * as THREE from "three";
import React, { useEffect, useMemo } from "react";
import { remapMixamoAnimationToVrm } from "./utils/remapMixamoAnimationToVrm";
import { useKhavee } from "./KhaveeProvider";

interface VRMAvatarProps {
  src: string; // URL or path to the VRM model
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  animations?: AnimationConfig; // User's animation configuration (just URLs!)
  enableLipSync?: boolean; // Enable lip sync from realtime provider
  mouthState?: {
    aa: number;
    i: number;
    u: number;
    e: number;
    o: number;
  }; // Mouth state from realtime lip sync
  [key: string]: any; // Other props
}

/**
 * AnimationConfig - Simple animation configuration using URLs
 * 
 * Just provide URLs to your FBX animation files. The SDK automatically:
 * - Loads the FBX files
 * - Remaps Mixamo bone names to VRM bone names
 * - Creates AnimationClips
 * - Auto-plays the "idle" animation if present
 * 
 * @example
 * ```tsx
 * const animations: AnimationConfig = {
 *   idle: '/animations/idle.fbx',      // Auto-plays on load
 *   walk: '/animations/walk.fbx',
 *   dance: '/animations/dance.fbx',
 * };
 * 
 * <VRMAvatar src="/model.vrm" animations={animations} />
 * ```
 */
export interface AnimationConfig {
  [name: string]: string; // Just the URL to the FBX file! SDK handles loading & remapping
}

// OLD: AnimationRegistry - kept for backwards compatibility
export interface AnimationRegistry {
  [name: string]: string | THREE.AnimationClip;
}

// Internal component to load FBX files
function useFBXAnimations(animationUrls: AnimationConfig | undefined) {
  const loadedAnimations: Record<string, THREE.Group> = {};
  
  if (animationUrls) {
    Object.entries(animationUrls).forEach(([name, url]) => {
      // Hook rules are satisfied - we're calling this consistently
      // eslint-disable-next-line react-hooks/rules-of-hooks
      loadedAnimations[name] = useFBX(url);
    });
  }
  
  return loadedAnimations;
}

/**
 * VRMAvatar - Render a VRM character with animations and expressions
 * 
 * This component handles everything needed to display and animate a VRM model:
 * - Loads and renders the VRM model
 * - Automatically loads and remaps animations from URLs
 * - Manages expression blending with smooth transitions
 * - Auto-plays "idle" animation if provided
 * - Updates VRM model every frame
 * 
 * **IMPORTANT:** Must be used inside a React Three Fiber `<Canvas>` component
 * and within a `<KhaveeProvider>`.
 * 
 * @param src - URL or path to the VRM model file (.vrm)
 * @param position - Position in 3D space [x, y, z]. Default: [0, 0, 0]
 * @param rotation - Rotation in radians [x, y, z]. Default: [0, Math.PI, 0]
 * @param scale - Scale [x, y, z]. Default: [1, 1, 1]
 * @param animations - Optional animation configuration using URLs to FBX files
 * 
 * @example
 * // Basic usage
 * ```tsx
 * import { KhaveeProvider, VRMAvatar } from '@khaveeai/react';
 * import { Canvas } from '@react-three/fiber';
 * 
 * function App() {
 *   return (
 *     <KhaveeProvider>
 *       <Canvas>
 *         <VRMAvatar src="/models/character.vrm" />
 *       </Canvas>
 *     </KhaveeProvider>
 *   );
 * }
 * ```
 * 
 * @example
 * // With animations
 * ```tsx
 * function Character() {
 *   const animations = {
 *     idle: '/animations/idle.fbx',
 *     walk: '/animations/walk.fbx',
 *     dance: '/animations/dance.fbx',
 *   };
 *   
 *   return (
 *     <VRMAvatar
 *       src="/models/character.vrm"
 *       animations={animations}
 *       position={[0, -1, 0]}
 *       scale={[1.5, 1.5, 1.5]}
 *     />
 *   );
 * }
 * ```
 * 
 * @example
 * // Control animations from outside
 * ```tsx
 * import { useVRMAnimations } from '@khaveeai/react';
 * 
 * function Controls() {
 *   const { animate } = useVRMAnimations();
 *   
 *   return (
 *     <button onClick={() => animate('dance')}>
 *       Dance!
 *     </button>
 *   );
 * }
 * 
 * function App() {
 *   const animations = {
 *     idle: '/animations/idle.fbx',
 *     dance: '/animations/dance.fbx',
 *   };
 *   
 *   return (
 *     <KhaveeProvider>
 *       <Canvas>
 *         <VRMAvatar src="/model.vrm" animations={animations} />
 *       </Canvas>
 *       <Controls />
 *     </KhaveeProvider>
 *   );
 * }
 * ```
 */
export function VRMAvatar({ 
  src, 
  position = [0, 0, 0],
  rotation = [0, Math.PI, 0],
  scale = [1, 1, 1],
  animations,
  enableLipSync = false,
  mouthState,
  ...props 
}: VRMAvatarProps) {
  const { setVrm, expressions, currentAnimation } = useKhavee();
  
  const { scene, userData } = useGLTF(
    src,
    undefined,
    undefined,
    (loader) => {
      // @ts-ignore - VRM loader type compatibility issue
      loader.register((parser: any) => {
        return new VRMLoaderPlugin(parser);
      });
    }
  );

  const currentVrm: VRM = userData.vrm;

  // SDK automatically loads FBX files from URLs!
  const loadedFBXAnimations = useFBXAnimations(animations);

  // Process and remap animations automatically - SDK handles EVERYTHING!
  const processedClips = useMemo(() => {
    if (!animations || !currentVrm || Object.keys(loadedFBXAnimations).length === 0) {
      console.log('[VRM Animation] Waiting for animations or VRM to load...');
      return [];
    }
    
    console.log('[VRM Animation] 🚀 Auto-loading and remapping Mixamo animations to VRM format');
    const clips: THREE.AnimationClip[] = [];
    
    Object.entries(loadedFBXAnimations).forEach(([name, fbxGroup]) => {
      try {
        console.log(`[VRM Animation] 📦 Loading & remapping: ${name}`);
        
        // Automatically remap Mixamo animation to VRM format
        // @ts-ignore - VRM type compatibility with remap function
        const remappedClip = remapMixamoAnimationToVrm(currentVrm, fbxGroup);
        remappedClip.name = name;
        clips.push(remappedClip);
        
        console.log(`[VRM Animation] ✅ ${name} ready!`);
      } catch (error) {
        console.error(`[VRM Animation] ❌ Failed to load/remap ${name}:`, error);
      }
    });
    
    console.log(`[VRM Animation] 🎉 Total animations ready: ${clips.length}`);
    return clips;
  }, [loadedFBXAnimations, currentVrm]);

  const { actions, names } = useAnimations(processedClips, currentVrm?.scene);

  // Update available animations in context and auto-play idle
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;
    
    // Auto-play idle animation when animations are loaded
    if (actions['idle'] && currentAnimation === 'idle') {
      console.log('[VRM Animation] Auto-playing idle animation');
      const idleAction = actions['idle'];
      if (idleAction) {
        idleAction.reset().fadeIn(0.5).play();
      }
    }
  }, [actions]);

  useEffect(() => {
    if (!currentVrm) return;
    
    console.log("VRM loaded:", currentVrm);
    
    // Update VRM in context
    setVrm(currentVrm);
    
    // Performance optimizations
    VRMUtils.removeUnnecessaryVertices(scene);
    VRMUtils.combineSkeletons(scene);
    VRMUtils.combineMorphs(currentVrm);

    // Disable frustum culling
    currentVrm.scene.traverse((obj: any) => {
      obj.frustumCulled = false;
    });
  }, [scene, currentVrm, setVrm]);

  // Handle animation playback
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;
    if (!currentAnimation) {
      // Stop all animations if currentAnimation is null
      Object.values(actions).forEach(action => action?.stop());
      return;
    }
    
    console.log(`[VRM Animation] Playing: ${currentAnimation}`);
    
    // Stop all other animations
    Object.values(actions).forEach(action => action?.stop());
    
    // Play the requested animation
    const action = actions[currentAnimation];
    if (action) {
      action.reset().fadeIn(0.5).play();
    } else {
      console.warn(`[VRM Animation] Animation "${currentAnimation}" not found in registry`);
    }
    
    return () => {
      // Fade out when switching animations
      if (action) {
        action.fadeOut(0.5);
      }
    };
  }, [currentAnimation, actions]);

  const lerpExpression = (name: string, value: number, lerpFactor: number) => {
    if (!currentVrm?.expressionManager) return;
    
    const currentValue = currentVrm.expressionManager.getValue(name);
    if (currentValue !== null) {
      const newValue = lerp(currentValue, value, lerpFactor);
      currentVrm.expressionManager.setValue(name, newValue);
      
      // Debug log for reset operations
      if (value === 0 && currentValue > 0.1) {
        console.log(`[Reset] ${name}: ${currentValue.toFixed(3)} → ${newValue.toFixed(3)} (target: 0)`);
      }
    }
  };

  useFrame((_, delta) => {
    if (!currentVrm?.expressionManager) return;

    // Apply expressions from the hook with smooth lerping
    Object.entries(expressions).forEach(([name, value]) => {
      if (typeof value === 'number') {
        lerpExpression(name, value, delta * 8); // Smooth transition
      }
    });

    // Apply lip sync from realtime provider if enabled
    if (enableLipSync && mouthState) {
      // Map phoneme values to VRM viseme expressions
      // VRM standard visemes: aa, ih, ou, ee, oh, bmp, ff, th, dd, kk, ch, ss, nn, rr
      lerpExpression('aa', mouthState.aa, delta * 15); // Fast lip sync
      lerpExpression('ih', mouthState.i, delta * 15);  // i -> ih
      lerpExpression('ou', mouthState.u, delta * 15);  // u -> ou  
      lerpExpression('ee', mouthState.e, delta * 15);  // e -> ee
      lerpExpression('oh', mouthState.o, delta * 15);  // o -> oh
      
      console.log('Applying lip sync:', mouthState);
    }

    currentVrm.update(delta);
  });

  return (
    <group position={position} rotation={rotation} scale={scale} {...props}>
      <primitive object={scene} />
    </group>
  );
}

/**
 * useVRM - Access the loaded VRM model instance
 * 
 * Returns the current VRM model instance. Use this when you need direct access
 * to the VRM object for advanced operations.
 * 
 * @returns VRM instance or null if not yet loaded
 * @throws Error if used outside of KhaveeProvider
 * 
 * @example
 * ```tsx
 * import { useVRM } from '@khaveeai/react';
 * 
 * function VRMInfo() {
 *   const vrm = useVRM();
 *   
 *   if (!vrm) {
 *     return <div>Loading VRM...</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       <p>VRM Model: {vrm.meta?.name}</p>
 *       <p>Author: {vrm.meta?.author}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVRM() {
  const { vrm } = useKhavee();
  return vrm;
}

/**
 * useVRMExpressions - Control VRM facial expressions
 * 
 * Provides functions to control VRM expressions (facial animations) with smooth transitions.
 * All expression values are clamped between 0 and 1, and changes are smoothly interpolated.
 * 
 * @returns Object containing:
 *   - expressions: Current expression values
 *   - setExpression: Set a single expression
 *   - resetExpressions: Reset all expressions to 0
 *   - setMultipleExpressions: Set multiple expressions at once
 * 
 * @example
 * // Basic expression control
 * ```tsx
 * import { useVRMExpressions } from '@khaveeai/react';
 * 
 * function ExpressionControls() {
 *   const { setExpression, resetExpressions } = useVRMExpressions();
 *   
 *   return (
 *     <div>
 *       <button onClick={() => setExpression('happy', 1)}>
 *         😊 Happy
 *       </button>
 *       <button onClick={() => setExpression('sad', 1)}>
 *         😢 Sad
 *       </button>
 *       <button onClick={() => setExpression('angry', 1)}>
 *         😠 Angry
 *       </button>
 *       <button onClick={() => resetExpressions()}>
 *         Reset
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * // Partial expressions (intensity control)
 * ```tsx
 * function SubtleExpressions() {
 *   const { setExpression } = useVRMExpressions();
 *   
 *   return (
 *     <div>
 *       <button onClick={() => setExpression('happy', 0.3)}>
 *         Slightly Happy (30%)
 *       </button>
 *       <button onClick={() => setExpression('happy', 0.7)}>
 *         Very Happy (70%)
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * // Multiple expressions at once
 * ```tsx
 * function CombinedExpressions() {
 *   const { setMultipleExpressions } = useVRMExpressions();
 *   
 *   const setSurprisedAndHappy = () => {
 *     setMultipleExpressions({
 *       happy: 0.7,
 *       surprised: 0.5,
 *     });
 *   };
 *   
 *   return (
 *     <button onClick={setSurprisedAndHappy}>
 *       😃 Happy Surprise!
 *     </button>
 *   );
 * }
 * ```
 * 
 * @example
 * // Display current expressions
 * ```tsx
 * function ExpressionDisplay() {
 *   const { expressions } = useVRMExpressions();
 *   
 *   return (
 *     <div>
 *       <h3>Active Expressions:</h3>
 *       {Object.entries(expressions).map(([name, value]) => (
 *         <p key={name}>
 *           {name}: {(value * 100).toFixed(0)}%
 *         </p>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useVRMExpressions() {
  const { 
    expressions, 
    setExpression, 
    resetExpressions, 
    setMultipleExpressions 
  } = useKhavee();
  
  return {
    expressions,
    setExpression,
    resetExpressions,
    setMultipleExpressions,
  };
}

/**
 * useVRMAnimations - Control VRM character animations
 * 
 * Provides functions to play, stop, and manage VRM animations. Animations are smoothly
 * transitioned with fade-in/fade-out effects. The "idle" animation auto-plays when loaded.
 * 
 * @returns Object containing:
 *   - currentAnimation: Name of the currently playing animation
 *   - animate: Function to play an animation by name
 *   - stopAnimation: Function to stop all animations
 *   - availableAnimations: Array of loaded animation names
 * 
 * @example
 * // Basic animation control
 * ```tsx
 * import { useVRMAnimations } from '@khaveeai/react';
 * 
 * function AnimationControls() {
 *   const { animate, currentAnimation } = useVRMAnimations();
 *   
 *   return (
 *     <div>
 *       <p>Current: {currentAnimation}</p>
 *       <button onClick={() => animate('idle')}>
 *         🧍 Idle
 *       </button>
 *       <button onClick={() => animate('walk')}>
 *         🚶 Walk
 *       </button>
 *       <button onClick={() => animate('dance')}>
 *         💃 Dance
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * // With animation panel UI
 * ```tsx
 * function AnimationPanel() {
 *   const { animate, currentAnimation, stopAnimation } = useVRMAnimations();
 *   
 *   const animations = ['idle', 'walk', 'run', 'jump', 'dance'];
 *   
 *   return (
 *     <div className="panel">
 *       {animations.map(name => (
 *         <button
 *           key={name}
 *           onClick={() => animate(name)}
 *           className={currentAnimation === name ? 'active' : ''}
 *         >
 *           {name}
 *         </button>
 *       ))}
 *       <button onClick={stopAnimation}>Stop All</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * // Keyboard controls
 * ```tsx
 * function KeyboardControls() {
 *   const { animate } = useVRMAnimations();
 *   
 *   useEffect(() => {
 *     const handleKeyPress = (e: KeyboardEvent) => {
 *       switch(e.key) {
 *         case 'w': animate('walk'); break;
 *         case 'r': animate('run'); break;
 *         case 'd': animate('dance'); break;
 *         case ' ': animate('idle'); break;
 *       }
 *     };
 *     
 *     window.addEventListener('keydown', handleKeyPress);
 *     return () => window.removeEventListener('keydown', handleKeyPress);
 *   }, [animate]);
 *   
 *   return <div>Use W/R/D/Space to control animations</div>;
 * }
 * ```
 * 
 * @example
 * // Combined with expressions
 * ```tsx
 * function PresetActions() {
 *   const { animate } = useVRMAnimations();
 *   const { setMultipleExpressions } = useVRMExpressions();
 *   
 *   const happyDance = () => {
 *     animate('dance');
 *     setMultipleExpressions({ happy: 1, excited: 0.8 });
 *   };
 *   
 *   const sadWalk = () => {
 *     animate('walk');
 *     setMultipleExpressions({ sad: 0.7 });
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={happyDance}>😄 Happy Dance</button>
 *       <button onClick={sadWalk}>😢 Sad Walk</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVRMAnimations() {
  const { 
    currentAnimation, 
    animate, 
    stopAnimation, 
    availableAnimations 
  } = useKhavee();
  
  return {
    currentAnimation,
    animate,
    stopAnimation,
    availableAnimations,
  };
}