import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { lerp } from "three/src/math/MathUtils.js";
import React, { useEffect, useMemo } from "react";
import { remapMixamoAnimationToVrm } from "../utils/remapMixamoAnimationToVrm";

interface VRMAvatarProps {
  avatar: string; // URL or path to the VRM model
  [key: string]: any; // Other props
}

export default function VRMAvatar({ avatar, ...props }: VRMAvatarProps) {
  const { scene, userData } = useGLTF(
    `models/${avatar}`,
    undefined,
    undefined,
    (loader) => {
      loader.register((parser) => {
        return new VRMLoaderPlugin(parser);
      });
    }
  );

  const assetA = useFBX("models/animations/Swing Dancing.fbx");
  const assetB = useFBX("models/animations/Thriller Part 2.fbx");
  const assetC = useFBX("models/animations/Breathing Idle.fbx");
  const assetD = useFBX("models/animations/Fist Fight B.fbx");

  const currentVrm = userData.vrm;

  const animationClipA = useMemo(() => {
    const clip = remapMixamoAnimationToVrm(currentVrm, assetA);
    clip.name = "Swing Dancing";
    return clip;
  }, [assetA, currentVrm]);

  const animationClipB = useMemo(() => {
    const clip = remapMixamoAnimationToVrm(currentVrm, assetB);
    clip.name = "Thriller Part 2";
    return clip;
  }, [assetB, currentVrm]);

  const animationClipC = useMemo(() => {
    const clip = remapMixamoAnimationToVrm(currentVrm, assetC);
    clip.name = "Idle";
    return clip;
  }, [assetC, currentVrm]);

  const animationClipD = useMemo(() => {
    const clip = remapMixamoAnimationToVrm(currentVrm, assetD);
    clip.name = "Fist Fight B";
    return clip;
  }, [assetD, currentVrm]);

  const { actions } = useAnimations(
    [animationClipA, animationClipB, animationClipC, animationClipD],
    currentVrm.scene
  );

  useEffect(() => {
    const vrm = userData.vrm;
    console.log("VRM loaded:", vrm);
    // calling these functions greatly improves the performance
    VRMUtils.removeUnnecessaryVertices(scene);
    VRMUtils.combineSkeletons(scene);
    VRMUtils.combineMorphs(vrm);

    // Disable frustum culling
    vrm.scene.traverse((obj: { frustumCulled: boolean; }) => {
      obj.frustumCulled = false;
    });
  }, [scene]);

  const {
    aa,
    ih,
    ee,
    oh,
    ou,
    blinkLeft,
    blinkRight,
    angry,
    sad,
    happy,
    animation,
  } = useControls("VRM", {
    aa: { value: 0, min: 0, max: 1 },
    ih: { value: 0, min: 0, max: 1 },
    ee: { value: 0, min: 0, max: 1 },
    oh: { value: 0, min: 0, max: 1 },
    ou: { value: 0, min: 0, max: 1 },
    blinkLeft: { value: 0, min: 0, max: 1 },
    blinkRight: { value: 0, min: 0, max: 1 },
    angry: { value: 0, min: 0, max: 1 },
    sad: { value: 0, min: 0, max: 1 },
    happy: { value: 0, min: 0, max: 1 },
    animation: {
      options: [
        "None",
        "Idle",
        "Swing Dancing",
        "Thriller Part 2",
        "Fist Fight B",
      ],
      value: "Idle",
    },
  });

  useEffect(() => {
    if (animation === "None") {
      return;
    }
    actions[animation]?.play();
    return () => {
      actions[animation]?.stop();
    };
  }, [actions, animation]);

  const lerpExpression = (name: string, value: number, lerpFactor: number) => {
    userData.vrm.expressionManager.setValue(
      name,
      lerp(userData.vrm.expressionManager.getValue(name), value, lerpFactor)
    );
  };

  useFrame((_, delta) => {
    if (!userData.vrm) {
      return;
    }
    userData.vrm.expressionManager.setValue("angry", angry);
    userData.vrm.expressionManager.setValue("sad", sad);
    userData.vrm.expressionManager.setValue("happy", happy);

    [
      {
        name: "aa",
        value: aa,
      },
      {
        name: "ih",
        value: ih,
      },
      {
        name: "ee",
        value: ee,
      },
      {
        name: "oh",
        value: oh,
      },
      {
        name: "ou",
        value: ou,
      },
      {
        name: "blinkLeft",
        value: blinkLeft,
      },
      {
        name: "blinkRight",
        value: blinkRight,
      },
    ].forEach((item) => {
      lerpExpression(item.name, item.value, delta * 12);
    });

    userData.vrm.update(delta);
  });

  return (
    <group {...props}>
      <primitive object={scene} rotation-y={Math.PI} />
    </group>
  );
}
