// Animation tool for LLM integration
export const toolAnimate = {
  name: "trigger_animation",
  description: "Trigger an animation on the VRM avatar",
  parameters: {
    type: "object",
    properties: {
      animation: {
        type: "string",
        description: "Name of the animation to trigger"
      },
      intensity: {
        type: "number",
        description: "Animation intensity (0-1)",
        minimum: 0,
        maximum: 1,
        default: 1
      }
    },
    required: ["animation"]
  }
};