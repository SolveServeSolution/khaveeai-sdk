import { useVRMExpressions } from "@khaveeai/react";
import React from "react";

export default function ExpressionControls() {
  const { setExpression, resetExpressions, expressions } = useVRMExpressions();

  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-3">VRM Expression Controls</h3>

      {/* Current expressions display */}
      <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
        <strong>Active expressions:</strong>
        {Object.keys(expressions).length > 0 ? (
          <div className="mt-1">
            {Object.entries(expressions).map(([name, value]) => (
              <span
                key={name}
                className="inline-block mr-2 px-2 py-1 bg-blue-100 rounded text-xs"
              >
                {name}: {value.toFixed(2)}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-500 ml-2">None</span>
        )}
      </div>

      {/* Expression buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <button
          onClick={() => {
            console.log("Setting happy expression");
            setExpression("happy", 1);
          }}
          className="px-4 py-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors font-medium"
        >
          😊 Happy
        </button>
        <button
          onClick={() => {
            console.log("Setting sad expression");
            setExpression("sad", 1);
          }}
          className="px-4 py-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors font-medium"
        >
          😢 Sad
        </button>
        <button
          onClick={() => {
            console.log("Setting angry expression");
            setExpression("angry", 1);
          }}
          className="px-4 py-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors font-medium"
        >
          😠 Angry
        </button>
      </div>

      {/* Intensity controls */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Quick Intensities:</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setExpression("happy", 0.3)}
            className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 text-sm"
          >
            😊 30%
          </button>
          <button
            onClick={() => setExpression("happy", 0.6)}
            className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm"
          >
            😊 60%
          </button>
          <button
            onClick={() => setExpression("happy", 1)}
            className="px-3 py-2 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300 text-sm"
          >
            😊 100%
          </button>
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={() => {
          console.log("Resetting all expressions");
          resetExpressions();
        }}
        className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
      >
        🔄 Reset All Expressions
      </button>
    </div>
  );
}
