import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service, Staff } from '../types';
import { servicesApi } from '../api/services';
import { staffApi } from '../api/staff';
import { appointmentsApi } from '../api/appointments';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ServiceCard } from '../components/ui/ServiceCard';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PublicLayout } from '../components/layout/Layout';

// Step 0 = datos de contacto (solo para invitados)
// Step 1 = servicio, 2 = profesional + fecha, 3 = horario, 4 = confirmación invitado
type Step = 0 | 1 | 2 | 3 | 4;

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getNext14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

export function Booking() {
  const { user } = useAuth();
  const isGuest = !user;

  const [step, setStep] = useState<Step>(isGuest ? 0 : 1);

  // Guest contact info
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

  const { showToast } = useToast();
  const navigate = useNavigate();

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
        setStep(4);
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

  const days14 = getNext14Days();

  // Progress bar steps (visible steps 1-3 after contact)
  const visibleStep = isGuest ? step : step; // 1, 2, 3

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Paso 4: confirmación para invitados */}
        {step === 4 && (
          <div className="text-center py-12 space-y-6">
            <div className="text-6xl">✅</div>
            <h2 className="text-2xl font-bold text-white">¡Turno reservado!</h2>
            <p className="text-white/60 max-w-sm mx-auto">
              Tu turno quedó confirmado, {guestNombre}. Te esperamos el{' '}
              <strong className="text-white">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </strong>{' '}
              a las <strong className="text-white">{selectedSlot}</strong> hs.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-left max-w-xs mx-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-white/50">Servicio</span>
                <span className="text-white font-medium">{selectedService?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Profesional</span>
                <span className="text-white font-medium">{selectedStaff?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Precio</span>
                <span className="text-white font-bold">
                  ${selectedService?.precio.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-8 py-3 bg-white text-[#0D215B] font-bold rounded-xl
                hover:bg-white/90 transition-all duration-200"
            >
              Volver al inicio
            </button>
          </div>
        )}

        {step !== 4 && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-4">Reservar turno</h1>

              {/* Progress dots: contacto → servicio → profesional → horario */}
              <div className="flex gap-2 items-center">
                {(isGuest
                  ? [
                      { n: 0, label: 'Contacto' },
                      { n: 1, label: 'Servicio' },
                      { n: 2, label: 'Profesional' },
                      { n: 3, label: 'Horario' },
                    ]
                  : [
                      { n: 1, label: 'Servicio' },
                      { n: 2, label: 'Profesional' },
                      { n: 3, label: 'Horario' },
                    ]
                ).map((s, idx, arr) => (
                  <React.Fragment key={s.n}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                          step >= s.n
                            ? 'bg-white text-[#0D215B]'
                            : 'bg-white/10 text-white/40'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span
                        className={`text-sm hidden sm:block ${
                          step >= s.n ? 'text-white' : 'text-white/30'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="w-6 h-px bg-white/15 mx-1" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Paso 0: datos de contacto (solo invitados) */}
            {step === 0 && isGuest && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-white mb-1">¿Cómo te contactamos?</h2>
                <p className="text-white/50 text-sm mb-5">
                  No hace falta crear una cuenta. Solo ingresá tu nombre y teléfono.
                </p>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={guestNombre}
                    onChange={(e) => setGuestNombre(e.target.value)}
                    placeholder="Juan García"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5
                      text-white placeholder-white/25 focus:outline-none focus:ring-2
                      focus:ring-white/30 focus:border-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={guestTelefono}
                    onChange={(e) => setGuestTelefono(e.target.value)}
                    placeholder="3585 123456"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5
                      text-white placeholder-white/25 focus:outline-none focus:ring-2
                      focus:ring-white/30 focus:border-white/30 transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    disabled={!guestNombre.trim() || !guestTelefono.trim()}
                    onClick={() => setStep(1)}
                    className="w-full py-3 bg-white text-[#0D215B] font-bold rounded-xl
                      hover:bg-white/90 active:scale-[0.98] transition-all duration-200
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Paso 1: servicio */}
            {step === 1 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white mb-4">Elegí un servicio</h2>
                {services.length === 0 ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : (
                  services.map((s) => (
                    <ServiceCard
                      key={s.id}
                      service={s}
                      selected={selectedService?.id === s.id}
                      onClick={() => setSelectedService(s)}
                    />
                  ))
                )}
                <div className="pt-4 flex gap-3">
                  {isGuest && (
                    <Button
                      variant="secondary"
                      onClick={() => setStep(0)}
                      className="flex-1"
                    >
                      Volver
                    </Button>
                  )}
                  <Button
                    disabled={!selectedService}
                    onClick={() => setStep(2)}
                    className={`${isGuest ? 'flex-1' : 'w-full'} bg-white text-[#0D215B] hover:bg-white/90 border-0`}
                    size="lg"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* Paso 2: profesional + fecha */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">
                    Elegí un profesional
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {staff.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStaff(s)}
                        className={`p-4 rounded-xl border transition-all text-left flex items-center gap-3 ${
                          selectedStaff?.id === s.id
                            ? 'border-white/60 bg-white/10'
                            : 'border-white/10 bg-white/5 hover:border-white/25'
                        }`}
                      >
                        <Avatar emoji={s.avatar} nombre={s.nombre} size="sm" />
                        <span className="font-medium text-white text-sm">{s.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedStaff && (
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-3">
                      Elegí una fecha
                    </h2>
                    <div className="grid grid-cols-7 gap-1.5">
                      {days14.map((d) => {
                        const str = formatDate(d);
                        const isSelected = selectedDate === str;
                        return (
                          <button
                            key={str}
                            onClick={() => setSelectedDate(str)}
                            className={`p-2 rounded-lg text-center transition-all ${
                              isSelected
                                ? 'bg-white text-[#0D215B] font-bold'
                                : 'bg-white/5 border border-white/10 text-white/70 hover:border-white/30'
                            }`}
                          >
                            <div className="text-xs opacity-70">{DAYS[d.getDay()]}</div>
                            <div className="text-sm font-semibold">{d.getDate()}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Volver
                  </Button>
                  <Button
                    disabled={!selectedStaff || !selectedDate}
                    onClick={() => setStep(3)}
                    className="flex-1 bg-white text-[#0D215B] hover:bg-white/90 border-0"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* Paso 3: horario */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Servicio</span>
                    <span className="text-white font-medium">{selectedService?.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Profesional</span>
                    <span className="text-white font-medium">{selectedStaff?.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Fecha</span>
                    <span className="text-white font-medium">
                      {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Precio</span>
                    <span className="text-white font-bold">
                      ${selectedService?.precio.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">
                    Elegí un horario
                  </h2>
                  {loadingSlots ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-white/40 text-center py-8">
                      No hay horarios disponibles para este día.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                            selectedSlot === slot
                              ? 'bg-white text-[#0D215B] font-bold'
                              : 'bg-white/5 border border-white/10 text-white/70 hover:border-white/30'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Volver
                  </Button>
                  <button
                    disabled={!selectedSlot || booking}
                    onClick={() => void handleBook()}
                    className="flex-1 py-2.5 bg-white text-[#0D215B] font-bold rounded-lg
                      hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2"
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
    </PublicLayout>
  );
}
