import React, { useState, useEffect, useCallback } from 'react';
import { Staff, StaffSchedule, StaffException } from '../../types';
import { staffApi } from '../../api/staff';
import { useToast } from '../../contexts/ToastContext';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface ScheduleRow {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  slot_minutos: number;
  active: boolean;
}

function buildRows(schedules: StaffSchedule[]): ScheduleRow[] {
  return [1, 2, 3, 4, 5, 6, 0].map((day) => {
    const found = schedules.find((s) => s.dia_semana === day);
    return {
      dia_semana: day,
      hora_inicio: found?.hora_inicio ?? '09:00',
      hora_fin: found?.hora_fin ?? '18:00',
      slot_minutos: found?.slot_minutos ?? 30,
      active: !!found,
    };
  });
}

export function Schedules() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [exceptions, setExceptions] = useState<StaffException[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exModal, setExModal] = useState(false);
  const [exForm, setExForm] = useState({
    fecha: '',
    tipo: 'libre' as 'libre' | 'horario_especial',
    hora_inicio: '',
    hora_fin: '',
    motivo: '',
  });
  const { showToast } = useToast();

  useEffect(() => {
    void staffApi.list().then(setStaff);
  }, []);

  const loadSchedule = useCallback(async (s: Staff) => {
    setLoading(true);
    try {
      const data = await staffApi.getSchedule(s.id);
      setRows(buildRows(data.schedules));
      setExceptions(data.exceptions);
    } catch {
      showToast('Error al cargar horario', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleSelectStaff = (s: Staff) => {
    setSelectedStaff(s);
    void loadSchedule(s);
  };

  const updateRow = (day: number, field: keyof ScheduleRow, value: string | number | boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.dia_semana === day ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    try {
      const payload = rows.map((r) => ({
        dia_semana: r.dia_semana,
        hora_inicio: r.active ? r.hora_inicio : '',
        hora_fin: r.active ? r.hora_fin : '',
        slot_minutos: r.slot_minutos,
      }));
      await staffApi.updateSchedule(selectedStaff.id, payload);
      showToast('Horario guardado', 'success');
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddException = async () => {
    if (!selectedStaff || !exForm.fecha) return;
    try {
      await staffApi.addException(selectedStaff.id, exForm);
      showToast('Excepción agregada', 'success');
      setExModal(false);
      await loadSchedule(selectedStaff);
    } catch {
      showToast('Error al agregar excepción', 'error');
    }
  };

  const handleDeleteException = async (exId: number) => {
    if (!selectedStaff) return;
    try {
      await staffApi.deleteException(selectedStaff.id, exId);
      showToast('Excepción eliminada', 'info');
      await loadSchedule(selectedStaff);
    } catch {
      showToast('Error al eliminar', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Horarios</h1>

      <div className="flex flex-wrap gap-3">
        {staff.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelectStaff(s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              selectedStaff?.id === s.id
                ? 'border-violet-500 bg-violet-600/10 text-violet-300'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
            }`}
          >
            <Avatar emoji={s.avatar} nombre={s.nombre} size="sm" />
            <span className="font-medium text-sm">{s.nombre}</span>
          </button>
        ))}
      </div>

      {!selectedStaff && (
        <div className="text-center py-12 text-gray-500">
          Seleccioná un empleado para editar su horario.
        </div>
      )}

      {selectedStaff && loading && (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      )}

      {selectedStaff && !loading && (
        <>
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="font-semibold text-gray-200">
                Horario semanal — {selectedStaff.nombre}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3 w-28">Día</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Activo</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Inicio</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Fin</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Slot (min)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {rows.map((row) => (
                    <tr key={row.dia_semana}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-200">
                          {DAYS_FULL[row.dia_semana]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={row.active}
                          onChange={(e) => updateRow(row.dia_semana, 'active', e.target.checked)}
                          className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={row.hora_inicio}
                          disabled={!row.active}
                          onChange={(e) => updateRow(row.dia_semana, 'hora_inicio', e.target.value)}
                          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-200 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={row.hora_fin}
                          disabled={!row.active}
                          onChange={(e) => updateRow(row.dia_semana, 'hora_fin', e.target.value)}
                          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-200 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={row.slot_minutos}
                          disabled={!row.active}
                          onChange={(e) => updateRow(row.dia_semana, 'slot_minutos', Number(e.target.value))}
                          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-200 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          {[15, 20, 30, 45, 60].map((m) => (
                            <option key={m} value={m}>{m} min</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
              <Button loading={saving} onClick={() => void handleSave()}>
                Guardar horario
              </Button>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-200">Excepciones / Días libres</h2>
              <Button variant="secondary" size="sm" onClick={() => setExModal(true)}>
                + Agregar
              </Button>
            </div>

            {exceptions.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay excepciones registradas.</p>
            ) : (
              <div className="space-y-2">
                {exceptions.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between border border-gray-700 rounded-lg px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-gray-300">{ex.fecha}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        ex.tipo === 'libre' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {ex.tipo === 'libre' ? 'Día libre' : 'Horario especial'}
                      </span>
                      {ex.tipo === 'horario_especial' && (
                        <span className="text-gray-400">{ex.hora_inicio} – {ex.hora_fin}</span>
                      )}
                      {ex.motivo && <span className="text-gray-500">{ex.motivo}</span>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDeleteException(ex.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={exModal} onClose={() => setExModal(false)} title="Agregar excepción">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Fecha</label>
            <input
              type="date"
              value={exForm.fecha}
              onChange={(e) => setExForm((f) => ({ ...f, fecha: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Tipo</label>
            <select
              value={exForm.tipo}
              onChange={(e) => setExForm((f) => ({ ...f, tipo: e.target.value as 'libre' | 'horario_especial' }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="libre">Día libre</option>
              <option value="horario_especial">Horario especial</option>
            </select>
          </div>
          {exForm.tipo === 'horario_especial' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Inicio</label>
                <input
                  type="time"
                  value={exForm.hora_inicio}
                  onChange={(e) => setExForm((f) => ({ ...f, hora_inicio: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Fin</label>
                <input
                  type="time"
                  value={exForm.hora_fin}
                  onChange={(e) => setExForm((f) => ({ ...f, hora_fin: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Motivo (opcional)</label>
            <input
              type="text"
              value={exForm.motivo}
              onChange={(e) => setExForm((f) => ({ ...f, motivo: e.target.value }))}
              placeholder="Ej: Vacaciones"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setExModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={() => void handleAddException()}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
