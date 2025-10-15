/**
 * Type definitions for the VRM Animation System
 * 
 * Import these types when using TypeScript for better type safety
 */

import * as THREE from "three";

/**
 * Animation Registry
 * 
 * A map of animation names to THREE.AnimationClip objects.
 * The key is the name you'll use with animate() function.
 * 
 * @example
 * ```tsx
 * const animations: AnimationRegistry = {
 *   idle: idleClip,
 *   walk: walkClip,
 *   run: runClip,
 * };
 * ```
 */
export interface AnimationRegistry {
  [name: string]: THREE.AnimationClip;
}

/**
 * VRM Animations Hook Return Type
 * 
 * Returned by useVRMAnimations() hook
 */
export interface VRMAnimationsControl {
  /**
   * The name of the currently playing animation
   * null if no animation is playing
   */
  currentAnimation: string | null;
  
  /**
   * Play an animation from the registry
   * 
   * @param name - The name of the animation (must exist in your AnimationRegistry)
   * 
   * @example
   * ```tsx
   * animate('walk');  // Plays the 'walk' animation
   * animate('idle');  // Switches to 'idle' animation
   * ```
   */
  animate: (name: string) => void;
  
  /**
   * Stop the currently playing animation
   * 
   * @example
   * ```tsx
   * stopAnimation();  // Stops all animations
   * ```
   */
  stopAnimation: () => void;
  
  /**
   * List of all available animation names from the registry
   * Useful for building UI or debugging
   */
  availableAnimations: string[];
}

/**
 * VRM Avatar Component Props
 */
export interface VRMAvatarProps {
  /**
   * Path or URL to the VRM model file
   */
  src: string;
  
  /**
   * Optional animation registry
   * If an 'idle' animation is provided, it will play automatically on load
   */
  animations?: AnimationRegistry;
  
  /**
   * Position in 3D space [x, y, z]
   * @default [0, 0, 0]
   */
  position?: [number, number, number];
  
  /**
   * Rotation in radians [x, y, z]
   * @default [0, Math.PI, 0]
   */
  rotation?: [number, number, number];
  
  /**
   * Scale [x, y, z]
   * @default [1, 1, 1]
   */
  scale?: [number, number, number];
  
  [key: string]: any;
}

/**
 * Example usage with full type safety
 * 
 * ```tsx
 * import { AnimationRegistry, VRMAvatarProps } from "@khaveeai/react";
 * import { useFBX } from "@react-three/drei";
 * import { useMemo } from "react";
 * 
 * function MyCharacter() {
 *   const idle = useFBX("/animations/idle.fbx");
 *   const walk = useFBX("/animations/walk.fbx");
 *   
 *   const animations: AnimationRegistry = useMemo(() => ({
 *     idle: idle.animations[0],
 *     walk: walk.animations[0],
 *   }), [idle, walk]);
 *   
 *   const props: VRMAvatarProps = {
 *     src: "/models/character.vrm",
 *     animations,
 *     position: [0, 0, 0],
 *   };
 *   
 *   return <VRMAvatar {...props} />;
 * }
 * 
 * function Controls() {
 *   const { animate, currentAnimation }: VRMAnimationsControl = useVRMAnimations();
 *   
 *   return (
 *     <button onClick={() => animate('walk')}>
 *       Current: {currentAnimation}
 *     </button>
 *   );
 * }
 * ```
 */
