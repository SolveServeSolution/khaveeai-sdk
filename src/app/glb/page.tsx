"use client";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { GLBAvatar, KhaveeProvider, useAnimations } from "@khaveeai/react";

function AnimationControls() {
  const { animate, currentAnimation, availableAnimations } = useAnimations();

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        zIndex: 10,
        background: "rgba(0,0,0,0.8)",
        padding: "20px",
        borderRadius: "10px",
        color: "white",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "250px",
      }}
    >
      <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
        GLB Model Animations
      </h2>
      <p style={{ margin: "0 0 15px 0", fontSize: "12px", opacity: 0.7 }}>
        Current: <strong>{currentAnimation || "None"}</strong>
      </p>
      
      {availableAnimations.length > 0 ? (
        <>
          <p style={{ margin: "0 0 10px 0", fontSize: "11px", opacity: 0.6 }}>
            Available Animations ({availableAnimations.length}):
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {availableAnimations.map((animName, index) => (
              <button
                key={animName}
                onClick={() => animate(animName)}
                style={{
                  padding: "10px 15px",
                  background: currentAnimation === animName ? "#4CAF50" : "#2196F3",
                  border: "none",
                  borderRadius: "5px",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: currentAnimation === animName ? "bold" : "normal",
                  transition: "all 0.2s ease",
                }}
              >
                {currentAnimation === animName ? "▶ " : ""}{animName}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p style={{ fontSize: "12px", opacity: 0.5 }}>
          Loading animations...
        </p>
      )}
      
      <p style={{ margin: "15px 0 0 0", fontSize: "11px", opacity: 0.5 }}>
        GLB file contains model + animations
      </p>
    </div>
  );
}

export default function GLBPage() {
  return (
    <KhaveeProvider>
      <div style={{ width: "100%", height: "100vh", position: "relative" }}>
        <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />

          {/* GLB model with embedded animations */}
          <GLBAvatar
            src="/models/tiger.glb"
            autoPlayAnimation={0} // Auto-play first animation
            position={[0, 0, 0]}
            scale={[1, 1, 1]}
          />

          <OrbitControls
            target={[0, 0.5, 0]}
            enablePan={true}
            minDistance={2}
            maxDistance={10}
          />
        </Canvas>

        <AnimationControls />
      </div>
    </KhaveeProvider>
  );
}
