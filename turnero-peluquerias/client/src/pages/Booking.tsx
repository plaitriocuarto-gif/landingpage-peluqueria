import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service, Staff } from '../types';
import { servicesApi } from '../api/services';
import { staffApi } from '../api/staff';
import { appointmentsApi } from '../api/appointments';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { BookingLayout } from '../components/layout/Layout';

// Steps: 1=Profesional 2=Servicio 3=Horario 4=Contacto(guest) 5=Confirmacion(guest)
type Step = 1 | 2 | 3 | 4 | 5;

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getNext30Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function getInitials(nombre: string): string {
  return nombre
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatLongDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// SVG icons ---------------------------------------------------------------

function IconCheck({ size = 12, stroke = '#111111' }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6L5 9L10 3" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5" stroke="#787774" strokeWidth="1.2" />
      <path d="M6.5 4V6.5L8 8" stroke="#787774" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// Stepper -----------------------------------------------------------------

interface StepperProps {
  labels: string[];
  current: Step;
}

function Stepper({ labels, current }: StepperProps) {
  return (
    <div className="flex items-start justify-center w-full overflow-x-auto pb-1">
      {labels.map((label, idx) => {
        const n = (idx + 1) as Step;
        const isCompleted = current > n;
        const isActive = current === n;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-14 sm:w-20">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                  isCompleted
                    ? 'border border-[#EAEAEA] bg-white text-[#111111]'
                    : isActive
                    ? 'bg-[#111111] text-white'
                    : 'border border-[#EAEAEA] bg-white text-[#787774]'
                }`}
              >
                {isCompleted ? <IconCheck /> : n}
              </div>
              <span
                className={`hidden sm:block text-center leading-tight text-[10px] ${
                  isActive ? 'text-[#111111] font-medium' : 'text-[#787774]'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < labels.length - 1 && (
              <div
                className={`flex-1 h-px mt-3.5 mx-1 transition-colors duration-300 ${
                  current > n ? 'bg-[#111111]' : 'bg-[#EAEAEA]'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Main component ----------------------------------------------------------

export function Booking() {
  const { user } = useAuth();
  const isGuest = !user;
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);

  const [guestNombre, setGuestNombre] = useState('');
  const [guestTelefono, setGuestTelefono] = useState('');

  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    void servicesApi.list().then(setServices);
    void staffApi.list().then(setStaff);
  }, []);

  useEffect(() => {
    if (selectedStaff && selectedDate && selectedService) {
      setLoadingSlots(true);
      setSlots([]);
      setSelectedSlot('');
      appointmentsApi
        .getAvailable(selectedStaff.id, selectedDate, selectedService.id)
        .then((data) => setSlots(data.slots))
        .catch(() => showToast('Error al cargar horarios', 'error'))
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedStaff, selectedDate, selectedService, showToast]);

  const handleBook = async () => {
    if (!selectedStaff || !selectedService || !selectedDate || !selectedSlot) return;
    setBooking(true);
    try {
      if (isGuest) {
        await appointmentsApi.guestBook({
          nombre: guestNombre,
          telefono: guestTelefono,
          staffId: selectedStaff.id,
          serviceId: selectedService.id,
          fecha: selectedDate,
          horaInicio: selectedSlot,
        });
        setStep(5);
      } else {
        await appointmentsApi.book({
          staffId: selectedStaff.id,
          serviceId: selectedService.id,
          fecha: selectedDate,
          horaInicio: selectedSlot,
        });
        showToast('¡Turno reservado exitosamente!', 'success');
        navigate('/my-appointments');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      showToast(msg ?? 'Error al reservar', 'error');
    } finally {
      setBooking(false);
    }
  };

  const days30 = getNext30Days();
  const todayStr = formatDate(new Date());

  const stepLabels = isGuest
    ? ['Profesional', 'Servicio', 'Horario', 'Contacto', 'Confirmación']
    : ['Profesional', 'Servicio', 'Horario'];

  const activeStaff = staff.filter((s) => s.activo);
  const activeServices = services.filter((s) => s.activo);

  // Shared heading style
  const headingStyle: React.CSSProperties = {
    fontFamily: 'var(--font-serif)',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  };

  // Shared button styles
  const btnPrimary =
    'px-8 py-2.5 bg-[#111111] text-white text-sm font-medium rounded-md hover:bg-[#333333] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2';
  const btnSecondary =
    'px-6 py-2.5 border border-[#EAEAEA] text-[#111111] text-sm font-medium rounded-md hover:bg-white transition-all duration-200';

  // Summary rows for step 3 sidebar and step 5 card
  const summaryRows = [
    { label: 'Profesional', value: selectedStaff?.nombre },
    { label: 'Servicio', value: selectedService?.nombre },
    { label: 'Precio', value: selectedService ? `$${selectedService.precio.toLocaleString('es-AR')}` : undefined },
    { label: 'Fecha', value: selectedDate ? formatLongDate(selectedDate) : undefined },
    { label: 'Hora', value: selectedSlot || undefined },
  ];

  return (
    <BookingLayout>
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* ── Step 5: Confirmación ────────────────────────────────────────── */}
        {step === 5 && (
          <div className="step-entry flex flex-col items-center py-16 space-y-8">
            <div className="w-14 h-14 rounded-full border border-[#EAEAEA] bg-white flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 12L9.5 17.5L20 7" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="text-center">
              <h1 style={headingStyle} className="text-4xl text-[#111111] mb-2">
                Turno reservado
              </h1>
              <p className="text-[#787774] text-sm">
                Te esperamos, {guestNombre}.
              </p>
            </div>

            <div className="w-full max-w-sm border border-[#EAEAEA] rounded-xl bg-white overflow-hidden">
              {summaryRows.map((row, i) => (
                <div
                  key={row.label}
                  className={`flex justify-between items-center px-5 py-3.5 ${
                    i < summaryRows.length - 1 ? 'border-b border-[#EAEAEA]' : ''
                  }`}
                >
                  <span className="text-sm text-[#787774]">{row.label}</span>
                  <span className={`text-sm text-[#111111] ${row.label === 'Precio' ? 'font-bold' : 'font-medium'}`}>
                    {row.value ?? <span className="text-[#EAEAEA]">—</span>}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-2.5 px-5 bg-[#111111] text-white text-sm font-medium rounded-md hover:bg-[#333333] active:scale-[0.98] transition-all duration-200"
              >
                Volver al inicio
              </button>
              <button
                onClick={() => {
                  const start = new Date(`${selectedDate}T${selectedSlot}:00`);
                  const end = new Date(start.getTime() + (selectedService?.duracion_minutos ?? 60) * 60000);
                  const fmt = (d: Date) =>
                    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Turno: ${selectedService?.nombre ?? ''}`)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(`Profesional: ${selectedStaff?.nombre ?? ''}`)}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="flex-1 py-2.5 px-5 border border-[#EAEAEA] bg-white text-[#111111] text-sm font-medium rounded-md hover:bg-[#F7F6F3] transition-all duration-200"
              >
                Agregar al calendario
              </button>
            </div>
          </div>
        )}

        {/* ── Steps 1-4 ───────────────────────────────────────────────────── */}
        {step !== 5 && (
          <>
            {/* Stepper */}
            <div className="step-entry mb-10 max-w-lg mx-auto">
              <Stepper labels={stepLabels} current={step} />
            </div>

            {/* ── Step 1: Profesional ──────────────────────────────────────── */}
            {step === 1 && (
              <div className="step-entry space-y-6">
                <h2 style={headingStyle} className="text-3xl text-[#111111]">
                  Elegí tu profesional
                </h2>

                {activeStaff.length === 0 && staff.length === 0 ? (
                  <div className="flex justify-center py-16">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeStaff.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStaff(s)}
                        style={{ '--index': idx } as React.CSSProperties}
                        className={`stagger-item text-left p-6 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                          selectedStaff?.id === s.id
                            ? 'border-2 border-[#111111] bg-[#F9F9F8]'
                            : 'border border-[#EAEAEA] bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-full bg-[#EDECEA] flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-[#2F3437]">
                            {getInitials(s.nombre)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#111111] text-sm truncate">{s.nombre}</div>
                          <div className="text-xs text-[#787774] mt-0.5">Profesional</div>
                        </div>
                        {selectedStaff?.id === s.id && (
                          <div className="flex-shrink-0">
                            <IconCheck size={16} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    disabled={!selectedStaff}
                    onClick={() => setStep(2)}
                    className={btnPrimary}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Servicio ─────────────────────────────────────────── */}
            {step === 2 && (
              <div className="step-entry space-y-6">
                <h2 style={headingStyle} className="text-3xl text-[#111111]">
                  ¿Qué servicio necesitás?
                </h2>

                {activeServices.length === 0 && services.length === 0 ? (
                  <div className="flex justify-center py-16">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeServices.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedService(s)}
                        style={{ '--index': idx } as React.CSSProperties}
                        className={`stagger-item w-full text-left p-5 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                          selectedService?.id === s.id
                            ? 'border-2 border-[#111111] bg-[#F9F9F8]'
                            : 'border border-[#EAEAEA] bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-[#111111] text-sm">{s.nombre}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#787774] text-xs flex-shrink-0">
                          <IconClock />
                          <span>{s.duracion_minutos}&nbsp;min</span>
                        </div>
                        <span className="font-bold text-[#111111] text-sm flex-shrink-0">
                          ${s.precio.toLocaleString('es-AR')}
                        </span>
                        {selectedService?.id === s.id && (
                          <div className="flex-shrink-0">
                            <IconCheck size={16} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)} className={btnSecondary}>
                    Volver
                  </button>
                  <button
                    disabled={!selectedService}
                    onClick={() => setStep(3)}
                    className={btnPrimary}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Horario ──────────────────────────────────────────── */}
            {step === 3 && (
              <div className="step-entry">
                <h2 style={headingStyle} className="text-3xl text-[#111111] mb-6">
                  Elegí día y horario
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Calendar + slots — left 2/3 */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[#787774] font-medium mb-3">
                        Fecha
                      </p>
                      <div className="grid grid-cols-7 gap-1.5">
                        {days30.map((d) => {
                          const str = formatDate(d);
                          const isSelected = selectedDate === str;
                          const isToday = str === todayStr;
                          return (
                            <button
                              key={str}
                              onClick={() => setSelectedDate(str)}
                              className={`py-2 rounded-md text-center transition-all duration-150 ${
                                isSelected
                                  ? 'bg-[#111111] text-white'
                                  : 'border border-[#EAEAEA] bg-white text-[#2F3437] hover:bg-[#F7F6F3]'
                              }`}
                            >
                              <div className={`text-[9px] leading-none mb-0.5 ${isSelected ? 'text-white/70' : 'text-[#787774]'}`}>
                                {DAYS[d.getDay()]}
                              </div>
                              <div className={`text-sm leading-none ${isToday && !isSelected ? 'font-bold' : 'font-medium'}`}>
                                {d.getDate()}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedDate && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-[#787774] font-medium mb-3">
                          Horario disponible
                        </p>
                        {loadingSlots ? (
                          <div className="flex justify-center py-8">
                            <LoadingSpinner />
                          </div>
                        ) : slots.length === 0 ? (
                          <p className="text-[#787774] text-sm py-4">
                            No hay horarios disponibles para este día.
                          </p>
                        ) : (
                          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                            {slots.map((slot) => (
                              <button
                                key={slot}
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                                  selectedSlot === slot
                                    ? 'bg-[#111111] text-white'
                                    : 'border border-[#EAEAEA] bg-white text-[#2F3437] hover:bg-[#F7F6F3]'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Summary sidebar — right 1/3 */}
                  <div className="lg:sticky lg:top-20">
                    <div className="border border-[#EAEAEA] rounded-xl bg-white overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-[#EAEAEA]">
                        <p className="text-xs uppercase tracking-widest text-[#787774] font-medium">
                          Resumen
                        </p>
                      </div>
                      {summaryRows.map((row, i) => (
                        <div
                          key={row.label}
                          className={`flex justify-between items-center px-5 py-3 ${
                            i < summaryRows.length - 1 ? 'border-b border-[#EAEAEA]' : ''
                          }`}
                        >
                          <span className="text-xs text-[#787774]">{row.label}</span>
                          <span className="text-xs font-medium text-[#111111] text-right max-w-[56%] truncate">
                            {row.value ?? <span className="text-[#BDBDBD]">—</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button onClick={() => setStep(2)} className={btnSecondary}>
                    Volver
                  </button>
                  {isGuest ? (
                    <button
                      disabled={!selectedDate || !selectedSlot}
                      onClick={() => setStep(4)}
                      className={btnPrimary}
                    >
                      Continuar
                    </button>
                  ) : (
                    <button
                      disabled={!selectedDate || !selectedSlot || booking}
                      onClick={() => void handleBook()}
                      className={btnPrimary}
                    >
                      {booking && <LoadingSpinner size="sm" />}
                      Confirmar turno
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 4: Contacto (guest only) ────────────────────────────── */}
            {step === 4 && isGuest && (
              <div className="step-entry space-y-6 max-w-md">
                <div>
                  <h2 style={headingStyle} className="text-3xl text-[#111111]">
                    ¿Cómo te avisamos?
                  </h2>
                  <p className="text-[#787774] text-sm mt-2">
                    Solo para confirmarte el turno por WhatsApp.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1.5">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={guestNombre}
                      onChange={(e) => setGuestNombre(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full border border-[#EAEAEA] rounded-md px-4 py-2.5 text-[#111111] text-sm placeholder-[#BDBDBD] bg-white focus:outline-none focus:border-[#111111] transition-colors duration-150"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1.5">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={guestTelefono}
                      onChange={(e) => setGuestTelefono(e.target.value)}
                      placeholder="3585 000000"
                      className="w-full border border-[#EAEAEA] rounded-md px-4 py-2.5 text-[#111111] text-sm placeholder-[#BDBDBD] bg-white focus:outline-none focus:border-[#111111] transition-colors duration-150"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(3)} className={btnSecondary}>
                    Volver
                  </button>
                  <button
                    disabled={!guestNombre.trim() || !guestTelefono.trim() || booking}
                    onClick={() => void handleBook()}
                    className={btnPrimary}
                  >
                    {booking && <LoadingSpinner size="sm" />}
                    Confirmar turno
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </BookingLayout>
  );
}
