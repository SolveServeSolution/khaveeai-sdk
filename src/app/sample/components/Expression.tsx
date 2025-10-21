import { useVRMExpressions } from "@khaveeai/react";

export default function Expression() {
  const { setExpression, resetExpressions } = useVRMExpressions();
  return (
    <div className="bg-white rounded-xl p-10 flex flex-col space-y-2 ">
      <h1>Expressions</h1>
      <button
        className="bg-slate-100 p-2 rounded-lg"
        onClick={() => setExpression("happy", 1)}
      >
        Happy
      </button>
      <button
        className="bg-slate-100 p-2 rounded-lg"
        onClick={() => setExpression("sad", 1)}
      >
        Sad
      </button>
      <button
        className="border border-slate-400 p-2 rounded-lg"
        onClick={resetExpressions}
      >
        Reset
      </button>
    </div>
  );
}
