
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onOnboard: () => void;
  onBack: () => void;
}

export const Login: React.FC<LoginProps> = ({ onOnboard, onBack }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden p-12 border border-slate-800 animate-in zoom-in-95 duration-500 relative">
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 text-slate-500 hover:text-blue-500 transition-all flex items-center gap-2 group"
        >
          <i className="fas fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Início</span>
        </button>

        <div className="text-center pt-8 mb-12">
          <div className="w-20 h-20 bg-blue-600 rounded-[32px] mx-auto flex items-center justify-center text-white text-4xl mb-6 shadow-2xl shadow-blue-500/20 rotate-3 border border-white/10">
            <i className="fas fa-cubes"></i>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">ConstructStock</h2>
          <p className="text-slate-500 mt-2 font-bold text-[10px] uppercase tracking-widest">Gestão de Suprimentos Pro</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">E-mail de Acesso</label>
              <input 
                type="email" required
                className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-[24px] focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-white transition-all"
                placeholder="Ex: seu@email.com" value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Senha</label>
              <input 
                type="password" required
                className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-[24px] focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-white transition-all"
                placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          {error && (
             <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl animate-shake">
                <p className="text-[10px] text-rose-500 font-black text-center uppercase tracking-widest">{error}</p>
             </div>
          )}

          <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black shadow-2xl shadow-blue-500/20 hover:bg-blue-500 transition-all uppercase tracking-widest text-xs active:scale-95">
            Entrar no Painel
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center">
          <button onClick={onOnboard} className="text-slate-400 hover:text-blue-500 font-black text-[10px] uppercase transition-all tracking-widest">
            Criar Empresa / Primeiro Acesso
          </button>
        </div>
      </div>
    </div>
  );
};
