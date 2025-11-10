/**
 * Create a RAG tool for OpenAI Realtime API
 */

import { RealtimeTool } from "@khaveeai/core";
import { RAGProvider } from "./RAGProvider";

export interface CreateRAGToolOptions {
  ragProvider: RAGProvider;
  toolName?: string;
  toolDescription?: string;
  promptTemplate?: (query: string, context: string) => string;
}

/**
 * Create a RAG tool that can be used with OpenAI Realtime Provider
 */
export function createRAGTool(options: CreateRAGToolOptions): RealtimeTool {
  const {
    ragProvider,
    toolName = "search_knowledge_base",
    toolDescription = "Search the knowledge base for relevant information to answer user questions",
    promptTemplate,
  } = options;

  return {
    name: toolName,
    description: toolDescription,
    parameters: {
      query: {
        type: "string",
        required: true,
        description: "Search query to find relevant information",
      },
    },
    execute: async (args: any) => {
      try {
        const { query } = args;

        if (!query || typeof query !== "string") {
          return {
            success: false,
            message: "Invalid query parameter",
          };
        }

        // Prepare context using RAG
        const ragContext = await ragProvider.prepareContext(query);

        // Format the response
        let message = "";
        if (ragContext.documents.length === 0) {
          message = "No relevant information found in the knowledge base.";
        } else {
          if (promptTemplate) {
            message = promptTemplate(query, ragContext.formattedContext);
          } else {
            message = `Found ${ragContext.documents.length} relevant documents:\n\n${ragContext.formattedContext}`;
          }
        }

        return {
          success: true,
          message,
        };
      } catch (error) {
        return {
          success: false,
          message: `Error searching knowledge base: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  };
}
