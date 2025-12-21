/**
 * Tool Executor for Amazon Nova
 * Handles tool/function calling during conversations
 */

import { RealtimeTool } from '@khaveeai/core';

export class NovaToolExecutor {
  private tools: Map<string, RealtimeTool> = new Map();

  /**
   * Register a tool for execution
   */
  registerTool(tool: RealtimeTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(toolName: string): void {
    this.tools.delete(toolName);
  }

  /**
   * Check if a tool is registered
   */
  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get all registered tools
   */
  getTools(): RealtimeTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool by name
   */
  async executeTool(
    toolName: string,
    args: any
  ): Promise<{ success: boolean; message: string }> {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      return {
        success: false,
        message: `Tool '${toolName}' not found`,
      };
    }

    try {
      const result = await tool.execute(args);
      return result;
    } catch (error) {
      console.error(`Error executing tool '${toolName}':`, error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Convert RealtimeTool to Nova tool spec format
   */
  toNovaToolSpec(tool: RealtimeTool) {
    const properties: any = {};
    const required: string[] = [];

    Object.entries(tool.parameters).forEach(([key, param]) => {
      properties[key] = {
        type: param.type,
        description: param.description || '',
      };

      if (param.enum) {
        properties[key].enum = param.enum;
      }

      if (param.required) {
        required.push(key);
      }
    });

    return {
      toolSpec: {
        name: tool.name,
        description: tool.description,
        inputSchema: {
          json: JSON.stringify({
            type: 'object',
            properties,
            required,
          }),
        },
      },
    };
  }

  /**
   * Get all tools in Nova format
   */
  getNovaToolConfig() {
    const tools = this.getTools().map((tool) => this.toNovaToolSpec(tool));
    
    if (tools.length === 0) {
      return undefined;
    }

    return { tools };
  }
}
