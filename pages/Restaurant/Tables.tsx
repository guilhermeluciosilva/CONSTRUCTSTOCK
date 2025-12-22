
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { RestaurantTable, Tab, MenuItem, TabItem } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { STATUS_COLORS } from '../../constants';

export const Tables: React.FC = () => {
  const { currentScope, getLabel } = useApp();
  const { user } = useAuth();
  const { notify } = useNotification();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  
  const [showAddTable, setShowAddTable] = useState(false);
  const [showCloseTab, setShowCloseTab] = useState(false);
  const [showOpenPaxModal, setShowOpenPaxModal] = useState(false);
  const [paxCount, setPaxCount] = useState(1);
  const [customerName, setCustomerName] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState<Tab['paymentMethod']>('CARD');
  const [newTableName, setNewTableName] = useState('');

  const load = async () => {
    if (!currentScope?.tenantId || !currentScope?.unitId) {
      setTables([]);
      return;
    }
    
    const t = await api.getTables(currentScope.tenantId, currentScope.unitId);
    setTables(t);
    setMenu(await api.getMenuItems(currentScope.tenantId, currentScope.unitId));
    
    if (selectedTable) {
       const updatedT = t.find(x => x.id === selectedTable.id);
       if (updatedT?.activeTabId) {
          setActiveTab(await api.getTabById(updatedT.activeTabId) || null);
       } else {
          setActiveTab(null);
       }
    }
  };

  useEffect(() => { load(); }, [currentScope]);

  const handleStartOpenProcess = (t: RestaurantTable) => {
    setSelectedTable(t);
    setPaxCount(2); 
    setCustomerName('');
    setShowOpenPaxModal(true);
  };

  const confirmOpenTable = async () => {
    if (!selectedTable) return;
    try {
      await api.openTab(selectedTable.id, selectedTable.tenantId, selectedTable.unitId, customerName, paxCount);
      notify(`Mesa ${selectedTable.nameOrNumber} aberta!`, 'success');
      setShowOpenPaxModal(false);
      load();
    } catch (e: any) { 
      notify(e.message, 'error'); 
    }
  };

  const addItemToTab = async (menuItem: MenuItem) => {
    if (!activeTab) return;
    const newItem: TabItem = {
      id: `ITEM-${Date.now()}`,
      menuItemId: menuItem.id,
      nameSnapshot: menuItem.name,
      qty: 1,
      unitPriceSnapshot: menuItem.price,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    const updatedTab = { ...activeTab, items: [...activeTab.items, newItem] };
    await api.updateTab(updatedTab);
    load();
  };

  const updateItemStatus = async (itemId: string, status: TabItem['status']) => {
    if (!activeTab) return;
    const updatedItems = activeTab.items.map(i => i.id === itemId ? { ...i, status } : i);
    await api.updateTab({ ...activeTab, items: updatedItems });
    load();
  };

  const handleFinalClose = async () => {
    if (!activeTab || !user) return;
    
    // Fallback de segurança caso o auto-select demore
    const warehouseId = currentScope?.warehouseId;
    if (!warehouseId) {
      notify('Selecione um estoque no topo.', 'warning');
      return;
    }

    try {
      await api.closeTab(activeTab.id, warehouseId, paymentMethod, user.id);
      notify('Comanda fechada!', 'success');
      setShowCloseTab(false);
      setSelectedTable(null);
      load();
    } catch (e: any) { notify(e.message, 'error'); }
  };

  if (!currentScope?.unitId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-4xl shadow-inner">
          <i className="fas fa-store-alt-slash"></i>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Restaurante não Selecionado</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium">
            Selecione o seu <b>{getLabel('UNIT')}</b> no topo para gerenciar o salão.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Salão & Comandas</h1>
          <p className="text-gray-500 text-sm">Controle de ocupação e pedidos.</p>
        </div>
        <button 
          onClick={() => setShowAddTable(true)} 
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg flex items-center gap-2 active:scale-95"
        >
          <i className="fas fa-plus"></i> Nova Mesa
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Grid de Mesas - Agora mais compactas e quadradas */}
        <div className="lg:col-span-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
           {tables.map(t => (
             <div 
               key={t.id} 
               onClick={() => { setSelectedTable(t); load(); }} 
               className={`aspect-square relative p-4 rounded-2xl border-2 transition-all cursor-pointer select-none active:scale-95 flex flex-col items-center justify-center gap-2 text-center ${selectedTable?.id === t.id ? 'ring-2 ring-blue-500 border-blue-600 shadow-md' : ''} ${t.status === 'FREE' ? 'bg-white border-slate-100 hover:border-emerald-200' : 'bg-rose-50 border-rose-100 shadow-sm'}`}
             >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${t.status === 'FREE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-600 text-white shadow-sm'}`}>
                  <i className="fas fa-chair"></i>
                </div>
                <p className="text-sm font-black text-slate-800 leading-none">#{t.nameOrNumber}</p>
                <div className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${t.status === 'FREE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {t.status === 'FREE' ? 'Livre' : 'Ocupada'}
                </div>
             </div>
           ))}
           {tables.length === 0 && (
             <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 space-y-4">
               <i className="fas fa-border-all text-4xl opacity-20"></i>
               <p className="font-black text-xs uppercase tracking-[0.2em]">Nenhuma mesa cadastrada.</p>
             </div>
           )}
        </div>

        {/* Painel Lateral da Comanda */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl min-h-[500px] flex flex-col overflow-hidden sticky top-24">
           {selectedTable ? (
             <>
               <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tighter">Mesa {selectedTable.nameOrNumber}</h3>
                    <p className="text-[10px] font-bold text-slate-400">Capacidade: {selectedTable.capacity} pax</p>
                  </div>
                  <button onClick={() => setSelectedTable(null)} className="text-slate-300 hover:text-slate-800"><i className="fas fa-times"></i></button>
               </div>
               
               {selectedTable.status === 'FREE' ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-4 animate-in slide-in-from-bottom-4">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 text-2xl"><i className="fas fa-lock-open"></i></div>
                    <p className="font-black text-slate-800 text-sm uppercase">Mesa Livre</p>
                    <button onClick={() => handleStartOpenProcess(selectedTable)} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">Abrir Comanda</button>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col h-full overflow-hidden animate-in slide-in-from-right-4">
                    <div className="px-6 py-2 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center">
                       <span className="text-[9px] font-black text-blue-600 uppercase"><i className="fas fa-users mr-1"></i> {activeTab?.peopleCount || 0} Pessoas</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase truncate max-w-[120px]">{activeTab?.customerName || 'Consumidor'}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                       {activeTab?.items.map((item, i) => (
                         <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                            <div className="min-w-0">
                               <p className="text-xs font-black text-slate-800 uppercase truncate">{item.nameSnapshot}</p>
                               <p className="text-[9px] font-bold text-slate-400">{item.qty} x {formatCurrency(item.unitPriceSnapshot)}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               {item.status === 'PENDING' && <button onClick={() => updateItemStatus(item.id, 'IN_PREP')} className="w-6 h-6 bg-white rounded-lg border text-blue-500 text-[9px]"><i className="fas fa-fire"></i></button>}
                               {item.status === 'IN_PREP' && <button onClick={() => updateItemStatus(item.id, 'SERVED')} className="w-6 h-6 bg-white rounded-lg border text-emerald-500 text-[9px]"><i className="fas fa-check"></i></button>}
                               {item.status !== 'CANCELED' && <button onClick={() => updateItemStatus(item.id, 'CANCELED')} className="w-6 h-6 bg-white rounded-lg border text-rose-300 text-[9px]"><i className="fas fa-times"></i></button>}
                            </div>
                         </div>
                       ))}
                       {activeTab?.items.length === 0 && <div className="py-20 text-center text-slate-300 italic text-[10px] uppercase tracking-widest">Nenhum item.</div>}
                    </div>

                    <div className="p-6 bg-slate-900 text-white space-y-4">
                       <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                          <div><p className="text-[9px] font-black uppercase text-slate-500">Parcial</p><p className="text-xl font-black text-emerald-400">{formatCurrency(activeTab?.totalAmount || 0)}</p></div>
                          <button onClick={() => setShowCloseTab(true)} className="px-5 py-2 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-slate-50 active:scale-95 transition-all">Fechar</button>
                       </div>
                       <div>
                          <h4 className="text-[8px] font-black uppercase text-slate-500 mb-2 tracking-widest">Lançar Item</h4>
                          <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                             {menu.filter(m => m.isActive).map(m => (
                               <button key={m.id} onClick={() => addItemToTab(m)} className="p-2.5 bg-slate-800 rounded-lg text-left hover:bg-slate-700 transition-all border border-slate-700 active:scale-95">
                                 <p className="text-[8px] font-black text-slate-300 uppercase truncate">{m.name}</p>
                                 <p className="text-[8px] font-bold text-emerald-400">{formatCurrency(m.price)}</p>
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
               )}
             </>
           ) : (
             <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-4 opacity-40">
                <i className="fas fa-utensils text-4xl text-slate-200"></i>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed">Selecione uma mesa para gerenciar.</p>
             </div>
           )}
        </div>
      </div>

      {showAddTable && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
             <div className="p-8 border-b bg-slate-50 flex justify-between items-center"><h2 className="text-xl font-black text-slate-800">Nova Mesa</h2><button onClick={() => setShowAddTable(false)} className="text-slate-400"><i className="fas fa-times"></i></button></div>
             <div className="p-8 space-y-4">
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Número da Mesa</label>
                <input 
                  autoFocus
                  className="w-full p-3 bg-gray-50 border rounded-xl font-black text-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  value={newTableName} 
                  onChange={e => setNewTableName(e.target.value)} 
                  placeholder="Ex: 01" 
                /></div>
             </div>
             <div className="p-8 bg-slate-50 flex gap-4"><button onClick={() => setShowAddTable(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400 font-bold">Cancelar</button>
             <button 
               onClick={async () => { 
                  if (!newTableName) return notify('Informe o número', 'warning');
                  await api.saveTable({ 
                    nameOrNumber: newTableName, 
                    capacity: 4, 
                    status: 'FREE', 
                    tenantId: currentScope!.tenantId, 
                    unitId: currentScope!.unitId! 
                  }); 
                  notify('Mesa criada!', 'success'); 
                  setShowAddTable(false); 
                  setNewTableName('');
                  load(); 
               }} 
               className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg"
              >
                Salvar Mesa
              </button></div>
          </div>
        </div>
      )}

      {showOpenPaxModal && selectedTable && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
             <div className="p-8 bg-emerald-600 text-white text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl mx-auto mb-4"><i className="fas fa-users"></i></div>
                <h2 className="text-lg font-black uppercase tracking-tight">Atendimento Mesa {selectedTable.nameOrNumber}</h2>
             </div>
             <div className="p-8 space-y-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center block font-bold">Quantas pessoas?</label>
                   <div className="flex items-center justify-center gap-6">
                      <button onClick={() => setPaxCount(Math.max(1, paxCount - 1))} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 text-xl font-black hover:bg-slate-200 transition-all">-</button>
                      <span className="text-3xl font-black text-slate-800 w-10 text-center">{paxCount}</span>
                      <button onClick={() => setPaxCount(paxCount + 1)} className="w-10 h-10 rounded-xl bg-blue-600 text-white text-xl font-black hover:bg-blue-700 transition-all shadow-lg">+</button>
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-bold">Cliente (Opcional)</label>
                   <input 
                     type="text" className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500" 
                     placeholder="Nome ou código" 
                     value={customerName}
                     onChange={e => setCustomerName(e.target.value)}
                   />
                </div>
             </div>
             <div className="p-8 pt-0 flex gap-3">
                <button onClick={() => setShowOpenPaxModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Voltar</button>
                <button onClick={confirmOpenTable} className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all">Iniciar Mesa</button>
             </div>
          </div>
        </div>
      )}

      {showCloseTab && activeTab && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
             <div className="p-8 border-b bg-slate-900 text-white text-center space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Total a Pagar</p>
                <h2 className="text-3xl font-black text-emerald-400">{formatCurrency(activeTab.totalAmount)}</h2>
             </div>
             <div className="p-8 space-y-6">
                <div className="grid grid-cols-3 gap-2">
                   {[ {id:'CARD', label:'Cartão', icon:'fa-credit-card'}, {id:'PIX', label:'PIX', icon:'fa-bolt'}, {id:'CASH', label:'Dinheiro', icon:'fa-money-bill'} ].map(p => (
                     <button key={p.id} onClick={() => setPaymentMethod(p.id as any)} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === p.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 opacity-60 grayscale'}`}><i className={`fas ${p.icon} text-lg`}></i><span className="text-[8px] font-black uppercase">{p.label}</span></button>
                   ))}
                </div>
                <p className="text-[9px] text-slate-400 font-medium italic text-center leading-relaxed px-4">A baixa de insumos será feita no almoxarifado principal da unidade automaticamente.</p>
             </div>
             <div className="p-8 pt-0 flex gap-4"><button onClick={() => setShowCloseTab(false)} className="flex-1 py-3 text-[10px] font-black text-slate-400 uppercase font-bold">Voltar</button>
             <button onClick={handleFinalClose} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all">Confirmar Pagamento</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
