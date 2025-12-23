
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { AccessDenied } from '../../components/AccessDenied';
import { Material, Stock, Movement } from '../../types';

export const ReportCenter: React.FC = () => {
  const { hasPermission } = useAuth();
  const { currentScope } = useApp();
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

  if (!hasPermission('REPORT_VIEW')) return <AccessDenied />;

  const filteredMovs = movements.filter(m => {
    const matchStart = !filters.start || new Date(m.timestamp) >= new Date(filters.start);
    const matchEnd = !filters.end || new Date(m.timestamp) <= new Date(filters.end + 'T23:59:59');
    return matchStart && matchEnd;
  });

  const catRanking = ['Basico', 'Estrutura', 'Acabamento', 'Hidraulica'].map(cat => {
    const total = filteredMovs.filter(m => {
      const mat = materials.find(x => x.id === m.materialId);
      return (m.type === 'EXIT' || m.type === 'TRANSFER_OUT' || m.type === 'SALE' || m.type === 'RECIPE_CONSUMPTION') && mat?.category === cat;
    }).reduce((acc, curr) => acc + Math.abs(curr.quantity), 0);
    return { cat, total };
  });

  const maxCatTotal = Math.max(...catRanking.map(r => r.total), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-none">BI & Suprimentos</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest">Análise de desempenho e ruptura de estoque.</p>
        </div>
        {hasPermission('REPORT_EXPORT') && (
           <button onClick={() => notify('Iniciando exportação consolidada...', 'info')} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
             <i className="fas fa-file-excel text-emerald-400"></i> Exportar BI
           </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
         <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Período Inicial</label>
            <input type="date" className="w-full p-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" value={filters.start} onChange={e => setFilters({...filters, start: e.target.value})} />
         </div>
         <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Período Final</label>
            <input type="date" className="w-full p-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500" value={filters.end} onChange={e => setFilters({...filters, end: e.target.value})} />
         </div>
         <div className="flex justify-end pb-1">
            <button onClick={() => setFilters({start: '', end: '', cat: ''})} className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-[0.2em] transition-all">Limpar Filtros</button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
           <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-[0.2em]">Itens em Ruptura</h3>
                <p className="text-[9px] font-bold text-rose-500 dark:text-rose-400 uppercase mt-1">Abaixo do estoque mínimo</p>
              </div>
              <span className="bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black px-3 py-1 rounded-full border border-rose-200 dark:border-rose-500/20">{critical.length} SKUs</span>
           </div>
           <div className="flex-1 p-8 space-y-4 overflow-y-auto max-h-[500px] custom-scrollbar">
              {critical.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-[#020617] rounded-[24px] border border-slate-100 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 transition-all group">
                   <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-white truncate uppercase group-hover:text-rose-600 transition-colors">{c.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest mt-1">{c.warehouseId} • {c.sku}</p>
                   </div>
                   <div className="text-right whitespace-nowrap ml-6">
                      <p className="text-base font-black text-rose-600 dark:text-rose-400">{c.quantity} / {c.min}</p>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Nec. {(c.min - c.quantity).toFixed(1)}</p>
                   </div>
                </div>
              ))}
              {critical.length === 0 && (
                <div className="py-32 text-center text-emerald-500 dark:text-emerald-400/30 font-black flex flex-col items-center gap-6">
                   <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-5xl">
                      <i className="fas fa-shield-check"></i>
                   </div>
                   <p className="text-sm uppercase tracking-[0.4em]">Estoque 100% Saudável</p>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
           <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-[0.2em]">Volume de Consumo</h3>
              <p className="text-[9px] font-bold text-blue-500 dark:text-blue-400 uppercase mt-1">Por Categoria de Produto</p>
           </div>
           <div className="p-10 space-y-10">
              {catRanking.map(({ cat, total }) => (
                <div key={cat} className="group">
                   <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{cat}</p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase">Saídas Totais</p>
                      </div>
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400">{total} un.</span>
                   </div>
                   <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-1000 group-hover:scale-y-110 shadow-lg shadow-blue-500/20" 
                        style={{ width: `${(total / maxCatTotal) * 100}%` }}
                      ></div>
                   </div>
                </div>
              ))}
              {catRanking.every(c => c.total === 0) && (
                 <div className="py-20 text-center opacity-20 text-slate-400 dark:text-slate-600"><i className="fas fa-chart-line text-5xl mb-4"></i><p className="font-black text-xs uppercase tracking-widest">Sem dados no período</p></div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
