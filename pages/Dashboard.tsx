
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/api';
import { RM, Stock, Movement, RMStatus, OperationType } from '../types';
import { STATUS_COLORS } from '../constants';
import { formatCurrency } from '../lib/utils';

interface DashboardProps {
  onSelectRM?: (id: string) => void;
  onNavigate?: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectRM, onNavigate }) => {
  const { currentScope, activeTenant, getLabel } = useApp();
  const { user } = useAuth();
  const [rms, setRms] = useState<RM[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [criticalStock, setCriticalStock] = useState<any[]>([]);
  const [dailySalesTotal, setDailySalesTotal] = useState(0);
  const [inventoryStats, setInventoryStats] = useState({ totalSkus: 0, totalQty: 0 });

  useEffect(() => {
    const fetchData = async () => {
      if (currentScope) {
        // Dados comuns
        const loadedRMs = await api.getRMs(currentScope);
        setRms(loadedRMs);
        
        const loadedMovements = await api.getMovements(currentScope);
        setMovements(loadedMovements);

        const stock = await api.getStock(currentScope);
        const materials = await api.getMaterials();
        
        let totalQty = 0;
        const critical = stock.map(s => {
          const mat = materials.find(m => m.id === s.materialId);
          totalQty += s.quantity;
          return { ...s, name: mat?.name, minStock: mat?.minStock || 0 };
        }).filter(s => s.quantity < s.minStock);
        
        setCriticalStock(critical);
        setInventoryStats({ totalSkus: stock.length, totalQty });

        // Valor de vendas do dia (específico para LOJA)
        if (activeTenant?.operationType === OperationType.STORE) {
          // Fix: Pass full currentScope object instead of just tenantId string
          const allSales = await api.getSales(currentScope);
          const todayStr = new Date().toLocaleDateString();
          const totalToday = allSales
            .filter(s => new Date(s.createdAt).toLocaleDateString() === todayStr && s.status === 'COMPLETED')
            .reduce((acc, sale) => acc + sale.totalAmount, 0);
          setDailySalesTotal(totalToday);
        }
      }
    };
    fetchData();
  }, [currentScope, activeTenant]);

  const isStore = activeTenant?.operationType === OperationType.STORE;

  const stats = [
    ...(isStore ? [
      { label: 'Vendas Hoje', value: formatCurrency(dailySalesTotal), icon: 'fa-hand-holding-dollar', color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/sales' }
    ] : [
      { label: getLabel('RM') + ' Ativas', value: rms.filter(r => r.status !== RMStatus.DONE && r.status !== RMStatus.CANCELED).length, icon: 'fa-file-invoice', color: 'text-blue-600', bg: 'bg-blue-50', path: '/rm' }
    ]),
    { label: 'SKUs em Estoque', value: inventoryStats.totalSkus, icon: 'fa-boxes-stacked', color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/stock' },
    { label: 'Itens Críticos', value: criticalStock.length, icon: 'fa-exclamation-triangle', color: 'text-red-600', bg: 'bg-red-50', path: '/reports' },
    { label: 'Movimentos Hoje', value: movements.filter(m => new Date(m.timestamp).toLocaleDateString() === new Date().toLocaleDateString()).length, icon: 'fa-exchange-alt', color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/movements' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Visão Geral da {getLabel('UNIT')}</h1>
          <p className="text-gray-500 text-sm">Olá, <span className="font-bold text-slate-700">{user?.name}</span>. Veja o status atual da sua operação.</p>
        </div>
        <div className="text-right hidden sm:block">
           <p className="text-[10px] font-black text-slate-400 uppercase">Contexto Ativo</p>
           <p className="text-xs font-bold text-blue-600">
             {currentScope?.warehouseId ? 'Almoxarifado Selecionado' : currentScope?.unitId ? getLabel('UNIT') + ' Selecionada' : 'Visão Geral (Todas)'}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => onNavigate?.(stat.path)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left w-full group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest group-hover:text-blue-600 transition-colors">{stat.label}</p>
                <h3 className={`font-black mt-2 text-slate-800 ${typeof stat.value === 'string' && stat.value.length > 8 ? 'text-xl' : 'text-3xl'}`}>{stat.value}</h3>
              </div>
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                <i className={`fas ${stat.icon} text-xl`}></i>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <div>
               <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">
                 {isStore ? 'Últimas Vendas Realizadas' : 'Requisições Aguardando Ação'}
               </h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Fluxo Operacional</p>
            </div>
            <button onClick={() => onNavigate?.(isStore ? '/sales' : '/rm')} className="text-xs font-black text-blue-600 hover:underline">VER TUDO</button>
          </div>
          <div className="flex-1 divide-y divide-gray-50 overflow-y-auto max-h-[400px]">
            {isStore ? (
              // Visualização para Loja (Vendas)
              movements.filter(m => m.type === 'SALE').slice(0, 10).map(m => (
                <div key={m.id} className="w-full px-8 py-5 flex items-center justify-between hover:bg-emerald-50/20 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <i className="fas fa-cart-shopping"></i>
                      </div>
                      <div className="text-left">
                        <p className="font-black text-sm text-slate-800">{m.description || 'Venda PDV'}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(m.timestamp).toLocaleTimeString()}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-black text-emerald-600 text-sm">{Math.abs(m.quantity)} un.</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Material: {m.materialId}</p>
                   </div>
                </div>
              ))
            ) : (
              // Visualização para Obras/Fábrica (RMs)
              rms.length > 0 ? rms.slice(0, 10).map(rm => (
                <button 
                  key={rm.id} 
                  onClick={() => onSelectRM?.(rm.id)}
                  className="w-full px-8 py-5 flex items-center justify-between hover:bg-blue-50/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${rm.priority === 'URGENT' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></div>
                    <div className="text-left">
                      <p className="font-black text-sm text-slate-800">#{rm.id}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                        Necessário em {new Date(rm.dateRequired).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${STATUS_COLORS[rm.status]}`}>
                      {rm.status.replace('_', ' ')}
                    </span>
                    <i className="fas fa-chevron-right text-gray-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"></i>
                  </div>
                </button>
              )) : (
                <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30">
                  <i className="fas fa-check-circle text-5xl"></i>
                  <p className="font-bold text-sm">Nada pendente por aqui!</p>
                </div>
              )
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Estoque Crítico</h3>
            <i className="fas fa-triangle-exclamation text-rose-500 animate-pulse"></i>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto">
            {criticalStock.length > 0 ? criticalStock.map((s, i) => (
              <div key={i} className="group relative">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-xs font-black text-slate-800 truncate max-w-[150px]">{s.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{s.warehouseId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600">{s.quantity}</span>
                    <span className="text-[10px] text-gray-400 font-bold ml-1">/ {s.minStock}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all duration-1000 ${ (s.quantity / (s.minStock || 1)) < 0.2 ? 'bg-rose-500' : 'bg-amber-500' }`} 
                    style={{ width: `${Math.min(100, (s.quantity / (s.minStock || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-emerald-500 opacity-40">
                <i className="fas fa-shield-heart text-5xl"></i>
                <p className="font-bold text-xs uppercase text-center">Níveis de estoque<br/>saudáveis</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => onNavigate?.('/stock')}
            className="mt-8 w-full py-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-all"
          >
             VER INVENTÁRIO COMPLETO
          </button>
        </div>
      </div>
    </div>
  );
};
