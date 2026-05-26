import React, { useState, useEffect, useCallback } from 'react';
import { Appointment } from '../../types';
import { appointmentsApi } from '../../api/appointments';
import { useToast } from '../../contexts/ToastContext';
import { StatusBadge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StaffLayout } from '../../components/layout/Layout';

function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function MySchedule() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(() => weekStart(new Date()));
  const { showToast } = useToast();

  const load = useCallback(async (weekDate: Date) => {
    setLoading(true);
    try {
      const data = await appointmentsApi.getStaffAppointments({
        semana: formatDate(weekDate),
      });
      setAppointments(data);
    } catch {
      showToast('Error al cargar agenda', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(currentWeek); }, [load, currentWeek]);

  const prevWeek = () => {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() - 7);
    setCurrentWeek(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() + 7);
    setCurrentWeek(d);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = formatDate(new Date());

  const apptsByDay: Record<string, Appointment[]> = {};
  for (const a of appointments) {
    if (!apptsByDay[a.fecha]) apptsByDay[a.fecha] = [];
    apptsByDay[a.fecha].push(a);
  }

  const weekLabel = `${currentWeek.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-100">Mi Agenda</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={prevWeek}
              className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
            >
              ‹
            </button>
            <span className="text-sm text-gray-300 min-w-40 text-center">{weekLabel}</span>
            <button
              onClick={nextWeek}
              className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
            >
              ›
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((d) => {
              const dateStr = formatDate(d);
              const isToday = dateStr === today;
              const dayAppts = apptsByDay[dateStr] ?? [];

              return (
                <div key={dateStr} className={`min-h-32 rounded-xl border ${
                  isToday ? 'border-violet-500 bg-violet-600/5' : 'border-gray-700 bg-gray-800'
                }`}>
                  <div className={`px-3 py-2 border-b ${isToday ? 'border-violet-500/30' : 'border-gray-700'}`}>
                    <p className={`text-xs font-semibold uppercase ${isToday ? 'text-violet-400' : 'text-gray-500'}`}>
                      {DAY_LABELS[d.getDay()]}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-violet-300' : 'text-gray-300'}`}>
                      {d.getDate()}
                    </p>
                  </div>
                  <div className="p-1.5 space-y-1">
                    {dayAppts.length === 0 ? (
                      <p className="text-xs text-gray-600 text-center py-2">–</p>
                    ) : (
                      dayAppts
                        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                        .map((a) => (
                          <div
                            key={a.id}
                            className="rounded-lg bg-gray-700 p-1.5 text-xs"
                          >
                            <p className="font-mono text-gray-300 text-[10px]">{a.hora_inicio}</p>
                            <p className="font-medium text-gray-200 truncate">{a.client_nombre}</p>
                            <p className="text-gray-500 truncate">{a.service_nombre}</p>
                            <div className="mt-1">
                              <StatusBadge status={a.estado} />
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-gray-200 mb-4">
            Hoy — {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          {(apptsByDay[today] ?? []).length === 0 ? (
            <p className="text-gray-500 text-sm">Sin turnos hoy.</p>
          ) : (
            <div className="space-y-3">
              {(apptsByDay[today] ?? [])
                .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                .map((a) => (
                  <div key={a.id} className="flex items-center justify-between border border-gray-700 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-violet-400 text-sm font-bold">{a.hora_inicio}</span>
                      <div>
                        <p className="font-medium text-gray-200">{a.client_nombre}</p>
                        <p className="text-sm text-gray-500">{a.service_nombre} · {a.duracion_minutos} min</p>
                      </div>
                    </div>
                    <StatusBadge status={a.estado} />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
