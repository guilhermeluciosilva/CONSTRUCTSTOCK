
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../services/api';
import { RM, Movement, RMStatus, OperationType } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useNotification } from '../../contexts/NotificationContext';

interface DashboardProps {
  onSelectRM?: (id: string) => void;
  onNavigate?: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentScope, activeTenant, activeUnit, getLabel } = useApp();
  const { user } = useAuth();
  const { notify } = useNotification();
  const [rms, setRms] = useState<RM[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [criticalStock, setCriticalStock] = useState<any[]>([]);
  const [dailySalesTotal, setDailySalesTotal] = useState(0);
  const [inventoryStats, setInventoryStats] = useState({ totalProducts: 0, totalQty: 0 });
  const [showAditivarModal, setShowAditivarModal] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>({
    stats: true,
    activity: true,
    critical: true,
    usage: true
  });

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

  const type = activeUnit?.operationType || activeTenant?.operationType;
  const isStore = type === OperationType.STORE;
  const isRestaurant = type === OperationType.RESTAURANT;

  const unitLabel = getLabel('UNIT');
  const preposition = ['Restaurante', 'Outro'].includes(unitLabel) ? 'do' : 'da';

  const stats = [
    ...(isStore || isRestaurant ? [
      { id: 'vendas', label: 'Vendas Hoje', value: formatCurrency(dailySalesTotal), icon: 'fa-hand-holding-dollar', color: 'text-emerald-600', bg: 'bg-emerald-50', path: isRestaurant ? '/restaurant/tables' : '/sales' }
    ] : []),
    { id: 'rms', label: getLabel('RM') + ' Ativas', value: rms.filter(r => r.status !== RMStatus.DONE && r.status !== RMStatus.CANCELED).length, icon: 'fa-file-invoice', color: 'text-blue-600', bg: 'bg-blue-50', path: '/rm' },
    { id: 'skus', label: 'Produtos em Estoque', value: inventoryStats.totalProducts, icon: 'fa-boxes-stacked', color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/stock' },
    { id: 'critico', label: 'Itens Críticos', value: criticalStock.length, icon: 'fa-exclamation-triangle', color: 'text-red-600', bg: 'bg-red-50', path: '/reports' },
  ];

  const productLimit = 2000;
  const usagePercentage = (inventoryStats.totalProducts / productLimit) * 100;

  const PrivacyValue = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <span className={`${className} transition-all duration-300 ${isPrivacyMode ? 'blur-md select-none opacity-50' : ''}`}>
      {children}
    </span>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Visão Geral {preposition} {unitLabel}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowAditivarModal(true)}
                className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              >
                Editar
              </button>
              <button 
                onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${
                  isPrivacyMode ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {isPrivacyMode ? 'Mostrar' : 'Ocultar'}
              </button>
            </div>
          </h1>
          <p className="text-gray-500 text-sm">Olá, <span className="font-bold text-slate-700">{user?.name}</span>.</p>
        </div>
      </div>

      {visibleWidgets.usage && (
        <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-[28px]">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1">
                 <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Capacidade de Inventário</h4>
                 <p className="text-sm font-bold text-slate-700">
                   {inventoryStats.totalProducts} de {productLimit} produtos.
                 </p>
              </div>
              <div className="flex-1 w-full max-w-md">
                 <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-1000" 
                      style={{ width: `${Math.min(100, usagePercentage)}%` }}
                    />
                 </div>
              </div>
              <button onClick={() => onNavigate?.('/admin/settings')} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase">Planos</button>
           </div>
        </div>
      )}

      {visibleWidgets.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <button 
              key={i} 
              onClick={() => onNavigate?.(stat.path)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all text-left"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{stat.label}</p>
                  <h3 className="font-black mt-2 text-slate-800 text-2xl">
                    <PrivacyValue>{stat.value}</PrivacyValue>
                  </h3>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <i className={`fas ${stat.icon}`}></i>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {visibleWidgets.activity && (
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-8 py-5 border-b flex justify-between items-center bg-gray-50/30">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Atividade Recente</h3>
            </div>
            <div className="flex-1 divide-y divide-gray-50 overflow-y-auto max-h-[400px]">
              {movements.slice(0, 8).map(m => (
                <div key={m.id} className="px-8 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                   <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${m.type === 'SALE' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        <i className={`fas ${m.type === 'SALE' ? 'fa-cart-shopping' : 'fa-exchange-alt'}`}></i>
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-800">{m.description || 'Movimentação'}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(m.timestamp).toLocaleTimeString()}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={`font-black text-xs ${m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                         <PrivacyValue>{m.quantity > 0 ? '+' : ''}{m.quantity}</PrivacyValue>
                      </p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {visibleWidgets.critical && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-6">Estoque Crítico</h3>
            <div className="space-y-4 flex-1 overflow-y-auto">
              {criticalStock.map((s, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-end">
                    <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                    <span className="text-xs font-black text-rose-600"><PrivacyValue>{s.quantity}</PrivacyValue></span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500" 
                      style={{ width: `${Math.min(100, (s.quantity / (s.minStock || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
