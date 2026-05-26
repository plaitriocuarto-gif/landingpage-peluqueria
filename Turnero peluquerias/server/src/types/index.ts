export interface User {
  id: number;
  email: string;
  password_hash: string;
  nombre: string;
  rol: 'admin' | 'staff' | 'cliente';
  created_at: string;
}

export interface Staff {
  id: number;
  nombre: string;
  avatar: string;
  activo: number;
  created_at: string;
}

export interface StaffSchedule {
  id: number;
  staff_id: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  slot_minutos: number;
}

export interface StaffException {
  id: number;
  staff_id: number;
  fecha: string;
  tipo: 'libre' | 'horario_especial';
  hora_inicio: string | null;
  hora_fin: string | null;
  motivo: string | null;
}

export interface Service {
  id: number;
  nombre: string;
  duracion_minutos: number;
  precio: number;
  activo: number;
}

export interface Appointment {
  id: number;
  client_id: number;
  staff_id: number;
  service_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: 'pendiente' | 'confirmado' | 'cancelado' | 'completado';
  created_at: string;
}

export interface JwtPayload {
  id: number;
  email: string;
  rol: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
