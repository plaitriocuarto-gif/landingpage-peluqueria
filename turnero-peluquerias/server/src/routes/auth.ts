import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret';

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, nombre } = req.body as { email: string; password: string; nombre: string };

  if (!email || !password || !nombre) {
    res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    return;
  }

  const { data: existing } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
  if (existing) {
    res.status(409).json({ error: 'El email ya está registrado' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({ email, password_hash: hash, nombre, rol: 'cliente' })
    .select()
    .single();

  if (error || !user) {
    res.status(500).json({ error: 'Error al crear el usuario' });
    return;
  }

  const token = jwt.sign({ id: user.id, email, rol: 'cliente' }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, email, nombre, rol: 'cliente' } });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña requeridos' });
    return;
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Credenciales incorrectas' });
    return;
  }

  const token = jwt.sign({ id: user.id, email: user.email, rol: user.rol }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol } });
});

router.post('/register-admin', async (req: Request, res: Response) => {
  const { email, password, nombre, setupSecret } = req.body as {
    email: string; password: string; nombre: string; setupSecret: string;
  };

  if (setupSecret !== process.env.SETUP_SECRET) {
    res.status(403).json({ error: 'Setup secret incorrecto' });
    return;
  }
  if (!email || !password || !nombre) {
    res.status(400).json({ error: 'Datos incompletos' });
    return;
  }

  const { data: existing } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
  if (existing) {
    res.status(409).json({ error: 'El email ya está registrado' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({ email, password_hash: hash, nombre, rol: 'admin' })
    .select()
    .single();

  if (error || !user) {
    res.status(500).json({ error: 'Error al crear el usuario admin' });
    return;
  }

  const token = jwt.sign({ id: user.id, email, rol: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, email, nombre, rol: 'admin' } });
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, nombre, rol, created_at')
    .eq('id', req.user!.id)
    .single();

  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  res.json(user);
});

export default router;
