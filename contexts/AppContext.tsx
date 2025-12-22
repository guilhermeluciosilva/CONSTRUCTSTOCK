
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Tenant, Unit, Sector, Warehouse, Scope, RoleAssignment, OperationType, Role } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { normalizeScope, getScopeUnitId } from '../utils/scope';

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
    const uid = getScopeUnitId(currentScope);
    return units.find(u => u.id === uid) || null;
  }, [units, currentScope]);

  const getLabel = (key: 'UNIT' | 'SECTOR' | 'RM'): string => {
    const type = activeUnit?.operationType || activeTenant?.operationType || OperationType.CONSTRUCTION;
    const labels = {
      [OperationType.STORE]: { UNIT: 'Loja', SECTOR: 'Seção', RM: 'Pedido Interno' },
      [OperationType.CONSTRUCTION]: { UNIT: 'Obra', SECTOR: 'Frente de Serviço', RM: 'Requisição (RM)' },
      [OperationType.FACTORY]: { UNIT: 'Planta', SECTOR: 'Setor', RM: 'Requisição de Produção' },
      [OperationType.RESTAURANT]: { UNIT: 'Restaurante', SECTOR: 'Salão', RM: 'Pedido de Insumos' },
      [OperationType.OTHER]: { UNIT: 'Unidade', SECTOR: 'Setor', RM: 'Requisição' },
    };
    return labels[type][key];
  };

  const setScopeNormalized = (newScope: Scope) => {
    setCurrentScope(normalizeScope(newScope));
  };

  const refreshMetadata = async () => {
    if (!currentScope?.tenantId) return;

    const t = await api.getTenants();
    setTenants(t);
    
    const tid = currentScope.tenantId;
    const u = await api.getWorks(tid);
    setUnits([...u]);
    
    const unitId = getScopeUnitId(currentScope);
    if (unitId) {
      const wh = await api.getWarehouses(unitId);
      setWarehouses([...wh]);
      
      const currentUnit = u.find(x => x.id === unitId);
      const effectiveOpType = currentUnit?.operationType || activeTenant?.operationType;

      // REGRA: Auto-seleção de almoxarifado para Restaurantes e Lojas com apenas 1 estoque
      if (wh.length > 0) {
        const hasValidWh = wh.some(w => w.id === currentScope.warehouseId);
        if (!hasValidWh) {
          // Se for restaurante e tiver estoques, pega o central ou o primeiro disponível
          const autoWh = wh.find(w => w.isCentral) || wh[0];
          setScopeNormalized({ ...currentScope, warehouseId: autoWh.id });
          return; 
        }
      }
      
      if (effectiveOpType === OperationType.FACTORY || effectiveOpType === OperationType.RESTAURANT) {
         const s = await api.getSectors(unitId);
         setSectors(s);
      } else {
         setSectors([]);
      }
    }
  };

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`SCOPE_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCurrentScope(normalizeScope(parsed));
        } catch (e) {
          const initial = user.roleAssignments[0]?.scope;
          if (initial) setCurrentScope(normalizeScope(initial));
        }
      } else {
        const initial = user.roleAssignments[0]?.scope;
        if (initial) setCurrentScope(normalizeScope(initial));
      }
    }
  }, [user]);

  useEffect(() => {
    if (currentScope) {
      localStorage.setItem(`SCOPE_${user?.id}`, JSON.stringify(currentScope));
      refreshMetadata();
    }
  }, [currentScope?.tenantId, currentScope?.unitId, currentScope?.workId, currentScope?.warehouseId, currentScope?.sectorId]);

  const activeRole = useMemo(() => {
    if (!user || !currentScope) return 'VIEWER';
    const match = user.roleAssignments.find(ra => {
      if (ra.scope.tenantId !== currentScope.tenantId) return false;
      if (ra.scope.warehouseId && ra.scope.warehouseId !== currentScope.warehouseId) return false;
      const uid = getScopeUnitId(currentScope);
      const ruid = getScopeUnitId(ra.scope);
      if (ruid && ruid !== uid) return false;
      return true;
    });
    return match?.role || user.roleAssignments[0]?.role || 'VIEWER';
  }, [user, currentScope]);

  const isPermittedUnit = (unitId: string) => {
    if (!user) return false;
    if (user.roleAssignments.some(ra => ra.role === Role.OWNER)) return true;
    return user.roleAssignments.some(ra => {
       const ruid = getScopeUnitId(ra.scope);
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
      setScope: setScopeNormalized, refreshMetadata, isPermittedUnit, isPermittedWh, getLabel 
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
