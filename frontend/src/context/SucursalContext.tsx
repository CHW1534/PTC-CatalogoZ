import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sucursalesService } from '../services';
import type { Sucursal } from '../types';

interface SucursalContextType {
  sucursales: Sucursal[];
  selectedSucursal: Sucursal | null;
  setSelectedSucursal: (sucursal: Sucursal | null) => void;
  isLoading: boolean;
}

const SucursalContext = createContext<SucursalContextType | undefined>(undefined);

export function SucursalProvider({ children }: { children: ReactNode }) {
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null);

  const { data: sucursales = [], isLoading } = useQuery({
    queryKey: ['sucursales'],
    queryFn: sucursalesService.getAll,
  });

  // Seleccionar primera sucursal por defecto
  useEffect(() => {
    if (sucursales.length > 0 && !selectedSucursal) {
      setSelectedSucursal(sucursales[0]);
    }
  }, [sucursales, selectedSucursal]);

  return (
    <SucursalContext.Provider
      value={{
        sucursales,
        selectedSucursal,
        setSelectedSucursal,
        isLoading,
      }}
    >
      {children}
    </SucursalContext.Provider>
  );
}

export function useSucursal() {
  const context = useContext(SucursalContext);
  if (context === undefined) {
    throw new Error('useSucursal debe usarse dentro de SucursalProvider');
  }
  return context;
}
