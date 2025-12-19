
import React from 'react';

export const AccessDenied: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-6 animate-in fade-in duration-300">
    <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 text-4xl shadow-inner">
      <i className="fas fa-shield-halved"></i>
    </div>
    <div className="space-y-2">
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Acesso Restrito</h2>
      <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
        {message || "Seu perfil atual não possui permissão para visualizar ou operar nesta seção. Caso precise de acesso, contate o administrador do sistema."}
      </p>
    </div>
    <div className="flex gap-4">
       <button onClick={() => window.history.back()} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Voltar</button>
    </div>
  </div>
);
