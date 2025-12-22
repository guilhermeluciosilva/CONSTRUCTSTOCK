
import React, { useEffect, useState, useMemo } from 'react';
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
        notify(`Mesa ${selectedTable.nameOrNumber} aberta!`, 'success');
      } else if (activeTab) {
        await api.updateTab({ ...activeTab, customerName, peopleCount: paxCount });
        notify('Informações atualizadas!', 'success');
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
    notify(`${menuItem.name} adicionado`, 'success');
  };

  const updateItemStatus = async (itemId: string, status: TabItem['status']) => {
    if (!activeTab) return;
    const updatedItems = activeTab.items.map(i => i.id === itemId ? { ...i, status } : i);
    await api.updateTab({ ...activeTab, items: updatedItems });
    load();
  };

  const handleFinalClose = async () => {
    if (!activeTab || !user || !currentScope?.warehouseId) {
      return notify('Verifique o estoque selecionado e tente novamente.', 'warning');
    }
    try {
      await api.closeTab(activeTab.id, currentScope.warehouseId, paymentMethod, user.id);
      notify('Comanda encerrada com sucesso!', 'success');
      setShowCloseTab(false);
      setSelectedTable(null);
      load();
    } catch (e: any) { 
      notify(e.message, 'error'); 
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
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Gestão de Salão</h1>
          <p className="text-gray-500 text-sm">Mapa de ocupação e comandas ativas.</p>
        </div>
        <button onClick={() => setShowAddTable(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg flex items-center gap-2 active:scale-95 transition-all">
          <i className="fas fa-plus"></i> Nova Mesa
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Mapa de Mesas */}
        <div className="lg:col-span-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-4">
           {tables.map(t => (
             <div 
               key={t.id} 
               onClick={() => handleTableClick(t)} 
               className={`aspect-square relative p-4 rounded-[32px] border-2 transition-all cursor-pointer select-none active:scale-95 flex flex-col items-center justify-center gap-2 text-center ${selectedTable?.id === t.id ? 'ring-4 ring-blue-500/20 border-blue-600 shadow-xl' : ''} ${t.status === 'FREE' ? 'bg-white border-slate-100 hover:border-emerald-200' : 'bg-rose-50 border-rose-100'}`}
             >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${t.status === 'FREE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-600 text-white shadow-lg'}`}>
                  <i className="fas fa-chair"></i>
                </div>
                <p className="text-base font-black text-slate-800 leading-none">Mesa {t.nameOrNumber}</p>
                <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${t.status === 'FREE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-200 text-rose-700'}`}>
                  {t.status === 'FREE' ? 'Livre' : 'Ocupada'}
                </div>
                {t.activeTabId && <div className="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>}
             </div>
           ))}
        </div>

        {/* Painel da Comanda */}
        <div className="lg:col-span-4 bg-white rounded-[40px] border border-slate-100 shadow-2xl min-h-[650px] flex flex-col overflow-hidden sticky top-24">
           {selectedTable ? (
             <>
               <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Comanda Mesa {selectedTable.nameOrNumber}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unidade: {getLabel('UNIT')}</p>
                  </div>
                  <button onClick={() => setSelectedTable(null)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 shadow-sm transition-all"><i className="fas fa-times"></i></button>
               </div>
               
               {selectedTable.status === 'FREE' ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6 animate-in slide-in-from-bottom-4">
                    <div className="w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center text-emerald-500 text-4xl shadow-inner rotate-3"><i className="fas fa-play"></i></div>
                    <div className="space-y-2">
                       <p className="font-black text-slate-800 text-lg uppercase tracking-tight">Mesa Pronta</p>
                       <p className="text-slate-400 text-sm font-medium">Toque abaixo para abrir o atendimento.</p>
                    </div>
                    <button onClick={handleStartOpen} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all">Iniciar Atendimento</button>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Header da Comanda */}
                    <div className="px-8 py-5 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-blue-600 uppercase mb-1 flex items-center gap-1">
                             <i className="fas fa-users"></i> {activeTab?.peopleCount || 0} Lugares (PAX)
                          </span>
                          <span className="text-sm font-black text-slate-700 truncate max-w-[180px]">{activeTab?.customerName || 'Consumidor Final'}</span>
                       </div>
                       <button onClick={handleUpdatePax} className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-500 text-[10px] font-black uppercase shadow-sm hover:bg-blue-600 hover:text-white transition-all">Editar PAX</button>
                    </div>

                    {/* Lista de Itens */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                       {activeTab?.items.map((item) => (
                         <div key={item.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${item.status === 'CANCELED' ? 'bg-slate-50 opacity-40 grayscale' : 'bg-white border-slate-100 hover:shadow-lg'}`}>
                            <div className="min-w-0">
                               <p className={`text-xs font-black uppercase truncate ${item.status === 'CANCELED' ? 'line-through' : 'text-slate-800'}`}>{item.nameSnapshot}</p>
                               <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-slate-400">{item.qty}x {formatCurrency(item.unitPriceSnapshot)}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase border ${
                                     item.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                     item.status === 'IN_PREP' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                     item.status === 'SERVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                     'bg-rose-50 text-rose-600 border-rose-100'
                                  }`}>{item.status.replace('_', ' ')}</span>
                               </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               {item.status === 'PENDING' && <button onClick={() => updateItemStatus(item.id, 'IN_PREP')} className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"><i className="fas fa-fire-burner text-xs"></i></button>}
                               {item.status === 'IN_PREP' && <button onClick={() => updateItemStatus(item.id, 'SERVED')} className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"><i className="fas fa-check text-xs"></i></button>}
                               {item.status !== 'CANCELED' && <button onClick={() => updateItemStatus(item.id, 'CANCELED')} className="w-8 h-8 bg-rose-50 text-rose-400 rounded-lg flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"><i className="fas fa-trash-alt text-xs"></i></button>}
                            </div>
                         </div>
                       ))}
                       {activeTab?.items.length === 0 && <div className="py-20 text-center flex flex-col items-center gap-3 opacity-20"><i className="fas fa-clipboard-list text-4xl"></i><p className="text-[10px] font-black uppercase tracking-widest">Sem pedidos lançados</p></div>}
                    </div>

                    {/* PDV / Lançamento Rápido */}
                    <div className="p-8 bg-[#1a1a1a] text-white">
                       <div className="flex justify-between items-center mb-6">
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Total Consumo</p>
                            <p className="text-4xl font-black text-emerald-400 tracking-tighter">{formatCurrency(activeTab?.totalAmount || 0)}</p>
                          </div>
                          <button onClick={() => setShowCloseTab(true)} className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">Fechar Conta</button>
                       </div>
                       
                       <div className="space-y-4">
                          <div className="relative">
                             <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                             <input 
                               className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold focus:bg-white/10 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                               placeholder="Buscar prato ou bebida..."
                               value={menuSearch}
                               onChange={e => setMenuSearch(e.target.value)}
                             />
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                             {filteredMenu.map(m => (
                               <button 
                                 key={m.id} 
                                 onClick={() => addItemToTab(m)} 
                                 className="p-3 bg-white/5 rounded-xl text-left hover:bg-blue-600 transition-all border border-white/5 group active:scale-95"
                               >
                                 <p className="text-[10px] font-black text-slate-200 uppercase truncate group-hover:text-white">{m.name}</p>
                                 <p className="text-[9px] font-bold text-emerald-400 group-hover:text-blue-100">{formatCurrency(m.price)}</p>
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
               )}
             </>
           ) : (
             <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6 animate-in zoom-in-95">
                <div className="w-28 h-28 bg-slate-50 rounded-[40px] flex items-center justify-center text-5xl text-slate-200 shadow-inner rotate-3 border border-slate-100"><i className="fas fa-hand-pointer"></i></div>
                <div className="space-y-2">
                   <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 leading-relaxed">Nenhuma mesa<br/>selecionada</p>
                   <p className="text-slate-300 text-[10px] font-medium max-w-[200px] uppercase">Toque em um número no mapa lateral para abrir as opções.</p>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Modal PAX/Configuração Atendimento */}
      {showPaxModal && selectedTable && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
             <div className="p-10 bg-emerald-600 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-[24px] flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg"><i className="fas fa-users"></i></div>
                <h2 className="text-xl font-black uppercase tracking-tight">Atendimento Mesa {selectedTable.nameOrNumber}</h2>
             </div>
             <div className="p-10 space-y-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center block">Número de Clientes (PAX)</label>
                   <div className="flex items-center justify-center gap-8">
                      <button onClick={() => setPaxCount(Math.max(1, paxCount - 1))} className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 text-2xl font-black hover:bg-slate-200 transition-all">-</button>
                      <span className="text-4xl font-black text-slate-800 w-12 text-center">{paxCount}</span>
                      <button onClick={() => setPaxCount(paxCount + 1)} className="w-12 h-12 rounded-2xl bg-blue-600 text-white text-2xl font-black hover:bg-blue-700 transition-all shadow-lg">+</button>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-bold">Nome do Cliente / Comanda</label>
                   <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="Ex: João Silva ou Comanda 45" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
             </div>
             <div className="p-10 pt-0 flex gap-4">
                <button onClick={() => setShowPaxModal(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-800 transition-colors">Voltar</button>
                <button onClick={confirmPaxAction} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all">Confirmar Configuração</button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Fechamento */}
      {showCloseTab && activeTab && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
             <div className="p-10 border-b bg-slate-900 text-white text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl mx-auto mb-4 shadow-lg shadow-emerald-500/20"><i className="fas fa-check"></i></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Total à Pagar</p>
                <h2 className="text-5xl font-black text-emerald-400 leading-none tracking-tighter">{formatCurrency(activeTab.totalAmount)}</h2>
             </div>
             <div className="p-10 space-y-6">
                <div className="grid grid-cols-3 gap-3">
                   {[ 
                     {id:'CARD', label:'Cartão', icon:'fa-credit-card'}, 
                     {id:'PIX', label:'PIX', icon:'fa-bolt'}, 
                     {id:'CASH', label:'Dinheiro', icon:'fa-money-bill'} 
                   ].map(p => (
                     <button 
                        key={p.id} 
                        onClick={() => setPaymentMethod(p.id as any)} 
                        className={`p-5 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === p.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 opacity-60 text-slate-400'}`}
                     >
                        <i className={`fas ${p.icon} text-2xl`}></i>
                        <span className="text-[9px] font-black uppercase tracking-widest">{p.label}</span>
                     </button>
                   ))}
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                   <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                   <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">Ao confirmar, o sistema dará baixa automática no estoque dos insumos (ficha técnica) deste pedido.</p>
                </div>
             </div>
             <div className="p-10 pt-0 flex gap-4">
                <button onClick={() => setShowCloseTab(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-800 transition-colors">Voltar</button>
                <button onClick={handleFinalClose} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all">Finalizar & Imprimir</button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Mesa */}
      {showAddTable && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
             <div className="p-8 border-b bg-slate-50 flex justify-between items-center"><h2 className="text-xl font-black text-slate-800">Layout do Salão</h2><button onClick={() => setShowAddTable(false)} className="text-slate-400"><i className="fas fa-times"></i></button></div>
             <div className="p-8 space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Identificação da Mesa (Número)</label>
                   <input autoFocus className="w-full p-4 bg-gray-50 border border-slate-200 rounded-xl font-black text-xl outline-none focus:ring-2 focus:ring-blue-500" value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="Ex: 15" />
                </div>
             </div>
             <div className="p-8 bg-slate-50 flex gap-4">
                <button onClick={() => setShowAddTable(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                <button 
                   onClick={async () => { 
                      if (!newTableName) return notify('Informe o número', 'warning');
                      await api.saveTable({ nameOrNumber: newTableName, capacity: 4, status: 'FREE', tenantId: currentScope!.tenantId, unitId: currentScope!.unitId! }); 
                      notify('Mesa adicionada!', 'success'); setShowAddTable(false); setNewTableName(''); load(); 
                   }} 
                   className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-200 active:scale-95 transition-all"
                >Salvar Mesa</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
