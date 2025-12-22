
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Material, OperationType } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const SalesEntry: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const { currentScope, activeUnit, activeTenant, warehouses } = useApp();
  const { user } = useAuth();
  const { notify } = useNotification();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [customer, setCustomer] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [seller, setSeller] = useState(user?.name || '');
  const [items, setItems] = useState<any[]>([{ materialId: '', quantity: 1, unitPrice: 0 }]);
  const [isSaving, setIsSaving] = useState(false);

  const effectiveOpType = activeUnit?.operationType || activeTenant?.operationType;
  const isRestaurant = effectiveOpType === OperationType.RESTAURANT;

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
    // Garante que temos um almoxarifado selecionado ou auto-seleciona se houver apenas um
    const warehouseId = currentScope?.warehouseId || (warehouses.length > 0 ? warehouses[0].id : null);
    
    if (!warehouseId) return notify('Erro: Selecione um almoxarifado para esta unidade.', 'error');
    if (items.some(i => !i.materialId || i.quantity <= 0)) return notify('Verifique os itens da venda.', 'warning');

    try {
      setIsSaving(true);
      await api.createSale({
        tenantId: currentScope!.tenantId,
        unitId: currentScope!.unitId || currentScope!.workId,
        warehouseId: warehouseId,
        customerName: customer || 'Consumidor Final',
        tableNumber: tableNumber,
        sellerId: seller
      }, items);
      
      notify('Venda registrada e estoque baixado!', 'success');
      onFinished();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const totalSale = items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);

  if (!currentScope?.unitId) {
    return <div className="p-20 text-center text-slate-300 font-black uppercase">Selecione uma Unidade no topo para vender.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Novo Registro de Venda</h1>
          <p className="text-gray-500 text-sm">Venda rápida de itens com baixa automática.</p>
        </div>
        <button onClick={onFinished} className="text-slate-400 font-bold hover:text-slate-600 uppercase text-xs tracking-widest">Cancelar</button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 bg-slate-50 border-b grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vendedor Responsável</label>
            <input 
              type="text" 
              className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={seller}
              onChange={e => setSeller(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Identificação do Cliente</label>
            <input 
              type="text" 
              className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome ou CPF (Opcional)"
              value={customer}
              onChange={e => setCustomer(e.target.value)}
            />
          </div>
        </div>

        <div className="p-8 space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-800 border-b pb-2 flex justify-between">
            Itens da Venda
            <button onClick={() => setItems([...items, { materialId: '', quantity: 1, unitPrice: 0 }])} className="text-blue-600 text-[10px] font-black uppercase">
               + Adicionar Item
            </button>
          </h3>
          
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-end animate-in fade-in">
                <div className="flex-1 space-y-1">
                  <select 
                    className="w-full p-2.5 bg-gray-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={item.materialId}
                    onChange={e => updateItem(idx, { materialId: e.target.value })}
                  >
                    <option value="">Selecione Material...</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({formatCurrency(m.salePrice || 0)})</option>)}
                  </select>
                </div>
                <div className="w-24 space-y-1">
                  <input 
                    type="number" 
                    className="w-full p-2.5 bg-gray-50 border border-slate-200 rounded-xl font-black text-center text-sm"
                    value={item.quantity}
                    onChange={e => updateItem(idx, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="w-32 py-2.5 text-right font-black text-slate-600 text-sm">
                   {formatCurrency(item.quantity * item.unitPrice)}
                </div>
                <button 
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  className="w-10 h-10 flex items-center justify-center text-rose-300 hover:text-rose-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-slate-900 flex justify-between items-center text-white">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Geral</p>
            <p className="text-3xl font-black text-emerald-400">{formatCurrency(totalSale)}</p>
          </div>
          <button 
            disabled={isSaving || items.length === 0}
            onClick={handleSubmit}
            className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isSaving ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-check-double text-lg"></i>}
            Finalizar Venda
          </button>
        </div>
      </div>
    </div>
  );
};
