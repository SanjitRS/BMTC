import express from 'express';
import cors from 'cors';
import routes from './routes';
import { config } from './config';

const app = express();

// Middlewares
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.includes('/health')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Gurugale Central Ingestion & Admin Pipeline (Nischal Module)',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', routes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🧠 GURUGALE ADMIN PIPELINE & INGESTION BACKEND READY`);
  console.log(`🚀 Server listening on port http://localhost:${config.port}`);
  console.log(`📥 Central Ingestion Endpoint: http://localhost:${config.port}/api/sync/batch`);
  console.log(`🏥 Health Check: http://localhost:${config.port}/health`);
  console.log(`=======================================================`);
});

export default server;
