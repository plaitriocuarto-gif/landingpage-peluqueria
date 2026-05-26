import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ShopConfig } from '../types';
import { configApi } from '../api/config';

interface ConfigContextValue {
  config: ShopConfig;
  reloadConfig: () => Promise<void>;
}

const DEFAULT_CONFIG: ShopConfig = {
  nombre: 'Peluquería',
  logo: '✂️',
  color: '#7C3AED',
  cancellation_hours: '2',
  descripcion: '',
};

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ShopConfig>(DEFAULT_CONFIG);

  const reloadConfig = async () => {
    try {
      const data = await configApi.get();
      setConfig({ ...DEFAULT_CONFIG, ...data });
      const color = data.color ?? DEFAULT_CONFIG.color;
      document.documentElement.style.setProperty('--accent', color ?? '#7C3AED');
    } catch {
      // keep defaults
    }
  };

  useEffect(() => {
    void reloadConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, reloadConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
