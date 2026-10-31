import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './database';
import { runSeed } from './database/seed';
import { testSupabaseConnection } from './database/supabase';
import { authRouter } from './routes/auth.routes';
import { hostRouter } from './routes/host.routes';
import { guestRouter } from './routes/guest.routes';
import { recommendationRouter } from './routes/recommendation.routes';
import { qrRouter } from './routes/qr.routes';
import { sessionRouter } from './routes/session.routes';
import { adminRouter } from './routes/admin.routes';

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database with seed dataset if empty
try {
  if (db.getUsers().length === 0) {
    console.log('🌱 Initializing database with seed dataset...');
    runSeed(db);
  }
} catch (seedErr) {
  console.warn('Seed initialization error (ignoring for serverless runtime):', seedErr);
}

// Health check with Supabase verification (supports both /api/health and /health)
app.get(['/api/health', '/health'], async (_req, res) => {
  let supabaseStatus: any = { configured: Boolean(process.env.DATABASE_URL) };
  if (process.env.DATABASE_URL) {
    try {
      const sb = await testSupabaseConnection();
      supabaseStatus = { ...supabaseStatus, ...sb };
    } catch (err: any) {
      supabaseStatus.error = err.message;
    }
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Voltly API',
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development',
    supabase: supabaseStatus,
  });
});

// Mount API Routes (supports both /api/* and root mount)
app.use(['/api/auth', '/auth'], authRouter);
app.use(['/api/host', '/host'], hostRouter);
app.use(['/api/guest', '/guest'], guestRouter);
app.use(['/api/recommendations', '/recommendations'], recommendationRouter);
app.use(['/api/qr', '/qr'], qrRouter);
app.use(['/api/sessions', '/sessions'], sessionRouter);
app.use(['/api/admin', '/admin'], adminRouter);

// Serve Static Frontend in local development or monolithic mode (bypassed on Vercel)
if (!process.env.VERCEL) {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(clientDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).send('Voltly API active. For client UI, run Vite dev server.');
      }
    });
  });
}

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5001;

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`⚡ Voltly Server active on http://localhost:${PORT}`);
  });
}

export default app;
