
import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { MENU_ITEMS, MENU_CATEGORIES } from '../constants';
import { Permission, OperationType } from '../types';

export const Layout: React.FC<{ children: React.ReactNode, onNavigate: (path: string) => void, currentPath: string }> = ({ children, onNavigate, currentPath }) => {
  const { user, logout, hasPermission } = useAuth();
  const { 
    units, sectors, warehouses, currentScope, activeRole, activeTenant, activeUnit,
    setScope, isPermittedUnit, isPermittedWh, getLabel 
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

      return true; 
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

  const isFactory = activeTenant?.operationType === OperationType.FACTORY;
  const isStore = activeTenant?.operationType === OperationType.STORE;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <i className="fas fa-cubes text-lg"></i>
            </div>
            <span className="font-black text-white text-lg tracking-tighter">ConstructStock</span>
          </div>
          <button className="lg:hidden text-slate-500" onClick={() => setIsMobileMenuOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-8">
          {(Object.entries(categorizedItems) as [string, typeof activeMenuItems][]).map(([catId, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={catId} className="space-y-2">
                {catId !== 'MAIN' && (
                  <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
                    {MENU_CATEGORIES[catId as keyof typeof MENU_CATEGORIES]}
                  </p>
                )}
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.path); setIsMobileMenuOpen(false); }}
                    className={`flex items-center w-full gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${currentPath === item.path || currentPath.startsWith(item.path + '/') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1' : 'hover:bg-slate-800/50 hover:text-white'}`}
                  >
                    <i className={`fas ${item.icon} w-5 text-sm ${currentPath === item.path || currentPath.startsWith(item.path + '/') ? 'text-white' : 'text-slate-500'}`}></i>
                    <span className="text-xs font-bold tracking-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/50 shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center font-black border border-blue-600/20 shadow-inner shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate leading-tight">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-bold truncate uppercase tracking-tighter">{activeRole.replace('_', ' ')}</p>
            </div>
            <button 
              onClick={logout} 
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-colors shrink-0"
              title="Sair do sistema"
            >
              <i className="fas fa-power-off text-sm"></i>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-2 md:py-3 flex items-center justify-between shadow-sm z-40 shrink-0">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <button className="lg:hidden text-slate-400 hover:text-slate-600 shrink-0" onClick={() => setIsMobileMenuOpen(true)}>
              <i className="fas fa-bars text-xl"></i>
            </button>
            
            <div className="flex items-center gap-2 md:gap-4 text-sm overflow-x-auto no-scrollbar py-1 pr-4">
              <div className="hidden md:flex items-center gap-2 group shrink-0">
                <i className="fas fa-building text-blue-500 transition-colors"></i>
                <span className="font-black text-slate-700 whitespace-nowrap">{activeTenant?.name || 'Empresa'}</span>
              </div>

              {/* Seletor de Unidade */}
              <div className="flex items-center md:border-l md:border-slate-100 md:pl-4 shrink-0">
                <div className="relative group">
                  <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer shadow-sm active:scale-95">
                    <i className={`fas ${isStore ? 'fa-store' : isFactory ? 'fa-industry' : 'fa-hard-hat'} ${currentScope?.unitId ? 'text-blue-600' : 'text-slate-400'} text-xs md:text-base`}></i>
                    <div className="flex flex-col min-w-[100px] md:min-w-[140px]">
                      <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5 tracking-wider">
                        {getLabel('UNIT')} <span className="hidden xs:inline">Selecionada</span>
                      </span>
                      <div className="relative flex items-center">
                        <select 
                          className="bg-transparent border-none p-0 font-black text-slate-800 focus:ring-0 cursor-pointer appearance-none pr-5 text-[11px] md:text-xs w-full"
                          value={currentScope?.unitId || currentScope?.workId || ''}
                          onChange={(e) => setScope({ ...currentScope!, unitId: e.target.value, workId: e.target.value, sectorId: undefined, warehouseId: undefined })}
                        >
                          <option value="">Todas</option>
                          {filteredUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <i className="fas fa-chevron-down absolute right-0 text-[10px] text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isFactory && currentScope?.unitId && (
                <div className="flex items-center border-l border-slate-100 pl-2 md:pl-4 shrink-0">
                  <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer shadow-sm active:scale-95">
                    <i className="fas fa-layer-group text-slate-400 group-hover:text-purple-500 transition-colors text-xs md:text-base"></i>
                    <div className="flex flex-col min-w-[80px] md:min-w-[120px]">
                      <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5 tracking-wider">
                        {getLabel('SECTOR')}
                      </span>
                      <div className="relative flex items-center">
                        <select 
                          className="bg-transparent border-none p-0 font-black text-slate-700 focus:ring-0 cursor-pointer appearance-none pr-5 text-[11px] md:text-xs w-full"
                          value={currentScope?.sectorId || ''}
                          onChange={(e) => setScope({ ...currentScope!, sectorId: e.target.value, warehouseId: undefined })}
                        >
                          <option value="">Todos</option>
                          {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <i className="fas fa-chevron-down absolute right-0 text-[10px] text-slate-400 pointer-events-none"></i>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(currentScope?.unitId || currentScope?.workId) && (
                <div className="flex items-center border-l border-slate-100 pl-2 md:pl-4 shrink-0">
                  <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer shadow-sm active:scale-95">
                    <i className="fas fa-warehouse text-slate-400 group-hover:text-emerald-500 transition-colors text-xs md:text-base"></i>
                    <div className="flex flex-col min-w-[80px] md:min-w-[120px]">
                      <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5 tracking-wider">
                        Estoque
                      </span>
                      <div className="relative flex items-center">
                        <select 
                          className="bg-transparent border-none p-0 font-black text-slate-700 focus:ring-0 cursor-pointer appearance-none pr-5 text-[11px] md:text-xs w-full"
                          value={currentScope?.warehouseId || ''}
                          onChange={(e) => setScope({ ...currentScope!, warehouseId: e.target.value })}
                        >
                          <option value="">Geral</option>
                          {filteredWhs.filter(wh => !currentScope.sectorId || wh.sectorId === currentScope.sectorId).map(wh => (
                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                          ))}
                        </select>
                        <i className="fas fa-chevron-down absolute right-0 text-[10px] text-slate-400 pointer-events-none"></i>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-5 shrink-0 ml-2">
            <button className="relative text-slate-400 hover:text-blue-600 transition-colors">
              <i className="fas fa-bell"></i>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-100 hidden xs:block"></div>
            <div className="flex flex-col text-right hidden sm:flex">
               <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Perfil Ativo</span>
               <span className="text-[10px] font-black text-blue-600 tracking-tight uppercase bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                  {activeRole.replace('_', ' ')}
               </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
