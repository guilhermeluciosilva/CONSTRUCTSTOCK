
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
  const [items, setItems] = useState<any[]>([{ materialId: '', quantity: 1, unitPrice: 0 }]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.getMaterials().then(setMaterials);
  }, []);

  const generateReceipt = (saleData: any, saleItems: any[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
      <head>
        <title>Recibo de Venda</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 5mm; font-size: 12px; line-height: 1.2; }
          .header { text-align: center; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 5mm; margin-bottom: 5mm; }
          .item { display: flex; justify-content: space-between; margin-bottom: 1mm; }
          .total { border-top: 1px dashed #000; margin-top: 5mm; padding-top: 5mm; font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; }
          .footer { text-align: center; font-size: 10px; margin-top: 10mm; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          ${activeTenant?.name || 'ConstructStock Store'}<br>
          UNIDADE: ${activeUnit?.name || 'Matriz'}<br>
          RECIBO DE VENDA<br>
          ${new Date().toLocaleString()}
        </div>
        <div style="margin-bottom: 5mm">CLIENTE: ${customer || 'Consumidor Final'}</div>
        
        ${saleItems.map(i => {
          const mat = materials.find(m => m.id === i.materialId);
          return `
            <div class="item">
              <span>${i.quantity}x ${mat?.name}</span>
              <span>${formatCurrency(i.quantity * i.unitPrice)}</span>
            </div>
          `;
        }).join('')}

        <div class="total">
          <span>TOTAL PAGO</span>
          <span>${formatCurrency(saleItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0))}</span>
        </div>

        <div class="footer">
          Obrigado pela compra!<br>
          Volte sempre.
        </div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

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
      const saleData = {
        tenantId: currentScope!.tenantId,
        unitId: currentScope!.unitId,
        warehouseId: warehouseId,
        customerName: customer || 'Consumidor Final',
        sellerId: user?.name
      };
      
      const saleItemsToPrint = JSON.parse(JSON.stringify(items));
      
      await api.createSale(saleData, items);
      notify('Venda concluída!', 'success');
      
      // Delay pequeno para garantir que a notificação apareça antes do confirm
      setTimeout(() => {
        if (window.confirm("Venda finalizada! Deseja gerar o recibo de venda?")) {
          generateReceipt(saleData, saleItemsToPrint);
        }
        onFinished();
      }, 300);
      
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
        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Checkout Balcão</h1>
        <button onClick={onFinished} className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase hover:text-rose-500 transition-colors">Cancelar</button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Cliente</label>
            <input 
              className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Ex: Consumidor Final"
              value={customer}
              onChange={e => setCustomer(e.target.value)}
            />
          </div>
        </div>

        <div className="p-8 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-[0.2em]">Itens da Venda</h3>
            <button onClick={() => setItems([...items, { materialId: '', quantity: 1, unitPrice: 0 }])} className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase hover:underline">+ Adicionar Produto</button>
          </div>
          
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-end animate-in fade-in slide-in-from-right-2">
                <div className="flex-1 space-y-1">
                  <select 
                    className="w-full p-3 bg-gray-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    value={item.materialId}
                    onChange={e => updateItem(idx, { materialId: e.target.value })}
                  >
                    <option value="">Selecione o Produto...</option>
                    {materials.filter(m => m.salePrice).map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({formatCurrency(m.salePrice || 0)})</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <input 
                    type="number" 
                    className="w-full p-3 bg-gray-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-center text-slate-900 dark:text-white outline-none"
                    value={item.quantity}
                    onChange={e => updateItem(idx, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="w-32 py-3 text-right">
                   <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">Subtotal</p>
                   <p className="font-black text-slate-800 dark:text-white text-sm">{formatCurrency(item.quantity * item.unitPrice)}</p>
                </div>
                <button 
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  className="w-10 h-10 flex items-center justify-center text-rose-300 hover:text-rose-600 transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-slate-900 dark:bg-[#020617] flex justify-between items-center text-white border-t border-slate-800">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-1">Total Geral a Pagar</p>
            <p className="text-4xl font-black text-emerald-400 tracking-tighter leading-none">{formatCurrency(totalSale)}</p>
          </div>
          <button 
            disabled={isSaving || items.length === 0}
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-[24px] font-black uppercase text-xs shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-3"
          >
            {isSaving ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-check-double text-lg"></i>}
            Concluir Venda
          </button>
        </div>
      </div>
    </div>
  );
};
