
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

  const load = async () => {
    if (currentScope) {
      const stocks = await api.getStock(currentScope);
      const mats = await api.getMaterials();
      setMaterials(mats);
      const merged = stocks.map(s => ({ stock: s, material: mats.find(m => m.id === s.materialId)! })).filter(x => x.material);
      setInventory(merged);
    }
  };

  useEffect(() => { load(); }, [currentScope]);

  const handleAction = async () => {
    if (!currentScope?.warehouseId) {
      // Tenta resolução automática se for uma operação simples
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
      load();
    } catch (err: any) { notify(err.message, 'error'); }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Inventário Local</h1>
          <p className="text-slate-500 text-sm font-medium">{getLabel('UNIT')}: {currentScope?.warehouseId ? 'Estoque Selecionado' : 'Visão Geral'}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowModal('ENTRY')} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-emerald-500/10 hover:scale-105 active:scale-95 transition-all">Entrada</button>
          <button onClick={() => setShowModal('EXIT')} className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-rose-500/10 hover:scale-105 active:scale-95 transition-all">Saída</button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[40px] border border-slate-800 shadow-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#1e293b]/30 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
              <th className="px-8 py-5">Identificação</th>
              <th className="px-6 py-5 text-center">Saldo Atual</th>
              <th className="px-6 py-5 text-center">Reserva</th>
              <th className="px-8 py-5 text-right">Status Saúde</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {inventory.map(({ material, stock }) => (
              <tr key={material.id} className="hover:bg-slate-800/30 transition-all group">
                <td className="px-8 py-6">
                   <p className="font-black text-white uppercase text-sm group-hover:text-blue-400 transition-colors">{material.name}</p>
                   <p className="text-[10px] font-bold text-slate-600 mt-1 tracking-wider">{material.sku} • {material.category}</p>
                </td>
                <td className="px-6 py-6 text-center">
                  <div className="inline-flex flex-col">
                    <span className={`text-xl font-black ${stock.quantity < material.minStock ? 'text-rose-400' : 'text-emerald-400'}`}>{stock.quantity}</span>
                    <span className="text-[9px] font-black text-slate-600 uppercase">{material.unit}</span>
                  </div>
                </td>
                <td className="px-6 py-6 text-center text-slate-500 font-bold text-xs">
                   {stock.reserved || 0}
                </td>
                <td className="px-8 py-6 text-right">
                   {stock.quantity < material.minStock ? (
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                        <span className="text-rose-500 font-black uppercase text-[9px]">Reposição Urgente</span>
                     </div>
                   ) : (
                     <span className="text-emerald-500/40 font-black uppercase text-[9px] tracking-widest">Estável</span>
                   )}
                </td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr><td colSpan={4} className="py-32 text-center opacity-20"><i className="fas fa-boxes text-6xl mb-4"></i><p className="font-black text-xs uppercase tracking-[0.3em]">Sem registros no estoque</p></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-[40px] border border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className={`p-8 border-b border-slate-800 ${showModal === 'ENTRY' ? 'bg-emerald-600/10' : 'bg-rose-600/10'}`}>
              <h2 className={`text-xl font-black uppercase tracking-tight ${showModal === 'ENTRY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {showModal === 'ENTRY' ? 'Lançar Entrada' : 'Lançar Saída'}
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Movimentação Manual de Inventário</p>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-600">Material / Produto</label>
                <select className="w-full p-4 bg-[#020617] border border-slate-800 rounded-2xl font-bold text-white text-sm outline-none focus:ring-2 focus:ring-blue-600" value={modalData.materialId} onChange={e => setModalData({...modalData, materialId: e.target.value})}>
                   <option value="">Selecione...</option>
                   {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-600">Quantidade</label>
                   <input type="number" className="w-full p-4 bg-[#020617] border border-slate-800 rounded-2xl font-black text-white text-sm outline-none focus:ring-2 focus:ring-blue-600" value={modalData.quantity} onChange={e => setModalData({...modalData, quantity: Number(e.target.value)})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-600">Referência (NF/Doc)</label>
                   <input type="text" className="w-full p-4 bg-[#020617] border border-slate-800 rounded-2xl font-bold text-white text-sm outline-none focus:ring-2 focus:ring-blue-600" value={modalData.reference} onChange={e => setModalData({...modalData, reference: e.target.value})} />
                 </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-600">Observações</label>
                <textarea className="w-full p-4 bg-[#020617] border border-slate-800 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-blue-600" rows={2} value={modalData.description} onChange={e => setModalData({...modalData, description: e.target.value})} />
              </div>
            </div>
            <div className="p-8 bg-slate-800/30 flex gap-4">
              <button onClick={() => setShowModal(null)} className="flex-1 py-4 text-xs font-black text-slate-500 uppercase hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleAction} className={`flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase shadow-lg ${showModal === 'ENTRY' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}>Confirmar Lançamento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
