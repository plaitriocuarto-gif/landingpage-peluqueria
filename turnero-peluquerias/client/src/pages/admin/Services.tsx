import React, { useState, useEffect, useCallback } from 'react';
import { Service } from '../../types';
import { servicesApi } from '../../api/services';
import { useToast } from '../../contexts/ToastContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface ServiceForm {
  nombre: string;
  duracion_minutos: number;
  precio: number;
}

export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>({ nombre: '', duracion_minutos: 30, precio: 0 });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const data = await servicesApi.listAll();
      setServices(data);
    } catch {
      showToast('Error al cargar servicios', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', duracion_minutos: 30, precio: 0 });
    setModalOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ nombre: s.nombre, duracion_minutos: s.duracion_minutos, precio: s.precio });
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
        await servicesApi.update(editing.id, form);
        showToast('Servicio actualizado', 'success');
      } else {
        await servicesApi.create(form);
        showToast('Servicio creado', 'success');
      }
      setModalOpen(false);
      await load();
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (s: Service) => {
    try {
      if (s.activo) {
        await servicesApi.deactivate(s.id);
        showToast('Servicio desactivado', 'info');
      } else {
        await servicesApi.update(s.id, { activo: 1 });
        showToast('Servicio activado', 'success');
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
        <h1 className="text-2xl font-bold text-gray-100">Servicios</h1>
        <Button onClick={openCreate}>+ Nuevo servicio</Button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {services.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay servicios registrados.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Servicio</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Duración</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Precio</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Estado</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {services.map((s) => (
                <tr key={s.id}>
                  <td className="px-6 py-4 font-medium text-gray-200">{s.nombre}</td>
                  <td className="px-6 py-4 text-gray-400">{s.duracion_minutos} min</td>
                  <td className="px-6 py-4 text-violet-400 font-semibold">
                    ${s.precio.toLocaleString('es-AR')}
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
        title={editing ? 'Editar servicio' : 'Nuevo servicio'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Ej: Corte de cabello"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Duración (minutos)</label>
              <input
                type="number"
                value={form.duracion_minutos}
                onChange={(e) => setForm((f) => ({ ...f, duracion_minutos: Number(e.target.value) }))}
                min={5}
                step={5}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Precio ($)</label>
              <input
                type="number"
                value={form.precio}
                onChange={(e) => setForm((f) => ({ ...f, precio: Number(e.target.value) }))}
                min={0}
                step={50}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1" loading={saving} onClick={() => void handleSave()}>
              {editing ? 'Guardar cambios' : 'Crear servicio'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
