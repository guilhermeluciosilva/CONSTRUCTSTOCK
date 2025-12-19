
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Material, Stock } from '../../types';

export const StockList: React.FC = () => {
  const { currentScope } = useApp();
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
    if (!currentScope?.warehouseId) return notify('Selecione um almoxarifado.', 'error');
    if (!modalData.materialId || modalData.quantity <= 0) return notify('Preencha os campos.', 'warning');
    
    try {
      await api.addMovement({
        warehouseId: currentScope!.warehouseId,
        materialId: modalData.materialId,
        type: showModal as any,
        quantity: modalData.quantity,
        referenceId: modalData.reference,
        description: modalData.description
      });
      notify('Registro salvo com sucesso!', 'success');
      setShowModal(null);
      setModalData({ materialId: '', quantity: 0, reference: '', description: '' });
      load();
    } catch (err: any) { notify(err.message, 'error'); }
  };

  const isOperable = !!currentScope?.warehouseId;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-black text-slate-800 tracking-tight">Estoque Local</h1><p className="text-gray-500 text-sm italic">Controle de saldo e disponibilidade local no escopo ativo.</p></div>
        <div className="flex gap-2">
          <button disabled={!isOperable} onClick={() => setShowModal('ENTRY')} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black shadow-lg hover:bg-emerald-700 disabled:opacity-30 transition-all flex items-center gap-2 text-xs uppercase">Entrada</button>
          <button disabled={!isOperable} onClick={() => setShowModal('EXIT')} className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-black shadow-lg hover:bg-rose-700 disabled:opacity-30 transition-all flex items-center gap-2 text-xs uppercase">Saída</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead><tr className="bg-gray-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100"><th className="px-8 py-5">SKU</th><th className="px-6 py-5">Material</th><th className="px-6 py-5 text-center">Saldo Atual</th><th className="px-8 py-5 text-right">Saúde</th></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {inventory.map(({ material, stock }) => (
              <tr key={material.id} className="hover:bg-blue-50/20 transition-all text-sm">
                <td className="px-8 py-5 font-mono font-bold text-blue-600">{material.sku}</td>
                <td className="px-6 py-5 font-bold text-slate-800">{material.name}</td>
                <td className="px-6 py-5 text-center font-black">{stock.quantity} <span className="text-[10px] text-slate-400">{material.unit}</span></td>
                <td className="px-8 py-5 text-right">
                   {stock.quantity < material.minStock ? <span className="text-rose-500 font-black uppercase text-[10px]">Reposição Nec.</span> : <span className="text-emerald-500 font-black uppercase text-[10px]">Ok</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className={`p-8 border-b ${showModal === 'ENTRY' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              <h2 className="text-xl font-black">Registro de {showModal === 'ENTRY' ? 'Entrada' : 'Saída'}</h2>
            </div>
            <div className="p-8 space-y-4">
              <select className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm outline-none" value={modalData.materialId} onChange={e => setModalData({...modalData, materialId: e.target.value})}>
                 <option value="">Selecione Material...</option>
                 {materials.map(m => <option key={m.id} value={m.id}>{m.sku} | {m.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                 <input type="number" placeholder="Qtd" className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={modalData.quantity} onChange={e => setModalData({...modalData, quantity: Number(e.target.value)})} />
                 <input type="text" placeholder="Referência / NF" className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={modalData.reference} onChange={e => setModalData({...modalData, reference: e.target.value})} />
              </div>
              <textarea placeholder="Descrição / Motivo..." className="w-full p-3 bg-gray-50 border rounded-xl font-medium text-sm" rows={2} value={modalData.description} onChange={e => setModalData({...modalData, description: e.target.value})} />
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={() => setShowModal(null)} className="flex-1 py-3 text-xs font-black uppercase text-slate-400">Cancelar</button>
              <button onClick={handleAction} className={`flex-1 py-3 text-white rounded-xl font-black text-xs uppercase shadow-lg ${showModal === 'ENTRY' ? 'bg-emerald-600' : 'bg-rose-600'}`}>Confirmar Registro</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
