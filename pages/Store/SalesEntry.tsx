
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Material } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const SalesEntry: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const { currentScope, warehouses } = useApp();
  const { user } = useAuth();
  const { notify } = useNotification();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState<any[]>([{ materialId: '', quantity: 1, unitPrice: 0 }]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.getMaterials().then(setMaterials);
  }, []);

  const updateItem = (idx: number, updates: any) => {
    const newItems = [...items];
    const mat = materials.find(m => m.id === (updates.materialId || newItems[idx].materialId));
    if (updates.materialId && mat) {
      updates.unitPrice = mat.salePrice || 0;
    }
    newItems[idx] = { ...newItems[idx], ...updates };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    const warehouseId = currentScope?.warehouseId || (warehouses.length > 0 ? warehouses[0].id : null);
    if (!warehouseId) return notify('Selecione um estoque.', 'error');
    if (items.some(i => !i.materialId || i.quantity <= 0)) return notify('Itens inválidos.', 'warning');

    try {
      setIsSaving(true);
      await api.createSale({
        tenantId: currentScope!.tenantId,
        unitId: currentScope!.unitId,
        warehouseId: warehouseId,
        customerName: customer || 'Consumidor Final',
        sellerId: user?.name
      }, items);
      
      notify('Venda concluída!', 'success');
      onFinished();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const totalSale = items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800">Checkout Balcão</h1>
        <button onClick={onFinished} className="text-slate-400 font-bold text-[10px] uppercase">Cancelar</button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 bg-slate-50 border-b grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400">Cliente</label>
            <input 
              className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm"
              placeholder="Consumidor Final"
              value={customer}
              onChange={e => setCustomer(e.target.value)}
            />
          </div>
        </div>

        <div className="p-8 space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="text-[10px] font-black uppercase text-slate-800">Itens</h3>
            <button onClick={() => setItems([...items, { materialId: '', quantity: 1, unitPrice: 0 }])} className="text-blue-600 text-[10px] font-black uppercase">+ Adicionar</button>
          </div>
          
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-end animate-in fade-in">
                <div className="flex-1">
                  <select 
                    className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-bold text-sm"
                    value={item.materialId}
                    onChange={e => updateItem(idx, { materialId: e.target.value })}
                  >
                    <option value="">Produto...</option>
                    {materials.filter(m => m.salePrice).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <input type="number" className="w-20 p-3 bg-gray-50 border border-slate-200 rounded-xl font-black text-center" value={item.quantity} onChange={e => updateItem(idx, { quantity: Number(e.target.value) })} />
                <div className="w-28 py-3 text-right font-black text-slate-600 text-sm">{formatCurrency(item.quantity * item.unitPrice)}</div>
                <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-rose-300 hover:text-rose-600"><i className="fas fa-times"></i></button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-slate-900 flex justify-between items-center text-white">
          <div className="text-left">
            <p className="text-[9px] font-black uppercase text-slate-500">Total a Pagar</p>
            <p className="text-3xl font-black text-emerald-400">{formatCurrency(totalSale)}</p>
          </div>
          <button 
            disabled={isSaving}
            onClick={handleSubmit}
            className="bg-emerald-600 px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? '...' : 'Concluir Venda'}
          </button>
        </div>
      </div>
    </div>
  );
};
