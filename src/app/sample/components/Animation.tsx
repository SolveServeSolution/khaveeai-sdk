import { useVRMAnimations } from "@khaveeai/react";
import React from "react";

export default function Animation() {
  const { animate, stopAnimation } = useVRMAnimations();
  return (
    <div className="bg-white rounded-xl p-10 flex flex-col space-y-2 ">
      <h1>Animations</h1>
      <button
        className="bg-slate-100 p-2 rounded-lg"
        onClick={() => animate("idle")}
      >
        Idle
      </button>
      <button
        className="bg-slate-100 p-2 rounded-lg"
        onClick={() => animate("fight")}
      >
        Fight
      </button>
        <button
        className="border border-slate-400 p-2 rounded-lg"
        onClick={stopAnimation}
      >
        Reset
      </button>
    </div>
  );
}
