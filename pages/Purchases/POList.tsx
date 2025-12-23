
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { PO, Supplier, Unit } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { STATUS_COLORS } from '../../constants';

export const POList: React.FC<{ onNew: () => void, onDetail: (id: string) => void }> = ({ onNew, onDetail }) => {
  const { currentScope, works } = useApp();
  const [pos, setPos] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (currentScope) {
      // Fix: Use correct method and scope
      api.getPOs(currentScope).then(setPos);
      api.getSuppliers(currentScope.tenantId).then(setSuppliers);
    }
  }, [currentScope]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-black text-slate-800 tracking-tight">Pedidos de Compra (PO)</h1><p className="text-gray-500 text-sm">Gestão de aquisições e conformidade de fornecedores.</p></div>
        <button onClick={onNew} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-200"><i className="fas fa-cart-plus mr-2"></i> Novo Pedido</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <th className="px-8 py-5">PO ID</th>
              <th className="px-6 py-5">Fornecedor</th>
              <th className="px-6 py-5">Obra Destino</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Total</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pos.map(po => (
              <tr key={po.id} className="hover:bg-blue-50/20 transition-all group">
                <td className="px-8 py-6 font-black text-blue-600">#{po.id}</td>
                <td className="px-6 py-6 font-bold text-slate-800 text-sm">{suppliers.find(s => s.id === po.supplierId)?.name || po.supplierId}</td>
                <td className="px-6 py-6 font-bold text-slate-500 text-xs">
                  <i className="fas fa-hard-hat text-orange-400 mr-2"></i>
                  {works.find(w => w.id === po.unitId)?.name || 'N/A'}
                </td>
                <td className="px-6 py-6"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${STATUS_COLORS[po.status]}`}>{po.status}</span></td>
                <td className="px-6 py-6 font-black text-slate-800 text-sm">{formatCurrency(po.totalAmount)}</td>
                <td className="px-8 py-6 text-right"><button onClick={() => onDetail(po.id)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-300 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"><i className="fas fa-eye"></i></button></td>
              </tr>
            ))}
            {pos.length === 0 && <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-300 italic">Sem pedidos registrados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
