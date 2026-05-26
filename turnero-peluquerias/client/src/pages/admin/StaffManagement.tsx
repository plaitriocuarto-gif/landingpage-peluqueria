import React, { useState, useEffect, useCallback } from 'react';
import { Staff } from '../../types';
import { staffApi } from '../../api/staff';
import { useToast } from '../../contexts/ToastContext';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const EMOJI_OPTIONS = ['✂️', '💇', '💈', '👤', '🧑‍🎨', '💁', '🙋', '😊'];

interface StaffForm {
  nombre: string;
  avatar: string;
}

export function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState<StaffForm>({ nombre: '', avatar: '✂️' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const data = await staffApi.listAll();
      setStaff(data);
    } catch {
      showToast('Error al cargar empleados', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', avatar: '✂️' });
    setModalOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ nombre: s.nombre, avatar: s.avatar });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      showToast('El nombre es requerido', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await staffApi.update(editing.id, form);
        showToast('Empleado actualizado', 'success');
      } else {
        await staffApi.create(form);
        showToast('Empleado creado', 'success');
      }
      setModalOpen(false);
      await load();
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (s: Staff) => {
    try {
      if (s.activo) {
        await staffApi.deactivate(s.id);
        showToast('Empleado desactivado', 'info');
      } else {
        await staffApi.update(s.id, { activo: 1 });
        showToast('Empleado activado', 'success');
      }
      await load();
    } catch {
      showToast('Error al cambiar estado', 'error');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Empleados</h1>
        <Button onClick={openCreate}>+ Nuevo empleado</Button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {staff.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay empleados registrados.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Empleado</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Estado</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar emoji={s.avatar} nombre={s.nombre} size="sm" />
                      <span className="font-medium text-gray-200">{s.nombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={s.activo ? 'green' : 'red'}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(s)}>
                        Editar
                      </Button>
                      <Button
                        variant={s.activo ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => void handleToggle(s)}
                      >
                        {s.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar empleado' : 'Nuevo empleado'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Nombre del empleado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setForm((f) => ({ ...f, avatar: emoji }))}
                  className={`w-10 h-10 rounded-lg text-2xl flex items-center justify-center transition-all ${
                    form.avatar === emoji
                      ? 'bg-violet-600/20 ring-2 ring-violet-500'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" loading={saving} onClick={() => void handleSave()}>
              {editing ? 'Guardar cambios' : 'Crear empleado'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
