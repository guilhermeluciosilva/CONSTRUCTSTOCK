
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-10 space-y-8 animate-in zoom-in-95 duration-500 relative">
        {/* Botão de Voltar Simples */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-2 group"
          title="Voltar para o site"
        >
          <i className="fas fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Início</span>
        </button>

        <div className="text-center pt-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl mb-4 shadow-xl shadow-blue-500/20">
            <i className="fas fa-cubes"></i>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">ConstructStock Pro</h2>
          <p className="text-slate-400 mt-2 font-medium">Gestão Inteligente de Suprimentos</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <input 
              type="email" required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            />
            <input 
              type="password" required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-rose-500 font-bold text-center">{error}</p>}
          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest text-xs active:scale-95">
            Entrar no Sistema
          </button>
        </form>

        <div className="pt-6 border-t border-slate-100 text-center">
          <button onClick={onOnboard} className="text-blue-600 font-black text-xs uppercase hover:underline tracking-tight">
            Criar empresa / Primeiro acesso
          </button>
        </div>
      </div>
    </div>
  );
};
