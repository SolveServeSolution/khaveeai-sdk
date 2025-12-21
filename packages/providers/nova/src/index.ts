/**
 * @khaveeai/providers-nova
 * Amazon Nova Speech-to-Speech provider for Khavee AI SDK
 * 
 * Client-side exports
 */

export { NovaProvider, NovaConfig, NovaVoice, NOVA_VOICES } from './NovaProvider';
export { NovaEventBuilder } from './NovaEventBuilder';
export { NovaAudioPlayer } from './NovaAudioPlayer';
export { NovaToolExecutor } from './NovaToolExecutor';
export { base64ToFloat32Array, float32ArrayToBase64, resampleAudio } from './audioHelpers';

// Note: Server-side exports are in @khaveeai/providers-nova/server
