/**
 * Tool executor for function calling
 */
import { RealtimeTool } from '@khaveeai/core';
export declare class ToolExecutor {
    private functions;
    /**
     * Register a function for execution
     */
    register(name: string, fn: RealtimeTool['execute']): void;
    /**
     * Execute a registered function
     */
    execute(name: string, args: any): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Get list of registered function names
     */
    getRegisteredFunctions(): string[];
}
