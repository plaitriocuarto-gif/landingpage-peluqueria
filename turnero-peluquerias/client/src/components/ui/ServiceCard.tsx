import React from 'react';
import { Service } from '../../types';

interface ServiceCardProps {
  service: Service;
  selected?: boolean;
  onClick?: () => void;
}

export function ServiceCard({ service, selected = false, onClick }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
        selected
          ? 'border-violet-500 bg-violet-600/10 ring-1 ring-violet-500'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-100 truncate">{service.nombre}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{service.duracion_minutos} minutos</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-violet-400">
            ${service.precio.toLocaleString('es-AR')}
          </p>
        </div>
      </div>
      {selected && (
        <div className="mt-2 flex items-center gap-1 text-violet-400 text-xs font-medium">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Seleccionado
        </div>
      )}
    </button>
  );
}
