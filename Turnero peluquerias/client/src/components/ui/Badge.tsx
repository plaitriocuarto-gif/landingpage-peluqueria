import React from 'react';
import { AppointmentStatus } from '../../types';

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  confirmado: { label: 'Confirmado', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  cancelado: { label: 'Cancelado', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
  completado: { label: 'Completado', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
};

interface BadgeProps {
  status: AppointmentStatus;
}

export function StatusBadge({ status }: BadgeProps) {
  const { label, className } = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}

interface GenericBadgeProps {
  children: React.ReactNode;
  color?: 'gray' | 'violet' | 'green' | 'red';
}

export function Badge({ children, color = 'gray' }: GenericBadgeProps) {
  const colors = {
    gray: 'bg-gray-700 text-gray-200',
    violet: 'bg-violet-600/20 text-violet-300',
    green: 'bg-green-500/20 text-green-300',
    red: 'bg-red-500/20 text-red-300',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}
