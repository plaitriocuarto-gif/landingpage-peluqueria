import React, { useState, useEffect, FormEvent } from 'react';
import { ShopConfig } from '../../types';
import { configApi } from '../../api/config';
import { useConfig } from '../../contexts/ConfigContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const LOGO_OPTIONS = ['✂️', '💈', '💇', '🪮', '🧴', '👑', '⭐', '🌟'];

export function Config() {
  const [form, setForm] = useState<ShopConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { reloadConfig } = useConfig();
  const { showToast } = useToast();

  useEffect(() => {
    void configApi.get().then((data) => {
      setForm(data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await configApi.update(form);
      await reloadConfig();
      showToast('Configuración guardada', 'success');
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-100">Configuración</h1>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-200 text-lg">Información del local</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nombre del local
            </label>
            <input
              type="text"
              value={form.nombre ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Peluquería Mi Nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Descripción / Slogan
            </label>
            <textarea
              value={form.descripcion ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="Tu peluquería de confianza..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Logo (emoji)
            </label>
            <div className="flex flex-wrap gap-2">
              {LOGO_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, logo: emoji }))}
                  className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
                    form.logo === emoji
                      ? 'bg-violet-600/20 ring-2 ring-violet-500'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-200 text-lg">Apariencia</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Color principal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color ?? '#7C3AED'}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-10 w-16 rounded-lg cursor-pointer bg-gray-700 border border-gray-600"
              />
              <input
                type="text"
                value={form.color ?? '#7C3AED'}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-32"
                placeholder="#7C3AED"
              />
              <div
                className="w-10 h-10 rounded-lg"
                style={{ backgroundColor: form.color ?? '#7C3AED' }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-200 text-lg">Políticas</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Horas mínimas para cancelar
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.cancellation_hours ?? '2'}
                onChange={(e) => setForm((f) => ({ ...f, cancellation_hours: e.target.value }))}
                min={0}
                max={72}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 w-24"
              />
              <span className="text-gray-400 text-sm">horas antes del turno</span>
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" loading={saving}>
          Guardar configuración
        </Button>
      </form>
    </div>
  );
}
