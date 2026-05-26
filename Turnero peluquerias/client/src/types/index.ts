export interface User {
  id: number;
  email: string;
  nombre: string;
  rol: 'admin' | 'staff' | 'cliente';
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

export type AppointmentStatus = 'pendiente' | 'confirmado' | 'cancelado' | 'completado';

export interface Appointment {
  id: number;
  client_id: number;
  staff_id: number;
  service_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: AppointmentStatus;
  created_at: string;
  staff_nombre?: string;
  staff_avatar?: string;
  client_nombre?: string;
  client_email?: string;
  service_nombre?: string;
  service_precio?: number;
  duracion_minutos?: number;
}

export interface ShopConfig {
  nombre?: string;
  logo?: string;
  color?: string;
  cancellation_hours?: string;
  descripcion?: string;
}
