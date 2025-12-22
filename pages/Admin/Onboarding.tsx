
import React, { useState } from 'react';
import { api } from '../../services/api';
import { OperationType } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

export const Onboarding: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { notify } = useNotification();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  const [admin, setAdmin] = useState({ name: '', email: '', password: '' });
  const [company, setCompany] = useState({ name: '', operationType: OperationType.RESTAURANT, unitName: '' });

  const finish = async () => {
    if (!admin.name || !admin.email || !admin.password || !company.name || !company.unitName) {
      return notify('Preencha todos os campos.', 'warning');
    }
    try {
      setIsFinishing(true);
      await api.onboard(admin, company);
      notify('Empresa criada com sucesso!', 'success');
      await login(admin.email, admin.password);
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-slate-100">
      <div className="max-w-2xl w-full bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden border border-slate-800 animate-in slide-in-from-bottom-4 duration-500">
        {/* Header Progress */}
        <div className="p-10 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase text-white">Crie sua Empresa</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Passo {step} de 4</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step >= s ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>

        <div className="p-10 md:p-14">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-black text-white tracking-tight uppercase">Dados do Administrador</h3>
                <p className="text-slate-400 text-sm mt-2 font-medium uppercase tracking-tight">Este será o usuário Dono (Owner) com acesso total.</p>
              </div>
              <div className="space-y-4">
                <div className="group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Nome Completo</label>
                  <input 
                    className="w-full p-5 bg-slate-950 border border-slate-800 rounded-3xl outline-none font-bold text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-600 transition-all" 
                    placeholder="Ex: João Silva" value={admin.name} onChange={e => setAdmin({...admin, name: e.target.value})} 
                  />
                </div>
                <div className="group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Email Corporativo</label>
                  <input 
                    className="w-full p-5 bg-slate-950 border border-slate-800 rounded-3xl outline-none font-bold text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-600 transition-all" 
                    placeholder="email@empresa.com" value={admin.email} onChange={e => setAdmin({...admin, email: e.target.value})} 
                  />
                </div>
                <div className="group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Senha Secreta</label>
                  <input 
                    type="password" className="w-full p-5 bg-slate-950 border border-slate-800 rounded-3xl outline-none font-bold text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-600 transition-all" 
                    placeholder="••••••••" value={admin.password} onChange={e => setAdmin({...admin, password: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-black text-white tracking-tight uppercase">O que você administra?</h3>
                <p className="text-slate-400 text-sm mt-2 font-medium">O sistema irá adaptar menus e regras ao seu negócio.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: OperationType.RESTAURANT, label: 'Restaurante', desc: 'Insumos, validade e mesas.', icon: 'fa-utensils' },
                  { id: OperationType.STORE, label: 'Loja / Varejo', desc: 'Venda direta e gerência.', icon: 'fa-store' },
                  { id: OperationType.CONSTRUCTION, label: 'Construção Civil', desc: 'Obras, RMs e Centrais.', icon: 'fa-hard-hat' },
                  { id: OperationType.FACTORY, label: 'Indústria / Fábrica', desc: 'Produção e requisições.', icon: 'fa-industry' },
                ].map(op => (
                  <button 
                    key={op.id}
                    onClick={() => setCompany({...company, operationType: op.id})}
                    className={`p-6 border-2 rounded-[32px] flex items-center gap-5 text-left transition-all duration-300 ${company.operationType === op.id ? 'border-blue-600 bg-blue-600/10 shadow-lg scale-105' : 'border-slate-800 bg-slate-950/50 hover:border-slate-600'}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${company.operationType === op.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <i className={`fas ${op.icon}`}></i>
                    </div>
                    <div>
                      <p className="font-black text-white text-base leading-none mb-1">{op.label}</p>
                      <p className="text-[10px] text-slate-500 font-bold leading-tight uppercase">{op.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-black text-white tracking-tight uppercase">Dados da Empresa</h3>
                <p className="text-slate-400 text-sm mt-2 font-medium">A estrutura mínima para começar a operar.</p>
              </div>
              <div className="space-y-6">
                <div className="group">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block ml-1">Nome da Organização</label>
                  <input className="w-full p-5 bg-slate-950 border border-slate-800 rounded-3xl outline-none font-bold text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-600 transition-all" placeholder="Ex: Grupo Gastronômico S/A" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} />
                </div>
                <div className="group">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Nome da Primeira Unidade</label>
                  <input className="w-full p-5 bg-slate-950 border border-slate-800 rounded-3xl outline-none font-bold text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-600 transition-all" placeholder="Ex: Matriz Centro ou Filial 01" value={company.unitName} onChange={e => setCompany({...company, unitName: e.target.value})} />
                </div>
                <div className="p-5 bg-blue-600/5 rounded-[24px] border border-blue-500/10 flex items-start gap-4">
                   <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                   <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic uppercase tracking-tight">O sistema selecionará esta unidade e seu estoque automaticamente no primeiro acesso.</p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-12 animate-in zoom-in-95 duration-500">
              <div className="w-28 h-28 bg-blue-500/10 text-blue-500 rounded-[40px] flex items-center justify-center text-6xl mx-auto mb-8 shadow-inner border border-blue-500/20 rotate-3">
                <i className="fas fa-rocket"></i>
              </div>
              <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Tudo Pronto!</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-10 font-medium">Sua conta e a estrutura básica do seu negócio estão sendo preparadas.</p>
              <button 
                onClick={finish} disabled={isFinishing}
                className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black uppercase text-sm shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-blue-500 disabled:opacity-50"
              >
                {isFinishing ? <i className="fas fa-sync fa-spin text-xl"></i> : <i className="fas fa-check-circle text-xl"></i>}
                Finalizar e Começar Agora
              </button>
            </div>
          )}

          <div className="mt-12 flex justify-between items-center">
            {step > 1 && step < 4 && (
              <button onClick={() => setStep(step - 1)} className="px-8 py-3 text-slate-500 font-black uppercase text-[10px] hover:text-white transition-colors tracking-widest">Voltar</button>
            )}
            <div className="flex-1" />
            {step < 4 && (
              <button onClick={() => setStep(step + 1)} className="px-12 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Próximo</button>
            )}
          </div>
        </div>
        
        {step === 1 && (
          <button onClick={onBack} className="w-full py-6 text-slate-500 font-black text-[10px] bg-slate-950/50 hover:bg-slate-950 transition-all border-t border-slate-800 uppercase tracking-widest">Já tenho uma conta ativa</button>
        )}
      </div>
    </div>
  );
};
