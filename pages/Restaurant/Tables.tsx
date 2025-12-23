
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { RestaurantTable, Tab, MenuItem, TabItem } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const Tables: React.FC = () => {
  const { currentScope, activeTenant, activeUnit } = useApp();
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

  const generateReceipt = (tab: Tab, table: RestaurantTable) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
      <head>
        <title>Recibo de Consumo - Mesa ${table.nameOrNumber}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 5mm; font-size: 12px; line-height: 1.2; }
          .header { text-align: center; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 5mm; margin-bottom: 5mm; }
          .item { display: flex; justify-content: space-between; margin-bottom: 1mm; }
          .total { border-top: 1px dashed #000; margin-top: 5mm; padding-top: 5mm; font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; }
          .footer { text-align: center; font-size: 10px; margin-top: 10mm; color: #666; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${activeTenant?.name || 'ConstructStock Resto'}<br>
          UNIDADE: ${activeUnit?.name || 'Matriz'}<br>
          RECIBO DE CONSUMO - MESA ${table.nameOrNumber}<br>
          ${new Date().toLocaleString()}
        </div>
        <div style="margin-bottom: 3mm">CLIENTE: ${tab.customerName || 'Consumidor Final'}</div>
        <div style="margin-bottom: 5mm">PESSOAS: ${tab.peopleCount || 1}</div>
        
        ${tab.items.filter(i => i.status !== 'CANCELED').map(i => `
          <div class="item">
            <span>${i.qty}x ${i.nameSnapshot}</span>
            <span>${formatCurrency(i.qty * i.unitPriceSnapshot)}</span>
          </div>
        `).join('')}

        <div class="total">
          <span>TOTAL</span>
          <span>${formatCurrency(tab.totalAmount)}</span>
        </div>
        
        <div style="margin-top: 5mm; text-align: right;">
          FORMA PGTO: <b>${tab.paymentMethod || paymentMethod}</b>
        </div>

        <div class="footer">
          Obrigado pela preferência!<br>
          Volte sempre.
        </div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleStartOpen = () => {
    setCustomerName('');
    setPaxCount(2);
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
        notify('PAX atualizado!', 'success');
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
    notify(`Lançado: ${menuItem.name}`, 'success');
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
      else return notify('Cadastre um local de estoque.', 'error');
    }

    try {
      const tabToPrint = JSON.parse(JSON.stringify({ ...activeTab, paymentMethod }));
      const tableToPrint = JSON.parse(JSON.stringify({ ...selectedTable }));
      
      await api.closeTab(activeTab.id, targetWarehouseId, paymentMethod, user.id);
      notify(`Mesa ${selectedTable.nameOrNumber} encerrada!`, 'success');
      
      // Fechar modal de fechamento antes da pergunta
      setShowCloseTab(false);

      setTimeout(() => {
        if (window.confirm("Deseja imprimir o recibo desta mesa?")) {
          generateReceipt(tabToPrint, tableToPrint);
        }
        setSelectedTable(null);
        load();
      }, 300);
      
    } catch (e: any) { notify(e.message, 'error'); }
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
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-none">Mapa de Mesas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest">Controle de ocupação e lançamentos.</p>
        </div>
        <button onClick={() => setShowAddTable(true)} className="bg-slate-900 dark:bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">Criar Mesa</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
           {tables.map(t => (
             <div 
               key={t.id} 
               onClick={() => handleTableClick(t)} 
               className={`aspect-square relative p-6 rounded-[32px] border-2 transition-all cursor-pointer select-none active:scale-95 flex flex-col items-center justify-center gap-2 text-center ${selectedTable?.id === t.id ? 'border-blue-50 bg-blue-500/10 shadow-2xl scale-105 z-10' : t.status === 'FREE' ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300' : 'bg-rose-500/5 border-rose-500/20 shadow-inner'}`}
             >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${t.status === 'FREE' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600' : 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'}`}>
                  <i className="fas fa-chair"></i>
                </div>
                <p className={`text-base font-black leading-none ${t.status === 'FREE' ? 'text-slate-800 dark:text-slate-200' : 'text-rose-700 dark:text-rose-400'}`}>Mesa {t.nameOrNumber}</p>
                {t.activeTabId && <div className="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>}
             </div>
           ))}
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-2xl min-h-[750px] flex flex-col overflow-hidden sticky top-24">
           {selectedTable ? (
             <div className="flex flex-col h-full animate-in slide-in-from-right-4">
               <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-none">Mesa {selectedTable.nameOrNumber}</h3>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mt-2">{activeTab?.customerName || 'Consumidor Final'} • {activeTab?.peopleCount || 0} PAX</p>
                  </div>
                  <button onClick={() => setSelectedTable(null)} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-rose-500 transition-all"><i className="fas fa-times"></i></button>
               </div>
               
               {selectedTable.status === 'FREE' ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[32px] flex items-center justify-center text-slate-200 dark:text-slate-700 text-4xl border border-slate-100 dark:border-slate-700 shadow-inner"><i className="fas fa-play"></i></div>
                    <button onClick={handleStartOpen} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all">Abrir Comanda</button>
                 </div>
               ) : (
                 <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-slate-50/30 dark:bg-[#020617]/30">
                       {activeTab?.items.map((item) => (
                         <div key={item.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${item.status === 'CANCELED' ? 'opacity-20 grayscale' : 'bg-white dark:bg-[#0f172a] border-slate-100 dark:border-slate-800 shadow-sm'}`}>
                            <div className="min-w-0">
                               <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 truncate">{item.nameSnapshot}</p>
                               <p className="text-[10px] font-bold text-slate-400 mt-1">{item.qty}x {formatCurrency(item.unitPriceSnapshot)}</p>
                            </div>
                            <div className="flex gap-1">
                               {item.status !== 'CANCELED' && <button onClick={() => updateItemStatus(item.id, 'CANCELED')} className="w-9 h-9 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><i className="fas fa-trash-alt text-xs"></i></button>}
                            </div>
                         </div>
                       ))}
                    </div>

                    <div className="p-8 bg-white dark:bg-[#020617] border-t border-slate-200 dark:border-slate-800">
                       <div className="flex justify-between items-end mb-6">
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest leading-none mb-2">Total Parcial</p>
                            <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{formatCurrency(activeTab?.totalAmount || 0)}</p>
                          </div>
                          <button onClick={() => setShowCloseTab(true)} className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all">Fechar Conta</button>
                       </div>
                       
                       <div className="space-y-4">
                          <div className="relative">
                             <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                             <input className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Filtrar cardápio..." value={menuSearch} onChange={e => setMenuSearch(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                             {filteredMenu.map(m => (
                               <button key={m.id} onClick={() => addItemToTab(m)} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-left border border-slate-100 dark:border-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:border-blue-500 group transition-all active:scale-90">
                                 <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase truncate group-hover:text-white leading-tight mb-1">{m.name}</p>
                                 <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-100">{formatCurrency(m.price)}</p>
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
                <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800/30 rounded-[48px] flex items-center justify-center text-6xl text-slate-200 dark:text-slate-700 border border-slate-100 dark:border-slate-800 animate-pulse"><i className="fas fa-utensils"></i></div>
                <h3 className="text-xl font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">Escolha uma Mesa</h3>
             </div>
           )}
        </div>
      </div>

      {showPaxModal && selectedTable && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
             <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-blue-600 text-white text-center">
                <h2 className="text-xl font-black uppercase tracking-tight">Mesa {selectedTable.nameOrNumber}</h2>
             </div>
             <div className="p-10 space-y-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-slate-400 text-center block tracking-widest">Quantidade de Pessoas</label>
                   <div className="flex items-center justify-center gap-10">
                      <button onClick={() => setPaxCount(Math.max(1, paxCount - 1))} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-2xl font-black">-</button>
                      <span className="text-5xl font-black text-slate-900 dark:text-white w-14 text-center">{paxCount}</span>
                      <button onClick={() => setPaxCount(paxCount + 1)} className="w-12 h-12 rounded-2xl bg-blue-600 text-white text-2xl font-black shadow-lg">+</button>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome do Cliente (Opcional)</label>
                   <input className="w-full p-4 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
             </div>
             <div className="p-10 pt-0 flex gap-4">
                <button onClick={() => setShowPaxModal(false)} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase">Voltar</button>
                <button onClick={confirmPaxAction} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Confirmar</button>
             </div>
          </div>
        </div>
      )}

      {showCloseTab && activeTab && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
             <div className="p-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Valor Total</p>
                <h2 className="text-6xl font-black text-emerald-600 dark:text-emerald-400 leading-none tracking-tighter">{formatCurrency(activeTab.totalAmount)}</h2>
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
                        className={`p-6 rounded-[32px] border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === p.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10 text-blue-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                     >
                        <i className={`fas ${p.icon} text-2xl`}></i>
                        <span className="text-[9px] font-black uppercase">{p.label}</span>
                     </button>
                   ))}
                </div>
             </div>
             <div className="p-10 pt-0 flex gap-4">
                <button onClick={() => setShowCloseTab(false)} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase">Sair</button>
                <button onClick={handleFinalClose} className="flex-[2] py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase shadow-2xl active:scale-95 transition-all">Finalizar Mesa</button>
             </div>
          </div>
        </div>
      )}

      {showAddTable && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
             <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Nova Mesa</h2>
                <button onClick={() => setShowAddTable(false)} className="text-slate-400"><i className="fas fa-times"></i></button>
             </div>
             <div className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Número</label>
                   <input autoFocus type="text" className="w-full p-5 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600" value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="01" />
                </div>
             </div>
             <div className="p-8 bg-slate-50 dark:bg-slate-800/30 flex gap-4">
                <button onClick={() => setShowAddTable(false)} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase">Sair</button>
                <button 
                   onClick={async () => { 
                      if (!newTableName) return notify('Informe o número', 'warning');
                      await api.saveTable({ nameOrNumber: newTableName, capacity: 4, status: 'FREE', tenantId: currentScope!.tenantId, unitId: currentScope!.unitId! }); 
                      notify('Mesa criada!', 'success'); setNewTableName(''); load(); 
                   }} 
                   className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all"
                >Criar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
