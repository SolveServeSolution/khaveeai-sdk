"use client";

import { useState } from "react";

interface Model {
  name: string;
  path: string;
  thumbnail: string;
  gender: "male" | "female";
}

interface ModelSelectorProps {
  onModelSelect: (model: Model) => void;
  currentModel?: string;
}

// Import the Model interface for use in the page component
export type { Model };

export default function ModelSelector({ onModelSelect, currentModel }: ModelSelectorProps) {
  const [selectedGender, setSelectedGender] = useState<"all" | "male" | "female">("all");

  // Define available models based on file structure
  const models: Model[] = [
    // Male models
    {
      name: "Nongkhavee Male 01",
      path: "/models/male/nongkhavee_male_01.vrm",
      thumbnail: "/models/male/nongkhavee_male_01.png",
      gender: "male",
    },
    {
      name: "Nongkhavee Male 02",
      path: "/models/male/nongkhavee_male_02.vrm",
      thumbnail: "/models/male/nongkhavee_male_02.png",
      gender: "male",
    },
    // Female models
    {
      name: "Nongkhavee Female 01",
      path: "/models/female/nongkhavee_female_01.vrm",
      thumbnail: "/models/female/nongkhavee_female_01.png",
      gender: "female",
    },
    {
      name: "Nongkhavee Female 02",
      path: "/models/female/nongkhavee_female_02.vrm",
      thumbnail: "/models/female/nongkhavee_female_02.png",
      gender: "female",
    },
    {
      name: "Nongkhavee Female 03",
      path: "/models/female/nongkhavee_female_03.vrm",
      thumbnail: "/models/female/nongkhavee_female_03.png",
      gender: "female",
    },
    {
      name: "Nongkhavee Female 04",
      path: "/models/female/nongkhavee_female_04.vrm",
      thumbnail: "/models/female/nongkhavee_female_04.png",
      gender: "female",
    },
    {
      name: "Nongkhavee Female 05",
      path: "/models/female/nongkhavee_female_05.vrm",
      thumbnail: "/models/female/nongkhavee_female_05.png",
      gender: "female",
    },
    {
      name: "Nongkhavee Female 06",
      path: "/models/female/nongkhavee_female_06.vrm",
      thumbnail: "/models/female/nongkhavee_female_06.png",
      gender: "female",
    },
    {
      name: "Nongkhavee Female 07",
      path: "/models/female/nongkhavee_female_07.vrm",
      thumbnail: "/models/female/nongkhavee_female_07.png",
      gender: "female",
    },
    {
      name: "Nongkhavee Female 08",
      path: "/models/female/nongkhavee_female_08.vrm",
      thumbnail: "/models/female/nongkhavee_female_08.png",
      gender: "female",
    },
  ];

  const filteredModels = selectedGender === "all"
    ? models
    : models.filter(model => model.gender === selectedGender);

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Select Avatar Model</h2>

      {/* Gender Filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedGender("all")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedGender === "all"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All Models
        </button>
        <button
          onClick={() => setSelectedGender("male")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedGender === "male"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Male
        </button>
        <button
          onClick={() => setSelectedGender("female")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedGender === "female"
              ? "bg-pink-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Female
        </button>
      </div>

      {/* Model Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
        {filteredModels.map((model) => (
          <div
            key={model.path}
            onClick={() => onModelSelect(model)}
            className={`cursor-pointer rounded-lg border-2 transition-all hover:scale-105 ${
              currentModel === model.path
                ? "border-blue-500 shadow-lg"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="aspect-square relative overflow-hidden rounded-t-lg">
              <img
                src={model.thumbnail}
                alt={model.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image doesn't load
                  const target = e.target as HTMLImageElement;
                  target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e5e7eb"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%236b7280">No Preview</text></svg>`;
                }}
              />
              {currentModel === model.path && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-2 bg-gray-50 rounded-b-lg">
              <p className="text-sm font-medium text-gray-800 truncate">{model.name}</p>
              <p className="text-xs text-gray-500 capitalize">{model.gender}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No models found for the selected gender.</p>
        </div>
      )}
    </div>
  );
}