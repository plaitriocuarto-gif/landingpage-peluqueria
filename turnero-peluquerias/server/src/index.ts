import 'dotenv/config';
import express from 'express';
import cors from 'cors';

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

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/staff', staffRouter);
app.use('/api/services', servicesRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/config', configRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/registro', registroRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwt_secret: !!process.env.JWT_SECRET,
      clerk_key: !!process.env.CLERK_SECRET_KEY,
      resend_key: !!process.env.RESEND_API_KEY,
      resend_from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
    },
  });
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
