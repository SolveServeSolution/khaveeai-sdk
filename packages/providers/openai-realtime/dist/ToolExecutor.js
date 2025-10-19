/**
 * Tool executor for function calling
 */
export class ToolExecutor {
    constructor() {
        this.functions = new Map();
    }
    /**
     * Register a function for execution
     */
    register(name, fn) {
        this.functions.set(name, fn);
    }
    /**
     * Execute a registered function
     */
    async execute(name, args) {
        const fn = this.functions.get(name);
        if (!fn) {
            return {
                success: false,
                message: `Function '${name}' not found`
            };
        }
        try {
            return await fn(args);
        }
        catch (error) {
            console.error(`Error executing function '${name}':`, error);
            return {
                success: false,
                message: `Error executing function: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Get list of registered function names
     */
    getRegisteredFunctions() {
        return Array.from(this.functions.keys());
    }
}
