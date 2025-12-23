
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Material, Stock } from '../../types';

export const StockList: React.FC = () => {
  const { currentScope, getLabel } = useApp();
  const { notify } = useNotification();
  const [inventory, setInventory] = useState<{ material: Material, stock: Stock }[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState<'ENTRY' | 'EXIT' | null>(null);
  const [modalData, setModalData] = useState({ materialId: '', quantity: 0, reference: '', description: '' });
  
  // Estados para Busca de Material no Modal
  const [materialSearch, setMaterialSearch] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

  const load = async () => {
    if (currentScope) {
      const stocks = await api.getStock(currentScope);
      const mats = await api.getMaterials();
      setMaterials(mats.sort((a, b) => a.name.localeCompare(b.name)));
      const merged = stocks.map(s => ({ stock: s, material: mats.find(m => m.id === s.materialId)! })).filter(x => x.material);
      setInventory(merged);
    }
  };

  useEffect(() => { load(); }, [currentScope]);

  const handleAction = async () => {
    if (!currentScope?.warehouseId) {
      const whs = await api.getWarehouses(currentScope?.unitId || '');
      if (whs.length > 0) {
        const target = whs.find(w => w.isCentral) || whs[0];
        modalData.reference = modalData.reference || 'Ação Manual';
        await processMovement(target.id);
      } else {
        return notify('Selecione um almoxarifado no topo.', 'error');
      }
    } else {
      await processMovement(currentScope.warehouseId);
    }
  };

  const processMovement = async (whId: string) => {
    if (!modalData.materialId || modalData.quantity <= 0) return notify('Preencha os campos.', 'warning');
    try {
      await api.addMovement({
        warehouseId: whId,
        materialId: modalData.materialId,
        type: showModal as any,
        quantity: modalData.quantity,
        referenceId: modalData.reference,
        description: modalData.description || (showModal === 'ENTRY' ? 'Entrada Manual' : 'Saída Manual')
      });
      notify('Saldo atualizado com sucesso!', 'success');
      setShowModal(null);
      setModalData({ materialId: '', quantity: 0, reference: '', description: '' });
      setMaterialSearch('');
      load();
    } catch (err: any) { notify(err.message, 'error'); }
  };

  const filteredModalMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(materialSearch.toLowerCase()) || 
    m.sku.toLowerCase().includes(materialSearch.toLowerCase())
  ).slice(0, 10);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Inventário Local</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-widest">{getLabel('UNIT')}: {currentScope?.warehouseId ? 'Estoque Selecionado' : 'Visão Geral'}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => setShowModal('ENTRY')} className="flex-1 sm:flex-none bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-emerald-500/10 hover:scale-105 active:scale-95 transition-all">Entrada</button>
          <button onClick={() => setShowModal('EXIT')} className="flex-1 sm:flex-none bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-rose-500/10 hover:scale-105 active:scale-95 transition-all">Saída</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#1e293b]/30 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                <th className="px-8 py-5">Identificação</th>
                <th className="px-6 py-5 text-center">Saldo Atual</th>
                <th className="px-6 py-5 text-center">Reserva</th>
                <th className="px-8 py-5 text-right">Status Saúde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
              {inventory.map(({ material, stock }) => (
                <tr key={material.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-6">
                     <p className="font-black text-slate-900 dark:text-white uppercase text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{material.name}</p>
                     <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 mt-1 tracking-wider uppercase">{material.sku} • {material.category}</p>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex flex-col">
                      <span className={`text-xl font-black ${stock.quantity < material.minStock ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {stock.quantity.toFixed(3)}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase">{material.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center text-slate-500 dark:text-slate-500 font-bold text-xs uppercase tracking-tighter">
                     {(stock.reserved || 0).toFixed(3)}
                  </td>
                  <td className="px-8 py-6 text-right">
                     {stock.quantity < material.minStock ? (
                       <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                          <span className="text-rose-600 dark:text-rose-400 font-black uppercase text-[9px]">Reposição</span>
                       </div>
                     ) : (
                       <span className="text-emerald-600 dark:text-emerald-500/40 font-black uppercase text-[9px] tracking-widest">Estável</span>
                     )}
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr><td colSpan={4} className="py-32 text-center opacity-20 text-slate-400 dark:text-slate-500"><i className="fas fa-boxes text-6xl mb-4"></i><p className="font-black text-xs uppercase tracking-[0.3em]">Sem registros no estoque</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className={`p-8 border-b border-slate-200 dark:border-slate-800 ${showModal === 'ENTRY' ? 'bg-emerald-600/10' : 'bg-rose-600/10'}`}>
              <h2 className={`text-xl font-black uppercase tracking-tight ${showModal === 'ENTRY' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                {showModal === 'ENTRY' ? 'Lançar Entrada' : 'Lançar Saída'}
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Movimentação Manual de Inventário</p>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-1 relative">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600">Procurar Insumo</label>
                <div className="relative">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                  <input 
                    className="w-full pl-10 p-4 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-600" 
                    placeholder="Digite o nome ou código..."
                    value={materialSearch}
                    onFocus={() => setShowMaterialDropdown(true)}
                    onChange={e => { setMaterialSearch(e.target.value); setShowMaterialDropdown(true); }}
                  />
                </div>

                {showMaterialDropdown && (
                  <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[110] mt-2 overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                      {filteredModalMaterials.map(m => (
                        <button 
                          key={m.id}
                          onClick={() => {
                            setModalData({...modalData, materialId: m.id});
                            setMaterialSearch(`${m.name} (${m.unit})`);
                            setShowMaterialDropdown(false);
                          }}
                          className="w-full p-4 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-slate-100 dark:border-slate-700 last:border-0 flex justify-between items-center group"
                        >
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase group-hover:text-blue-600 transition-colors">{m.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{m.sku} • {m.category}</p>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase">{m.unit}</span>
                        </button>
                      ))}
                      {filteredModalMaterials.length === 0 && (
                        <div className="p-8 text-center opacity-40 font-bold text-[10px] uppercase tracking-widest text-slate-400">Nenhum insumo encontrado</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600">Quantidade</label>
                   <input type="number" step="0.001" className="w-full p-4 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-600" value={modalData.quantity} onChange={e => setModalData({...modalData, quantity: Number(e.target.value)})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600">Referência (NF/Doc)</label>
                   <input type="text" className="w-full p-4 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-600" value={modalData.reference} onChange={e => setModalData({...modalData, reference: e.target.value})} />
                 </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600">Observações</label>
                <textarea className="w-full p-4 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-600" rows={2} value={modalData.description} onChange={e => setModalData({...modalData, description: e.target.value})} />
              </div>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-800/30 flex gap-4">
              <button onClick={() => setShowModal(null)} className="flex-1 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase hover:text-slate-900 dark:hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleAction} className={`flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase shadow-lg ${showModal === 'ENTRY' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}>Confirmar Lançamento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
