import { MCPServerConfig, RealtimeTool } from "@khaveeai/core";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

type MCPRemoteTool = Awaited<ReturnType<Client["listTools"]>>["tools"][number];

interface MCPClientEntry {
  server: MCPServerConfig;
  client: Client;
  transport: StreamableHTTPClientTransport;
}

/**
 * Bridges MCP servers into the realtime tool execution pipeline.
 */
export class MCPToolManager {
  private servers: MCPServerConfig[];
  private clients = new Map<string, MCPClientEntry>();
  private discoveredTools: RealtimeTool[] = [];

  constructor(servers: MCPServerConfig[] = []) {
    this.servers = servers;
  }

  /**
   * Connect to configured MCP servers and convert their tools into RealtimeTool definitions.
   */
  async initialize(): Promise<RealtimeTool[]> {
    const aggregated: RealtimeTool[] = [];

    for (const server of this.servers) {
      const entry = await this.connectToServer(server);
      if (!entry) {
        continue;
      }

      try {
        const tools = await this.fetchAllTools(entry.client);
        tools.forEach((tool) => {
          const realtimeTool = this.createRealtimeTool(entry, tool);
          aggregated.push(realtimeTool);
        });
      } catch (error) {
        console.error(
          `[MCP] Failed to list tools for server '${server.id}':`,
          error
        );
      }
    }

    this.discoveredTools = aggregated;
    return aggregated;
  }

  /**
   * Returns the MCP-backed tool definitions discovered during initialization.
   */
  getTools(): RealtimeTool[] {
    return this.discoveredTools;
  }

  /**
   * Gracefully close all transports.
   */
  async dispose(): Promise<void> {
    const closing = Array.from(this.clients.values()).map(async (entry) => {
      try {
        await entry.transport.close();
      } catch {
        // Ignore shutdown errors
      }
    });
    await Promise.all(closing);
    this.clients.clear();
  }

  private async connectToServer(
    server: MCPServerConfig
  ): Promise<MCPClientEntry | null> {
    try {
      if (server.transport && server.transport !== "streamable-http") {
        console.warn(
          `[MCP] Unsupported transport '${server.transport}' for server '${server.id}'.` +
            " Only 'streamable-http' is supported."
        );
        return null;
      }

      const client = new Client(
        {
          name: server.client?.name || `khaveeai-mcp-${server.id}`,
          version: server.client?.version || "1.0.0",
        },
        {
          capabilities: (server.client?.capabilities as any) || {},
        }
      );

      const url = new URL(server.url);
      const transport = new StreamableHTTPClientTransport(url, {
        requestInit: server.headers
          ? {
              headers: server.headers,
            }
          : undefined,
      });

      await client.connect(transport);

      const entry: MCPClientEntry = { server, client, transport };
      this.clients.set(server.id, entry);
      return entry;
    } catch (error) {
      console.error(`[MCP] Failed to connect to server '${server.id}':`, error);
      return null;
    }
  }

  private async fetchAllTools(client: Client): Promise<MCPRemoteTool[]> {
    const tools: MCPRemoteTool[] = [];
    let cursor: string | undefined;

    do {
      const response = await client.listTools(
        cursor ? { cursor } : undefined
      );
      tools.push(...(response.tools || []));
      cursor = response.nextCursor || undefined;
    } while (cursor);

    return tools;
  }

  private createRealtimeTool(
    entry: MCPClientEntry,
    tool: MCPRemoteTool
  ): RealtimeTool {
    const prefix =
      entry.server.toolNamePrefix === null
        ? ""
        : entry.server.toolNamePrefix || `${entry.server.id}__`;
    const exposedName = `${prefix}${tool.name}`;

    const parameters = this.convertSchemaToParameters(tool.inputSchema);

    return {
      name: exposedName,
      description:
        tool.description ||
        tool.title ||
        `Tool ${tool.name} from ${entry.server.id}`,
      parameters,
      execute: async (args: any) =>
        this.executeRemoteTool(entry.server.id, tool.name, args),
    };
  }

  private convertSchemaToParameters(
    schema: MCPRemoteTool["inputSchema"]
  ): RealtimeTool["parameters"] {
    const parameters: RealtimeTool["parameters"] = {};

    if (!schema || schema.type !== "object") {
      return parameters;
    }

    const required = new Set(schema.required || []);
    const properties = schema.properties || {};

    Object.entries(properties).forEach(([key, value]) => {
      const property = value as {
        type?: string;
        description?: string;
        enum?: unknown[];
      };

      parameters[key] = {
        type: this.normalizeSchemaType(property.type),
        description:
          typeof property.description === "string"
            ? property.description
            : undefined,
        enum: Array.isArray(property.enum)
          ? property.enum.filter((item): item is string => typeof item === "string")
          : undefined,
        required: required.has(key) || undefined,
      };
    });

    return parameters;
  }

  private normalizeSchemaType(type?: string):
    | "string"
    | "number"
    | "boolean"
    | "array"
    | "object" {
    switch (type) {
      case "number":
      case "integer":
        return "number";
      case "boolean":
        return "boolean";
      case "array":
        return "array";
      case "object":
        return "object";
      default:
        return "string";
    }
  }

  private async executeRemoteTool(
    serverId: string,
    toolName: string,
    args: any
  ): Promise<{ success: boolean; message: string }> {
    const entry = this.clients.get(serverId);

    if (!entry) {
      return {
        success: false,
        message: `MCP server '${serverId}' is not connected.`,
      };
    }

    try {
      const result = await entry.client.callTool({
        name: toolName,
        arguments: args,
      });

      const message = this.renderResultMessage(result);
      const isError = Boolean((result as any)?.isError);

      return {
        success: !isError,
        message: message || (isError ? "MCP tool call failed." : "MCP tool executed successfully."),
      };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Unknown MCP error";
      return {
        success: false,
        message: `Failed to execute MCP tool '${toolName}' on '${serverId}': ${reason}`,
      };
    }
  }

  private renderResultMessage(result: any): string {
    if (Array.isArray(result?.content)) {
      const segments = (result.content as unknown[])
        .map((item) => this.renderContentItem(item))
        .filter((text): text is string => Boolean(text));

      if (segments.length > 0) {
        return segments.join("\n\n");
      }
    }

    if (result?.structuredContent) {
      return this.stringifyPayload(result.structuredContent);
    }

    if (result?.toolResult) {
      return this.stringifyPayload(result.toolResult);
    }

    return this.stringifyPayload(result);
  }

  private renderContentItem(item: unknown): string | null {
    if (!item || typeof item !== "object") {
      return null;
    }

    const content = item as Record<string, any>;

    switch (content.type) {
      case "text":
        return content.text || null;
      case "resource":
        if (content.resource?.text) {
          return content.resource.text;
        }
        if (content.resource?.uri) {
          return `Resource available at ${content.resource.uri}`;
        }
        return "[resource content]";
      case "resource_link":
        return content.description
          ? `${content.description} (${content.uri})`
          : `Resource link: ${content.uri}`;
      case "image":
        return `[image (${content.mimeType || "binary"}) returned by MCP tool]`;
      case "audio":
        return `[audio (${content.mimeType || "binary"}) returned by MCP tool]`;
      default:
        return typeof content.text === "string"
          ? content.text
          : `[${content.type ?? "content"} returned by MCP tool]`;
    }
  }

  private stringifyPayload(payload: unknown): string {
    if (payload == null) {
      return "";
    }

    if (typeof payload === "string") {
      return payload;
    }

    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload);
    }
  }
}
