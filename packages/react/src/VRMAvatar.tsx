import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useFBX, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
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
  enableBlinking?: boolean; // Enable random blinking
  enableGestures?: boolean; // Enable natural body language gestures
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
 * VRMAvatar - Render a VRM character with animations, expressions, and natural arm gestures
 *
 * This component handles everything needed to display and animate a VRM model:
 * - Loads and renders the VRM model
 * - Automatically loads and remaps animations from URLs
 * - Manages expression blending with smooth transitions
 * - Auto-plays "idle" animation if provided
 * - Natural blinking with randomized timing
 * - Speech-responsive arm gestures (adds movement on top of existing animations)
 * - Updates VRM model every frame
 *
 * **GESTURE SYSTEM:** The gesture system only moves the arms when talking and does NOT
 * interfere with existing animations. It adds natural arm movements on top of whatever
 * animation is currently playing (idle, walk, dance, etc.).
 *
 * **IMPORTANT:** Must be used inside a React Three Fiber `<Canvas>` component
 * and within a `<KhaveeProvider>`.
 *
 * @param src - URL or path to the VRM model file (.vrm)
 * @param position - Position in 3D space [x, y, z]. Default: [0, 0, 0]
 * @param rotation - Rotation in radians [x, y, z]. Default: [0, Math.PI, 0]
 * @param scale - Scale [x, y, z]. Default: [1, 1, 1]
 * @param animations - Optional animation configuration using URLs to FBX files
 * @param enableBlinking - Enable natural blinking animations. Default: true
 * @param enableGestures - Enable speech-responsive arm gestures (doesn't interfere with animations). Default: true
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
 * // With animations and natural arm gestures
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
 *       enableBlinking={true}
 *       enableGestures={true}  // Adds arm movements on top of animations
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
 *         <VRMAvatar src="/model.vrm" animations={animations} enableGestures={true} />
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
  enableBlinking = true,
  enableGestures = true,
  ...props
}: VRMAvatarProps) {
  const { setVrm, expressions, currentAnimation, realtimeProvider, chatStatus } = useKhavee();
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const expressionTargetsRef = useRef<Record<string, number>>({});

  // Blinking system
  const [blinkState, setBlinkState] = useState(0);
  const nextBlinkTime = useRef(Date.now() + 2000 + Math.random() * 3000);
  const isBlinking = useRef(false);
  const blinkAnimationRef = useRef(0);

  // Enhanced gesture system for natural arm movements only
  const leftArmTarget = useRef({ rotation: 0, raise: 0, sway: 0, gesture: 0 });
  const rightArmTarget = useRef({ rotation: 0, raise: 0, sway: 0, gesture: 0 });
  const currentLeftArm = useRef({ rotation: 0, raise: 0, sway: 0, gesture: 0 });
  const currentRightArm = useRef({ rotation: 0, raise: 0, sway: 0, gesture: 0 });

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

    // Natural gesture system - ONLY arm movements when talking, doesn't interfere with animations
    if (enableGestures && currentVrm?.humanoid) {
      const time = Date.now() * 0.001; // Convert to seconds

      // Use chatStatus as the primary indicator of when AI is speaking
      const isAISpeaking = chatStatus === 'speaking';

      // Also try to get audio intensity for more natural movement
      let speechIntensity = isAISpeaking ? 0.5 : 0; // Base intensity from chat status

      // Get additional speech activity from audio analyzer if available
      if (realtimeProvider?.getAudioAnalyser && isAISpeaking) {
        const audioData = realtimeProvider.getAudioAnalyser();
        if (audioData) {
          const analyser = audioData.analyser;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);

          // Calculate average volume from audio data
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          speechIntensity = Math.max(speechIntensity, average / 255); // Use the higher of the two
        }
      }

      // Add some variation even when using chat status
      if (isAISpeaking) {
        speechIntensity = speechIntensity * (0.7 + Math.sin(time * 2) * 0.3); // Natural variation
      }

      const isSpeaking = isAISpeaking;

      if (isSpeaking) {
        // Generate natural movement targets while speaking
        const gesturePhase = time * 1.5;

        // Scale movements by actual speech intensity for realistic response
        const gestureIntensity = speechIntensity;

        // ONLY left arm natural movements - scaled by speech intensity
        leftArmTarget.current.rotation = (Math.sin(gesturePhase) * 0.2 + Math.sin(gesturePhase * 3) * 0.05) * gestureIntensity;
        leftArmTarget.current.raise = (Math.sin(gesturePhase * 2) * 0.15 + Math.sin(gesturePhase * 4) * 0.03) * gestureIntensity;
        leftArmTarget.current.sway = Math.cos(gesturePhase * 1.5) * 0.1 * gestureIntensity;
        leftArmTarget.current.gesture = (Math.sin(gesturePhase * 5) * 0.2 + 0.1) * gestureIntensity;

        // ONLY right arm natural movements (slightly different timing for variety)
        const rightGesturePhase = gesturePhase + Math.PI * 0.25;
        rightArmTarget.current.rotation = (Math.cos(rightGesturePhase) * 0.18 + Math.cos(rightGesturePhase * 3) * 0.04) * gestureIntensity;
        rightArmTarget.current.raise = (Math.cos(rightGesturePhase * 2) * 0.12 + Math.cos(rightGesturePhase * 4) * 0.02) * gestureIntensity;
        rightArmTarget.current.sway = Math.sin(rightGesturePhase * 1.5) * 0.08 * gestureIntensity;
        rightArmTarget.current.gesture = (Math.cos(rightGesturePhase * 5) * 0.15 + 0.08) * gestureIntensity;
      } else {
        // Return to neutral positions when not speaking
        const neutralSpeed = delta * 3; // Faster return to neutral

        // Arms return to neutral
        leftArmTarget.current.rotation *= (1 - neutralSpeed);
        leftArmTarget.current.raise *= (1 - neutralSpeed);
        leftArmTarget.current.sway *= (1 - neutralSpeed);
        leftArmTarget.current.gesture *= (1 - neutralSpeed);

        rightArmTarget.current.rotation *= (1 - neutralSpeed);
        rightArmTarget.current.raise *= (1 - neutralSpeed);
        rightArmTarget.current.sway *= (1 - neutralSpeed);
        rightArmTarget.current.gesture *= (1 - neutralSpeed);
      }

      // Smooth interpolation of current positions to targets
      const lerpSpeed = delta * 8; // Very responsive for speech

      // Update current left arm
      currentLeftArm.current.rotation += (leftArmTarget.current.rotation - currentLeftArm.current.rotation) * lerpSpeed;
      currentLeftArm.current.raise += (leftArmTarget.current.raise - currentLeftArm.current.raise) * lerpSpeed;
      currentLeftArm.current.sway += (leftArmTarget.current.sway - currentLeftArm.current.sway) * lerpSpeed;
      currentLeftArm.current.gesture += (leftArmTarget.current.gesture - currentLeftArm.current.gesture) * lerpSpeed;

      // Update current right arm
      currentRightArm.current.rotation += (rightArmTarget.current.rotation - currentRightArm.current.rotation) * lerpSpeed;
      currentRightArm.current.raise += (rightArmTarget.current.raise - currentRightArm.current.raise) * lerpSpeed;
      currentRightArm.current.sway += (rightArmTarget.current.sway - currentRightArm.current.sway) * lerpSpeed;
      currentRightArm.current.gesture += (rightArmTarget.current.gesture - currentRightArm.current.gesture) * lerpSpeed;

      // Apply ONLY arm movements to VRM bones - NO head or spine interference
      const humanoid = currentVrm.humanoid;

      // Apply ONLY left arm movements
      const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm');
      if (leftUpperArm) {
        // Add gesture rotation on top of existing animation rotation
        leftUpperArm.rotation.z += currentLeftArm.current.rotation;
        leftUpperArm.rotation.x += -currentLeftArm.current.raise * 0.5; // Reduced impact on animation
        leftUpperArm.rotation.y += currentLeftArm.current.sway;
      }

      const leftLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm');
      if (leftLowerArm) {
        // Add gesture to existing animation
        leftLowerArm.rotation.z += currentLeftArm.current.gesture * 0.3;
      }

      const leftHand = humanoid.getNormalizedBoneNode('leftHand');
      if (leftHand) {
        // Add gesture to existing animation
        leftHand.rotation.z += currentLeftArm.current.gesture * 0.2;
      }

      // Apply ONLY right arm movements
      const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');
      if (rightUpperArm) {
        // Add gesture rotation on top of existing animation rotation
        rightUpperArm.rotation.z += currentRightArm.current.rotation;
        rightUpperArm.rotation.x += -currentRightArm.current.raise * 0.5; // Reduced impact on animation
        rightUpperArm.rotation.y += currentRightArm.current.sway;
      }

      const rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm');
      if (rightLowerArm) {
        // Add gesture to existing animation
        rightLowerArm.rotation.z += currentRightArm.current.gesture * 0.3;
      }

      const rightHand = humanoid.getNormalizedBoneNode('rightHand');
      if (rightHand) {
        // Add gesture to existing animation
        rightHand.rotation.z += currentRightArm.current.gesture * 0.2;
      }
    }

    // Blinking system
    if (enableBlinking) {
      const time = Date.now();

      // Check if it's time to blink
      if (time > nextBlinkTime.current && !isBlinking.current) {
        isBlinking.current = true;
        blinkAnimationRef.current = 0;
        nextBlinkTime.current = time + 100 + Math.random() * 4000; // Next blink in 0-4 seconds
      }

      // Handle blink animation
      if (isBlinking.current) {
        blinkAnimationRef.current += 0.15;
        if (blinkAnimationRef.current >= 1) {
          isBlinking.current = false;
          setBlinkState(0);
        } else {
          // Create smooth blink curve using sine
          const blinkProgress = Math.sin(blinkAnimationRef.current * Math.PI);
          setBlinkState(blinkProgress);
        }
      }

      // Apply blinking to VRM expression system
      if (currentVrm.expressionManager) {
        if (
          currentVrm.expressionManager.blinkExpressionNames.includes(
            "blinkLeft"
          ) &&
          currentVrm.expressionManager.blinkExpressionNames.includes(
            "blinkRight"
          )
        ) {
          currentVrm.expressionManager.setValue("blinkLeft", blinkState);
          currentVrm.expressionManager.setValue("blinkRight", blinkState);
        }
      }
    }

    // Update VRM after all changes (expressions + animations + blinking + gestures)
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
