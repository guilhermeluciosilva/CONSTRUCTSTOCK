
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Extrato de Movimentações</h1>
          <p className="text-xs text-slate-400 uppercase font-black tracking-widest mt-1">Histórico operacional</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select 
          className="p-2.5 bg-gray-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase"
          value={filters.type}
          onChange={e => setFilters({...filters, type: e.target.value})}
        >
          <option value="">Todos os Tipos</option>
          <option value="ENTRY">Entrada</option>
          <option value="EXIT">Saída</option>
          <option value="SALE">Venda</option>
          <option value="ADJUST">Ajuste</option>
        </select>
        <input type="date" className="p-2.5 bg-gray-50 border border-slate-200 rounded-xl text-xs font-bold" value={filters.start} onChange={e => setFilters({...filters, start: e.target.value})} />
        <input type="date" className="p-2.5 bg-gray-50 border border-slate-200 rounded-xl text-xs font-bold" value={filters.end} onChange={e => setFilters({...filters, end: e.target.value})} />
        <button onClick={() => setFilters({type: '', start: '', end: ''})} className="text-[10px] font-black text-blue-600 uppercase hover:underline">Limpar Filtros</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400">
            <tr>
              <th className="px-6 py-4">Data / Hora</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Produto</th>
              <th className="px-6 py-4 text-center">Qtd.</th>
              <th className="px-6 py-4">Ref / Obs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(m => {
              const mat = materials.find(x => x.id === m.materialId);
              return (
                <tr key={m.id} className="text-sm hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-[10px] text-slate-500 font-bold">{new Date(m.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      ['ENTRY', 'TRANSFER_IN'].includes(m.type) ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 text-xs uppercase">{mat?.name || '---'}</p>
                  </td>
                  <td className="px-6 py-4 text-center font-black">
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="px-6 py-4 text-[10px] text-slate-400 italic max-w-xs truncate">
                    {m.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
