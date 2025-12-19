
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { AccessDenied } from '../../components/AccessDenied';
import { MENU_ITEMS } from '../../constants';
import { Unit, OperationType } from '../../types';

export const OperationSettings: React.FC = () => {
  const { user } = useAuth();
  const { currentScope, units, refreshMetadata, getLabel, activeTenant } = useApp();
  const { notify } = useNotification();
  
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Garantir acesso apenas ao OWNER
  if (!user || user.roleAssignments.every(ra => ra.role !== 'OWNER')) {
    return <AccessDenied message="Apenas o Dono da empresa pode gerenciar as configurações de visibilidade dos módulos." />;
  }

  // Resetar unidade selecionada se o Tenant mudar no topo
  useEffect(() => {
    setSelectedUnitId('');
    setEnabledModules([]);
  }, [currentScope?.tenantId]);

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  useEffect(() => {
    if (selectedUnit) {
      // Se a unidade já tem uma configuração salva, carrega ela
      if (selectedUnit.enabledModuleIds && selectedUnit.enabledModuleIds.length > 0) {
        setEnabledModules(selectedUnit.enabledModuleIds);
      } else {
        // Caso contrário, sugere o padrão baseado no tipo de operação do Tenant ativo
        const opType = activeTenant?.operationType || OperationType.CONSTRUCTION;
        const defaultModules = MENU_ITEMS
          .filter(m => m.allowedOps.includes(opType) && !['dashboard', 'settings'].includes(m.id))
          .map(m => m.id);
        setEnabledModules(defaultModules);
      }
    } else {
      setEnabledModules([]);
    }
  }, [selectedUnitId, selectedUnit, activeTenant]);

  const handleToggleModule = (moduleId: string) => {
    setEnabledModules(prev => 
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSave = async () => {
    if (!selectedUnitId) {
      notify('Selecione uma unidade primeiro.', 'warning');
      return;
    }
    try {
      setIsSaving(true);
      await api.updateUnitModules(selectedUnitId, enabledModules);
      notify('Configurações aplicadas com sucesso!', 'success');
      // Importante: atualizar os metadados globais para refletir no menu lateral
      await refreshMetadata();
    } catch (err: any) {
      notify(err.message || 'Erro ao salvar.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtra apenas módulos compatíveis com a operação atual da empresa
  const opType = activeTenant?.operationType || OperationType.CONSTRUCTION;
  const compatibleModules = MENU_ITEMS.filter(m => 
    m.allowedOps.includes(opType) && !['dashboard', 'settings'].includes(m.id)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Configurações de Visibilidade</h1>
          <p className="text-gray-500 text-sm italic">Habilite módulos específicos para a unidade <b>{activeTenant?.name}</b>.</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex items-center gap-3">
           <i className="fas fa-crown text-amber-500"></i>
           <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Painel do Proprietário</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">1. Escolha a Unidade</label>
              <select 
                className="w-full p-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={selectedUnitId}
                onChange={e => setSelectedUnitId(e.target.value)}
              >
                <option value="">Selecione uma {getLabel('UNIT')}...</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
           </div>
           {selectedUnitId && (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-save"></i>}
                Salvar Configurações
              </button>
           )}
        </div>

        {selectedUnitId ? (
          <div className="p-8 space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest">2. Módulos Ativos</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase">{enabledModules.length} habilitados</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {compatibleModules.map(item => (
                   <button 
                    key={item.id}
                    onClick={() => handleToggleModule(item.id)}
                    className={`p-5 rounded-3xl border text-left transition-all group flex items-start gap-4 ${
                      enabledModules.includes(item.id) 
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' 
                      : 'border-slate-100 hover:border-slate-200 shadow-sm'
                    }`}
                   >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors ${
                        enabledModules.includes(item.id) ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'
                      }`}>
                         <i className={`fas ${item.icon}`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center mb-1">
                            <p className={`font-black text-sm uppercase tracking-tight ${enabledModules.includes(item.id) ? 'text-blue-700' : 'text-slate-700'}`}>
                               {item.label}
                            </p>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${enabledModules.includes(item.id) ? 'bg-blue-600' : 'bg-slate-200'}`}>
                               <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${enabledModules.includes(item.id) ? 'left-5' : 'left-1'}`}></div>
                            </div>
                         </div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter line-clamp-1">Visível no menu desta unidade.</p>
                      </div>
                   </button>
                ))}
             </div>
          </div>
        ) : (
          <div className="p-24 text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-3xl text-slate-200 mx-auto">
                <i className="fas fa-hand-pointer animate-bounce"></i>
             </div>
             <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Selecione uma unidade acima para gerenciar</p>
          </div>
        )}
      </div>

      {selectedUnitId && (
        <div className="bg-slate-900 p-8 rounded-3xl text-white flex items-center gap-6 shadow-xl">
           <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl shadow-lg">
              <i className="fas fa-info-circle"></i>
           </div>
           <div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-1">Impacto das Configurações</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                As alterações afetarão o menu lateral de todos os usuários da unidade <span className="text-blue-400 font-bold">{selectedUnit?.name}</span>. Módulos obrigatórios de sistema não podem ser removidos.
              </p>
           </div>
        </div>
      )}
    </div>
  );
};
