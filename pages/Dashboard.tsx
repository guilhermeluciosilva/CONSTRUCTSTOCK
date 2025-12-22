
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/api';
import { RM, Stock, Movement, RMStatus, OperationType } from '../types';
import { STATUS_COLORS } from '../constants';
import { formatCurrency } from '../lib/utils';
import { useNotification } from '../contexts/NotificationContext';

interface DashboardProps {
  onSelectRM?: (id: string) => void;
  onNavigate?: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectRM, onNavigate }) => {
  const { currentScope, activeTenant, activeUnit, getLabel } = useApp();
  const { user } = useAuth();
  const { notify } = useNotification();
  const [rms, setRms] = useState<RM[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [criticalStock, setCriticalStock] = useState<any[]>([]);
  const [dailySalesTotal, setDailySalesTotal] = useState(0);
  const [inventoryStats, setInventoryStats] = useState({ totalSkus: 0, totalQty: 0 });
  const [showAditivarModal, setShowAditivarModal] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  
  // Customização de Widgets (Persistência Local)
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
        setInventoryStats({ totalSkus: stock.length, totalQty });

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

  // Ajuste de preposição dinâmica
  const unitLabel = getLabel('UNIT');
  const preposition = ['Restaurante', 'Outro'].includes(unitLabel) ? 'do' : 'da';

  const stats = [
    ...(isStore || isRestaurant ? [
      { id: 'vendas', label: 'Vendas Hoje', value: formatCurrency(dailySalesTotal), icon: 'fa-hand-holding-dollar', color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/sales' }
    ] : []),
    { id: 'rms', label: getLabel('RM') + ' Ativas', value: rms.filter(r => r.status !== RMStatus.DONE && r.status !== RMStatus.CANCELED).length, icon: 'fa-file-invoice', color: 'text-blue-600', bg: 'bg-blue-50', path: '/rm' },
    { id: 'skus', label: 'Produtos em Estoque', value: inventoryStats.totalSkus, icon: 'fa-boxes-stacked', color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/stock' },
    { id: 'critico', label: 'Itens Críticos', value: criticalStock.length, icon: 'fa-exclamation-triangle', color: 'text-red-600', bg: 'bg-red-50', path: '/reports' },
  ];

  // Regra de Monitoramento (Baseado no plano Starter)
  const productLimit = 2000;
  const usagePercentage = (inventoryStats.totalSkus / productLimit) * 100;
  const isSoftLimit = usagePercentage >= 80;
  const isHardLimit = usagePercentage >= 100;

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
                className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-1"
                title="Editar widgets do dashboard"
              >
                <i className="fas fa-pen text-[9px]"></i> Editar
              </button>
              <button 
                onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1 border ${
                  isPrivacyMode ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}
              >
                <i className={`fas ${isPrivacyMode ? 'fa-eye' : 'fa-eye-slash'} text-[9px]`}></i>
                {isPrivacyMode ? 'Mostrar' : 'Ocultar'}
              </button>
            </div>
          </h1>
          <p className="text-gray-500 text-sm">Olá, <span className="font-bold text-slate-700">{user?.name}</span>. Veja o status atual da sua operação.</p>
        </div>
        <div className="text-right hidden sm:block">
           <p className="text-[10px] font-black text-slate-400 uppercase">Contexto Ativo</p>
           <p className="text-xs font-bold text-blue-600">
             {currentScope?.warehouseId ? 'Almoxarifado Selecionado' : currentScope?.unitId ? unitLabel + ' Selecionada' : 'Visão Geral (Todas)'}
           </p>
        </div>
      </div>

      {visibleWidgets.usage && (
        <div className={`p-6 rounded-[28px] border-2 transition-all duration-500 ${isHardLimit ? 'bg-rose-50 border-rose-200' : isSoftLimit ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 shadow-sm'}`}>
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1">
                 <h4 className={`text-xs font-black uppercase tracking-widest ${isHardLimit ? 'text-rose-600' : isSoftLimit ? 'text-amber-600' : 'text-slate-400'}`}>Uso do Plano</h4>
                 <p className="text-sm font-bold text-slate-700">
                   Você utilizou <PrivacyValue>{inventoryStats.totalSkus}</PrivacyValue> de {productLimit} produtos permitidos.
                 </p>
              </div>
              <div className="flex-1 w-full max-w-md relative group">
                 <div className={`w-full bg-slate-200 h-4 rounded-full overflow-hidden shadow-inner transition-all ${isPrivacyMode ? 'blur-sm grayscale' : ''}`}>
                    <div 
                      className={`h-full transition-all duration-[2000ms] ease-out ${isHardLimit ? 'bg-rose-600' : isSoftLimit ? 'bg-amber-500' : 'bg-blue-600'}`} 
                      style={{ width: `${Math.min(100, usagePercentage)}%` }}
                    />
                 </div>
                 {isSoftLimit && !isPrivacyMode && (
                   <span className="absolute -top-6 right-0 text-[10px] font-black text-amber-600 animate-pulse uppercase">Limite Próximo!</span>
                 )}
              </div>
              <button 
                onClick={() => onNavigate?.('/admin/settings')}
                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg transition-all active:scale-95 ${isHardLimit || isSoftLimit ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-slate-900 text-white'}`}
              >
                 {isHardLimit ? 'Aumentar Capacidade Agora' : 'Ver Planos Disponíveis'}
              </button>
           </div>
        </div>
      )}

      {visibleWidgets.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2">
          {stats.map((stat, i) => (
            <button 
              key={i} 
              onClick={() => onNavigate?.(stat.path)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left w-full group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest group-hover:text-blue-600 transition-colors">{stat.label}</p>
                  <h3 className={`font-black mt-2 text-slate-800 ${typeof stat.value === 'string' && stat.value.length > 8 ? 'text-xl' : 'text-3xl'}`}>
                    <PrivacyValue>{stat.value}</PrivacyValue>
                  </h3>
                </div>
                <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${stat.icon} text-xl`}></i>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {visibleWidgets.activity && (
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col animate-in slide-in-from-left-2">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <div>
                 <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">
                   Atividade Recente da Operação
                 </h3>
                 <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Fluxo Operacional</p>
              </div>
              <button onClick={() => onNavigate?.(rms.length > 0 ? '/rm' : '/sales')} className="text-xs font-black text-blue-600 hover:underline">VER TUDO</button>
            </div>
            <div className="flex-1 divide-y divide-gray-50 overflow-y-auto max-h-[400px] custom-scrollbar">
              {movements.length > 0 ? (
                movements.slice(0, 10).map(m => (
                  <div key={m.id} className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.type === 'SALE' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                          <i className={`fas ${m.type === 'SALE' ? 'fa-cart-shopping' : 'fa-exchange-alt'}`}></i>
                        </div>
                        <div className="text-left">
                          <p className="font-black text-sm text-slate-800">{m.description || (m.type === 'SALE' ? 'Venda PDV' : 'Movimentação')}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(m.timestamp).toLocaleTimeString()}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className={`font-black text-sm ${m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                           <PrivacyValue>{m.quantity > 0 ? '+' : ''}{m.quantity} un.</PrivacyValue>
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Ref: {m.materialId}</p>
                     </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30">
                  <i className="fas fa-check-circle text-5xl"></i>
                  <p className="font-bold text-sm">Nada pendente por aqui!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {visibleWidgets.critical && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col animate-in slide-in-from-right-2">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Estoque Crítico</h3>
              <i className="fas fa-triangle-exclamation text-rose-500 animate-pulse"></i>
            </div>
            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar">
              {criticalStock.length > 0 ? criticalStock.map((s, i) => (
                <div key={i} className="group relative">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs font-black text-slate-800 truncate max-w-[150px]">{s.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{s.warehouseId}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-rose-600"><PrivacyValue>{s.quantity}</PrivacyValue></span>
                      <span className="text-[10px] text-gray-400 font-bold ml-1">/ {s.minStock}</span>
                    </div>
                  </div>
                  <div className={`w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner transition-all ${isPrivacyMode ? 'blur-sm' : ''}`}>
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
        )}
      </div>

      {/* Modal de Editar (Customização de Widgets) */}
      {showAditivarModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-800">Editar Dashboard</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Configurar Visualização</p>
              </div>
              <button onClick={() => setShowAditivarModal(false)} className="text-slate-400 hover:text-slate-800 transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
                Adicione ou remova blocos de informação para personalizar sua experiência operacional.
              </p>
              
              <div className="space-y-3">
                {[
                  { id: 'stats', label: 'Resumo de Indicadores', desc: 'Cards superiores com totais de Produtos, Vendas e RMs.', icon: 'fa-chart-pie' },
                  { id: 'activity', label: 'Atividade Recente', desc: 'Lista de últimas vendas ou requisições em trânsito.', icon: 'fa-history' },
                  { id: 'critical', label: 'Gestão de Ruptura', desc: 'Alerta visual de itens abaixo do estoque mínimo.', icon: 'fa-triangle-exclamation' },
                  { id: 'usage', label: 'Monitoramento de Plano', desc: 'Acompanhe limites de produtos e movimentações.', icon: 'fa-tachometer-alt' }
                ].map(widget => (
                  <button 
                    key={widget.id}
                    onClick={() => setVisibleWidgets(prev => ({ ...prev, [widget.id]: !prev[widget.id] }))}
                    className={`w-full p-5 border-2 rounded-2xl flex items-center gap-5 text-left transition-all ${visibleWidgets[widget.id] ? 'border-blue-600 bg-blue-50' : 'border-slate-100 opacity-60'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${visibleWidgets[widget.id] ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 text-slate-400'}`}>
                      <i className={`fas ${widget.icon}`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 text-sm">{widget.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium leading-tight">{widget.desc}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${visibleWidgets[widget.id] ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                      {visibleWidgets[widget.id] && <i className="fas fa-check text-[10px]"></i>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex justify-end">
              <button 
                onClick={() => { setShowAditivarModal(false); notify('Painel atualizado!', 'success'); }}
                className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
              >
                Aplicar Mudanças
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
