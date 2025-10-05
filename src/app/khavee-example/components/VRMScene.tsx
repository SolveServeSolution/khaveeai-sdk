"use client";

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { VRMAvatar } from '@khaveeai/react';

export function VRMScene() {
  return (
    <div className="w-full h-96 bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [3, 4, 5], fov: 50 }}>
        <Environment preset="studio" />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        
        <VRMAvatar
          src="/models/3859814441197244330.vrm"
          position={[0, -1, 0]}
          scale={[1, 1, 1]}
        />
        
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          minDistance={1}
          maxDistance={5}
          target={[0, 0.5, 0]}
        />
      </Canvas>
    </div>
  );
}