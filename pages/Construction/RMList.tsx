
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { RM, RMStatus } from '../../types';
import { STATUS_COLORS } from '../../constants';

export const RMList: React.FC<{ onDetail: (id: string) => void, onNew: () => void }> = ({ onDetail, onNew }) => {
  const { currentScope } = useApp();
  const { hasPermission } = useAuth();
  const [rms, setRms] = useState<RM[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (currentScope) {
      api.getRMs(currentScope).then(setRms);
    }
  }, [currentScope]);

  const filteredRms = rms.filter(r => r.id.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Requisições (RM)</h1>
          <p className="text-gray-500 text-sm">Controle de suprimentos da obra/fábrica.</p>
        </div>
        {hasPermission('RM_CREATE', currentScope || undefined) && (
          <button onClick={onNew} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg">Nova Requisição</button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50">
          <input 
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs"
            placeholder="Buscar por código..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                <th className="px-8 py-5">Código</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5">Expectativa</th>
                <th className="px-8 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRms.map(rm => (
                <tr key={rm.id} className="hover:bg-blue-50/20 transition-all text-sm">
                  <td className="px-8 py-6 font-black text-blue-600">#{rm.id}</td>
                  <td className="px-6 py-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_COLORS[rm.status]}`}>
                      {rm.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-6 font-bold text-slate-700">{new Date(rm.dateRequired).toLocaleDateString()}</td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => onDetail(rm.id)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-300 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center">
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};
