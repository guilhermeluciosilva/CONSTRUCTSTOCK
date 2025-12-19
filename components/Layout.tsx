
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { MENU_ITEMS } from '../constants';
import { Permission, OperationType } from '../types';

export const Layout: React.FC<{ children: React.ReactNode, onNavigate: (path: string) => void, currentPath: string }> = ({ children, onNavigate, currentPath }) => {
  const { user, logout, hasPermission } = useAuth();
  const { 
    units, sectors, warehouses, currentScope, activeRole, activeTenant, activeUnit,
    setScope, isPermittedUnit, isPermittedWh, getLabel 
  } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const activeMenuItems = MENU_ITEMS.filter(item => {
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
  
  const filteredUnits = units.filter(u => isPermittedUnit(u.id));
  const filteredWhs = warehouses.filter(wh => isPermittedWh(wh.id));

  const isFactory = activeTenant?.operationType === OperationType.FACTORY;
  const isStore = activeTenant?.operationType === OperationType.STORE;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
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

        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
          {activeMenuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.path); setIsMobileMenuOpen(false); }}
              className={`flex items-center w-full gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200 ${currentPath === item.path || currentPath.startsWith(item.path + '/') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1' : 'hover:bg-slate-800/50 hover:text-white'}`}
            >
              <i className={`fas ${item.icon} w-5 text-sm ${currentPath === item.path || currentPath.startsWith(item.path + '/') ? 'text-white' : 'text-slate-500'}`}></i>
              <span className="text-sm font-bold tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center font-black border border-blue-600/20 shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate uppercase tracking-tighter">{activeRole.replace('_', ' ')}</p>
            </div>
            <button onClick={logout} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-colors">
              <i className="fas fa-power-off text-sm"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-40">
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden text-slate-400 hover:text-slate-600" onClick={() => setIsMobileMenuOpen(true)}>
              <i className="fas fa-bars text-xl"></i>
            </button>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="hidden sm:flex items-center gap-2 group">
                <i className="fas fa-building text-blue-500 transition-colors"></i>
                <span className="font-black text-slate-700">{activeTenant?.name || 'Empresa'}</span>
              </div>

              <div className="flex items-center gap-2 border-l border-slate-100 pl-6 group">
                <i className={`fas ${isStore ? 'fa-store' : isFactory ? 'fa-industry' : 'fa-hard-hat'} text-slate-300 group-hover:text-orange-500 transition-colors`}></i>
                <select 
                  className="bg-transparent border-none p-0 font-black text-slate-700 focus:ring-0 cursor-pointer appearance-none pr-4"
                  value={currentScope?.unitId || currentScope?.workId || ''}
                  onChange={(e) => setScope({ ...currentScope!, unitId: e.target.value, workId: e.target.value, sectorId: undefined, warehouseId: undefined })}
                >
                  <option value="">Todas as {getLabel('UNIT')}s</option>
                  {filteredUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              {isFactory && currentScope?.unitId && (
                <div className="flex items-center gap-2 border-l border-slate-100 pl-6 group">
                  <i className="fas fa-layer-group text-slate-300 group-hover:text-purple-500 transition-colors"></i>
                  <select 
                    className="bg-transparent border-none p-0 font-black text-slate-700 focus:ring-0 cursor-pointer appearance-none pr-4"
                    value={currentScope?.sectorId || ''}
                    onChange={(e) => setScope({ ...currentScope!, sectorId: e.target.value, warehouseId: undefined })}
                  >
                    <option value="">Todos os {getLabel('SECTOR')}s</option>
                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {(currentScope?.unitId || currentScope?.workId) && (
                <div className="flex items-center gap-2 border-l border-slate-100 pl-6 group">
                  <i className="fas fa-warehouse text-slate-300 group-hover:text-emerald-500 transition-colors"></i>
                  <select 
                    className="bg-transparent border-none p-0 font-black text-slate-700 focus:ring-0 cursor-pointer appearance-none pr-4"
                    value={currentScope?.warehouseId || ''}
                    onChange={(e) => setScope({ ...currentScope!, warehouseId: e.target.value })}
                  >
                    <option value="">Estoque Geral</option>
                    {filteredWhs.filter(wh => !currentScope.sectorId || wh.sectorId === currentScope.sectorId).map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative text-slate-400 hover:text-blue-600 transition-colors">
              <i className="fas fa-bell"></i>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-100"></div>
            <div className="flex flex-col text-right">
               <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Perfil Ativo</span>
               <span className="text-xs font-black text-blue-600 tracking-tight uppercase bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                  {activeRole.replace('_', ' ')}
               </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};
