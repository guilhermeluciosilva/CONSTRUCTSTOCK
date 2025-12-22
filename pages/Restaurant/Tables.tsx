
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { RestaurantTable, Tab, MenuItem, TabItem } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { STATUS_COLORS } from '../../constants';

export const Tables: React.FC = () => {
  const { currentScope, getLabel, activeUnit } = useApp();
  const { user } = useAuth();
  const { notify } = useNotification();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  
  const [showAddTable, setShowAddTable] = useState(false);
  const [showCloseTab, setShowCloseTab] = useState(false);
  const [showPaxModal, setShowPaxModal] = useState(false);
  const [paxCount, setPaxCount] = useState(2);
  const [customerName, setCustomerName] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState<Tab['paymentMethod']>('CARD');
  const [newTableName, setNewTableName] = useState('');

  const load = async () => {
    if (!currentScope?.tenantId || !currentScope?.unitId) return;
    const t = await api.getTables(currentScope.tenantId, currentScope.unitId);
    setTables(t);
    setMenu(await api.getMenuItems(currentScope.tenantId, currentScope.unitId));
    
    if (selectedTable) {
       const updatedT = t.find(x => x.id === selectedTable.id);
       if (updatedT?.activeTabId) {
          const tab = await api.getTabById(updatedT.activeTabId);
          setActiveTab(tab || null);
       } else {
          setActiveTab(null);
       }
    }
  };

  useEffect(() => { load(); }, [currentScope]);

  const handleTableClick = (t: RestaurantTable) => {
    setSelectedTable(t);
    load();
  };

  const handleStartOpen = () => {
    setCustomerName('');
    setPaxCount(2);
    setShowPaxModal(true);
  };

  const handleUpdatePax = () => {
    if (!activeTab) return;
    setCustomerName(activeTab.customerName || '');
    setPaxCount(activeTab.peopleCount || 1);
    setShowPaxModal(true);
  };

  const confirmPaxAction = async () => {
    if (!selectedTable) return;
    try {
      if (selectedTable.status === 'FREE') {
        await api.openTab(selectedTable.id, selectedTable.tenantId, selectedTable.unitId, customerName, paxCount);
        notify(`Mesa ${selectedTable.nameOrNumber} iniciada!`, 'success');
      } else if (activeTab) {
        await api.updateTab({ ...activeTab, customerName, peopleCount: paxCount });
        notify('Informações PAX atualizadas!', 'success');
      }
      setShowPaxModal(false);
      load();
    } catch (e: any) { notify(e.message, 'error'); }
  };

  const addItemToTab = async (menuItem: MenuItem) => {
    if (!activeTab) return;
    const newItem: TabItem = {
      id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
    notify(`Adicionado: ${menuItem.name} na Mesa ${selectedTable?.nameOrNumber}`, 'success');
  };

  const updateItemStatus = async (itemId: string, status: TabItem['status']) => {
    if (!activeTab) return;
    const updatedItems = activeTab.items.map(i => i.id === itemId ? { ...i, status } : i);
    await api.updateTab({ ...activeTab, items: updatedItems });
    load();
  };

  const handleFinalClose = async () => {
    if (!activeTab || !user || !selectedTable) return;

    const unitId = currentScope?.unitId || currentScope?.workId;
    if (!unitId) return notify('Unidade não identificada.', 'error');

    let targetWarehouseId = currentScope?.warehouseId;
    if (!targetWarehouseId) {
      const unitWarehouses = await api.getWarehouses(unitId);
      const defaultWh = unitWarehouses.find(w => w.isCentral) || unitWarehouses[0];
      if (defaultWh) targetWarehouseId = defaultWh.id;
      else return notify('Erro: Cadastre um local de estoque.', 'error');
    }

    try {
      await api.closeTab(activeTab.id, targetWarehouseId, paymentMethod, user.id);
      notify(`Mesa ${selectedTable.nameOrNumber} finalizada com sucesso!`, 'success');
      setShowCloseTab(false);
      setSelectedTable(null);
      load();
    } catch (e: any) { 
      notify(e.message || 'Erro ao processar fechamento', 'error'); 
    }
  };

  const filteredMenu = useMemo(() => {
    return menu.filter(m => m.isActive && (
      m.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
      m.category.toLowerCase().includes(menuSearch.toLowerCase())
    ));
  }, [menu, menuSearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Salão & Atendimento</h1>
          <p className="text-slate-500 text-sm font-medium">Toque em uma mesa para lançar pedidos ou fechar contas.</p>
        </div>
        <button onClick={() => setShowAddTable(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">
          <i className="fas fa-plus mr-2"></i> Criar Mesa
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Mapa de Mesas */}
        <div className="lg:col-span-7 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
           {tables.map(t => (
             <div 
               key={t.id} 
               onClick={() => handleTableClick(t)} 
               className={`aspect-square relative p-6 rounded-[32px] border-2 transition-all cursor-pointer select-none active:scale-95 flex flex-col items-center justify-center gap-2 text-center ${selectedTable?.id === t.id ? 'border-blue-500 bg-blue-500/10 shadow-2xl' : t.status === 'FREE' ? 'bg-slate-900 border-slate-800 hover:border-slate-600' : 'bg-rose-500/5 border-rose-500/20'}`}
             >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${t.status === 'FREE' ? 'bg-slate-800 text-slate-500' : 'bg-rose-600 text-white shadow-lg'}`}>
                  <i className="fas fa-chair"></i>
                </div>
                <p className="text-base font-black text-white leading-none">Mesa {t.nameOrNumber}</p>
                <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${t.status === 'FREE' ? 'text-slate-600' : 'text-rose-400'}`}>
                  {t.status === 'FREE' ? 'Livre' : 'Ocupada'}
                </div>
                {t.activeTabId && <div className="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>}
             </div>
           ))}
           {tables.length === 0 && (
             <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[40px] opacity-30">
                <i className="fas fa-couch text-4xl mb-4 text-slate-500"></i>
                <p className="font-black text-xs uppercase tracking-widest text-slate-400">Nenhuma mesa configurada</p>
             </div>
           )}
        </div>

        {/* Painel da Comanda (Lançamento e Rastreabilidade) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-[48px] border border-slate-800 shadow-2xl min-h-[750px] flex flex-col overflow-hidden sticky top-24">
           {selectedTable ? (
             <div className="flex flex-col h-full animate-in slide-in-from-right-4">
               <div className="p-8 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Mesa {selectedTable.nameOrNumber}</h3>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mt-2">Detalhamento de Consumo</p>
                  </div>
                  <button onClick={() => setSelectedTable(null)} className="w-10 h-10 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"><i className="fas fa-times"></i></button>
               </div>
               
               {selectedTable.status === 'FREE' ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6">
                    <div className="w-24 h-24 bg-slate-800 rounded-[32px] flex items-center justify-center text-slate-600 text-4xl border border-slate-700 shadow-inner"><i className="fas fa-play"></i></div>
                    <div className="space-y-1">
                       <p className="font-black text-white text-lg uppercase tracking-tight">Mesa Disponível</p>
                       <p className="text-slate-500 text-xs font-medium uppercase tracking-tight">Inicie a comanda para começar a lançar itens.</p>
                    </div>
                    <button onClick={handleStartOpen} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all">Abrir Comanda</button>
                 </div>
               ) : (
                 <div className="flex flex-col h-full overflow-hidden">
                    {/* Resumo PAX */}
                    <div className="px-8 py-5 bg-blue-600/5 border-b border-blue-500/10 flex justify-between items-center">
                       <div className="min-w-0">
                          <span className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-2 mb-1"><i className="fas fa-users"></i> {activeTab?.peopleCount} PAX</span>
                          <p className="text-sm font-black text-slate-100 truncate uppercase">{activeTab?.customerName || 'Consumidor Final'}</p>
                       </div>
                       <button onClick={handleUpdatePax} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-[9px] font-black uppercase border border-slate-700 hover:bg-slate-700 transition-all">Alterar PAX</button>
                    </div>

                    {/* Comanda / Itens Lançados */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-[#020617]/30">
                       <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Itens na Conta</h4>
                       {activeTab?.items.map((item) => (
                         <div key={item.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${item.status === 'CANCELED' ? 'border-slate-900 opacity-20 grayscale' : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'}`}>
                            <div className="min-w-0">
                               <p className="text-xs font-black uppercase text-slate-200 truncate">{item.nameSnapshot}</p>
                               <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-slate-500">{item.qty}x {formatCurrency(item.unitPriceSnapshot)}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase border ${
                                     item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                     item.status === 'SERVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                     'bg-slate-800 text-slate-500 border-slate-700'
                                  }`}>{item.status}</span>
                               </div>
                            </div>
                            <div className="flex gap-1">
                               {item.status === 'PENDING' && <button onClick={() => updateItemStatus(item.id, 'SERVED')} className="w-9 h-9 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><i className="fas fa-check text-xs"></i></button>}
                               {item.status !== 'CANCELED' && <button onClick={() => updateItemStatus(item.id, 'CANCELED')} className="w-9 h-9 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-white transition-all"><i className="fas fa-trash-alt text-xs"></i></button>}
                            </div>
                         </div>
                       ))}
                       {activeTab?.items.length === 0 && (
                         <div className="py-12 text-center text-slate-700 italic text-xs uppercase font-bold tracking-widest opacity-50">Nenhum item lançado</div>
                       )}
                    </div>

                    {/* ÁREA DE LANÇAMENTO (O que você não estava vendo claramente) */}
                    <div className="p-8 bg-[#020617] border-t-2 border-slate-800 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
                       <div className="flex justify-between items-end mb-6">
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest leading-none mb-2">Subtotal da Mesa</p>
                            <p className="text-4xl font-black text-emerald-400 tracking-tighter">{formatCurrency(activeTab?.totalAmount || 0)}</p>
                          </div>
                          <button onClick={() => setShowCloseTab(true)} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all">Finalizar Conta</button>
                       </div>
                       
                       <div className="space-y-4">
                          <div className="flex justify-between items-center">
                             <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Lançar Novo Item</h4>
                             <div className="relative w-1/2">
                                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]"></i>
                                <input 
                                  className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                  placeholder="Filtrar cardápio..."
                                  value={menuSearch}
                                  onChange={e => setMenuSearch(e.target.value)}
                                />
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                             {filteredMenu.map(m => (
                               <button 
                                 key={m.id} 
                                 onClick={() => addItemToTab(m)} 
                                 className="p-3 bg-slate-800/40 rounded-xl text-left border border-slate-800 hover:bg-blue-600 hover:border-blue-500 group transition-all active:scale-90"
                               >
                                 <p className="text-[10px] font-black text-slate-300 uppercase truncate group-hover:text-white leading-tight mb-1">{m.name}</p>
                                 <p className="text-[10px] font-bold text-emerald-400 group-hover:text-blue-100">{formatCurrency(m.price)}</p>
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
               )}
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-8">
                <div className="w-32 h-32 bg-slate-800/30 rounded-[48px] flex items-center justify-center text-6xl text-slate-700 border border-slate-800 animate-pulse"><i className="fas fa-hand-pointer"></i></div>
                <div className="space-y-3">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">Atendimento</h3>
                   <p className="text-slate-500 text-xs font-bold max-w-[220px] mx-auto uppercase leading-relaxed">Selecione uma mesa no mapa ao lado para gerenciar pedidos e comandas.</p>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Modal PAX */}
      {showPaxModal && selectedTable && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-[48px] border border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
             <div className="p-10 border-b border-slate-800 bg-blue-600 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-[24px] flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg"><i className="fas fa-users"></i></div>
                <h2 className="text-xl font-black uppercase tracking-tight">Atendimento Mesa {selectedTable.nameOrNumber}</h2>
             </div>
             <div className="p-10 space-y-10">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center block">Quantas Pessoas? (PAX)</label>
                   <div className="flex items-center justify-center gap-10">
                      <button onClick={() => setPaxCount(Math.max(1, paxCount - 1))} className="w-12 h-12 rounded-2xl bg-slate-800 text-white text-2xl font-black border border-slate-700 transition-all active:scale-90">-</button>
                      <span className="text-5xl font-black text-white w-14 text-center">{paxCount}</span>
                      <button onClick={() => setPaxCount(paxCount + 1)} className="w-12 h-12 rounded-2xl bg-blue-600 text-white text-2xl font-black shadow-lg shadow-blue-500/20 transition-all active:scale-90">+</button>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Identificação do Cliente</label>
                   <input className="w-full p-4 bg-[#020617] border border-slate-800 rounded-2xl font-bold text-white text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="Ex: Nome ou Sobrenome..." value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
             </div>
             <div className="p-10 pt-0 flex gap-4">
                <button onClick={() => setShowPaxModal(false)} className="flex-1 py-4 text-xs font-black text-slate-500 uppercase hover:text-white transition-colors">Voltar</button>
                <button onClick={confirmPaxAction} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Confirmar e Abrir</button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Fechamento */}
      {showCloseTab && activeTab && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 rounded-[48px] border border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
             <div className="p-12 border-b border-slate-800 bg-[#0f172a] text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center text-3xl mx-auto mb-2 shadow-lg shadow-emerald-500/20"><i className="fas fa-check"></i></div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-2">Total à Pagar - Mesa {selectedTable?.nameOrNumber}</p>
                   <h2 className="text-6xl font-black text-emerald-400 leading-none tracking-tighter">{formatCurrency(activeTab.totalAmount)}</h2>
                </div>
             </div>
             <div className="p-10 space-y-8">
                <div className="grid grid-cols-3 gap-3">
                   {[ 
                     {id:'CARD', label:'Cartão', icon:'fa-credit-card'}, 
                     {id:'PIX', label:'PIX', icon:'fa-bolt'}, 
                     {id:'CASH', label:'Dinheiro', icon:'fa-money-bill-wave'} 
                   ].map(p => (
                     <button 
                        key={p.id} 
                        onClick={() => setPaymentMethod(p.id as any)} 
                        className={`p-6 rounded-[32px] border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === p.id ? 'border-blue-600 bg-blue-600/10 text-blue-400' : 'border-slate-800 text-slate-600 hover:border-slate-700 opacity-50'}`}
                     >
                        <i className={`fas ${p.icon} text-2xl`}></i>
                        <span className="text-[9px] font-black uppercase tracking-widest">{p.label}</span>
                     </button>
                   ))}
                </div>
                <div className="p-5 bg-blue-600/5 rounded-[24px] border border-blue-500/10 flex items-start gap-4">
                   <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                   <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">O sistema dará baixa automática no estoque para todos os insumos desta comanda com rastreabilidade nesta mesa.</p>
                </div>
             </div>
             <div className="p-10 pt-0 flex gap-4">
                <button onClick={() => setShowCloseTab(false)} className="flex-1 py-4 text-xs font-black text-slate-600 uppercase hover:text-white transition-colors">Voltar</button>
                <button onClick={handleFinalClose} className="flex-[2] py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase shadow-2xl shadow-emerald-500/30 hover:bg-emerald-500 active:scale-95 transition-all">Finalizar Mesa</button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Mesa */}
      {showAddTable && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
             <div className="p-8 border-b border-slate-800 flex justify-between items-center text-white">
                <h2 className="text-xl font-black uppercase tracking-tighter">Nova Mesa</h2>
                <button onClick={() => setShowAddTable(false)} className="text-slate-600"><i className="fas fa-times"></i></button>
             </div>
             <div className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Identificação / Número</label>
                   <input autoFocus type="text" className="w-full p-5 bg-[#020617] border border-slate-800 rounded-2xl font-black text-2xl text-white outline-none focus:ring-2 focus:ring-blue-600" value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="Ex: 01" />
                </div>
             </div>
             <div className="p-8 bg-[#0f172a]/50 flex gap-4">
                <button onClick={() => setShowAddTable(false)} className="flex-1 py-4 text-xs font-black text-slate-600 uppercase">Sair</button>
                <button 
                   onClick={async () => { 
                      if (!newTableName) return notify('Informe o número', 'warning');
                      await api.saveTable({ nameOrNumber: newTableName, capacity: 4, status: 'FREE', tenantId: currentScope!.tenantId, unitId: currentScope!.unitId! }); 
                      notify('Mesa criada!', 'success'); setNewTableName(''); load(); 
                   }} 
                   className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all"
                >Criar Agora</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
