
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { Transfer, Warehouse } from '../../types';
import { STATUS_COLORS } from '../../constants';

export const TransferList: React.FC<{ onDetail: (id: string) => void, onNew: () => void }> = ({ onDetail, onNew }) => {
  const { currentScope } = useApp();
  const { hasPermission } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [allWhs, setAllWhs] = useState<Warehouse[]>([]);

  useEffect(() => {
    if (currentScope) {
      api.getTransfers(currentScope).then(setTransfers);
      const loadLabels = async () => {
         const tenants = await api.getTenants();
         const tWorks = await api.getWorks(tenants.find(t => t.id === currentScope.tenantId)?.id || tenants[0].id);
         let list: Warehouse[] = [];
         for (const w of tWorks) { list = [...list, ...(await api.getWarehouses(w.id))]; }
         setAllWhs(list);
      };
      loadLabels();
    }
  }, [currentScope]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-black text-slate-800 tracking-tight">Transferências Logísticas</h1><p className="text-gray-500 text-sm italic">Gestão de trânsito entre canteiros e central.</p></div>
        {hasPermission('TRANSFER_CREATE') && (
           <button onClick={onNew} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg hover:bg-blue-700 transition-all">Nova Transferência</button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
            <tr><th className="px-8 py-5">Código</th><th className="px-6 py-5">Status</th><th className="px-6 py-5">Origem</th><th className="px-6 py-5">Destino</th><th className="px-6 py-5">Criação</th><th className="px-8 py-5 text-right">Ação</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transfers.map(t => (
              <tr key={t.id} className="hover:bg-blue-50/20 transition-all text-sm">
                <td className="px-8 py-6 font-black text-blue-600">#{t.id}</td>
                <td className="px-6 py-6"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${STATUS_COLORS[t.status]}`}>{t.status}</span></td>
                <td className="px-6 py-6 font-bold text-slate-700">{allWhs.find(w => w.id === t.originWarehouseId)?.name || t.originWarehouseId}</td>
                <td className="px-6 py-6 font-bold text-slate-700">{allWhs.find(w => w.id === t.destinationWarehouseId)?.name || t.destinationWarehouseId}</td>
                <td className="px-6 py-6 text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                <td className="px-8 py-6 text-right"><button onClick={() => onDetail(t.id)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-300 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"><i className="fas fa-eye"></i></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
