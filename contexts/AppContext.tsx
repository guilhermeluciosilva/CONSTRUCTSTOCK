
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Tenant, Unit, Sector, Warehouse, Scope, RoleAssignment, OperationType, Role } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface AppContextType {
  tenants: Tenant[];
  units: Unit[];
  works: Unit[]; // Alias for compatibility
  sectors: Sector[];
  warehouses: Warehouse[];
  currentScope: Scope | null;
  activeRole: string;
  activeTenant: Tenant | null;
  activeUnit: Unit | null;
  setScope: (scope: Scope) => void;
  refreshMetadata: () => Promise<void>;
  isPermittedUnit: (unitId: string) => boolean;
  isPermittedWh: (whId: string) => boolean;
  getLabel: (key: 'UNIT' | 'SECTOR' | 'RM') => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [currentScope, setCurrentScope] = useState<Scope | null>(null);

  const activeTenant = useMemo(() => {
    return tenants.find(t => t.id === currentScope?.tenantId) || null;
  }, [tenants, currentScope]);

  const activeUnit = useMemo(() => {
    const uid = currentScope?.unitId || currentScope?.workId;
    return units.find(u => u.id === uid) || null;
  }, [units, currentScope]);

  const getLabel = (key: 'UNIT' | 'SECTOR' | 'RM'): string => {
    const type = activeTenant?.operationType || OperationType.CONSTRUCTION;
    const labels = {
      [OperationType.STORE]: { UNIT: 'Loja', SECTOR: 'Seção', RM: 'Pedido Interno' },
      [OperationType.CONSTRUCTION]: { UNIT: 'Obra', SECTOR: 'Frente de Serviço', RM: 'Requisição (RM)' },
      [OperationType.FACTORY]: { UNIT: 'Planta', SECTOR: 'Setor', RM: 'Requisição de Produção' },
    };
    return labels[type][key];
  };

  const refreshMetadata = async () => {
    const t = await api.getTenants();
    setTenants(t);
    
    const tid = currentScope?.tenantId;
    if (tid) {
      const u = await api.getWorks(tid);
      setUnits([...u]);
      
      const uid = currentScope.unitId || currentScope.workId;
      if (uid) {
        const wh = await api.getWarehouses(uid);
        setWarehouses([...wh]);
        
        // Auto-selecionar almoxarifado se houver apenas um ou se nenhum estiver selecionado
        if (wh.length > 0 && !currentScope.warehouseId) {
          setCurrentScope(prev => prev ? { ...prev, warehouseId: wh[0].id } : null);
        }

        if (activeTenant?.operationType === OperationType.FACTORY) {
           setSectors([{ id: 'sec1', unitId: uid, name: 'Produção A', active: true }]);
        } else {
           setSectors([]);
        }
      }
    }
  };

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`SCOPE_${user.id}`);
      if (saved) {
        setCurrentScope(JSON.parse(saved));
      } else {
        const initial = user.roleAssignments[0]?.scope;
        if (initial) setCurrentScope(initial);
      }
    }
  }, [user]);

  useEffect(() => {
    if (currentScope) {
      localStorage.setItem(`SCOPE_${user?.id}`, JSON.stringify(currentScope));
      refreshMetadata();
    }
  }, [currentScope?.tenantId, currentScope?.unitId, currentScope?.workId]);

  const activeRole = useMemo(() => {
    if (!user || !currentScope) return 'VIEWER';
    const match = user.roleAssignments.find(ra => {
      if (ra.scope.tenantId !== currentScope.tenantId) return false;
      if (ra.scope.warehouseId && ra.scope.warehouseId !== currentScope.warehouseId) return false;
      const uid = currentScope.unitId || currentScope.workId;
      const ruid = ra.scope.unitId || ra.scope.workId;
      if (ruid && ruid !== uid) return false;
      return true;
    });
    return match?.role || user.roleAssignments[0]?.role || 'VIEWER';
  }, [user, currentScope]);

  const isPermittedUnit = (unitId: string) => {
    if (!user) return false;
    if (user.roleAssignments.some(ra => ra.role === Role.OWNER)) return true;
    return user.roleAssignments.some(ra => {
       const ruid = ra.scope.unitId || ra.scope.workId;
       return !ruid || ruid === unitId;
    });
  };

  const isPermittedWh = (whId: string) => {
    if (!user) return false;
    if (user.roleAssignments.some(ra => ra.role === Role.OWNER)) return true;
    return user.roleAssignments.some(ra => !ra.scope.warehouseId || ra.scope.warehouseId === whId);
  };

  return (
    <AppContext.Provider value={{ 
      tenants, units, works: units, sectors, warehouses, currentScope, activeRole, activeTenant, activeUnit,
      setScope: setCurrentScope, refreshMetadata, isPermittedUnit, isPermittedWh, getLabel 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
