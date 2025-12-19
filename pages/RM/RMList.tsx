
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { RM, RMStatus } from '../../types';
import { STATUS_COLORS } from '../../constants';

export const RMList: React.FC<{ onDetail: (id: string) => void, onNew: () => void }> = ({ onDetail, onNew }) => {
  const { currentScope } = useApp();
  const { hasPermission } = useAuth();
  const { notify } = useNotification();
  const [rms, setRms] = useState<RM[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    status: '' as RMStatus | '',
    priority: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (currentScope) {
      api.getRMs(currentScope).then(setRms);
    }
  }, [currentScope]);

  const filteredRms = rms.filter(r => {
    const matchesSearch = r.id.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !filters.status || r.status === filters.status;
    const matchesPriority = !filters.priority || r.priority === filters.priority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Requisições de Material (RM)</h1>
          <p className="text-gray-500 text-sm italic">Gestão de suprimentos e aprovações do escopo ativo.</p>
        </div>
        {hasPermission('RM_CREATE', currentScope || undefined) && (
          <button 
            onClick={onNew}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 active:scale-95"
          >
            <i className="fas fa-plus"></i> Nova Requisição
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Buscar por código..." 
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm font-bold text-xs"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-sm ${showFilters ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}>
            <i className="fas fa-filter"></i> {showFilters ? 'Ocultar Filtros' : 'Filtros'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">Código</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-center">Prioridade</th>
                <th className="px-6 py-5">Expectativa</th>
                <th className="px-8 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRms.map(rm => (
                <tr key={rm.id} className="hover:bg-blue-50/20 transition-all group text-sm">
                  <td className="px-8 py-6 font-black text-blue-600">#{rm.id}</td>
                  <td className="px-6 py-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[rm.status]}`}>
                      {rm.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                      rm.priority === 'URGENT' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {rm.priority}
                    </span>
                  </td>
                  <td className="px-6 py-6 font-bold text-slate-700">{new Date(rm.dateRequired).toLocaleDateString()}</td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => onDetail(rm.id)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
