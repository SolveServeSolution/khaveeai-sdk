"use client";
import { useState, useRef } from "react";
import Meyda from "meyda";

interface MFCCData {
  phoneme: string;
  mfcc: number[];
  timestamp: number;
}

export default function MFCCRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<MFCCData[]>([]);
  const [currentPhoneme, setCurrentPhoneme] = useState("aa");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const meydaAnalyzerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const phonemes = ["aa", "ee", "ih", "ou", "oh", "sil"];

  // Record from microphone
  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      
      meydaAnalyzerRef.current = Meyda.createMeydaAnalyzer({
        audioContext: audioContext,
        source: source,
        bufferSize: 512,
        featureExtractors: ["mfcc"],
        callback: (features: any) => {
          if (features?.mfcc) {
            const mfccData: MFCCData = {
              phoneme: currentPhoneme,
              mfcc: features.mfcc,
              timestamp: Date.now(),
            };
            setRecordings((prev) => [...prev, mfccData]);
          }
        },
      });

      meydaAnalyzerRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Microphone access denied or not available");
    }
  };

  const stopMicRecording = () => {
    if (meydaAnalyzerRef.current) {
      meydaAnalyzerRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
  };

  // Analyze audio file
  const analyzeAudioFile = async () => {
    if (!audioFile) return;

    setIsAnalyzing(true);
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const audioUrl = URL.createObjectURL(audioFile);
    const audio = new Audio(audioUrl);
    audioElementRef.current = audio;

    const source = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    meydaAnalyzerRef.current = Meyda.createMeydaAnalyzer({
      audioContext: audioContext,
      source: source,
      bufferSize: 512,
      featureExtractors: ["mfcc"],
      callback: (features: any) => {
        if (features?.mfcc) {
          const mfccData: MFCCData = {
            phoneme: currentPhoneme,
            mfcc: features.mfcc,
            timestamp: Date.now(),
          };
          setRecordings((prev) => [...prev, mfccData]);
        }
      },
    });

    meydaAnalyzerRef.current.start();
    await audio.play();

    audio.onended = () => {
      meydaAnalyzerRef.current?.stop();
      setIsAnalyzing(false);
      URL.revokeObjectURL(audioUrl);
    };
  };

  const stopAnalyzing = () => {
    if (meydaAnalyzerRef.current) {
      meydaAnalyzerRef.current.stop();
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setIsAnalyzing(false);
  };

  // Calculate average MFCC for each phoneme
  const calculateAverages = () => {
    const grouped: Record<string, number[][]> = {};
    
    recordings.forEach((record) => {
      if (!grouped[record.phoneme]) {
        grouped[record.phoneme] = [];
      }
      grouped[record.phoneme].push(record.mfcc);
    });

    const averages: Record<string, number[]> = {};
    
    Object.entries(grouped).forEach(([phoneme, mfccArrays]) => {
      if (mfccArrays.length === 0) return;
      
      const mfccLength = mfccArrays[0].length;
      const avg = new Array(mfccLength).fill(0);
      
      mfccArrays.forEach((mfcc) => {
        mfcc.forEach((val, idx) => {
          avg[idx] += val;
        });
      });
      
      averages[phoneme] = avg.map((sum) => 
        parseFloat((sum / mfccArrays.length).toFixed(1))
      );
    });

    return averages;
  };

  const exportTemplates = () => {
    const averages = calculateAverages();
    
    // Format as TypeScript object
    let output = "const phonemeTemplates: Record<string, number[][]> = {\n";
    
    Object.entries(averages).forEach(([phoneme, mfcc]) => {
      output += `  ${phoneme}: [\n`;
      output += `    [${mfcc.join(", ")}],\n`;
      output += `  ],\n`;
    });
    
    output += "};\n";

    // Copy to clipboard
    navigator.clipboard.writeText(output);
    alert("Templates copied to clipboard!");
  };

  const exportJSON = () => {
    const averages = calculateAverages();
    const json = JSON.stringify(averages, null, 2);
    
    // Download as JSON file
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mfcc-templates.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearRecordings = () => {
    setRecordings([]);
  };

  const groupedRecordings = recordings.reduce((acc, record) => {
    if (!acc[record.phoneme]) {
      acc[record.phoneme] = [];
    }
    acc[record.phoneme].push(record);
    return acc;
  }, {} as Record<string, MFCCData[]>);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">MFCC Phoneme Recorder</h2>
      
      {/* Phoneme Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Select Phoneme to Record:
        </label>
        <div className="flex gap-2 flex-wrap">
          {phonemes.map((phoneme) => (
            <button
              key={phoneme}
              onClick={() => setCurrentPhoneme(phoneme)}
              className={`px-4 py-2 rounded-lg font-mono font-bold transition-colors ${
                currentPhoneme === phoneme
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {phoneme}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Current: <span className="font-mono font-bold text-lg">{currentPhoneme}</span>
          {" "}({groupedRecordings[currentPhoneme]?.length || 0} samples)
        </p>
      </div>

      {/* Recording Controls */}
      <div className="mb-6 space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Option 1: Record from Microphone</h3>
          <div className="flex gap-2">
            {!isRecording ? (
              <button
                onClick={startMicRecording}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                🎤 Start Recording
              </button>
            ) : (
              <button
                onClick={stopMicRecording}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors animate-pulse"
              >
                ⏹️ Stop Recording
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Say the phoneme clearly and hold it for 1-2 seconds
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Option 2: Analyze Audio File</h3>
          <div className="flex gap-2 items-center">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
            {audioFile && !isAnalyzing && (
              <button
                onClick={analyzeAudioFile}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                📊 Analyze File
              </button>
            )}
            {isAnalyzing && (
              <button
                onClick={stopAnalyzing}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors animate-pulse"
              >
                ⏹️ Stop
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Upload audio file with the phoneme you want to record
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Recording Statistics:</h3>
        <div className="grid grid-cols-3 gap-4">
          {phonemes.map((phoneme) => {
            const count = groupedRecordings[phoneme]?.length || 0;
            return (
              <div key={phoneme} className="text-center">
                <div className="font-mono font-bold text-lg">{phoneme}</div>
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-xs text-gray-500">samples</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-center text-lg font-semibold">
          Total: {recordings.length} samples
        </div>
      </div>

      {/* Export Controls */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={exportTemplates}
          disabled={recordings.length === 0}
          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
        >
          📋 Copy TypeScript Templates
        </button>
        <button
          onClick={exportJSON}
          disabled={recordings.length === 0}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
        >
          💾 Download JSON
        </button>
        <button
          onClick={clearRecordings}
          disabled={recordings.length === 0}
          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors ml-auto"
        >
          🗑️ Clear All
        </button>
      </div>

      {/* Preview of Latest MFCC */}
      {recordings.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Latest Sample Preview:</h3>
          <div className="font-mono text-xs bg-white p-3 rounded border overflow-x-auto">
            <div className="mb-1">
              <span className="font-bold">Phoneme:</span> {recordings[recordings.length - 1].phoneme}
            </div>
            <div>
              <span className="font-bold">MFCC:</span> [
              {recordings[recordings.length - 1].mfcc.map((val) => val.toFixed(1)).join(", ")}
              ]
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">📖 Instructions:</h4>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Select a phoneme button (aa, ee, ih, ou, oh, sil)</li>
          <li>
            <strong>Option A:</strong> Click "Start Recording" and say the phoneme clearly for 1-2 seconds
          </li>
          <li>
            <strong>Option B:</strong> Upload an audio file with the phoneme and click "Analyze File"
          </li>
          <li>Repeat for multiple samples of each phoneme (recommended: 10-20 samples each)</li>
          <li>Click "Copy TypeScript Templates" to get averaged MFCC values</li>
          <li>Paste into your phonemeTemplates in useAudioLipSync.ts</li>
        </ol>
        <div className="mt-3 text-xs">
          <strong>Tips:</strong>
          <ul className="list-disc ml-5 mt-1">
            <li>Record in a quiet environment</li>
            <li>Hold each phoneme sound for 1-2 seconds</li>
            <li>Record multiple variations for better accuracy</li>
            <li>For "sil" (silence), just be quiet for a few seconds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
