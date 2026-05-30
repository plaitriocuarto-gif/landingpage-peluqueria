import React, { useState, useEffect } from 'react';
import { Appointment, Staff } from '../../types';
import { appointmentsApi } from '../../api/appointments';
import { staffApi } from '../../api/staff';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function nDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('es-AR')}`;
}

function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(nDaysAgo(i));
  }
  return days;
}

function calcEarnings(appts: Appointment[]): number {
  return appts
    .filter((a) => a.estado === 'confirmado' || a.estado === 'completado')
    .reduce((sum, a) => sum + (a.service_precio ?? 0), 0);
}

const statusStyle: Record<string, { dot: string; label: string }> = {
  pendiente:  { dot: 'bg-amber-400',  label: 'Pendiente' },
  confirmado: { dot: 'bg-blue-400',   label: 'Confirmado' },
  completado: { dot: 'bg-emerald-400',label: 'Completado' },
  cancelado:  { dot: 'bg-red-400',    label: 'Cancelado' },
};

export function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      appointmentsApi.getAll({ fecha: today() }),
      staffApi.list(),
      appointmentsApi.getAll({ fechaInicio: nDaysAgo(6), fechaFin: today() }),
    ]).then(([appts, staffList, weekAppts]) => {
      setAppointments(appts);
      setStaff(staffList);
      setWeekAppointments(weekAppts);
    }).finally(() => setLoading(false));
  }, []);

  const byStaff = staff.map((s) => ({
    ...s,
    appointments: appointments
      .filter((a) => a.staff_id === s.id)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
  }));

  const gananciaHoy = calcEarnings(appointments);

  const stats = [
    { label: 'Total hoy',   value: String(appointments.length), emerald: false },
    { label: 'Pendientes',  value: String(appointments.filter((a) => a.estado === 'pendiente').length), emerald: false },
    { label: 'Confirmados', value: String(appointments.filter((a) => a.estado === 'confirmado').length), emerald: false },
    { label: 'Completados', value: String(appointments.filter((a) => a.estado === 'completado').length), emerald: false },
    { label: 'Ganancia hoy', value: formatCurrency(gananciaHoy), emerald: true },
  ];

  const last7Days = getLast7Days();
  const earningsByDay = last7Days.map((dateStr) => {
    const dayAppts = weekAppointments.filter((a) => a.fecha === dateStr);
    const billedCount = dayAppts.filter((a) => a.estado === 'confirmado' || a.estado === 'completado').length;
    return {
      dateStr,
      label: shortDate(dateStr),
      isToday: dateStr === today(),
      total: dayAppts.length,
      billed: billedCount,
      earnings: calcEarnings(dayAppts),
    };
  });

  const totalSemana = earningsByDay.reduce((s, d) => s + d.earnings, 0);

  const dateLabel = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Encabezado */}
      <div>
        <h1
          className="text-2xl text-[#111] capitalize"
          style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}
        >
          {dateLabel}
        </h1>
        <p className="text-sm text-[#888] mt-0.5">Resumen de turnos del día</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-[#EAEAEA] rounded-xl p-5">
            <p className="text-xs text-[#888] uppercase tracking-wide">{stat.label}</p>
            <p className={`text-2xl font-light mt-2 ${stat.emerald ? 'text-emerald-600 font-medium' : 'text-[#111]'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Turnos por empleado */}
      {byStaff.length === 0 ? (
        <div className="bg-white border border-[#EAEAEA] rounded-xl p-10 text-center text-[#888] text-sm">
          No hay empleados configurados aún.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {byStaff.map((s) => (
            <div key={s.id} className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden">
              {/* Header del empleado */}
              <div className="px-5 py-4 border-b border-[#EAEAEA] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0EFED] flex items-center justify-center text-base">
                    {s.avatar}
                  </div>
                  <span className="font-medium text-[#111] text-sm">{s.nombre}</span>
                </div>
                <span className="text-xs text-[#888]">
                  {s.appointments.length} turno{s.appointments.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Lista de turnos */}
              {s.appointments.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-[#bbb]">
                  Sin turnos hoy
                </div>
              ) : (
                <ul className="divide-y divide-[#F0EFED]">
                  {s.appointments.map((a) => {
                    const st = statusStyle[a.estado] ?? statusStyle.pendiente;
                    return (
                      <li key={a.id} className="px-5 py-3 flex items-center gap-4">
                        <span className="text-xs text-[#888] font-mono w-10 flex-shrink-0">
                          {a.hora_inicio}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#111] truncate">{a.client_nombre}</p>
                          <p className="text-xs text-[#888] truncate">{a.service_nombre}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          <span className="text-xs text-[#888]">{st.label}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ganancias esta semana */}
      <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAEAEA] flex items-center justify-between">
          <div>
            <h2
              className="text-base font-medium text-[#111]"
              style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.01em' }}
            >
              Ganancias estimadas
            </h2>
            <p className="text-xs text-[#888] mt-0.5">Últimos 7 días · turnos confirmados y completados</p>
          </div>
          <span className="text-base font-semibold text-emerald-600">
            {formatCurrency(totalSemana)}
          </span>
        </div>

        <div className="divide-y divide-[#F0EFED]">
          {earningsByDay.map((day) => (
            <div
              key={day.dateStr}
              className={`px-5 py-3 flex items-center gap-4 ${day.isToday ? 'bg-[#F9F9F8]' : ''}`}
            >
              <div className="w-28 flex-shrink-0">
                <span className={`text-sm capitalize ${day.isToday ? 'font-semibold text-[#111]' : 'text-[#555]'}`}>
                  {day.label}
                </span>
                {day.isToday && (
                  <span className="ml-2 text-[10px] text-[#888] bg-[#EAEAEA] px-1.5 py-0.5 rounded-full">
                    hoy
                  </span>
                )}
              </div>

              {/* Barra proporcional */}
              <div className="flex-1 h-2 bg-[#F0EFED] rounded-full overflow-hidden">
                {totalSemana > 0 && (
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((day.earnings / totalSemana) * 100, 100)}%` }}
                  />
                )}
              </div>

              <div className="text-right flex-shrink-0 w-28">
                <span className={`text-sm font-medium ${day.earnings > 0 ? 'text-emerald-600' : 'text-[#BDBDBD]'}`}>
                  {day.earnings > 0 ? formatCurrency(day.earnings) : '—'}
                </span>
                {day.billed > 0 && (
                  <p className="text-[11px] text-[#888]">
                    {day.billed} turno{day.billed !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
