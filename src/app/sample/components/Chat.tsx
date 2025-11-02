import { useRealtime } from "@khaveeai/react";
import { useState } from "react";

export default function Chat() {
  const { 
    sendMessage, 
    conversation, 
    chatStatus, 
    isConnected, 
    currentPhoneme,
    connect,
    disconnect,
    startAutoLipSync,
    stopAutoLipSync,
    currentVolume
  } = useRealtime();
  const [input, setInput] = useState("");
  return (
    <div className="bg-white h-fit rounded-xl p-10 flex flex-col space-y-2 max-w-xl w-full max-h-[80vh] overflow-y-scroll">
      <div className="flex items-center justify-between">
        <h1>Chat</h1>
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{chatStatus}</span>
          {currentPhoneme && (
            <span className="font-mono text-xs">
              [{currentPhoneme.phoneme}] {(currentPhoneme.intensity * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
      <p>{currentVolume}</p>

      {!isConnected && (
        <button
          className="bg-blue-500 text-white p-2 rounded-lg"
          onClick={connect}
        >
          Connect to Realtime API
        </button>
      )}

      {isConnected && (
        <div className="flex gap-2">
          <button
            className="bg-red-500 text-white p-2 rounded-lg text-sm"
            onClick={disconnect}
          >
            Disconnect
          </button>
          <button
            className="bg-green-500 text-white p-2 rounded-lg text-sm"
            onClick={startAutoLipSync}
          >
            Restart Lip Sync
          </button>
          <button
            className="bg-orange-500 text-white p-2 rounded-lg text-sm"
            onClick={stopAutoLipSync}
          >
            Stop Lip Sync
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {conversation.map((msg, index) => (
          <div key={index} className="p-2">
            {msg.text}
          </div>
        ))}
      </div>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border border-slate-400 p-2 rounded-lg"
      />
      <button
        className="bg-slate-100 p-2 rounded-lg disabled:opacity-50"
        onClick={() => {
          sendMessage(input);
          setInput("");
        }}
        disabled={!isConnected || chatStatus === "thinking"}
      >
        Send
      </button>
    </div>
  );
}
