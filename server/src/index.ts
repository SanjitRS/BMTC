import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { nishRouter } from "./modules/nish/ingestionRouter";
import { praveenRouter } from "./modules/praveen/cognitiveRouter";
import { geofenceRelay } from "./modules/sanjit/geofenceRelay";
import { syncRelay } from "./modules/sanjit/syncRelay";

dotenv.config();

const app = express();
// Google Cloud Run & App Engine automatically supply the PORT env variable (default 8080)
const PORT = Number(process.env.PORT) || 8080;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    platform: "Gurugale Multi-Modular Platform",
    modules: ["sanjit:geofencing-sync", "praveen:cognitive-therapy", "nish:admin-ingestion"],
    timestamp: new Date().toISOString(),
    cloudEnvironment: process.env.K_SERVICE ? "Google Cloud Run" : "Standard Node",
  });
});

// SANJIT MODULE ENDPOINTS: Geofence & Safe Zones
app.get("/api/geofence/zones", (_req: Request, res: Response) => {
  res.json({ zones: geofenceRelay.getSafeZones() });
});

app.post("/api/geofence/event", (req: Request, res: Response) => {
  const event = req.body;
  const result = geofenceRelay.processGeofenceEvent(event);
  res.json({ success: true, ...result });
});

app.get("/api/geofence/events", (_req: Request, res: Response) => {
  res.json({ events: geofenceRelay.getRawEvents() });
});

app.get("/api/geofence/alerts", (_req: Request, res: Response) => {
  res.json({ alerts: geofenceRelay.getDebouncedAlerts() });
});

// Server-Sent Events (SSE) stream for live alerts
app.get("/api/geofence/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const unsubscribe = geofenceRelay.subscribe((alert) => {
    res.write(`data: ${JSON.stringify(alert)}\n\n`);
  });

  req.on("close", () => {
    unsubscribe();
  });
});

// NISCHAL MODULE ENDPOINTS: Ingestion, Roster, Scorecards, GDPR
app.use("/api", nishRouter);

// PRAVEEN MODULE ENDPOINTS: Cognitive therapy benchmarks & rules
app.use("/api/cognitive", praveenRouter);

// SERVE PRODUCTION FRONTEND SPA (Google Cloud Production Hosting)
const candidateStaticPaths = [
  path.join(process.cwd(), "client/dist"),
  path.join(__dirname, "../../client/dist"),
  path.join(__dirname, "../client/dist"),
  path.join(process.cwd(), "public"),
];

const clientDistPath = candidateStaticPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  console.log(`[Production Hosting] Serving static client build from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // SPA Wildcard fallback
  app.get("*", (req: Request, res: Response) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(clientDistPath, "index.html"));
    }
  });
} else {
  console.log(`[Development Mode] API server ready. Vite dev client should be run separately.`);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`===================================================`);
  console.log(` Gurugale Multi-Modular Platform - Google Cloud Hosted `);
  console.log(` Listening on: http://0.0.0.0:${PORT}`);
  console.log(` Ingestion Seam: POST http://0.0.0.0:${PORT}/api/sync/batch`);
  console.log(` Geofence Stream: GET http://0.0.0.0:${PORT}/api/geofence/stream`);
  console.log(`===================================================`);
});
