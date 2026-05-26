import React, { useState, useEffect, useCallback } from 'react';
import { Appointment, Staff, AppointmentStatus } from '../../types';
import { appointmentsApi } from '../../api/appointments';
import { staffApi } from '../../api/staff';
import { useToast } from '../../contexts/ToastContext';
import { StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const STATUS_OPTIONS: { value: AppointmentStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fecha: '',
    staffId: '',
    estado: '',
  });
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: { fecha?: string; staffId?: number; estado?: string } = {};
      if (filters.fecha) params.fecha = filters.fecha;
      if (filters.staffId) params.staffId = Number(filters.staffId);
      if (filters.estado) params.estado = filters.estado;
      const data = await appointmentsApi.getAll(params);
      setAppointments(data);
    } catch {
      showToast('Error al cargar turnos', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => { void staffApi.list().then(setStaff); }, []);
  useEffect(() => { void load(); }, [load]);

  const handleStatusChange = async (id: number, estado: string) => {
    try {
      await appointmentsApi.updateStatus(id, estado);
      showToast('Estado actualizado', 'success');
      await load();
    } catch {
      showToast('Error al actualizar', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Turnos</h1>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={filters.fecha}
            onChange={(e) => setFilters((f) => ({ ...f, fecha: e.target.value }))}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <select
            value={filters.staffId}
            onChange={(e) => setFilters((f) => ({ ...f, staffId: e.target.value }))}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Todos los empleados</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
          <select
            value={filters.estado}
            onChange={(e) => setFilters((f) => ({ ...f, estado: e.target.value }))}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ fecha: '', staffId: '', estado: '' })}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No hay turnos que coincidan.</div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Fecha / Hora</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Cliente</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Empleado</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Servicio</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Estado</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-700/30">
                    <td className="px-5 py-4">
                      <p className="text-sm font-mono text-gray-200">{a.fecha}</p>
                      <p className="text-xs text-gray-500">{a.hora_inicio} – {a.hora_fin}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-200">{a.client_nombre}</p>
                      <p className="text-xs text-gray-500">{a.client_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar emoji={a.staff_avatar ?? '✂️'} nombre={a.staff_nombre ?? ''} size="sm" />
                        <span className="text-sm text-gray-200">{a.staff_nombre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-200">{a.service_nombre}</p>
                      {a.service_precio !== undefined && (
                        <p className="text-xs text-violet-400">${a.service_precio.toLocaleString('es-AR')}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={a.estado} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <select
                        value={a.estado}
                        onChange={(e) => void handleStatusChange(a.id, e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      >
                        {STATUS_OPTIONS.filter((o) => o.value !== '').map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
