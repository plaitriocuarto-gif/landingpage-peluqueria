import React, { useState, useEffect, useCallback } from 'react';
import { Appointment } from '../types';
import { appointmentsApi } from '../api/appointments';
import { useToast } from '../contexts/ToastContext';
import { StatusBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PublicLayout } from '../components/layout/Layout';

export function MyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState<number | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const data = await appointmentsApi.getMyAppointments();
      setAppointments(data);
    } catch {
      showToast('Error al cargar los turnos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCancel = async (id: number) => {
    setCanceling(id);
    try {
      await appointmentsApi.cancel(id);
      showToast('Turno cancelado', 'success');
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      showToast(msg ?? 'Error al cancelar', 'error');
    } finally {
      setCanceling(null);
    }
  };

  const upcoming = appointments.filter(
    (a) => a.estado !== 'cancelado' && a.estado !== 'completado'
  );
  const past = appointments.filter(
    (a) => a.estado === 'cancelado' || a.estado === 'completado'
  );

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-100 mb-6">Mis turnos</h1>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-gray-400 text-lg">No tenés turnos reservados.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Próximos
                </h2>
                <div className="space-y-3">
                  {upcoming.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      onCancel={() => void handleCancel(a.id)}
                      canceling={canceling === a.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Historial
                </h2>
                <div className="space-y-3">
                  {past.map((a) => (
                    <AppointmentCard key={a.id} appointment={a} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel?: () => void;
  canceling?: boolean;
}

function AppointmentCard({ appointment: a, onCancel, canceling }: AppointmentCardProps) {
  const dateLabel = new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const canCancel = a.estado === 'pendiente' || a.estado === 'confirmado';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar emoji={a.staff_avatar ?? '✂️'} nombre={a.staff_nombre ?? ''} size="sm" />
          <div>
            <p className="font-semibold text-gray-100">{a.service_nombre}</p>
            <p className="text-sm text-gray-400">con {a.staff_nombre}</p>
          </div>
        </div>
        <StatusBadge status={a.estado} />
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-gray-500">Fecha: </span>
          <span className="text-gray-200 capitalize">{dateLabel}</span>
        </div>
        <div>
          <span className="text-gray-500">Horario: </span>
          <span className="text-gray-200">{a.hora_inicio} – {a.hora_fin}</span>
        </div>
        {a.service_precio !== undefined && (
          <div>
            <span className="text-gray-500">Precio: </span>
            <span className="text-violet-400 font-medium">
              ${a.service_precio.toLocaleString('es-AR')}
            </span>
          </div>
        )}
      </div>

      {canCancel && onCancel && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <Button
            variant="danger"
            size="sm"
            loading={canceling}
            onClick={onCancel}
          >
            Cancelar turno
          </Button>
        </div>
      )}
    </div>
  );
}
