import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { sensorRouter } from './server/routes/sensorRoutes.js';
import { soilHealthRouter } from './server/routes/soilHealthRoutes.js';
import { irrigationRouter } from './server/routes/irrigationRoutes.js';
import { alertRouter } from './server/routes/alertRoutes.js';
import { deviceRouter } from './server/routes/deviceRoutes.js';
import { aiRouter } from './server/routes/aiRoutes.js';
import { cropScanRouter } from './server/routes/cropScanRoutes.js';
import { gardenRouter } from './server/routes/gardenRoutes.js';
import { authRouter } from './server/routes/authRoutes.js';
import { dbService } from './server/services/dbService.js';
import { sensorService } from './server/services/sensorService.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger for API calls
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// System Health API: GET /api/health
app.get('/api/health', (_req: Request, res: Response) => {
  const devices = dbService.getDevices();
  const latest = dbService.getLatestReading();
  res.json({
    status: 'ONLINE',
    system: 'SoilSense AI Edge & Cloud Engine',
    version: '2.4.0',
    mode: sensorService.isDemo() ? 'DEMO_SIMULATION' : 'LIVE_HARDWARE',
    scenario: sensorService.getActiveScenario(),
    timestamp: new Date().toISOString(),
    nodes: devices.map(d => ({
      id: d.id,
      name: d.name,
      status: d.status,
      type: d.type
    })),
    telemetryFreshness: latest ? latest.timestamp : null
  });
});

// Mount modular API routers
app.use('/api/auth', authRouter);
app.use('/api/sensors', sensorRouter);
app.use('/api/soil-health', soilHealthRouter);
app.use('/api/irrigation', irrigationRouter);
app.use('/api/alerts', alertRouter);
app.use('/api/devices', deviceRouter);
app.use('/api/ai', aiRouter);
app.use('/api/ai', cropScanRouter);
app.use('/api/gardens', gardenRouter);

// Global API error handler
app.use('/api', (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

async function startServer() {
  if (!isProduction && !fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('[Vite] Middleware mounted in dev mode');
  } else {
    // Production static file serving
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[Production] Static assets served from dist');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  SOILSENSE AI - Edge & Cloud Engine`);
    console.log(`  Server running on http://0.0.0.0:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`======================================================\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start SoilSense AI server:', err);
  process.exit(1);
});
