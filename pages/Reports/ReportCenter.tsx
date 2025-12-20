
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { AccessDenied } from '../../components/AccessDenied';
import { Material, Stock, Movement } from '../../types';

export const ReportCenter: React.FC = () => {
  const { hasPermission } = useAuth();
  const { currentScope, works, warehouses } = useApp();
  const { notify } = useNotification();
  const [critical, setCritical] = useState<any[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filters, setFilters] = useState({ start: '', end: '', cat: '' });

  useEffect(() => {
    if (currentScope) {
      const load = async () => {
        const stocks = await api.getStock(currentScope);
        const mats = await api.getMaterials();
        const movs = await api.getMovements(currentScope);
        setMaterials(mats);
        setMovements(movs);
        
        const crit = stocks.map(s => {
          const m = mats.find(x => x.id === s.materialId);
          return { ...s, name: m?.name, sku: m?.sku, min: m?.minStock || 0 };
        }).filter(s => s.quantity < s.min);
        setCritical(crit);
      };
      load();
    }
  }, [currentScope]);

  if (!hasPermission('REPORT_VIEW', currentScope || undefined)) return <AccessDenied />;

  const filteredMovs = movements.filter(m => {
    const matchStart = !filters.start || new Date(m.timestamp) >= new Date(filters.start);
    const matchEnd = !filters.end || new Date(m.timestamp) <= new Date(filters.end + 'T23:59:59');
    return matchStart && matchEnd;
  });

  const catRanking = ['Basico', 'Estrutura', 'Acabamento', 'Hidraulica'].map(cat => {
    const total = filteredMovs.filter(m => {
      const mat = materials.find(x => x.id === m.materialId);
      return (m.type === 'EXIT' || m.type === 'TRANSFER_OUT') && mat?.category === cat;
    }).reduce((acc, curr) => acc + Math.abs(curr.quantity), 0);
    return { cat, total };
  });

  const maxCatTotal = Math.max(...catRanking.map(r => r.total), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Inteligência de Suprimentos</h1>
          <p className="text-gray-500 text-sm italic">Análise consolidada de desempenho e ruptura do escopo ativo.</p>
        </div>
        {hasPermission('REPORT_EXPORT', currentScope || undefined) && (
           <button onClick={() => notify('Iniciando exportação consolidada...', 'info')} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg flex items-center gap-2">
             <i className="fas fa-file-excel text-emerald-400"></i> Exportar Dados
           </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Período Inicial</label>
            <input type="date" className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-xs" value={filters.start} onChange={e => setFilters({...filters, start: e.target.value})} />
         </div>
         <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Período Final</label>
            <input type="date" className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-xs" value={filters.end} onChange={e => setFilters({...filters, end: e.target.value})} />
         </div>
         <div className="flex items-end">
            <button onClick={() => setFilters({start: '', end: '', cat: ''})} className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest">Limpar Período</button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 bg-slate-50/50 border-b flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest">Ruptura de Estoque</h3>
              <span className="bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full">{critical.length} SKUs</span>
           </div>
           <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[450px] custom-scrollbar">
              {critical.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                   <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.warehouseId} • {c.sku}</p>
                   </div>
                   <div className="text-right whitespace-nowrap ml-4">
                      <p className="text-xs font-black text-rose-600">{c.quantity} / {c.min}</p>
                      <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Déficit: {c.min - c.quantity}</p>
                   </div>
                </div>
              ))}
              {critical.length === 0 && <div className="py-20 text-center text-emerald-500 font-black flex flex-col items-center gap-4"><i className="fas fa-check-circle text-5xl opacity-20"></i><p className="text-sm uppercase tracking-widest">Estoque Saudável</p></div>}
           </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 bg-slate-50/50 border-b">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest">Ranking de Consumo por Categoria</h3>
           </div>
           <div className="p-8 space-y-8">
              {catRanking.map(({ cat, total }) => (
                <div key={cat} className="group">
                   <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{cat}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Período Selecionado</p>
                      </div>
                      <span className="text-xs font-black text-blue-600">{total} un.</span>
                   </div>
                   <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-blue-600 transition-all duration-1000 group-hover:bg-blue-500 shadow-sm" style={{ width: `${(total / maxCatTotal) * 100}%` }}></div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
