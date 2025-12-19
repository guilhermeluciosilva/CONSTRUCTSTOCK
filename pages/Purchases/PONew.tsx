
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
    if (!supplierId || !deliveryDate) {
      notify('Preencha fornecedor e data de entrega', 'warning');
      return;
    }

    const itemsToBuy = backlog
      .filter(b => selectedItems.includes(b.item.id))
      .map(b => ({
        rmItemId: b.item.id,
        quantity: b.item.quantityRequested - b.item.quantityFulfilled,
        unitPrice: prices[b.item.id] || 0
      }));

    await api.createPO({
      tenantId: currentScope!.tenantId,
      workId: backlog.find(b => selectedItems.includes(b.item.id))?.rm.workId,
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
          <div className="w-8 h-px bg-gray-200 mt-4"></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {step === 1 && (
          <div className="p-0">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-black uppercase text-slate-400">Itens Aguardando Compra (Backlog de Saldo)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black uppercase text-slate-400 border-b">
                  <tr>
                    <th className="px-6 py-3 w-10"></th>
                    <th className="px-6 py-3">Material</th>
                    <th className="px-6 py-3">Origem</th>
                    <th className="px-6 py-3 text-center">Pedido</th>
                    <th className="px-6 py-3 text-center">Atendido</th>
                    <th className="px-6 py-3 text-center">Falta Comprar</th>
                    <th className="px-6 py-3">Data Nec.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {backlog.map(({ item, rm, material }) => {
                    const balance = item.quantityRequested - item.quantityFulfilled;
                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-blue-50/30 cursor-pointer transition-colors ${selectedItems.includes(item.id) ? 'bg-blue-50' : ''}`}
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
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">RM #{rm.id}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-400">{item.quantityRequested}</td>
                        <td className="px-6 py-4 text-center font-bold text-emerald-500">{item.quantityFulfilled}</td>
                        <td className="px-6 py-4 text-center font-black text-slate-800">{balance} {material.unit}</td>
                        <td className="px-6 py-4 text-xs font-black text-blue-600">{new Date(rm.dateRequired).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-900 flex justify-between items-center text-white">
              <span className="text-xs font-black uppercase tracking-widest">{selectedItems.length} itens selecionados</span>
              <button 
                disabled={selectedItems.length === 0}
                onClick={() => setStep(2)}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-30 transition-all"
              >
                Próximo Passo <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">Fornecedor Homologado</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                >
                  <option value="">Selecione o Fornecedor...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.taxId})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">Previsão de Entrega</label>
                <input 
                  type="date" 
                  className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-slate-400 border-b pb-2">Negociação de Preços</h3>
              {backlog.filter(b => selectedItems.includes(b.item.id)).map(({ item, material }) => {
                const buyQty = item.quantityRequested - item.quantityFulfilled;
                return (
                  <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-800">{material.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{buyQty} {material.unit} (Restante)</p>
                    </div>
                    <div className="w-48 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
                      <input 
                        type="number" 
                        placeholder="Preço Unit." 
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-black focus:ring-2 focus:ring-blue-500"
                        value={prices[item.id] || ''}
                        onChange={e => setPrices({...prices, [item.id]: Number(e.target.value)})}
                      />
                    </div>
                    <div className="w-32 text-right">
                      <p className="text-[9px] uppercase font-black text-gray-400">Total Item</p>
                      <p className="font-black text-slate-800 text-sm">{formatCurrency((prices[item.id] || 0) * buyQty)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
              <button onClick={() => setStep(1)} className="px-6 py-2 text-slate-400 font-black text-xs uppercase hover:text-slate-800 transition-all">Voltar</button>
              <div className="text-right mr-6">
                <p className="text-[10px] font-black text-gray-400 uppercase">Valor Total do Pedido</p>
                <p className="text-2xl font-black text-blue-600">
                  {formatCurrency(selectedItems.reduce((sum, id) => {
                    const b = backlog.find(x => x.item.id === id);
                    const buyQty = (b?.item.quantityRequested || 0) - (b?.item.quantityFulfilled || 0);
                    return sum + ((prices[id] || 0) * buyQty);
                  }, 0))}
                </p>
              </div>
              <button 
                onClick={handleSubmit}
                className="px-10 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
              >
                Confirmar Pedido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
