
import React, { useState, useEffect } from 'react';

interface LandingProps {
  onLogin: () => void;
  onOnboard: () => void;
}

const slides = [
  {
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200",
    icon: "fa-boxes-stacked",
    label: "Status do Galpão",
    title: "Inventário Sincronizado"
  },
  {
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=1200",
    icon: "fa-truck-fast",
    label: "Fluxo Logístico",
    title: "Despachos em Tempo Real"
  },
  {
    image: "https://images.unsplash.com/photo-1565891741441-64926e441838?auto=format&fit=crop&q=80&w=1200",
    icon: "fa-clipboard-check",
    label: "Controle de Qualidade",
    title: "Auditoria de Materiais"
  },
  {
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200",
    icon: "fa-industry",
    label: "Gestão Industrial",
    title: "Alta Disponibilidade"
  }
];

const AdvancedProductionLine = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-[32px] bg-[#05070e]">
      {slides.map((slide, index) => (
        <div 
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {/* Background Image for each slide */}
          <div className="absolute inset-0">
            <img 
              src={slide.image} 
              alt={slide.title} 
              className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-[3000ms]"
            />
            {/* Overlay gradiente para combinar com a identidade visual */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070e] via-transparent to-transparent opacity-90"></div>
            <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay"></div>
          </div>

          {/* Elements Overlay for each slide */}
          <div className="relative z-20 w-full h-full p-8 flex flex-col justify-end">
             <div className={`flex items-center gap-4 transition-all duration-700 delay-300 ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/40">
                   <i className={`fas ${slide.icon} text-xl`}></i>
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] leading-none mb-1">{slide.label}</p>
                  <p className="text-sm font-black text-white uppercase tracking-tight">{slide.title}</p>
                </div>
             </div>
          </div>
        </div>
      ))}

      {/* Progress Indicators */}
      <div className="absolute top-6 right-8 z-30 flex gap-1.5">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-6 bg-blue-500' : 'w-1.5 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
};

export const Landing: React.FC<LandingProps> = ({ onLogin, onOnboard }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <i className="fas fa-cubes text-xl"></i>
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-900">ConstructStock</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('sobre')} className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Sobre</button>
            <button onClick={() => scrollTo('ideal')} className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Ideal</button>
            <div className="h-6 w-px bg-slate-100"></div>
            <button onClick={onLogin} className="text-xs font-black uppercase tracking-widest text-slate-800 hover:text-blue-600 transition-colors">Login</button>
            <button onClick={onOnboard} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all">Teste Grátis</button>
          </div>

          <button className="md:hidden text-slate-500" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 p-6 space-y-4 animate-in slide-in-from-top-4">
            <button onClick={() => scrollTo('sobre')} className="block w-full text-left font-black text-xs uppercase text-slate-500 py-2">Sobre</button>
            <button onClick={() => scrollTo('ideal')} className="block w-full text-left font-black text-xs uppercase text-slate-500 py-2">Ideal</button>
            <hr className="border-slate-50" />
            <button onClick={onLogin} className="block w-full text-left font-black text-xs uppercase text-slate-800 py-2">Login</button>
            <button onClick={onOnboard} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase">Teste Grátis</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center md:text-left animate-in slide-in-from-left-4 duration-700">
            <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              Smart Logistics Hub
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter">
              A linha de produção do seu <span className="text-blue-600">futuro.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
              Automatize a entrada, saída, vendas e despacho de materiais com inteligência. A solução definitiva para almoxarifados modernos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button onClick={onOnboard} className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-sm shadow-2xl shadow-blue-500/40 hover:bg-blue-700 hover:-translate-y-1 transition-all">
                Começar agora <i className="fas fa-arrow-right ml-2"></i>
              </button>
              <button onClick={onLogin} className="px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black uppercase text-sm hover:bg-slate-50 transition-all">
                Acessar minha conta
              </button>
            </div>
          </div>
          <div className="flex-1 relative animate-in zoom-in-95 duration-1000">
            <div className="relative z-10 bg-[#0a0f1d] rounded-[48px] p-2 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-slate-800/50">
              <div className="bg-slate-950 rounded-[42px] overflow-hidden aspect-[1.58/1] flex items-center justify-center">
                <AdvancedProductionLine />
              </div>
            </div>
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]"></div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-xs font-black uppercase text-blue-600 tracking-[0.3em]">Operação</h2>
            <p className="text-3xl font-black text-slate-900">Como o ConstructStock ajuda seu dia a dia</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: 'fa-exchange-alt', title: 'Entradas e saídas fluidas', desc: 'Registre movimentações em segundos com interface intuitiva otimizada para Desktop e Mobile.' },
              { icon: 'fa-sitemap', title: 'Controle Multi-unidade', desc: 'Gerencie múltiplos estoques dentro de uma mesma unidade ou em locais geograficamente distintos.' },
              { icon: 'fa-fingerprint', title: 'Rastreabilidade Total', desc: 'Saiba quem, quando e por que cada item foi movimentado com logs de auditoria automáticos.' }
            ].map((card, i) => (
              <div key={i} className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <i className={`fas ${card.icon}`}></i>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-4">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Targets Section */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-blue-600 tracking-[0.3em]">Verticalização</h2>
              <p className="text-4xl font-black text-slate-900 leading-tight">Um sistema, três realidades.</p>
            </div>
            <p className="text-slate-500 font-medium max-w-md">
              Ajustamos os termos e fluxos para que o sistema fale a língua da sua operação, seja você um lojista ou engenheiro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-[32px] bg-slate-900 text-white space-y-6 relative overflow-hidden group">
              <i className="fas fa-store text-4xl text-blue-500 opacity-20 absolute -right-4 -top-4 group-hover:scale-110 transition-transform"></i>
              <h4 className="text-xl font-black">Lojas</h4>
              <p className="text-slate-400 text-sm">Venda/saída rápida e estoque simples. Otimizado para balcão e conferência de prateleira.</p>
              <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase text-blue-400"><i className="fas fa-check"></i> Venda direta</div>
            </div>
            <div className="p-8 rounded-[32px] bg-blue-600 text-white space-y-6 relative overflow-hidden group shadow-2xl shadow-blue-500/20">
              <i className="fas fa-hard-hat text-4xl text-white opacity-20 absolute -right-4 -top-4 group-hover:scale-110 transition-transform"></i>
              <h4 className="text-xl font-black">Obras</h4>
              <p className="text-blue-100 text-sm">Central abastecendo obras, transferências e requisições (RM). Controle total de suprimentos.</p>
              <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase text-white"><i className="fas fa-check"></i> Requisições RM</div>
            </div>
            <div className="p-8 rounded-[32px] bg-slate-900 text-white space-y-6 relative overflow-hidden group">
              <i className="fas fa-industry text-4xl text-emerald-500 opacity-20 absolute -right-4 -top-4 group-hover:scale-110 transition-transform"></i>
              <h4 className="text-xl font-black">Indústrias</h4>
              <p className="text-slate-400 text-sm">Setores, múltiplos almoxarifados e movimentações internas complexas entre processos.</p>
              <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400"><i className="fas fa-check"></i> Setores de produção</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-24 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="w-20 h-2 bg-blue-600 mx-auto rounded-full mb-10"></div>
          <h2 className="text-3xl font-black text-slate-900">Sobre o ConstructStock Pro</h2>
          <div className="space-y-6 text-slate-500 text-lg leading-relaxed font-medium">
            <p>
              Nossa missão é simples: simplificar o controle de materiais para que as empresas possam focar no que realmente importa. Acreditamos que um sistema robusto não precisa ser complicado de usar.
            </p>
            <p>
              Com foco em adoção diária e baixa fricção, criamos uma plataforma que oferece clareza absoluta sobre o que entra e o que sai, eliminando rupturas de estoque e desperdícios financeiros.
            </p>
          </div>
        </div>
      </section>

      {/* Ideal & Objectives */}
      <section id="ideal" className="py-24 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1">
            <div className="bg-slate-900 rounded-[40px] p-12 text-white space-y-8">
               <h3 className="text-2xl font-black">Nosso Ideal e Objetivo</h3>
               <div className="space-y-6">
                  {[
                    { t: 'Simplicidade que funciona', d: 'Menos cliques, mais produtividade. Design focado no operador.' },
                    { t: 'Controle com rastreabilidade', d: 'Auditoria nativa em cada grama ou unidade movimentada.' },
                    { t: 'Versatilidade Total', d: 'Pronto para loja, obra e fábrica em um único ambiente.' },
                    { t: 'Escalabilidade Real', d: 'Sua empresa cresce, o sistema acompanha sem perder fôlego.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-xs font-black">{i+1}</div>
                      <div>
                        <p className="font-black text-sm uppercase text-blue-400 tracking-widest">{item.t}</p>
                        <p className="text-slate-400 text-xs mt-1">{item.d}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Pronto para transformar sua gestão?</h2>
            <p className="text-slate-500 text-lg font-medium">Junte-se a centenas de empresas que já otimizaram seus fluxos de suprimentos conosco.</p>
            <div className="flex gap-4">
              <button onClick={onOnboard} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-xs shadow-xl">Começar Teste Grátis</button>
              <button onClick={onLogin} className="px-8 py-4 border border-slate-200 text-slate-900 rounded-xl font-black uppercase text-xs hover:bg-slate-50 transition-all">Fazer Login</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-20 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6 col-span-1 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <i className="fas fa-cubes"></i>
              </div>
              <span className="font-black text-lg tracking-tighter">ConstructStock Pro</span>
            </div>
            <p className="text-slate-500 text-sm max-w-sm">
              Sua plataforma definitiva para gestão de materiais, logística e PDV. Simples para o usuário, poderoso para o negócio.
            </p>
          </div>
          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Navegação</h4>
             <ul className="space-y-2 text-sm font-bold">
               <li><button onClick={() => scrollTo('sobre')} className="text-slate-600 hover:text-white transition-colors">Sobre nós</button></li>
               <li><button onClick={() => scrollTo('ideal')} className="text-slate-600 hover:text-white transition-colors">Ideal & Objetivos</button></li>
               <li><button onClick={onLogin} className="text-slate-600 hover:text-white transition-colors">Login</button></li>
             </ul>
          </div>
          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Contato</h4>
             <ul className="space-y-2 text-sm font-bold">
               <li className="text-slate-600">suporte@constructstock.pro</li>
               <li className="text-slate-600">+55 (00) 00000-0000</li>
             </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-900 flex justify-between items-center text-[10px] font-black uppercase text-slate-600 tracking-widest">
           <p>© 2025 ConstructStock Pro. Todos os direitos reservados.</p>
           <div className="flex gap-6">
              <a href="#" className="hover:text-blue-500">Privacidade</a>
              <a href="#" className="hover:text-blue-500">Termos</a>
           </div>
        </div>
      </footer>
    </div>
  );
};
