
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Material, RM, RMItem, Supplier } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const PONew: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const { currentScope } = useApp();
  const { notify } = useNotification();
  const [backlog, setBacklog] = useState<{ item: RMItem, rm: RM, material: Material }[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [step, setStep] = useState(1);
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (currentScope) {
      api.getPurchaseBacklog(currentScope.tenantId).then(setBacklog);
      api.getSuppliers(currentScope.tenantId).then(setSuppliers);
    }
  }, [currentScope]);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!supplierId || !deliveryDate) return notify('Preencha fornecedor e data.', 'warning');

    const itemsToBuy = backlog
      .filter(b => selectedItems.includes(b.item.id))
      .map(b => ({
        rmItemId: b.item.id,
        materialId: b.item.materialId,
        quantity: b.item.quantityRequested - b.item.quantityFulfilled,
        unitPrice: prices[b.item.id] || 0
      }));

    await api.createPO({
      tenantId: currentScope!.tenantId,
      unitId: backlog.find(b => selectedItems.includes(b.item.id))?.rm.unitId,
      supplierId: supplierId,
      deliveryDate: deliveryDate
    }, itemsToBuy);

    notify('Pedido de Compra criado com sucesso!', 'success');
    onFinished();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Novo Pedido de Compra</h1>
          <p className="text-gray-500 text-sm">Transforme itens requisitados em ordens de compra reais.</p>
        </div>
        <div className="flex gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        {step === 1 ? (
          <div className="p-0">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Itens Aguardando Compra</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black uppercase text-slate-400 border-b">
                  <tr>
                    <th className="px-6 py-3 w-10"></th>
                    <th className="px-6 py-3">Material</th>
                    <th className="px-6 py-3 text-center">Pendente</th>
                    <th className="px-6 py-3">Data Nec.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {backlog.map(({ item, rm, material }) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-blue-50/30 cursor-pointer transition-colors ${selectedItems.includes(item.id) ? 'bg-blue-50/50' : ''}`}
                      onClick={() => toggleItem(item.id)}
                    >
                      <td className="px-6 py-4">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedItems.includes(item.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'}`}>
                          {selectedItems.includes(item.id) && <i className="fas fa-check text-[10px]"></i>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">{material.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{material.sku}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-800">
                        {item.quantityRequested - item.quantityFulfilled} {material.unit}
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-blue-600">{new Date(rm.dateRequired).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-900 flex justify-between items-center">
              <span className="text-xs font-black uppercase text-slate-400">{selectedItems.length} itens selecionados</span>
              <button disabled={selectedItems.length === 0} onClick={() => setStep(2)} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-500/30 disabled:opacity-30">
                Próximo Passo <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-8 animate-in slide-in-from-right-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">Fornecedor</label>
                <select className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-bold text-sm outline-none" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">Previsão Entrega</label>
                <input type="date" className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-bold text-sm outline-none" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
              <button onClick={() => setStep(1)} className="px-6 py-2 text-slate-400 font-black text-xs uppercase">Voltar</button>
              <button onClick={handleSubmit} className="px-10 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-emerald-200">Confirmar Pedido</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
