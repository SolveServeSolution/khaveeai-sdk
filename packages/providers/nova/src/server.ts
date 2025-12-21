/**
 * Server-side WebSocket proxy for Nova Speech-to-Speech
 * Use this in Next.js API routes or any Node.js server
 * Proxies client WebSocket to AWS Bedrock, keeping credentials secure
 */

import { IncomingMessage } from 'http';

// Types only - imported conditionally
type WebSocketServer = any;
type WebSocket = any;

// Dynamic imports for ws to avoid bundling issues and allow server-only usage
async function loadWS() {
  // @ts-ignore - ws is a server-only dependency loaded at runtime
  const ws = await import('ws');
  return ws;
}

export interface NovaProxyServerConfig {
  region: string;
  modelId?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
}

/**
 * Nova Proxy Server
 * Handles WebSocket connections and proxies to AWS Bedrock
 */
export class NovaProxyServer {
  private config: NovaProxyServerConfig;
  private wss: WebSocketServer | null = null;
  private WebSocket: any;
  private WebSocketServer: any;

  constructor(config: NovaProxyServerConfig) {
    this.config = {
      modelId: 'amazon.nova-sonic-v1:0',
      ...config,
    };
  }

  /**
   * Upgrade HTTP request to WebSocket
   * Use in Next.js API route or Express
   */
  async upgrade(request: Request | IncomingMessage): Promise<{
    socket: WebSocket;
    response: Response;
  }> {
    // Initialize WebSocket server if not already done
    if (!this.wss) {
      const ws = await loadWS();
      this.WebSocketServer = ws.WebSocketServer;
      this.WebSocket = ws.WebSocket;
      this.wss = new this.WebSocketServer({ noServer: true });
      this.wss.on('connection', this.handleConnection.bind(this));
    }

    // For Next.js 13+ App Router
    if ('url' in request && typeof request.url === 'string') {
      return this.handleNextJsUpgrade(request as any);
    }

    // For older Node.js style
    return this.handleNodeUpgrade(request as IncomingMessage);
  }

  /**
   * Handle Next.js App Router upgrade
   */
  private async handleNextJsUpgrade(request: any): Promise<any> {
    const upgradeHeader = request.headers.get('upgrade');
    
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    // Note: Next.js 13+ App Router WebSocket upgrade is complex
    // For production, use Next.js 12 Pages API or a separate WebSocket server
    throw new Error(
      'WebSocket upgrade in Next.js App Router requires additional setup. ' +
      'Please use Pages API (pages/api/) or deploy a separate WebSocket server.'
    );
  }

  /**
   * Handle traditional Node.js HTTP upgrade
   */
  private async handleNodeUpgrade(request: IncomingMessage): Promise<any> {
    // This is a placeholder - actual implementation needs socket and head from upgrade event
    throw new Error('Use handleUpgrade method for traditional Node.js servers');
  }

  /**
   * Handle WebSocket upgrade (for Express, etc.)
   */
  async handleUpgrade(
    request: IncomingMessage,
    socket: any,
    head: Buffer,
    callback: (ws: WebSocket) => void
  ): Promise<void> {
    if (!this.wss) {
      const ws = await loadWS();
      this.WebSocketServer = ws.WebSocketServer;
      this.WebSocket = ws.WebSocket;
      this.wss = new this.WebSocketServer({ noServer: true });
      this.wss.on('connection', this.handleConnection.bind(this));
    }

    this.wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      this.wss!.emit('connection', ws, request);
      callback(ws);
    });
  }

  /**
   * Handle WebSocket connection
   */
  private async handleConnection(ws: WebSocket): Promise<void> {
    console.log('Nova WebSocket client connected');

    // Import AWS SDK dynamically (server-side only)
    const { BedrockRuntimeClient } = await import('@aws-sdk/client-bedrock-runtime');
    
    const client = new BedrockRuntimeClient({
      region: this.config.region,
      credentials: this.config.credentials,
    });

    let bedrockStream: any = null;

    // Handle messages from client
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        // TODO: Initialize Bedrock stream and forward messages
        // This requires the AWS SDK Bedrock streaming API
        
        // For now, echo back for testing
        ws.send(JSON.stringify({
          event: {
            textOutput: {
              role: 'ASSISTANT',
              content: 'Server proxy is working, but AWS Bedrock streaming not yet implemented.',
              contentId: 'test-' + Date.now(),
            },
          },
        }));
      } catch (error: unknown) {
        console.error('Error handling message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Nova WebSocket client disconnected');
      if (bedrockStream) {
        // Close Bedrock stream
      }
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  }
}

/**
 * Create a simple WebSocket proxy handler
 * Use with Express or other Node.js servers
 */
export function createNovaProxyHandler(config: NovaProxyServerConfig) {
  const server = new NovaProxyServer(config);
  
  return {
    handleUpgrade: server.handleUpgrade.bind(server),
  };
}

/**
 * Example usage:
 * 
 * // Express example
 * import express from 'express';
 * import { createNovaProxyHandler } from '@khaveeai/providers-nova/server';
 * 
 * const app = express();
 * const novaProxy = createNovaProxyHandler({
 *   region: process.env.AWS_REGION!,
 *   credentials: {
 *     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
 *     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
 *   },
 * });
 * 
 * const server = app.listen(3001);
 * 
 * server.on('upgrade', (request, socket, head) => {
 *   if (request.url === '/nova') {
 *     novaProxy.handleUpgrade(request, socket, head, (ws) => {
 *       console.log('WebSocket connected');
 *     });
 *   }
 * });
 */
