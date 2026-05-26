import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { clerkInit } from './middleware/clerkAuth';
import authRouter from './routes/auth';
import staffRouter from './routes/staff';
import servicesRouter from './routes/services';
import appointmentsRouter from './routes/appointments';
import configRouter from './routes/config';
import paymentsRouter from './routes/payments';
import registroRouter from './routes/registro';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors({ origin: process.env.VERCEL_URL ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Clerk inicializa req.auth en cada request (no bloquea sin sesión)
app.use(clerkInit);

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/staff', staffRouter);
app.use('/api/services', servicesRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/config', configRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/registro', registroRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Arranque ──────────────────────────────────────────────────────────────────
// Exportamos app para Vercel (serverless) y escuchamos en local dev
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

export default app;
