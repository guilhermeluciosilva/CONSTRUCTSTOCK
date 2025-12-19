
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { MENU_ITEMS } from '../../constants';
import { OperationType } from '../../types';

type SettingTab = 'PROFILE' | 'SECURITY' | 'OPERATION' | 'ACCOUNT';

export const OperationSettings: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const { currentScope, units, refreshMetadata, getLabel, activeTenant } = useApp();
  const { notify } = useNotification();
  
  const [activeTab, setActiveTab] = useState<SettingTab>('PROFILE');
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form
  const [profileForm, setProfileForm] = useState({ 
    name: user?.name || '', 
    email: user?.email || '', 
    phone: user?.phone || '', 
    personalDocument: user?.personalDocument || '' 
  });

  // Password Form
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });

  // Operation Settings (Owner Only)
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [enabledModules, setEnabledModules] = useState<string[]>([]);

  const isOwner = user?.roleAssignments.some(ra => ra.role === 'OWNER');

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        personalDocument: user.personalDocument || ''
      });
    }
  }, [user]);

  // Logic for Operation Tab
  const selectedUnit = units.find(u => u.id === selectedUnitId);
  useEffect(() => {
    if (selectedUnit) {
      if (selectedUnit.enabledModuleIds && selectedUnit.enabledModuleIds.length > 0) {
        setEnabledModules(selectedUnit.enabledModuleIds);
      } else {
        const opType = activeTenant?.operationType || OperationType.CONSTRUCTION;
        const defaultModules = MENU_ITEMS
          .filter(m => m.allowedOps.includes(opType) && !['dashboard', 'settings'].includes(m.id))
          .map(m => m.id);
        setEnabledModules(defaultModules);
      }
    }
  }, [selectedUnitId, selectedUnit, activeTenant]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      await api.updateUser(user.id, profileForm);
      notify('Perfil atualizado! Saia e entre novamente para refletir todas as mudanças.', 'success');
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (passForm.new !== passForm.confirm) return notify('As novas senhas não conferem.', 'warning');
    if (passForm.new.length < 4) return notify('A senha deve ter ao menos 4 caracteres.', 'warning');

    try {
      setIsSaving(true);
      await api.changePassword(user.id, passForm.current, passForm.new);
      notify('Senha alterada com sucesso!', 'success');
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModules = async () => {
    if (!selectedUnitId) return notify('Selecione uma unidade.', 'warning');
    try {
      setIsSaving(true);
      await api.updateUnitModules(selectedUnitId, enabledModules);
      notify('Configurações aplicadas!', 'success');
      await refreshMetadata();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const msg = isOwner 
      ? 'VOCÊ É O PROPRIETÁRIO. Excluir sua conta removerá A EMPRESA INTEIRA e todos os seus dados. Deseja continuar?' 
      : 'Deseja realmente excluir sua conta de colaborador? Esta ação é irreversível.';
    
    if (!window.confirm(msg)) return;
    
    try {
      setIsSaving(true);
      if (isOwner && currentScope?.tenantId) {
        await api.deleteTenant(currentScope.tenantId);
      } else {
        await api.deleteUser(user.id);
      }
      notify('Conta excluída. Redirecionando...', 'info');
      logout();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Configurações Gerais</h1>
          <p className="text-gray-500 text-sm italic">Gerencie sua identidade, segurança e preferências operacionais.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 bg-slate-50/50 border-r border-slate-100 p-6 space-y-2">
           <button 
             onClick={() => setActiveTab('PROFILE')}
             className={`w-full p-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PROFILE' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:bg-slate-100'}`}
           >
              <i className="fas fa-user-circle text-lg"></i> Meu Perfil
           </button>
           <button 
             onClick={() => setActiveTab('SECURITY')}
             className={`w-full p-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'SECURITY' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:bg-slate-100'}`}
           >
              <i className="fas fa-shield-alt text-lg"></i> Segurança
           </button>
           {isOwner && (
             <button 
               onClick={() => setActiveTab('OPERATION')}
               className={`w-full p-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'OPERATION' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:bg-slate-100'}`}
             >
                <i className="fas fa-cog text-lg"></i> Operação
             </button>
           )}
           <button 
             onClick={() => setActiveTab('ACCOUNT')}
             className={`w-full p-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ACCOUNT' ? 'bg-white text-rose-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:bg-slate-100'}`}
           >
              <i className="fas fa-user-slash text-lg"></i> Minha Conta
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-10">
          {activeTab === 'PROFILE' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
               <div>
                  <h3 className="text-lg font-black text-slate-800">Dados do Perfil</h3>
                  <p className="text-sm text-slate-400">Informações básicas de identificação no sistema.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">Nome Completo</label>
                     <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">Email Corporativo</label>
                     <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">Telefone / WhatsApp</label>
                     <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="(00) 00000-0000" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">CPF / Identificação</label>
                     <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="000.000.000-00" value={profileForm.personalDocument} onChange={e => setProfileForm({...profileForm, personalDocument: e.target.value})} />
                  </div>
               </div>
               <button onClick={handleUpdateProfile} disabled={isSaving} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
                  {isSaving ? <i className="fas fa-sync fa-spin"></i> : 'Salvar Alterações'}
               </button>
            </div>
          )}

          {activeTab === 'SECURITY' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 max-w-md">
               <div>
                  <h3 className="text-lg font-black text-slate-800">Segurança da Conta</h3>
                  <p className="text-sm text-slate-400">Mantenha sua senha atualizada e segura.</p>
               </div>
               <div className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">Senha Atual</label>
                     <input type="password" placeholder="••••••••" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={passForm.current} onChange={e => setPassForm({...passForm, current: e.target.value})} />
                  </div>
                  <hr className="border-slate-100" />
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">Nova Senha</label>
                     <input type="password" placeholder="Nova senha" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={passForm.new} onChange={e => setPassForm({...passForm, new: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">Confirmar Nova Senha</label>
                     <input type="password" placeholder="Repita a nova senha" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={passForm.confirm} onChange={e => setPassForm({...passForm, confirm: e.target.value})} />
                  </div>
               </div>
               <button onClick={handleChangePassword} disabled={isSaving} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
                  {isSaving ? <i className="fas fa-sync fa-spin"></i> : 'Atualizar Senha'}
               </button>
            </div>
          )}

          {activeTab === 'OPERATION' && isOwner && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
               <div>
                  <h3 className="text-lg font-black text-slate-800">Visibilidade de Módulos</h3>
                  <p className="text-sm text-slate-400">Personalize o menu lateral para cada {getLabel('UNIT').toLowerCase()}.</p>
               </div>
               <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Unidade de Operação</label>
                    <select 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none"
                      value={selectedUnitId}
                      onChange={e => setSelectedUnitId(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>

                  {selectedUnitId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {MENU_ITEMS.filter(m => m.allowedOps.includes(activeTenant?.operationType || OperationType.CONSTRUCTION) && !['dashboard', 'settings'].includes(m.id)).map(item => (
                         <button 
                           key={item.id}
                           onClick={() => setEnabledModules(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                           className={`p-4 rounded-2xl border text-left flex items-center gap-4 transition-all ${enabledModules.includes(item.id) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'border-slate-100 text-slate-400'}`}
                         >
                            <i className={`fas ${item.icon} text-lg ${enabledModules.includes(item.id) ? 'text-blue-600' : 'text-slate-200'}`}></i>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${enabledModules.includes(item.id) ? 'text-blue-800' : 'text-slate-400'}`}>{item.label}</span>
                         </button>
                       ))}
                    </div>
                  )}
                  {selectedUnitId && (
                    <button onClick={handleSaveModules} disabled={isSaving} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-200">
                       Aplicar Configurações
                    </button>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'ACCOUNT' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 max-w-2xl">
               <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl space-y-4">
                  <div className="flex items-center gap-4 text-rose-600">
                     <i className="fas fa-exclamation-triangle text-3xl"></i>
                     <h3 className="text-lg font-black uppercase tracking-tight">Zona Crítica</h3>
                  </div>
                  <p className="text-sm text-rose-700 font-medium leading-relaxed">
                     Ao excluir sua conta, todas as suas preferências e logs de ações diretas serão desconectados. 
                     {isOwner && <b className="block mt-2">ATENÇÃO: Como Proprietário, todos os dados da empresa (materiais, pedidos, obras, colaboradores) serão APAGADOS permanentemente.</b>}
                  </p>
                  <div className="pt-4">
                     <button 
                       onClick={handleDeleteAccount}
                       disabled={isSaving}
                       className="px-8 py-3 bg-rose-600 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2"
                     >
                        <i className="fas fa-trash-alt"></i>
                        {isOwner ? 'Excluir Empresa e Sair' : 'Excluir Minha Conta'}
                     </button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
