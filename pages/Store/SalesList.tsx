
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { Sale } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { STATUS_COLORS } from '../../constants';

export const SalesList: React.FC<{ onNew: () => void }> = ({ onNew }) => {
  const { currentScope } = useApp();
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (currentScope) {
      api.getSales(currentScope).then(setSales);
    }
  }, [currentScope]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Histórico de Vendas</h1>
          <p className="text-gray-500 text-sm">Faturamento direto de balcão.</p>
        </div>
        <button 
          onClick={onNew}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-200"
        >
          <i className="fas fa-cart-plus mr-2"></i> Nova Venda
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="px-8 py-5">Cód.</th>
              <th className="px-6 py-5">Cliente</th>
              <th className="px-6 py-5">Data / Hora</th>
              <th className="px-6 py-5 text-right">Total</th>
              <th className="px-8 py-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sales.map(sale => (
              <tr key={sale.id} className="hover:bg-emerald-50/20 transition-all text-sm">
                <td className="px-8 py-6 font-black text-emerald-600">#{sale.id}</td>
                <td className="px-6 py-6 font-bold text-slate-800 uppercase">{sale.customerName}</td>
                <td className="px-6 py-6 text-slate-500 font-medium">{new Date(sale.createdAt).toLocaleString()}</td>
                <td className="px-6 py-6 text-right font-black text-slate-800">{formatCurrency(sale.totalAmount)}</td>
                <td className="px-8 py-6 text-right">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${STATUS_COLORS[sale.status]}`}>
                    {sale.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
