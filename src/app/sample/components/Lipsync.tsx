import { useAudioLipSync } from "@khaveeai/react";

export default function LipSync() {
  const { analyzeLipSync, stopLipSync } = useAudioLipSync();
  return (
    <div className="bg-white rounded-xl p-10 flex flex-col space-y-2 ">
      <h1>Lipsync</h1>
      <button
        className="bg-slate-100 p-2 rounded-lg"
        onClick={() => analyzeLipSync("./audio/harvard.wav")}
      >
        Start
      </button>
      <button
        className="border border-slate-400 p-2 rounded-lg"
        onClick={stopLipSync}
      >
        Stop
      </button>
    </div>
  );
}
