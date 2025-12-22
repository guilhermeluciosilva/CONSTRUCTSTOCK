
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../services/api';
import { RM, Movement, RMStatus, OperationType } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useNotification } from '../../contexts/NotificationContext';

interface DashboardProps {
  onNavigate?: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentScope, activeTenant, activeUnit, getLabel } = useApp();
  const { user } = useAuth();
  const [rms, setRms] = useState<RM[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [criticalStock, setCriticalStock] = useState<any[]>([]);
  const [dailySalesTotal, setDailySalesTotal] = useState(0);
  const [inventoryStats, setInventoryStats] = useState({ totalProducts: 0, totalQty: 0 });
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (currentScope) {
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
        setInventoryStats({ totalProducts: stock.length, totalQty });

        const type = activeUnit?.operationType || activeTenant?.operationType;
        if (type === OperationType.STORE || type === OperationType.RESTAURANT) {
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
  }, [currentScope, activeTenant, activeUnit]);

  const unitLabel = getLabel('UNIT');
  const type = activeUnit?.operationType || activeTenant?.operationType;
  const isRestaurant = type === OperationType.RESTAURANT;

  const stats = [
    ...(type === OperationType.STORE || isRestaurant ? [
      { label: 'Vendas Hoje', value: formatCurrency(dailySalesTotal), icon: 'fa-hand-holding-dollar', color: 'text-emerald-400', bg: 'bg-emerald-500/10', path: isRestaurant ? '/restaurant/tables' : '/sales' }
    ] : []),
    { label: getLabel('RM') + ' Ativas', value: rms.filter(r => r.status !== RMStatus.DONE && r.status !== RMStatus.CANCELED).length, icon: 'fa-file-invoice', color: 'text-blue-400', bg: 'bg-blue-500/10', path: '/rm' },
    { label: 'Produtos', value: inventoryStats.totalProducts, icon: 'fa-boxes-stacked', color: 'text-indigo-400', bg: 'bg-indigo-500/10', path: '/stock' },
    { label: 'Itens Críticos', value: criticalStock.length, icon: 'fa-triangle-exclamation', color: 'text-rose-400', bg: 'bg-rose-500/10', path: '/reports' },
  ];

  const PrivacyValue = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
    <span className={`${className} transition-all duration-300 ${isPrivacyMode ? 'blur-md select-none opacity-50' : ''}`}>
      {children}
    </span>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Painel de Controle</h1>
          <p className="text-slate-400 text-sm font-medium">Unidade: <span className="text-blue-400">{activeUnit?.name || 'Não selecionada'}</span></p>
        </div>
        <button 
          onClick={() => setIsPrivacyMode(!isPrivacyMode)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isPrivacyMode ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
        >
          <i className={`fas ${isPrivacyMode ? 'fa-eye' : 'fa-eye-slash'} mr-2`}></i>
          {isPrivacyMode ? 'Mostrar Valores' : 'Ocultar Valores'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => onNavigate?.(stat.path)}
            className="bg-[#0f172a] p-6 rounded-[32px] border border-slate-800 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all text-left group"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-slate-300 transition-colors">{stat.label}</p>
                <h3 className="font-black text-white text-2xl tracking-tighter">
                  <PrivacyValue>{stat.value}</PrivacyValue>
                </h3>
              </div>
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} border border-white/5`}>
                <i className={`fas ${stat.icon} text-xl`}></i>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-[#0f172a] rounded-[40px] border border-slate-800 overflow-hidden flex flex-col shadow-sm">
          <div className="px-8 py-6 border-b border-slate-800 bg-[#1e293b]/30 flex justify-between items-center">
            <h3 className="font-black text-white uppercase text-xs tracking-widest">Movimentações Recentes</h3>
            <button onClick={() => onNavigate?.('/movements')} className="text-[9px] font-black text-blue-400 hover:underline uppercase">Ver Extrato Completo</button>
          </div>
          <div className="flex-1 divide-y divide-slate-800/50 overflow-y-auto max-h-[500px] custom-scrollbar">
            {movements.slice(0, 10).map(m => (
              <div key={m.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-800/30 transition-all group">
                 <div className="flex items-center gap-5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${m.type === 'SALE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                      <i className={`fas ${m.type === 'SALE' ? 'fa-cart-shopping' : 'fa-exchange-alt'}`}></i>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-200">{m.description || 'Operação Manual'}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{new Date(m.timestamp).toLocaleString()}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className={`font-black text-base ${m.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                       <PrivacyValue>{m.quantity > 0 ? '+' : ''}{m.quantity}</PrivacyValue>
                    </p>
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">Ref: {m.id.split('-')[1]}</p>
                 </div>
              </div>
            ))}
            {movements.length === 0 && (
              <div className="py-32 text-center opacity-20"><i className="fas fa-box-open text-5xl mb-4"></i><p className="font-black text-xs uppercase tracking-[0.2em]">Nenhum registro</p></div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-[#0f172a] rounded-[40px] border border-slate-800 p-8 flex flex-col shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-white uppercase text-xs tracking-widest">Estoque Crítico</h3>
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-5 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                {criticalStock.map((s, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <p className="text-xs font-black text-slate-200 uppercase truncate max-w-[140px]">{s.name}</p>
                      <span className="text-xs font-black text-rose-400"><PrivacyValue>{s.quantity}</PrivacyValue> <span className="text-[9px] text-slate-600">/ {s.minStock}</span></span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-1000" 
                        style={{ width: `${Math.max(5, (s.quantity / (s.minStock || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {criticalStock.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-[32px] text-emerald-500/40">
                    <i className="fas fa-shield-check text-4xl mb-3"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest">Nível Seguro</p>
                  </div>
                )}
              </div>
           </div>
           
           <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[40px] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <i className="fas fa-seedling text-[180px]"></i>
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-2">Plano Inicial</h4>
              <p className="text-2xl font-black mb-6">Versão Free</p>
              <button onClick={() => onNavigate?.('/admin/settings')} className="w-full py-4 bg-white/20 backdrop-blur-md rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/20 hover:bg-white hover:text-indigo-700 transition-all active:scale-95">Ver Opções de Upgrade</button>
           </div>
        </div>
      </div>
    </div>
  );
};
