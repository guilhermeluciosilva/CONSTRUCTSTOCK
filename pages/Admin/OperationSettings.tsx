
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { MENU_ITEMS, PERMISSION_LABELS } from '../../constants';
import { OperationType } from '../../types';
import { formatCurrency } from '../../lib/utils';

type SettingTab = 'PROFILE' | 'SECURITY' | 'OPERATION' | 'PLANS' | 'ACCOUNT';

export const OperationSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentScope, units, refreshMetadata, getLabel, activeTenant } = useApp();
  const { notify } = useNotification();
  
  const [activeTab, setActiveTab] = useState<SettingTab>('PROFILE');
  const [isSaving, setIsSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({ 
    name: user?.name || '', 
    email: user?.email || '', 
    phone: user?.phone || '', 
    personalDocument: user?.personalDocument || '' 
  });

  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
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
    if (units.length > 0 && !selectedUnitId) {
      setSelectedUnitId(units[0].id);
    }
  }, [user, units]);

  const selectedUnit = units.find(u => u.id === selectedUnitId);
  useEffect(() => {
    if (selectedUnit) {
      setEnabledModules(selectedUnit.enabledModuleIds || []);
    }
  }, [selectedUnitId, selectedUnit]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      await api.updateUser(user.id, profileForm);
      notify('Perfil atualizado!', 'success');
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (passForm.new !== passForm.confirm) return notify('Novas senhas não conferem.', 'warning');
    try {
      setIsSaving(true);
      await api.changePassword(user.id, passForm.current, passForm.new);
      notify('Senha alterada!', 'success');
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModules = async () => {
    if (!selectedUnitId) return;
    try {
      setIsSaving(true);
      await api.updateUnitModules(selectedUnitId, enabledModules);
      notify('Módulos da unidade atualizados!', 'success');
      await refreshMetadata();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !activeTenant) return;
    const confirmMessage = isOwner 
      ? `ATENÇÃO: Você é o proprietário. Excluir a conta removerá permanentemente a empresa "${activeTenant.name}" e todos os seus dados. Deseja continuar?`
      : "Deseja realmente excluir seu usuário do sistema?";
    
    if (!window.confirm(confirmMessage)) return;

    try {
      setIsSaving(true);
      if (isOwner) {
        await api.deleteTenant(activeTenant.id);
        notify('Empresa e conta removidas com sucesso.', 'info');
      } else {
        await api.deleteUser(user.id);
        notify('Seu usuário foi removido.', 'info');
      }
      logout();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleModule = (modId: string) => {
    setEnabledModules(prev => prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]);
  };

  const plans = [
    { name: 'STARTER', sub: 'Assinatura', price: '59', features: ['Não', '1', '2', '3', '2.000', '6.000', '2 GB', 'CSV + 90 DIAS'] },
    { name: 'GROWTH', sub: 'Assinatura', price: '149', features: ['Não', '2', '5', '8', '10.000', '30.000', '15 GB', '24 MESES'], highlight: true },
    { name: 'PRO', sub: 'Assinatura', price: '299', features: ['Não', '5', '15', '20', 'Ilimitado', '120.000', '60 GB', 'ILIMITADO'] },
    { name: 'ENTERPRISE', sub: 'Assinatura', price: 'Sob Consulta', features: ['Não', 'Ilimitado', 'Ilimitado', 'Ilimitado / SSO', 'Ilimitado', 'Custom', '200 GB+', 'BI / CUSTOM'] },
  ];

  const addons = [
    { label: 'PDV / CAIXA EXTRA', price: 'R$ 39/mês', icon: 'fa-cash-register' },
    { label: 'USUÁRIO EXTRA', price: 'R$ 12/mês', icon: 'fa-user-plus' },
    { label: 'UNIDADE EXTRA', price: 'R$ 29/mês', icon: 'fa-store-alt' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Configurações do Sistema</h1>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar compacta */}
        <div className="w-full md:w-64 bg-slate-50/50 border-r border-slate-100 p-4 space-y-1 shrink-0">
           {[
             { id: 'PROFILE', label: 'Meu Perfil', icon: 'fa-user-circle', color: 'text-blue-600' },
             { id: 'SECURITY', label: 'Segurança', icon: 'fa-shield-alt', color: 'text-blue-600' },
             ...(isOwner ? [
               { id: 'OPERATION', label: 'Operação', icon: 'fa-cog', color: 'text-blue-600' },
               { id: 'PLANS', label: 'Faturamento', icon: 'fa-crown', color: 'text-emerald-600' }
             ] : []),
             { id: 'ACCOUNT', label: 'Minha Conta', icon: 'fa-user-slash', color: 'text-rose-600' }
           ].map(item => (
             <button 
               key={item.id}
               onClick={() => setActiveTab(item.id as SettingTab)}
               className={`w-full p-3 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-white shadow-sm border border-slate-100 ' + item.color : 'text-slate-400 hover:bg-slate-100'}`}
             >
                <i className={`fas ${item.icon} text-base`}></i> {item.label}
             </button>
           ))}
        </div>

        {/* Content Area mais fluida */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
          {activeTab === 'PROFILE' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 max-w-2xl">
               <div className="border-b pb-4">
                  <h3 className="text-lg font-black text-slate-800">Dados Cadastrais</h3>
                  <p className="text-xs text-slate-400">Mantenha seus dados de contato atualizados.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Nome</label>
                  <input className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold text-sm outline-none focus:ring-1 focus:ring-blue-500" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Email</label>
                  <input className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold text-sm outline-none focus:ring-1 focus:ring-blue-500" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Telefone</label>
                  <input className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold text-sm outline-none focus:ring-1 focus:ring-blue-500" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Documento</label>
                  <input className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold text-sm outline-none focus:ring-1 focus:ring-blue-500" value={profileForm.personalDocument} onChange={e => setProfileForm({...profileForm, personalDocument: e.target.value})} /></div>
               </div>
               <button onClick={handleUpdateProfile} disabled={isSaving} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">
                 {isSaving ? <i className="fas fa-sync fa-spin"></i> : 'Atualizar Perfil'}
               </button>
            </div>
          )}

          {activeTab === 'SECURITY' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 max-w-sm">
               <div className="border-b pb-4">
                  <h3 className="text-lg font-black text-slate-800">Alterar Senha</h3>
                  <p className="text-xs text-slate-400">Sua senha deve ter no mínimo 4 caracteres.</p>
               </div>
               <div className="space-y-3">
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Senha Atual</label>
                  <input type="password" placeholder="••••••••" className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold text-sm outline-none focus:ring-1 focus:ring-blue-500" value={passForm.current} onChange={e => setPassForm({...passForm, current: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Nova Senha</label>
                  <input type="password" placeholder="Nova senha" className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold text-sm outline-none focus:ring-1 focus:ring-blue-500" value={passForm.new} onChange={e => setPassForm({...passForm, new: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Confirmar Nova Senha</label>
                  <input type="password" placeholder="Repita a senha" className="w-full p-2.5 bg-slate-50 border rounded-lg font-bold text-sm outline-none focus:ring-1 focus:ring-blue-500" value={passForm.confirm} onChange={e => setPassForm({...passForm, confirm: e.target.value})} /></div>
               </div>
               <button onClick={handleChangePassword} disabled={isSaving} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">
                 {isSaving ? <i className="fas fa-sync fa-spin"></i> : 'Confirmar Nova Senha'}
               </button>
            </div>
          )}

          {activeTab === 'OPERATION' && isOwner && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
               <div className="border-b pb-4 flex justify-between items-end">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Módulos da Unidade</h3>
                    <p className="text-xs text-slate-400">Habilite ou desabilite funções para cada restaurante/loja.</p>
                  </div>
                  <select 
                    className="p-2 border rounded-lg text-xs font-black uppercase bg-slate-50"
                    value={selectedUnitId}
                    onChange={e => setSelectedUnitId(e.target.value)}
                  >
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {MENU_ITEMS.filter(m => !['dashboard', 'settings'].includes(m.id)).map(mod => (
                    <button 
                      key={mod.id}
                      onClick={() => toggleModule(mod.id)}
                      className={`p-4 border rounded-2xl flex items-center gap-3 text-left transition-all ${enabledModules.includes(mod.id) ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-100 opacity-60 grayscale'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${enabledModules.includes(mod.id) ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                        <i className={`fas ${mod.icon}`}></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1">{mod.label}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">{mod.category}</p>
                      </div>
                    </button>
                  ))}
               </div>
               <button onClick={handleSaveModules} disabled={isSaving} className="mt-4 px-10 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">
                 {isSaving ? <i className="fas fa-sync fa-spin"></i> : 'Salvar Configuração de Módulos'}
               </button>
            </div>
          )}

          {activeTab === 'PLANS' && isOwner && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
               <div className="text-center space-y-1">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Planos & Upgrade</h3>
                  <p className="text-xs text-slate-400 font-medium">Digitalize sua operação com escala e segurança.</p>
               </div>
               
               <div className="border border-slate-100 rounded-[24px] overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left border-collapse table-fixed">
                     <thead>
                        <tr className="bg-[#111827] text-white">
                           <th className="p-4 text-[9px] font-black uppercase tracking-widest w-1/4">Recursos</th>
                           {plans.map(p => (
                             <th key={p.name} className={`p-4 text-center border-l border-slate-800 ${p.highlight ? 'bg-blue-600' : ''}`}>
                                <p className="text-[8px] font-black uppercase opacity-60">{p.sub}</p>
                                <p className="text-sm font-black">{p.name}</p>
                                <p className="text-[10px] font-black text-blue-200">R$ {p.price}</p>
                             </th>
                           ))}
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 text-[10px]">
                        {[
                          'Operações Ativas', 'Unidades / Locais', 'Usuários', 'Produtos', 'Movim. / Mês', 'Armazenamento', 'Relatórios'
                        ].map((label, rIdx) => (
                          <tr key={label} className="hover:bg-slate-50 transition-colors">
                             <td className="p-3 font-black text-slate-500 uppercase tracking-tight bg-slate-50/30">{label}</td>
                             {plans.map((p, pIdx) => (
                               <td key={pIdx} className="p-3 text-center font-bold text-slate-700 border-l border-slate-50">
                                  {p.features[rIdx + 1]}
                               </td>
                             ))}
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {addons.map((addon, i) => (
                    <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-blue-400 transition-all">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs"><i className={`fas ${addon.icon}`}></i></div>
                          <div>
                             <p className="text-[9px] font-black text-slate-800 uppercase leading-none mb-1">{addon.label}</p>
                             <p className="text-[10px] font-bold text-blue-600">{addon.price}</p>
                          </div>
                       </div>
                       <button className="text-slate-300 hover:text-blue-600"><i className="fas fa-plus-circle text-sm"></i></button>
                    </div>
                  ))}
               </div>

               <div className="p-6 bg-slate-900 rounded-[28px] text-white flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase text-blue-500 tracking-widest mb-1">Status</p>
                    <p className="text-sm font-bold leading-tight">Sua empresa está em conformidade com o plano <span className="text-emerald-400">STARTER</span>.</p>
                  </div>
                  <button onClick={() => notify('Pagamento indisponível em ambiente de teste.', 'info')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">Mudar Plano</button>
               </div>
            </div>
          )}

          {activeTab === 'ACCOUNT' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 max-w-2xl">
               <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3 text-rose-600">
                     <i className="fas fa-exclamation-triangle text-xl"></i>
                     <h3 className="text-base font-black uppercase tracking-tight">Zona Crítica</h3>
                  </div>
                  <p className="text-xs text-rose-700 font-medium leading-relaxed">
                     A exclusão da conta é irreversível. Se você for o proprietário, todos os dados da empresa (materiais, vendas, estoque e usuários) serão removidos permanentemente.
                  </p>
                  <button onClick={handleDeleteAccount} className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-rose-700 transition-all">Excluir Tudo e Sair</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
