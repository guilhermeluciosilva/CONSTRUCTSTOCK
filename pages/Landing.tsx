
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

interface LandingProps {
  onLogin: () => void;
  onOnboard: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onLogin, onOnboard }) => {
  const { theme, toggleTheme } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePlan, setActivePlan] = useState(0);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const plans = [
    {
      name: 'Free',
      label: 'Experimental',
      price: '0',
      features: [
        'Até 300 Produtos em Estoque',
        '1 Unidade de Operação',
        '600 Movimentações / Mês',
        'Relatórios Básicos + 7 Dias'
      ],
      theme: 'light'
    },
    {
      name: 'Starter',
      label: 'Pequeno Negócio',
      price: '59',
      features: [
        'Até 2.000 Produtos em Estoque',
        '2 Unidades de Operação',
        '6.000 Movimentações / Mês',
        'Exportação CSV + 90 Dias'
      ],
      theme: 'light'
    },
    {
      name: 'Growth',
      label: 'Crescimento',
      price: '149',
      popular: true,
      features: [
        'Até 10.000 Produtos em Estoque',
        '5 Unidades de Operação',
        'Módulo Documental Completo',
        'Dashboards Avançados',
        'Histórico de 24 meses'
      ],
      theme: 'dark'
    },
    {
      name: 'Pro',
      label: 'Profissional',
      price: '299',
      features: [
        'Produtos Ilimitados',
        '15 Unidades Operacionais',
        '120.000 Movimentações / Mês',
        'Auditoria e BI Completo'
      ],
      theme: 'light'
    },
    {
      name: 'Enterprise',
      label: 'Corporativo',
      price: 'Sob Consulta',
      features: [
        'Estrutura Ilimitada',
        'SSO / Segurança Avançada',
        'Suporte 24/7 Dedicado',
        'Relatórios BI Customizados'
      ],
      theme: 'dark'
    }
  ];

  const nextPlan = () => {
    const max = window.innerWidth >= 1024 ? plans.length - 3 : plans.length - 1;
    setActivePlan((prev) => (prev >= max ? 0 : prev + 1));
  };

  const prevPlan = () => {
    const max = window.innerWidth >= 1024 ? plans.length - 3 : plans.length - 1;
    setActivePlan((prev) => (prev <= 0 ? max : prev - 1));
  };

  const faqs = [
    { q: "Posso gerenciar mais de uma loja/obra?", a: "Sim! Nosso sistema é multi-tenant. Você cria uma organização e pode gerenciar várias unidades e almoxarifados com logins independentes." },
    { q: "O controle de estoque baixa automaticamente?", a: "Sim. Em vendas PDV ou no fechamento de comandas de restaurante, o sistema processa as fichas técnicas e abate cada insumo do estoque local em tempo real." },
    { q: "Como funciona a transferência entre unidades?", a: "Você gera uma Guia de Transferência em uma unidade (saída) e a outra unidade confirma o recebimento (entrada), mantendo a rastreabilidade total da carga." },
    { q: "Posso anexar Notas Fiscais?", a: "Com certeza. Temos um módulo documental onde você anexa NF-e, contratos e certificados vinculados diretamente aos pedidos de compra ou requisições." },
    { q: "Como começo a usar?", a: "Basta clicar em 'Começar agora', criar sua empresa e escolher se sua operação inicial é uma Loja, Restaurante ou Construção Civil." }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-blue-100 transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-[100] bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-cubes text-xl"></i>
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-900 dark:text-white uppercase">ConstructStock</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-8 mr-4 border-r border-slate-100 dark:border-slate-800 pr-8">
              <button onClick={() => scrollTo('sobre')} className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">Funcionalidades</button>
              <button onClick={() => scrollTo('planos')} className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">Preços</button>
              <button onClick={() => scrollTo('duvidas')} className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">Dúvidas</button>
            </div>
            
            <button onClick={onLogin} className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 hover:text-blue-600 transition-colors">Entrar</button>
            <button onClick={onOnboard} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg hover:bg-blue-700 transition-all">Começar agora</button>

            {/* THEME TOGGLE - POSICIONADO À DIREITA DE COMEÇAR AGORA */}
            <button 
              onClick={() => toggleTheme()}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-sm ml-3"
              title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
            >
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'} text-lg`}></i>
            </button>
          </div>
          
          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-600 dark:text-slate-300" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-4 animate-in slide-in-from-top-4">
            <button onClick={() => scrollTo('sobre')} className="text-left font-black uppercase text-xs tracking-widest text-slate-500 py-2">Funcionalidades</button>
            <button onClick={() => scrollTo('planos')} className="text-left font-black uppercase text-xs tracking-widest text-slate-500 py-2">Preços</button>
            <button onClick={() => scrollTo('duvidas')} className="text-left font-black uppercase text-xs tracking-widest text-slate-500 py-2">Dúvidas</button>
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
            <div className="flex items-center justify-between">
              <button onClick={onLogin} className="font-black uppercase text-xs text-slate-800 dark:text-white">Entrar</button>
              <button 
                onClick={() => toggleTheme()}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
              </button>
            </div>
            <button onClick={onOnboard} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg">Começar agora</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter uppercase">
            Gestão de Materiais <br/> Sem <span className="text-blue-600">Complicação.</span>
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
            Organize seu estoque, venda mais rápido e controle suas comandas. Tudo em uma única plataforma desenhada para o dia a dia do seu negócio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onOnboard} className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-sm shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all">Começar agora</button>
            <button onClick={onLogin} className="px-10 py-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl font-black uppercase text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Acessar sistema</button>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="sobre" className="py-24 bg-slate-50 dark:bg-[#0f172a]/30 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-10 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
             <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg"><i className="fas fa-boxes-stacked"></i></div>
             <h3 className="text-xl font-black uppercase tracking-tight dark:text-white">Estoque & Almox</h3>
             <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Controle total de entradas, saídas, extratos e transferências entre suas unidades. Saiba exatamente o que tem e onde está.</p>
          </div>
          <div className="p-10 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
             <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg"><i className="fas fa-cash-register"></i></div>
             <h3 className="text-xl font-black uppercase tracking-tight dark:text-white">Vendas & PDV</h3>
             <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Frente de caixa simples para varejo. Registre vendas diretas, emita comprovantes e tenha faturamento consolidado por loja.</p>
          </div>
          <div className="p-10 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
             <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg"><i className="fas fa-utensils"></i></div>
             <h3 className="text-xl font-black uppercase tracking-tight dark:text-white">Mesas & Receitas</h3>
             <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Gestão de comandas para restaurantes. Fechamento de conta com baixa automática de insumos baseado na sua ficha técnica.</p>
          </div>
        </div>
      </section>

      {/* Planos Section */}
      <section id="planos" className="py-32 px-6 bg-white dark:bg-[#020617] overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase dark:text-white">Planos para todos os <span className="text-blue-600">tamanhos.</span></h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Escale conforme sua operação cresce.</p>
          </div>

          <div className="relative group">
            <button 
              onClick={prevPlan}
              className="absolute left-[-20px] md:left-[-40px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all z-30 active:scale-90"
            >
              <i className="fas fa-chevron-left text-lg"></i>
            </button>
            <button 
              onClick={nextPlan}
              className="absolute right-[-20px] md:right-[-40px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all z-30 active:scale-90"
            >
              <i className="fas fa-chevron-right text-lg"></i>
            </button>

            <div className="overflow-hidden py-10 px-2">
              <div 
                className="flex transition-transform duration-500 ease-out" 
                style={{ transform: `translateX(-${activePlan * (100 / (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1))}%)` }}
              >
                {plans.map((plan, index) => (
                  <div key={index} className="w-full md:w-1/2 lg:w-1/3 shrink-0 px-4">
                    <div className={`p-10 rounded-[40px] shadow-2xl flex flex-col h-[520px] border-4 relative transition-all duration-300 ${
                      plan.popular ? 'scale-105 z-10' : 'scale-100'
                    } ${
                      plan.theme === 'dark' 
                        ? 'bg-slate-900 border-blue-600 text-white' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white'
                    }`}>
                      {plan.popular && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Mais Popular</div>
                      )}
                      
                      <div className="mb-8">
                        <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${plan.theme === 'dark' ? 'text-blue-400' : 'text-slate-400'}`}>
                          {plan.label}
                        </h4>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-5xl font-black tracking-tighter ${plan.price === 'Sob Consulta' ? 'text-2xl' : ''}`}>
                            {plan.price !== 'Sob Consulta' ? `R$ ${plan.price}` : plan.price}
                          </span>
                          {plan.price !== 'Sob Consulta' && (
                            <span className="text-sm font-bold text-slate-400">/mês</span>
                          )}
                        </div>
                      </div>

                      <ul className="space-y-4 mb-10 flex-1">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm font-bold">
                            <i className={`fas fa-check mt-1 ${plan.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}></i>
                            <span className={plan.theme === 'dark' ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'}>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      <button 
                        onClick={onOnboard} 
                        className={`w-full py-5 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all ${
                          plan.theme === 'dark' 
                            ? 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700' 
                            : 'bg-slate-900 dark:bg-blue-600 text-white shadow-slate-900/20 hover:bg-slate-800'
                        }`}
                      >
                        {plan.price === 'Sob Consulta' ? 'Falar com Consultor' : 'Assinar Agora'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="duvidas" className="py-32 bg-indigo-50/40 dark:bg-[#0f172a]/20 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-slate-800 dark:text-white">Central de <span className="text-blue-600">Dúvidas.</span></h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Respostas rápidas para você começar.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
             {faqs.map((f, i) => (
               <div key={i} className="p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
                  <div className="flex gap-6">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-slate-800 text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                      <i className="fas fa-lightbulb"></i>
                    </div>
                    <div className="space-y-3">
                      <p className="font-black text-slate-800 dark:text-white text-lg leading-tight">{f.q}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.a}</p>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <footer className="py-24 px-6 text-center bg-blue-600 text-white space-y-8">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Pronto para organizar seu negócio?</h2>
        <button onClick={onOnboard} className="px-12 py-5 bg-white text-blue-600 rounded-2xl font-black uppercase text-sm shadow-xl hover:bg-slate-50 active:scale-95 transition-all">Criar minha conta</button>
        <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.2em]">ConstructStock Pro • Versão 2.0</p>
      </footer>
    </div>
  );
};
