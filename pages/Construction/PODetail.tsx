
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { DocumentPanel } from '../../components/DocumentPanel';
import { PO, POItem, Material, Supplier, Unit, Tenant } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { STATUS_COLORS } from '../../constants';

export const PODetail: React.FC<{ id: string, onBack: () => void }> = ({ id, onBack }) => {
  const { hasPermission } = useAuth();
  const { works, tenants } = useApp();
  const { notify } = useNotification();
  const [data, setData] = useState<{ po: PO; items: POItem[] } | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  const load = async () => {
    try {
      const res = await api.getPOById(id);
      const mats = await api.getMaterials();
      const sup = await api.getSuppliers(res.po.tenantId);
      setData(res);
      setMaterials(mats);
      setSupplier(sup.find(s => s.id === res.po.supplierId) || null);
    } catch (err) { notify('Erro ao carregar PO', 'error'); }
  };

  useEffect(() => { load(); }, [id]);

  const startEdit = () => {
    setEditForm({ ...data!.po, items: [...data!.items] });
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (editForm.items.some((i: any) => i.quantity <= 0)) return notify('Quantidades devem ser maiores que zero.', 'warning');
    notify('Pedido atualizado com sucesso!', 'success');
    setIsEditing(false);
    load();
  };

  const handleClose = async (status: 'CLOSED' | 'CANCELED') => {
    if (!window.confirm(`Deseja ${status === 'CLOSED' ? 'Encerrar' : 'Cancelar'} este pedido?`)) return;
    await api.closePO(id, status);
    notify('Pedido finalizado.', 'success');
    load();
  };

  const handleGeneratePDF = () => {
    if (!data || !supplier) return;
    
    const tenant = tenants.find(t => t.id === data.po.tenantId);
    const work = works.find(w => w.id === data.po.unitId);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return notify('Falha ao abrir janela de impressão.', 'error');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ordem de Compra #${data.po.id}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 900; color: #3b82f6; text-transform: uppercase; }
          .title { font-size: 24px; font-weight: 900; text-align: right; }
          .info-box { border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; }
          .info-title { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f8fafc; text-align: left; padding: 12px; font-size: 12px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
          td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .total-box { margin-top: 30px; text-align: right; padding: 20px; background: #1e293b; color: white; border-radius: 8px; }
          .footer { margin-top: 60px; font-size: 10px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">ConstructStock Pro</div>
          <div class="title">ORDEM DE COMPRA #${data.po.id}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div class="info-box">
            <div class="info-title">COMPRADOR / DESTINO</div>
            <div style="font-weight: 800; font-size: 16px;">${tenant?.name}</div>
            <div style="font-weight: 700; color: #3b82f6; font-size: 14px;">UNIDADE: ${work?.name || 'Geral'}</div>
          </div>
          <div class="info-box">
            <div class="info-title">FORNECEDOR</div>
            <div style="font-weight: 800; font-size: 16px;">${supplier.name}</div>
            <div style="font-size: 12px;">CNPJ: ${supplier.taxId}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>SKU</th><th>Descrição</th><th style="text-align: center;">Qtd</th><th style="text-align: right;">V. Unit.</th><th style="text-align: right;">Total</th></tr>
          </thead>
          <tbody>
            ${data.items.map(item => {
              const mat = materials.find(m => m.id === item.materialId);
              return `<tr><td>${mat?.sku}</td><td>${mat?.name}</td><td align="center">${item.quantity}</td><td align="right">${formatCurrency(item.unitPrice)}</td><td align="right"><b>${formatCurrency(item.quantity * item.unitPrice)}</b></td></tr>`;
            }).join('')}
          </tbody>
        </table>
        <div class="total-box">
          <div style="font-size: 28px; font-weight: 900;">${formatCurrency(data.po.totalAmount)}</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (!data) return null;

  const currentWork = works.find(w => w.id === data.po.unitId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in slide-in-from-bottom-4">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-50 border rounded-xl text-slate-400 hover:text-blue-600 transition-all">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800">Pedido #{data.po.id}</h1>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${STATUS_COLORS[data.po.status]}`}>{data.po.status}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Destino: {currentWork?.name || 'Geral'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           {data.po.status === 'OPEN' && !isEditing && (
             <>
               <button onClick={handleGeneratePDF} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs uppercase shadow-lg">PDF Ordem</button>
               {hasPermission('PO_EDIT') && <button onClick={startEdit} className="bg-white text-blue-600 border border-blue-100 px-6 py-2 rounded-xl font-black text-xs uppercase hover:bg-blue-50 transition-all">Editar</button>}
               {hasPermission('PO_CLOSE') && (
                 <>
                   <button onClick={() => handleClose('CLOSED')} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase shadow-lg">Encerrar</button>
                   <button onClick={() => handleClose('CANCELED')} className="bg-white text-rose-600 border border-rose-100 px-6 py-2 rounded-xl font-black text-xs uppercase">Cancelar</button>
                 </>
               )}
             </>
           )}
           {isEditing && (
             <>
               <button onClick={() => setIsEditing(false)} className="px-6 py-2 text-slate-400 font-black text-xs uppercase tracking-widest">Sair</button>
               <button onClick={saveEdit} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-black text-xs uppercase shadow-lg">Salvar</button>
             </>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 grid grid-cols-2 gap-8 shadow-sm">
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Fornecedor</p>
                <p className="font-bold text-slate-800">{supplier?.name || '---'}</p>
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Previsão</p>
                <p className="font-bold text-slate-800">{new Date(data.po.deliveryDate).toLocaleDateString()}</p>
             </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="text-[9px] font-black uppercase text-slate-400 border-b">
                <tr><th className="px-8 py-4">Item</th><th className="px-6 py-4 text-center">Qtd</th><th className="px-6 py-4 text-right">Unitário</th><th className="px-8 py-4 text-right">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(isEditing ? editForm.items : data.items).map((item: any, idx: number) => {
                  const mat = materials.find(m => m.id === item.materialId);
                  return (
                    <tr key={item.id} className="text-sm">
                      <td className="px-8 py-5"><p className="font-bold text-slate-800">{mat?.name}</p><p className="text-[10px] text-blue-500 font-black uppercase">{mat?.sku}</p></td>
                      <td className="px-6 py-5 text-center">
                         {isEditing ? (
                           <input type="number" className="w-20 p-2 border rounded text-center" value={item.quantity} onChange={e => {
                             const n = [...editForm.items]; n[idx].quantity = Number(e.target.value); setEditForm({...editForm, items: n});
                           }} />
                         ) : <span>{item.quantity}</span>}
                      </td>
                      <td className="px-6 py-5 text-right">
                         {isEditing ? (
                           <input type="number" className="w-24 p-2 border rounded text-right" value={item.unitPrice} onChange={e => {
                             const n = [...editForm.items]; n[idx].unitPrice = Number(e.target.value); setEditForm({...editForm, items: n});
                           }} />
                         ) : formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-8 py-5 text-right font-black">{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="p-8 bg-slate-900 text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Total PO</p>
              <p className="text-3xl font-black text-blue-500">{formatCurrency(isEditing ? editForm.items.reduce((s:number, i:any) => s + (i.quantity*i.unitPrice), 0) : data.po.totalAmount)}</p>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <DocumentPanel relatedId={id} entityType="PO" />
        </div>
      </div>
    </div>
  );
};
