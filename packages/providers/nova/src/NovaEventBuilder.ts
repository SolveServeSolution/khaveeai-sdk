/**
 * Amazon Nova Speech-to-Speech Provider Event Builder
 * Based on Amazon Nova Workshop implementation
 */

export interface NovaInferenceConfig {
  maxTokens?: number;
  topP?: number;
  temperature?: number;
}

export interface NovaAudioConfig {
  mediaType: string;
  sampleRateHertz: number;
  sampleSizeBits: number;
  channelCount: number;
  voiceId?: string;
  encoding: string;
  audioType: string;
}

export interface NovaToolSpec {
  toolSpec: {
    name: string;
    description: string;
    inputSchema: {
      json: string;
    };
  };
}

export interface NovaToolConfig {
  tools: NovaToolSpec[];
}

export interface NovaChatHistory {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

/**
 * Nova event builder for creating WebSocket messages
 */
export class NovaEventBuilder {
  static readonly DEFAULT_INFER_CONFIG: NovaInferenceConfig = {
    maxTokens: 1024,
    topP: 0.95,
    temperature: 0.7,
  };

  static readonly DEFAULT_AUDIO_INPUT_CONFIG: NovaAudioConfig = {
    mediaType: 'audio/lpcm',
    sampleRateHertz: 16000,
    sampleSizeBits: 16,
    channelCount: 1,
    audioType: 'SPEECH',
    encoding: 'base64',
  };

  static readonly DEFAULT_AUDIO_OUTPUT_CONFIG: NovaAudioConfig = {
    mediaType: 'audio/lpcm',
    sampleRateHertz: 24000,
    sampleSizeBits: 16,
    channelCount: 1,
    voiceId: 'matthew',
    encoding: 'base64',
    audioType: 'SPEECH',
  };

  /**
   * Create session start event
   */
  static sessionStart(
    inferenceConfig: NovaInferenceConfig = NovaEventBuilder.DEFAULT_INFER_CONFIG,
    turnSensitivity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
  ) {
    return {
      event: {
        sessionStart: {
          inferenceConfiguration: inferenceConfig,
        },
      },
    };
  }

  /**
   * Create prompt start event
   */
  static promptStart(
    promptName: string,
    audioOutputConfig: NovaAudioConfig = NovaEventBuilder.DEFAULT_AUDIO_OUTPUT_CONFIG,
    toolConfig?: NovaToolConfig
  ) {
    const event: any = {
      event: {
        promptStart: {
          promptName: promptName,
          textOutputConfiguration: {
            mediaType: 'text/plain',
          },
          audioOutputConfiguration: audioOutputConfig,
          toolUseOutputConfiguration: {
            mediaType: 'application/json',
          },
        },
      },
    };

    if (toolConfig) {
      event.event.promptStart.toolConfiguration = toolConfig;
    }

    return event;
  }

  /**
   * Create text content start event
   */
  static contentStartText(
    promptName: string,
    contentName: string,
    role: 'SYSTEM' | 'USER' | 'ASSISTANT' = 'SYSTEM',
    interactive = false
  ) {
    return {
      event: {
        contentStart: {
          promptName: promptName,
          contentName: contentName,
          type: 'TEXT',
          interactive: interactive,
          role: role,
          textInputConfiguration: {
            mediaType: 'text/plain',
          },
        },
      },
    };
  }

  /**
   * Create text input event
   */
  static textInput(promptName: string, contentName: string, content: string, role: 'SYSTEM' | 'USER' | 'ASSISTANT' | 'TOOL' = 'SYSTEM') {
    return {
      event: {
        textInput: {
          promptName: promptName,
          contentName: contentName,
          content: content,
          role: role,
        },
      },
    };
  }

  /**
   * Create content end event
   */
  static contentEnd(promptName: string, contentName: string) {
    return {
      event: {
        contentEnd: {
          promptName: promptName,
          contentName: contentName,
        },
      },
    };
  }

  /**
   * Create audio content start event
   */
  static contentStartAudio(
    promptName: string,
    contentName: string,
    audioInputConfig: NovaAudioConfig = NovaEventBuilder.DEFAULT_AUDIO_INPUT_CONFIG
  ) {
    return {
      event: {
        contentStart: {
          promptName: promptName,
          contentName: contentName,
          type: 'AUDIO',
          interactive: true,
          role: 'USER',
          audioInputConfiguration: audioInputConfig,
        },
      },
    };
  }

  /**
   * Create audio input event
   */
  static audioInput(promptName: string, contentName: string, content: string) {
    return {
      event: {
        audioInput: {
          promptName,
          contentName,
          content,
        },
      },
    };
  }

  /**
   * Create tool content start event
   */
  static contentStartTool(promptName: string, contentName: string, toolUseId: string) {
    return {
      event: {
        contentStart: {
          promptName,
          contentName,
          interactive: false,
          type: 'TOOL',
          toolResultInputConfiguration: {
            toolUseId,
            type: 'TEXT',
            textInputConfiguration: { mediaType: 'text/plain' },
          },
        },
      },
    };
  }

  /**
   * Create tool text input event
   */
  static textInputTool(promptName: string, contentName: string, content: string) {
    return {
      event: {
        textInput: {
          promptName,
          contentName,
          content,
          role: 'TOOL',
        },
      },
    };
  }

  /**
   * Create prompt end event
   */
  static promptEnd(promptName: string) {
    return {
      event: {
        promptEnd: {
          promptName,
        },
      },
    };
  }

  /**
   * Create session end event
   */
  static sessionEnd() {
    return {
      event: {
        sessionEnd: {},
      },
    };
  }
}
