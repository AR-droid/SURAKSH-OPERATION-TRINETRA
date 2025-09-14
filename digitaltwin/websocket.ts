import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { log } from './vite';

export interface GunshotEvent {
  id: string;
  position: [number, number, number];
  timestamp: number;
  confidence: number;
  weaponType?: string;
  sourceId?: string;
  sourceType?: 'friendly' | 'hostile' | 'unknown';
}

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private messageHandlers: Map<string, (data: any, ws: WebSocket) => void> = new Map();
  
  constructor(server: HttpServer | HttpsServer) {
    this.wss = new WebSocketServer({ server });
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.clients.add(ws);
      log(`New WebSocket connection (${this.clients.size} total)`);
      
      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          const { type, payload } = message;
          
          const handler = this.messageHandlers.get(type);
          if (handler) {
            handler(payload, ws);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        this.clients.delete(ws);
        log(`WebSocket connection closed (${this.clients.size} remaining)`);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }
  
  public broadcastGunshotEvent(event: GunshotEvent) {
    const message = JSON.stringify({
      type: 'gunshot',
      payload: event
    });
    
    this.broadcast(message);
  }
  
  public broadcast(message: string) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  public registerHandler(type: string, handler: (data: any, ws: WebSocket) => void) {
    this.messageHandlers.set(type, handler);
  }
}

export let webSocketManager: WebSocketManager;

export function initializeWebSocket(server: HttpServer | HttpsServer) {
  webSocketManager = new WebSocketManager(server);
  return webSocketManager;
}
