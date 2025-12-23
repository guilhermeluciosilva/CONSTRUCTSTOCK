
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Movement, Material } from '../../types';

export const MovementList: React.FC = () => {
  const { currentScope } = useApp();
  const { notify } = useNotification();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filters, setFilters] = useState({ type: '', start: '', end: '' });

  useEffect(() => {
    if (currentScope) {
      api.getMovements(currentScope).then(setMovements);
      api.getMaterials().then(setMaterials);
    }
  }, [currentScope]);

  const filtered = movements.filter(m => {
    const matchType = !filters.type || m.type === filters.type;
    const matchStart = !filters.start || new Date(m.timestamp) >= new Date(filters.start);
    const matchEnd = !filters.end || new Date(m.timestamp) <= new Date(filters.end + 'T23:59:59');
    return matchType && matchStart && matchEnd;
  }).reverse();

  const isExit = (type: string) => ['EXIT', 'SALE', 'RECIPE_CONSUMPTION', 'TRANSFER_OUT', 'LOSS'].includes(type);

  const getLabelByType = (type: string) => {
    switch (type) {
      case 'ENTRY': return 'ENTRADA';
      case 'EXIT': return 'SAÍDA';
      case 'SALE': return 'VENDA PDV';
      case 'RECIPE_CONSUMPTION': return 'SAÍDA (CONSUMO)';
      case 'TRANSFER_IN': return 'TRANSF. ENTRADA';
      case 'TRANSFER_OUT': return 'TRANSF. SAÍDA';
      case 'ADJUST': return 'AJUSTE';
      case 'LOSS': return 'PERDA';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Extrato de Movimentações</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mt-1">Histórico operacional consolidado</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select 
          className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
          value={filters.type}
          onChange={e => setFilters({...filters, type: e.target.value})}
        >
          <option value="">Todos os Tipos</option>
          <option value="ENTRY">Entrada</option>
          <option value="EXIT">Saída Manual</option>
          <option value="SALE">Venda PDV</option>
          <option value="RECIPE_CONSUMPTION">Saída (Consumo Ficha)</option>
          <option value="ADJUST">Ajuste</option>
        </select>
        <input type="date" className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" value={filters.start} onChange={e => setFilters({...filters, start: e.target.value})} />
        <input type="date" className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" value={filters.end} onChange={e => setFilters({...filters, end: e.target.value})} />
        <button onClick={() => setFilters({type: '', start: '', end: ''})} className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase hover:underline transition-all">Limpar Filtros</button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-[#1e293b]/30 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Data / Hora</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4 text-center">Quantidade</th>
                <th className="px-6 py-4">Ref / Obs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map(m => {
                const mat = materials.find(x => x.id === m.materialId);
                const isItemExit = isExit(m.type);
                return (
                  <tr key={m.id} className="text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                    <td className="px-6 py-4 text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-tight">{new Date(m.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        !isItemExit ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                        m.type === 'ADJUST' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                      }`}>
                        {getLabelByType(m.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-900 dark:text-white text-xs uppercase">{mat?.name || '---'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{mat?.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-black">
                      <span className={!isItemExit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {!isItemExit ? '+' : '-'}{m.quantity.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-400 dark:text-slate-600 italic max-w-xs truncate" title={m.description}>
                      {m.description}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 dark:text-slate-600 italic font-black text-xs uppercase tracking-widest opacity-30">Nenhum histórico encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
