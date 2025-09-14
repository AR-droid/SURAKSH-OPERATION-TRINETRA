import express, { type Request, Response, NextFunction } from "express";
import http from 'http';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeWebSocket, GunshotEvent } from "./websocket";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
initializeWebSocket(server);

// API endpoint for gunshot events
app.post('/api/gunshots', (req: Request, res: Response) => {
  try {
    const event: GunshotEvent = req.body;
    
    // Validate required fields
    if (!event.position || !Array.isArray(event.position) || event.position.length !== 3) {
      return res.status(400).json({ error: 'Invalid position' });
    }
    
    // Add timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }
    
    // Broadcast to all connected WebSocket clients
    const { webSocketManager } = require('./websocket');
    webSocketManager.broadcastGunshotEvent(event);
    
    res.status(202).json({ message: 'Gunshot event received', id: event.id });
  } catch (error) {
    console.error('Error processing gunshot event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register API routes
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  console.error(err);
});

// Setup Vite in development mode
(async () => {
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start the server
  const port = 5001; // Changed from 5000 to 5001
  server.listen(port, '0.0.0.0', () => {
    log(`Server running on http://localhost:${port}`);
  });
})();
