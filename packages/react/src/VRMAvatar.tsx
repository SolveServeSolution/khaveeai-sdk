import { VRMLoaderPlugin, VRMUtils, VRM } from "@pixiv/three-vrm";
import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { lerp } from "three/src/math/MathUtils.js";
import * as THREE from "three";
import React, { useEffect, useMemo, useState } from "react";
import { useAnimation } from "./hooks";
import { remapMixamoAnimationToVrm } from "./utils/remapMixamoAnimationToVrm";

interface VRMAvatarProps {
  src: string; // URL or path to the VRM model
  autoplayIdle?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  [key: string]: any; // Other props
}

export function VRMAvatar({ 
  src, 
  autoplayIdle = true,
  position = [0, 0, 0],
  rotation = [0, Math.PI, 0],
  scale = [1, 1, 1],
  ...props 
}: VRMAvatarProps) {
  const { visemes, expressions, currentAnimation, animationExpressions } = useAnimation();
  const [currentAnimationName, setCurrentAnimationName] = useState<string>("Idle");
  
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

  // Load FBX animations from the animation registry
  const swingDancing = useFBX("/models/animations/Swing Dancing.fbx");
  const thriller = useFBX("/models/animations/Thriller Part 2.fbx");
  const breathingIdle = useFBX("/models/animations/Breathing Idle.fbx");
  const fistFight = useFBX("/models/animations/Fist Fight B.fbx");

  // Create animation clips
  const idleClip = useMemo(() => {
    if (!currentVrm || !breathingIdle) return null;
    const clip = remapMixamoAnimationToVrm(currentVrm, breathingIdle);
    clip.name = "Idle"; // Match your working example
    return clip;
  }, [breathingIdle, currentVrm]);

  const swingDanceClip = useMemo(() => {
    if (!currentVrm || !swingDancing) return null;
    const clip = remapMixamoAnimationToVrm(currentVrm, swingDancing);
    clip.name = "Swing Dancing"; // Match your working example
    return clip;
  }, [swingDancing, currentVrm]);

  const thrillerClip = useMemo(() => {
    if (!currentVrm || !thriller) return null;
    const clip = remapMixamoAnimationToVrm(currentVrm, thriller);
    clip.name = "Thriller Part 2"; // Match your working example
    return clip;
  }, [thriller, currentVrm]);

  const punchClip = useMemo(() => {
    if (!currentVrm || !fistFight) return null;
    const clip = remapMixamoAnimationToVrm(currentVrm, fistFight);
    clip.name = "Fist Fight B"; // Match your working example
    return clip;
  }, [fistFight, currentVrm]);

  // Set up animations
  const animationClips = [idleClip, swingDanceClip, thrillerClip, punchClip].filter((clip): clip is THREE.AnimationClip => clip !== null);
  const { actions } = useAnimations(animationClips, currentVrm?.scene);

  useEffect(() => {
    if (!currentVrm) return;
    
    console.log("VRM loaded:", currentVrm);
    
    // Performance optimizations
    VRMUtils.removeUnnecessaryVertices(scene);
    VRMUtils.combineSkeletons(scene);
    VRMUtils.combineMorphs(currentVrm);

    // Disable frustum culling
    currentVrm.scene.traverse((obj: any) => {
      obj.frustumCulled = false;
    });
  }, [scene, currentVrm]);

  // Handle animation changes from the hook
  useEffect(() => {
    // Map SDK animation names to clip names
    const animationNameMap: Record<string, string> = {
      "idle": "Idle",
      "swing_dance": "Swing Dancing",
      "thriller_dance": "Thriller Part 2",
      "punch": "Fist Fight B"
    };
    
    const mappedName = currentAnimation ? animationNameMap[currentAnimation] || "Idle" : "Idle";
    setCurrentAnimationName(mappedName);
  }, [currentAnimation]);

  // Play animations
  useEffect(() => {
    if (!actions || !currentAnimationName) return;

    console.log(`🎭 Playing animation: ${currentAnimationName}`);
    console.log("Available actions:", Object.keys(actions));

    // Stop all current animations
    Object.values(actions).forEach((action: any) => {
      action?.stop();
    });

    // Play the requested animation
    const action = actions[currentAnimationName];
    if (action) {
      action.play();
      console.log(`✅ Started animation: ${currentAnimationName}`);
    } else {
      console.warn(`⚠️  Animation '${currentAnimationName}' not found. Available:`, Object.keys(actions));
      // Fallback to idle if available
      if (actions["idle"]) {
        actions["idle"].play();
      }
    }
  }, [actions, currentAnimationName]);

  // Start with idle animation when component mounts
  useEffect(() => {
    if (autoplayIdle && actions && actions["idle"]) {
      console.log("🔄 Auto-starting idle animation");
      actions["idle"].play();
    }
  }, [actions, autoplayIdle]);

  const lerpExpression = (name: string, value: number, lerpFactor: number) => {
    if (!currentVrm?.expressionManager) return;
    const currentValue = currentVrm.expressionManager.getValue(name);
    if (currentValue !== null) {
      currentVrm.expressionManager.setValue(
        name,
        lerp(currentValue, value, lerpFactor)
      );
    }
  };

  useFrame((_, delta) => {
    if (!currentVrm) return;

    // Apply animation-based expressions (like your working example)
    if (animationExpressions && currentVrm?.expressionManager) {
      Object.entries(animationExpressions).forEach(([name, value]) => {
        if (typeof value === 'number') {
          currentVrm.expressionManager!.setValue(name, value);
        }
      });
    }

    // Apply manual expressions (override animation expressions)
    if (expressions && currentVrm?.expressionManager) {
      Object.entries(expressions).forEach(([name, value]) => {
        if (typeof value === 'number') {
          currentVrm.expressionManager!.setValue(name, value);
        }
      });
    }

    // Apply visemes (lip-sync) with lerping
    if (visemes) {
      Object.entries(visemes).forEach(([name, value]) => {
        if (typeof value === 'number') {
          lerpExpression(name, value, delta * 12);
        }
      });
    }

    currentVrm.update(delta);
  });

  return (
    <group position={position} rotation={rotation} scale={scale} {...props}>
      <primitive object={scene} />
    </group>
  );
}