import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret';

router.post('/register', (req: Request, res: Response) => {
  const { email, password, nombre } = req.body as {
    email: string;
    password: string;
    nombre: string;
  };

  if (!email || !password || !nombre) {
    res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'El email ya está registrado' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, nombre, rol) VALUES (?, ?, ?, ?)')
    .run(email, hash, nombre, 'cliente');

  const newId = Number(result.lastInsertRowid);
  const token = jwt.sign({ id: newId, email, rol: 'cliente' }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({ token, user: { id: newId, email, nombre, rol: 'cliente' } });
});

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña requeridos' });
    return;
  }

  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email) as {
      id: number;
      email: string;
      password_hash: string;
      nombre: string;
      rol: string;
    } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Credenciales incorrectas' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol } });
});

router.post('/register-admin', (req: Request, res: Response) => {
  const { email, password, nombre, setupSecret } = req.body as {
    email: string;
    password: string;
    nombre: string;
    setupSecret: string;
  };

  if (setupSecret !== process.env.SETUP_SECRET) {
    res.status(403).json({ error: 'Setup secret incorrecto' });
    return;
  }

  if (!email || !password || !nombre) {
    res.status(400).json({ error: 'Datos incompletos' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'El email ya está registrado' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, nombre, rol) VALUES (?, ?, ?, ?)')
    .run(email, hash, nombre, 'admin');

  const newId = Number(result.lastInsertRowid);
  const token = jwt.sign({ id: newId, email, rol: 'admin' }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({ token, user: { id: newId, email, nombre, rol: 'admin' } });
});

router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = db
    .prepare('SELECT id, email, nombre, rol, created_at FROM users WHERE id = ?')
    .get(req.user!.id);

  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  res.json(user);
});

export default router;
