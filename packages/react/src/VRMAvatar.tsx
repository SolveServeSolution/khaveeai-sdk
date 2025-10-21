import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useFBX, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { lerp } from "three/src/math/MathUtils.js";
import { useKhavee } from "./KhaveeProvider";
import { remapMixamoAnimationToVrm } from "./utils/remapMixamoAnimationToVrm";

interface VRMAvatarProps {
  src: string; // URL or path to the VRM model
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  animations?: AnimationConfig; // User's animation configuration (just URLs!)
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
  ...props
}: VRMAvatarProps) {
  const { setVrm, expressions, currentAnimation } = useKhavee();
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const expressionTargetsRef = useRef<Record<string, number>>({});

  const { scene, userData } = useGLTF(src, undefined, undefined, (loader) => {
    // @ts-ignore - VRM loader type compatibility issue
    loader.register((parser: any) => {
      return new VRMLoaderPlugin(parser);
    });
  });

  const currentVrm: VRM = userData.vrm;

  // SDK automatically loads FBX files from URLs!
  const loadedFBXAnimations = useFBXAnimations(animations);

  // Process and remap animations automatically - SDK handles EVERYTHING!
  const processedClips = useMemo(() => {
    if (
      !animations ||
      !currentVrm ||
      Object.keys(loadedFBXAnimations).length === 0
    ) {
      console.log("[VRM Animation] Waiting for animations or VRM to load...");
      return [];
    }

    const clips: THREE.AnimationClip[] = [];

    Object.entries(loadedFBXAnimations).forEach(([name, fbxGroup]) => {
      try {
        // Automatically remap Mixamo animation to VRM format
        // @ts-ignore - VRM type compatibility with remap function
        const remappedClip = remapMixamoAnimationToVrm(currentVrm, fbxGroup);
        remappedClip.name = name;
        clips.push(remappedClip);
      } catch (error) {
        console.error(
          `[VRM Animation] ❌ Failed to load/remap ${name}:`,
          error
        );
      }
    });

    return clips;
  }, [loadedFBXAnimations, currentVrm]);

  // Initialize animation mixer and maintain animation state
  useEffect(() => {
    if (currentVrm?.scene && !mixerRef.current) {
      mixerRef.current = new THREE.AnimationMixer(currentVrm.scene);

      // Add clips to mixer when they're available
      if (processedClips.length > 0) {
        processedClips.forEach((clip) => {
          if (clip) {
            mixerRef.current?.clipAction(clip);
          }
        });
      }
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
        currentActionRef.current = null;
      }
    };
  }, [currentVrm]);

  // Add processed clips to existing mixer when they become available
  useEffect(() => {
    if (mixerRef.current && processedClips.length > 0) {
      processedClips.forEach((clip) => {
        if (clip) {
          // Only add if not already added
          try {
            mixerRef.current?.clipAction(clip);
          } catch (error) {
            // Clip might already be added, ignore error
          }
        }
      });
    }
  }, [processedClips]);

  // Handle animation switching with proper crossfading
  useEffect(() => {
    if (!mixerRef.current || !currentAnimation) {
      // Stop current animation
      if (currentActionRef.current) {
        currentActionRef.current.fadeOut(0.3);
        currentActionRef.current = null;
      }
      return;
    }

    const targetClip = processedClips.find(
      (clip) => clip?.name === currentAnimation
    );

    if (targetClip && mixerRef.current) {
      const newAction = mixerRef.current.clipAction(targetClip);

      // Only restart if this is actually a different animation
      if (currentActionRef.current !== newAction) {
        // Fade out current animation if it exists
        if (currentActionRef.current) {
          currentActionRef.current.fadeOut(0.3);
        }
        // Fade in new animation
        newAction.reset().fadeIn(0.3).play();
        currentActionRef.current = newAction;
      } else if (!currentActionRef.current) {
        // Start new animation without fade (first time)
        newAction.reset().play();
        currentActionRef.current = newAction;
      }
    }
  }, [currentAnimation]);

  useEffect(() => {
    if (!currentVrm) return;

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

  const lerpExpression = (name: string, value: number, lerpFactor: number) => {
    if (!currentVrm?.expressionManager) return;

    const currentValue = currentVrm.expressionManager.getValue(name);
    if (currentValue !== null) {
      const targetValue = lerp(currentValue, value, lerpFactor);

      // Store target for reference
      expressionTargetsRef.current[name] = value;

      // Apply expression without disrupting animations
      currentVrm.expressionManager.setValue(name, targetValue);
    }
  };

  useFrame((_, delta) => {
    if (!currentVrm?.expressionManager) return;

    // Update animation mixer first (if exists)
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Apply expressions from the hook with smooth lerping
    Object.entries(expressions).forEach(([name, value]) => {
      if (typeof value === "number") {
        lerpExpression(name, value, delta * 8);
      }
    });

    // Update VRM after all changes (expressions + animations)
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
    setMultipleExpressions,
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
  const { currentAnimation, animate, stopAnimation, availableAnimations } =
    useKhavee();

  return {
    currentAnimation,
    animate,
    stopAnimation,
    availableAnimations,
  };
}
