
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
          <div className="absolute inset-0">
            <img 
              src={slide.image} 
              alt={slide.title} 
              className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-[3000ms]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070e] via-transparent to-transparent opacity-90"></div>
            <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay"></div>
          </div>

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

  const plans = [
    { name: 'FREE', price: '0', ads: 'Sim', ops: '1', units: '1', users: '1', skus: '300', movs: '600', storage: '150 MB', reports: 'Básicos + 7 dias', popular: false },
    { name: 'STARTER', price: '59', ads: 'Não', ops: '1', units: '2', users: '3', skus: '2.000', movs: '6.000', storage: '2 GB', reports: 'Export CSV + 90 dias', popular: false },
    { name: 'GROWTH', price: '149', ads: 'Não', ops: '2', units: '5', users: '8', skus: '10.000', movs: '30.000', storage: '15 GB', reports: 'Dashboards + 24 meses', popular: true },
    { name: 'PRO', price: '299', ads: 'Não', ops: '5', units: '15', users: '20', skus: 'Ilimitado', movs: '120.000', storage: '60 GB', reports: 'Avançados + Ilimitado', popular: false },
    { name: 'ENTERPRISE', price: 'Sob Consulta', ads: 'Não', ops: 'Ilimitado', units: 'Ilimitado', users: 'Ilimitado / SSO', skus: 'Ilimitado', movs: 'Custom', storage: '200 GB+', reports: 'BI / Custom', popular: false },
  ];

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
            <button onClick={() => scrollTo('planos')} className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Planos</button>
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
            <button onClick={() => scrollTo('planos')} className="block w-full text-left font-black text-xs uppercase text-slate-500 py-2">Planos</button>
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
          </div>
        </div>
      </section>

      {/* Sobre Section - RESTORED & IMPROVED */}
      <section id="sobre" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-black uppercase text-blue-600 tracking-[0.3em]">Tecnologia e Gestão</h2>
            <p className="text-3xl font-black text-slate-900 uppercase">O que nos torna diferentes?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4 p-8 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
               <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/20 mb-6">
                  <i className="fas fa-microchip"></i>
               </div>
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestão Autônoma</h3>
               <p className="text-slate-500 text-sm font-medium leading-relaxed">
                 Nossa IA monitora níveis de estoque e sugere reposições automáticas antes que o material acabe no canteiro ou na gôndola.
               </p>
            </div>
            <div className="space-y-4 p-8 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
               <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/20 mb-6">
                  <i className="fas fa-cloud-arrow-up"></i>
               </div>
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cloud Docs</h3>
               <p className="text-slate-500 text-sm font-medium leading-relaxed">
                 Elimine o papel. Armazene Notas Fiscais, Certificados de Qualidade e Contratos vinculados diretamente a cada transação.
               </p>
            </div>
            <div className="space-y-4 p-8 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
               <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-500/20 mb-6">
                  <i className="fas fa-chart-line"></i>
               </div>
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Escalabilidade</h3>
               <p className="text-slate-500 text-sm font-medium leading-relaxed">
                 De uma única loja a grandes holdings. Nosso sistema de multi-tenant permite gerenciar centenas de unidades com um único login.
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-24 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-xs font-black uppercase text-blue-600 tracking-[0.3em]">Investimento</h2>
            <p className="text-3xl font-black text-slate-900 uppercase">Planos que acompanham seu crescimento</p>
            <p className="text-slate-500 font-medium italic text-sm">Comece com uma operação, expanda conforme sua necessidade.</p>
          </div>

          <div className="overflow-x-auto pb-6">
            <table className="w-full min-w-[1000px] border-collapse bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-200">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-8 text-left text-xs font-black uppercase tracking-widest w-1/4">Recursos</th>
                  {plans.map(p => (
                    <th key={p.name} className={`p-8 text-center border-l border-slate-800 ${p.popular ? 'bg-blue-600' : ''}`}>
                      <p className="text-[10px] font-black opacity-70 mb-1">{p.name === 'FREE' ? 'Experimental' : 'Assinatura'}</p>
                      <p className="text-xl font-black mb-2">{p.name}</p>
                      <p className="text-2xl font-black">
                        {p.price !== 'Sob Consulta' ? `R$ ${p.price}` : p.price}
                        {p.price !== 'Sob Consulta' && <span className="text-[10px] opacity-60 ml-1">/mês</span>}
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-6 pl-8">Anúncios no Sistema</td>
                  {plans.map(p => <td key={p.name} className={`p-6 text-center border-l border-slate-100 ${p.ads === 'Sim' ? 'text-blue-600' : 'text-slate-400 font-normal'}`}>{p.ads}</td>)}
                </tr>
                <tr className="hover:bg-slate-50 transition-colors bg-slate-50/30">
                  <td className="p-6 pl-8">Operações Ativas <i className="fas fa-info-circle text-[10px] ml-1 text-slate-400" title="Loja, Restaurante, Obras ou Fábrica"></i></td>
                  {plans.map(p => <td key={p.name} className="p-6 text-center border-l border-slate-100 text-slate-900">{p.ops}</td>)}
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-6 pl-8">Unidades / Locais</td>
                  {plans.map(p => <td key={p.name} className="p-6 text-center border-l border-slate-100 text-slate-900">{p.units}</td>)}
                </tr>
                <tr className="hover:bg-slate-50 transition-colors bg-slate-50/30">
                  <td className="p-6 pl-8">Usuários Incluídos</td>
                  {plans.map(p => <td key={p.name} className="p-6 text-center border-l border-slate-100 text-slate-900">{p.users}</td>)}
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-6 pl-8">Limite de SKUs</td>
                  {plans.map(p => <td key={p.name} className="p-6 text-center border-l border-slate-100 text-slate-900">{p.skus}</td>)}
                </tr>
                <tr className="hover:bg-slate-50 transition-colors bg-slate-50/30">
                  <td className="p-6 pl-8">Movimentações / Mês</td>
                  {plans.map(p => <td key={p.name} className="p-6 text-center border-l border-slate-100 text-slate-900">{p.movs}</td>)}
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-6 pl-8">Armazenamento</td>
                  {plans.map(p => <td key={p.name} className="p-6 text-center border-l border-slate-100 text-slate-900">{p.storage}</td>)}
                </tr>
                <tr className="hover:bg-slate-50 transition-colors bg-slate-50/30">
                  <td className="p-6 pl-8">Relatórios</td>
                  {plans.map(p => <td key={p.name} className="p-6 text-center border-l border-slate-100 text-[10px] uppercase">{p.reports}</td>)}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
            <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-xl space-y-6">
               <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                 <i className="fas fa-puzzle-piece text-blue-600"></i> Add-ons Opcionais
               </h4>
               <p className="text-sm text-slate-500 font-medium">Aumente sua capacidade sem precisar trocar de plano obrigatoriamente.</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { l: 'PDV / Caixa Extra', p: 'R$ 39/mês' },
                    { l: 'Usuário Extra', p: 'R$ 12/mês' },
                    { l: 'Unidade/Loja Extra', p: 'R$ 29/mês' },
                    { l: '10 GB Armazenamento', p: 'R$ 39/mês' },
                    { l: 'Integração Delivery', p: 'R$ 79/mês' },
                    { l: 'Combo 3 Integrações', p: 'R$ 199/mês' },
                  ].map((add, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-600">{add.l}</span>
                      <span className="text-[10px] font-black text-blue-600">{add.p}</span>
                    </div>
                  ))}
               </div>
            </div>
            <div className="space-y-6 p-6">
               <h4 className="text-xl font-black text-slate-900">Regras de Produto</h4>
               <div className="space-y-4">
                 <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><i className="fas fa-rocket"></i></div>
                    <div><p className="font-black text-sm">Foco Inicial: Loja ou Restaurante</p><p className="text-xs text-slate-400 italic">No plano Free/Starter, você escolhe uma trilha operacional (PDV ou Mesas) e o core de estoque já vem incluído.</p></div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><i className="fas fa-shield-halved"></i></div>
                    <div><p className="font-black text-sm">Upgrade Inteligente (Soft Paywall)</p><p className="text-xs text-slate-400 italic">Te avisamos ao atingir 80% do limite. O bloqueio em 100% é apenas para novos registros, garantindo que você nunca perca acesso aos dados existentes.</p></div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><i className="fas fa-handshake"></i></div>
                    <div><p className="font-black text-sm">Sinergia Growth</p><p className="text-xs text-slate-400 italic">Ideal para o negócio híbrido. Controle sua cafeteria e sua loja de conveniência em uma única tela.</p></div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ideal Section - RESTORED & IMPROVED */}
      <section id="ideal" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
             <h2 className="text-xs font-black uppercase text-blue-600 tracking-[0.3em] mb-4">Público-Alvo</h2>
             <p className="text-3xl font-black text-slate-900 uppercase">A Solução Ideal para sua Jornada</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Varejo & Lojas', icon: 'fa-shopping-bag', color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Controle de frente de caixa, estoque por grade e integração com marketplaces.' },
              { title: 'Gastronomia', icon: 'fa-utensils', color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Gestão de mesas, comandas, fichas técnicas e insumos de alta rotatividade.' },
              { title: 'Engenharia', icon: 'fa-helmet-safety', color: 'text-orange-600', bg: 'bg-orange-50', desc: 'RMs de campo, transferências logísticas e gestão documental de obras complexas.' },
              { title: 'Fábricas', icon: 'fa-industry', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Planejamento de ordens de produção e controle de matérias-primas por lotes.' }
            ].map((item, idx) => (
              <div key={idx} className="p-8 border-2 border-slate-100 rounded-[32px] hover:border-blue-600 hover:shadow-xl transition-all duration-300 group">
                <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-4">{item.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
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
               <li><button onClick={() => scrollTo('planos')} className="text-slate-600 hover:text-white transition-colors">Planos & Preços</button></li>
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
