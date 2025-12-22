
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Material, Warehouse } from '../../types';

export const TransferNew: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const { currentScope, works } = useApp();
  const { notify } = useNotification();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [allWarehouses, setAllWarehouses] = useState<Warehouse[]>([]);
  const [form, setForm] = useState({ originWhId: '', destWhId: '' });
  const [items, setItems] = useState<any[]>([{ materialId: '', quantity: 1 }]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (currentScope) {
        setMaterials(await api.getMaterials());
        const tWorks = await api.getWorks(currentScope.tenantId);
        let list: Warehouse[] = [];
        for (const w of tWorks) {
          list = [...list, ...(await api.getWarehouses(w.id))];
        }
        setAllWarehouses(list);
        if (currentScope.warehouseId) setForm(f => ({ ...f, originWhId: currentScope.warehouseId! }));
      }
    };
    load();
  }, [currentScope]);

  const handleSubmit = async () => {
    if (!form.originWhId || !form.destWhId) return notify('Selecione origem e destino.', 'warning');
    if (items.some(i => !i.materialId)) return notify('Verifique os itens.', 'warning');
    
    setIsSaving(true);
    try {
      await api.createTransfer({
        tenantId: currentScope!.tenantId,
        originWarehouseId: form.originWhId,
        destinationWarehouseId: form.destWhId
      }, items.map(i => ({ materialId: i.materialId, quantityRequested: i.quantity })));
      
      notify('Transferência criada!', 'success');
      onFinished();
    } catch (err: any) {
      notify(err.message || 'Erro ao criar transferência', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Nova Transferência Manual</h1>
        <button onClick={onFinished} className="text-slate-400 font-bold hover:text-slate-600">Cancelar</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b bg-slate-50/30 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Origem (Onde sai)</label>
              <select className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.originWhId} onChange={e => setForm({...form, originWhId: e.target.value})}>
                 <option value="">Selecione origem...</option>
                 {allWarehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name} ({works.find(w => w.id === wh.unitId)?.name})</option>)}
              </select>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Destino (Onde entra)</label>
              <select className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.destWhId} onChange={e => setForm({...form, destWhId: e.target.value})}>
                 <option value="">Selecione destino...</option>
                 {allWarehouses.map(wh => <option key={wh.id} value={wh.id} disabled={wh.id === form.originWhId}>{wh.name} ({works.find(w => w.id === wh.unitId)?.name})</option>)}
              </select>
           </div>
        </div>

        <div className="p-8 space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 border-b pb-2">Itens da Transferência</h3>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-center animate-in slide-in-from-right-2">
               <select className="flex-1 p-2.5 bg-gray-50 border rounded-xl font-bold text-sm" value={item.materialId} onChange={e => {
                  const n = [...items]; n[idx].materialId = e.target.value; setItems(n);
               }}>
                  <option value="">Selecione Material...</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.sku} | {m.name}</option>)}
               </select>
               <input type="number" className="w-24 p-2.5 bg-gray-50 border rounded-xl text-center font-black" value={item.quantity} onChange={e => {
                  const n = [...items]; n[idx].quantity = Number(e.target.value); setItems(n);
               }} />
               <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-rose-300 hover:text-rose-500"><i className="fas fa-trash-alt"></i></button>
            </div>
          ))}
          <button onClick={() => setItems([...items, { materialId: '', quantity: 1 }])} className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all">Adicionar Item</button>
        </div>

        <div className="p-8 bg-slate-900 flex justify-end">
           <button onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-500/30 active:scale-95 transition-all">
             {isSaving ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-paper-plane mr-2"></i>}
             Criar Guia de Transferência
           </button>
        </div>
      </div>
    </div>
  );
};
