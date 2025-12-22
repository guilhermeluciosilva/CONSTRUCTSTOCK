
import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { MENU_ITEMS, MENU_CATEGORIES } from '../constants';
import { Permission, OperationType } from '../types';

export const Layout: React.FC<{ children: React.ReactNode, onNavigate: (path: string) => void, currentPath: string }> = ({ children, onNavigate, currentPath }) => {
  const { user, logout, hasPermission } = useAuth();
  const { 
    units, sectors, warehouses, currentScope, activeRole, activeTenant, activeUnit,
    setScope, isPermittedUnit, isPermittedWh, getLabel, theme, toggleTheme 
  } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const activeMenuItems = useMemo(() => {
    return MENU_ITEMS.filter(item => {
      const permOk = hasPermission(item.minPermission as Permission, currentScope ? { tenantId: currentScope.tenantId } : undefined);
      if (!permOk) return false;
      const opOk = activeTenant ? item.allowedOps.includes(activeTenant.operationType) : true;
      if (!opOk) return false;
      if (['dashboard', 'settings'].includes(item.id)) return true;
      if (activeUnit?.enabledModuleIds && activeUnit.enabledModuleIds.length > 0) {
        return activeUnit.enabledModuleIds.includes(item.id);
      }
      return !['documents'].includes(item.id);
    });
  }, [hasPermission, currentScope, activeTenant, activeUnit]);

  const categorizedItems = useMemo(() => {
    const categories = Object.keys(MENU_CATEGORIES);
    const groups: Record<string, typeof activeMenuItems> = {};
    categories.forEach(cat => {
      groups[cat] = activeMenuItems.filter(item => item.category === cat);
    });
    return groups;
  }, [activeMenuItems]);
  
  const filteredUnits = units.filter(u => isPermittedUnit(u.id));
  const filteredWhs = warehouses.filter(wh => isPermittedWh(wh.id));

  const effectiveOpType = activeUnit?.operationType || activeTenant?.operationType;
  const isFactory = effectiveOpType === OperationType.FACTORY;
  const isConstruction = effectiveOpType === OperationType.CONSTRUCTION;
  const isStore = effectiveOpType === OperationType.STORE;
  const isRestaurant = effectiveOpType === OperationType.RESTAURANT;

  const showWarehouseSelector = isFactory || isConstruction || filteredWhs.length > 1;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <i className="fas fa-cubes text-lg"></i>
            </div>
            <span className="font-black text-slate-900 dark:text-white text-lg tracking-tighter uppercase">C-Stock</span>
          </div>
          <button className="lg:hidden text-slate-500" onClick={() => setIsMobileMenuOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-8">
          {(Object.entries(categorizedItems) as [string, typeof activeMenuItems][]).map(([catId, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={catId} className="space-y-1">
                {catId !== 'MAIN' && (
                  <p className="px-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">
                    {MENU_CATEGORIES[catId as keyof typeof MENU_CATEGORIES]}
                  </p>
                )}
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.path); setIsMobileMenuOpen(false); }}
                    className={`flex items-center w-full gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${currentPath === item.path || currentPath.startsWith(item.path + '/') ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'}`}
                  >
                    <i className={`fas ${item.icon} w-5 text-sm ${currentPath === item.path || currentPath.startsWith(item.path + '/') ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}></i>
                    <span className="text-xs font-bold tracking-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-[#020617]/50">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black border border-blue-500/20 shrink-0 uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate leading-tight">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-bold truncate uppercase tracking-tighter">{activeRole.replace('_', ' ')}</p>
            </div>
            <button onClick={logout} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shrink-0">
              <i className="fas fa-power-off text-sm"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#020617]">
        <header className="bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-2 md:py-3 flex items-center justify-between shadow-sm z-40 shrink-0 sticky top-0">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <button className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 shrink-0" onClick={() => setIsMobileMenuOpen(true)}>
              <i className="fas fa-bars text-xl"></i>
            </button>
            
            <div className="flex items-center gap-2 md:gap-4 text-sm overflow-x-auto no-scrollbar py-1 pr-4">
              {/* Seletor de Unidade */}
              <div className="flex items-center md:border-l border-slate-200 dark:border-slate-800 md:pl-4 shrink-0">
                <div className="relative group overflow-hidden rounded-xl">
                  <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group-hover:border-blue-500 transition-all">
                    <i className={`fas ${isStore ? 'fa-store' : isRestaurant ? 'fa-utensils' : isFactory ? 'fa-industry' : 'fa-hard-hat'} ${currentScope?.unitId ? 'text-blue-600' : 'text-slate-400'} text-xs md:text-base`}></i>
                    <div className="flex flex-col min-w-[100px] md:min-w-[140px]">
                      <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase leading-none mb-0.5 tracking-wider">
                        {getLabel('UNIT')}
                      </span>
                      <div className="relative flex items-center">
                        <span className="font-black text-slate-700 dark:text-slate-200 text-[11px] md:text-xs truncate pr-4">
                          {filteredUnits.find(u => u.id === (currentScope?.unitId || currentScope?.workId))?.name || (filteredUnits.length > 1 ? 'Todas as Unidades' : 'Carregando...')}
                        </span>
                        {filteredUnits.length > 1 && <i className="fas fa-chevron-down absolute right-0 text-[10px] text-slate-400"></i>}
                      </div>
                    </div>
                  </div>
                  {filteredUnits.length > 1 && (
                    <select 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      value={currentScope?.unitId || currentScope?.workId || ''}
                      onChange={(e) => setScope({ ...currentScope!, unitId: e.target.value, workId: e.target.value, sectorId: undefined, warehouseId: undefined })}
                    >
                      <option value="">Todas</option>
                      {filteredUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Seletor de Estoque */}
              {showWarehouseSelector && (currentScope?.unitId || currentScope?.workId) && (
                <div className="flex items-center border-l border-slate-200 dark:border-slate-800 pl-2 md:pl-4 shrink-0">
                  <div className="relative group overflow-hidden rounded-xl">
                    <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group-hover:border-emerald-500 transition-all">
                      <i className="fas fa-warehouse text-slate-400 group-hover:text-emerald-500 transition-colors text-xs md:text-base"></i>
                      <div className="flex flex-col min-w-[80px] md:min-w-[120px]">
                        <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase leading-none mb-0.5 tracking-wider">Estoque</span>
                        <div className="relative flex items-center">
                          <span className="font-black text-slate-700 dark:text-slate-200 text-[11px] md:text-xs truncate pr-4">
                            {filteredWhs.find(wh => wh.id === currentScope?.warehouseId)?.name || (filteredWhs.length > 1 ? 'Geral' : 'Padrão')}
                          </span>
                          {filteredWhs.length > 1 && <i className="fas fa-chevron-down absolute right-0 text-[10px] text-slate-400"></i>}
                        </div>
                      </div>
                    </div>
                    {filteredWhs.length > 1 && (
                      <select 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        value={currentScope?.warehouseId || ''}
                        onChange={(e) => setScope({ ...currentScope!, warehouseId: e.target.value })}
                      >
                        <option value="">Geral</option>
                        {filteredWhs.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-2">
            {/* TOGGLE THEME BUTTON */}
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-sm"
              title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
            >
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'} text-base md:text-lg`}></i>
            </button>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
            <div className="hidden sm:flex flex-col text-right">
               <span className="text-[10px] font-black text-slate-500 uppercase leading-none mb-1">Status Org.</span>
               <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-tight uppercase bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                  {activeTenant?.name || 'ONLINE'}
               </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};
