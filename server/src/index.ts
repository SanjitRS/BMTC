import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { nishRouter } from "./modules/nish/ingestionRouter";
import { praveenRouter } from "./modules/praveen/cognitiveRouter";
import { geofenceRelay } from "./modules/sanjit/geofenceRelay";
import { syncRelay } from "./modules/sanjit/syncRelay";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Gurugale Multi-Modular Backend Server `);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(` Central Ingestion: POST /api/sync/batch`);
  console.log(` Geofence Stream: GET /api/geofence/stream`);
  console.log(`=========================================`);
});
