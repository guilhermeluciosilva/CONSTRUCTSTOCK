
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

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-black text-slate-800 tracking-tight">Inventário Local</h1></div>
        <div className="flex gap-2">
          <button disabled={!currentScope?.warehouseId} onClick={() => setShowModal('ENTRY')} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-black shadow-lg text-[10px] uppercase">Entrada</button>
          <button disabled={!currentScope?.warehouseId} onClick={() => setShowModal('EXIT')} className="bg-rose-600 text-white px-5 py-2 rounded-xl font-black shadow-lg text-[10px] uppercase">Saída</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead><tr className="bg-gray-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-gray-100"><th className="px-8 py-5">Produto</th><th className="px-6 py-5 text-center">Saldo</th><th className="px-8 py-5 text-right">Saúde</th></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {inventory.map(({ material, stock }) => (
              <tr key={material.id} className="hover:bg-blue-50/20 transition-all text-sm">
                <td className="px-8 py-5">
                   <p className="font-bold text-slate-800 uppercase leading-none">{material.name}</p>
                   <p className="text-[9px] font-black text-blue-600 mt-1">{material.sku}</p>
                </td>
                <td className="px-6 py-5 text-center font-black">{stock.quantity} <span className="text-[9px] text-slate-400 font-bold">{material.unit}</span></td>
                <td className="px-8 py-5 text-right">
                   {stock.quantity < material.minStock ? <span className="text-rose-500 font-black uppercase text-[9px]">Reposição</span> : <span className="text-emerald-500 font-black uppercase text-[9px]">Ok</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className={`p-8 border-b ${showModal === 'ENTRY' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              <h2 className="text-xl font-black">Registro de {showModal === 'ENTRY' ? 'Entrada' : 'Saída'}</h2>
            </div>
            <div className="p-8 space-y-4">
              <select className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={modalData.materialId} onChange={e => setModalData({...modalData, materialId: e.target.value})}>
                 <option value="">Selecione Produto...</option>
                 {materials.map(m => <option key={m.id} value={m.id}>{m.sku} | {m.name}</option>)}
              </select>
              <input type="number" placeholder="Qtd" className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={modalData.quantity} onChange={e => setModalData({...modalData, quantity: Number(e.target.value)})} />
              <input type="text" placeholder="Referência (NF, Documento...)" className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={modalData.reference} onChange={e => setModalData({...modalData, reference: e.target.value})} />
              <textarea placeholder="Observações..." className="w-full p-3 bg-gray-50 border rounded-xl text-sm" rows={2} value={modalData.description} onChange={e => setModalData({...modalData, description: e.target.value})} />
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={() => setShowModal(null)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
              <button onClick={handleAction} className={`flex-1 py-3 text-white rounded-xl font-black text-[10px] uppercase shadow-lg ${showModal === 'ENTRY' ? 'bg-emerald-600' : 'bg-rose-600'}`}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
