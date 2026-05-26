import React, { useState, useEffect } from 'react';
import { Appointment, Staff } from '../../types';
import { appointmentsApi } from '../../api/appointments';
import { staffApi } from '../../api/staff';
import { StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      appointmentsApi.getAll({ fecha: today() }),
      staffApi.list(),
    ]).then(([appts, staffList]) => {
      setAppointments(appts);
      setStaff(staffList);
    }).finally(() => setLoading(false));
  }, []);

  const byStaff = staff.map((s) => ({
    ...s,
    appointments: appointments.filter((a) => a.staff_id === s.id),
  }));

  const stats = {
    total: appointments.length,
    pendiente: appointments.filter((a) => a.estado === 'pendiente').length,
    confirmado: appointments.filter((a) => a.estado === 'confirmado').length,
    completado: appointments.filter((a) => a.estado === 'completado').length,
    cancelado: appointments.filter((a) => a.estado === 'cancelado').length,
  };

  const dateLabel = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
        <p className="text-gray-400 capitalize">{dateLabel}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total hoy', value: stats.total, color: 'text-gray-100' },
          { label: 'Pendientes', value: stats.pendiente, color: 'text-yellow-400' },
          { label: 'Confirmados', value: stats.confirmado, color: 'text-blue-400' },
          { label: 'Completados', value: stats.completado, color: 'text-green-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {byStaff.map((s) => (
          <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Avatar emoji={s.avatar} nombre={s.nombre} size="sm" />
              <div>
                <p className="font-semibold text-gray-100">{s.nombre}</p>
                <p className="text-xs text-gray-500">
                  {s.appointments.length} turno{s.appointments.length !== 1 ? 's' : ''} hoy
                </p>
              </div>
            </div>

            {s.appointments.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Sin turnos hoy</p>
            ) : (
              <div className="space-y-2">
                {s.appointments
                  .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                  .map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between text-sm border border-gray-700 rounded-lg px-3 py-2"
                    >
                      <div>
                        <span className="font-mono text-gray-300 mr-3">{a.hora_inicio}</span>
                        <span className="text-gray-200">{a.client_nombre}</span>
                        <span className="text-gray-500 ml-2">· {a.service_nombre}</span>
                      </div>
                      <StatusBadge status={a.estado} />
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
