
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
  const [company, setCompany] = useState({ name: '', operationType: OperationType.CONSTRUCTION, unitName: '' });

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-4">
        {/* Header Progress */}
        <div className="p-8 border-b bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">Crie sua Empresa</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Passo {step} de 4</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 w-6 rounded-full transition-all ${step >= s ? 'bg-blue-500' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>

        <div className="p-10">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Dados do Administrador</h3>
                <p className="text-slate-400 text-sm">Este será o usuário Dono (Owner) com acesso total.</p>
              </div>
              <input 
                className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" 
                placeholder="Nome Completo" value={admin.name} onChange={e => setAdmin({...admin, name: e.target.value})} 
              />
              <input 
                className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" 
                placeholder="Email corporativo" value={admin.email} onChange={e => setAdmin({...admin, email: e.target.value})} 
              />
              <input 
                type="password" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" 
                placeholder="Senha de acesso" value={admin.password} onChange={e => setAdmin({...admin, password: e.target.value})} 
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">O que você administra?</h3>
                <p className="text-slate-400 text-sm">O sistema irá adaptar menus e regras ao seu negócio.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: OperationType.CONSTRUCTION, label: 'Construção Civil', desc: 'Obras, RMs e Centrais.', icon: 'fa-hard-hat' },
                  { id: OperationType.STORE, label: 'Lojas / Varejo', desc: 'Venda direta e gerência.', icon: 'fa-store' },
                  { id: OperationType.FACTORY, label: 'Indústria / Fábrica', desc: 'Produção e requisições.', icon: 'fa-industry' },
                  { id: OperationType.RESTAURANT, label: 'Restaurante', desc: 'Insumos, validade e mesas.', icon: 'fa-utensils' },
                ].map(op => (
                  <button 
                    key={op.id}
                    onClick={() => setCompany({...company, operationType: op.id})}
                    className={`p-6 border-2 rounded-3xl flex items-center gap-4 text-left transition-all ${company.operationType === op.id ? 'border-blue-600 bg-blue-50 shadow-lg scale-105' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${company.operationType === op.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                      <i className={`fas ${op.icon}`}></i>
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">{op.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium leading-tight">{op.desc}</p>
                    </div>
                  </button>
                ))}
                
                {/* Opção + Outros */}
                <button 
                  className="p-6 border-2 border-dashed border-slate-100 rounded-3xl flex items-center gap-4 text-left opacity-60 cursor-not-allowed group"
                  disabled
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center text-xl shrink-0 group-hover:bg-slate-100">
                    <i className="fas fa-plus"></i>
                  </div>
                  <div>
                    <p className="font-black text-slate-400 text-sm">Outros negócios</p>
                    <p className="text-[10px] text-slate-300 font-medium leading-tight">Em breve novos módulos.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Dados da Empresa</h3>
                <p className="text-slate-400 text-sm">A estrutura mínima para começar a operar.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Nome da Empresa</label>
                <input className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" placeholder="Ex: Engenharia S/A" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Primeira Unidade ({company.operationType === OperationType.STORE ? 'Loja' : company.operationType === OperationType.FACTORY ? 'Planta' : company.operationType === OperationType.RESTAURANT ? 'Restaurante' : 'Obra'})</label>
                <input className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" placeholder="Ex: Unidade Centro" value={company.unitName} onChange={e => setCompany({...company, unitName: e.target.value})} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-10 animate-in fade-in">
              <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
                <i className="fas fa-magic"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Quase lá!</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">Ao clicar em finalizar, criaremos sua conta e a estrutura básica selecionada para o seu tipo de negócio.</p>
              <button 
                onClick={finish} disabled={isFinishing}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-2"
              >
                {isFinishing ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-check-circle"></i>}
                Finalizar e Começar
              </button>
            </div>
          )}

          <div className="mt-10 flex justify-between">
            {step > 1 && step < 4 && (
              <button onClick={() => setStep(step - 1)} className="px-8 py-3 text-slate-400 font-bold uppercase text-[10px]">Voltar</button>
            )}
            <div className="flex-1" />
            {step < 4 && (
              <button onClick={() => setStep(step + 1)} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-200">Próximo</button>
            )}
          </div>
        </div>
        
        {step === 1 && (
          <button onClick={onBack} className="w-full py-4 text-slate-400 font-bold text-xs bg-slate-50 hover:bg-slate-100 transition-all border-t">Já tenho conta</button>
        )}
      </div>
    </div>
  );
};
