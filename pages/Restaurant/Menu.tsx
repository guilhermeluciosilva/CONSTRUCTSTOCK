
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { MenuItem, Material, Stock } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const Menu: React.FC = () => {
  const { currentScope } = useApp();
  const { notify } = useNotification();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerms, setSearchTerms] = useState<Record<number, string>>({});
  const [openSearchIdx, setOpenSearchIdx] = useState<number | null>(null);
  
  // Novo estado para filtrar por estoque
  const [onlyInStock, setOnlyInStock] = useState(false);

  const [form, setForm] = useState<Partial<MenuItem>>({
    name: '', category: '', price: 0, isActive: true, 
    ingredients: [], yieldQty: 1, yieldUnit: 'Porção'
  });

  const load = async () => {
    if (!currentScope?.tenantId || !currentScope?.unitId) return;
    
    const [mats, menuItems, currentStock] = await Promise.all([
      api.getMaterials(),
      api.getMenuItems(currentScope.tenantId, currentScope.unitId),
      api.getStock(currentScope)
    ]);

    setMaterials(mats.sort((a, b) => a.name.localeCompare(b.name)));
    setItems(menuItems);
    setStocks(currentStock);
  };

  useEffect(() => { load(); }, [currentScope]);

  const handleSave = async () => {
    if (!form.name || !form.price) return notify('Nome e Preço obrigatórios.', 'warning');
    if ((form.ingredients?.length || 0) === 0) return notify('Adicione pelo menos um insumo na Ficha Técnica.', 'warning');

    await api.saveMenuItem({ ...form, tenantId: currentScope!.tenantId, unitId: currentScope!.unitId! });
    notify(form.id ? 'Item atualizado!' : 'Item e Ficha criados!', 'success');
    setShowModal(false);
    load();
  };

  const togglePause = async (item: MenuItem) => {
    const updated = { ...item, isActive: !item.isActive };
    await api.saveMenuItem(updated);
    load();
    notify(updated.isActive ? 'Item ativado no cardápio!' : 'Item pausado com sucesso.', updated.isActive ? 'success' : 'info');
  };

  const addIngredient = () => {
    setForm({ ...form, ingredients: [...(form.ingredients || []), { materialId: '', qty: 1 }] });
  };

  const updateIngredient = (idx: number, field: 'materialId' | 'qty', value: any) => {
    const newIngs = [...(form.ingredients || [])];
    newIngs[idx] = { ...newIngs[idx], [field]: value };
    setForm({ ...form, ingredients: newIngs });
  };

  const getFilteredMaterials = (term: string) => {
    let filtered = materials;
    
    if (onlyInStock) {
      filtered = filtered.filter(m => {
        const stock = stocks.find(s => s.materialId === m.id);
        return stock && stock.quantity > 0;
      });
    }

    return filtered.filter(m => 
      m.name.toLowerCase().includes(term.toLowerCase()) || 
      m.sku.toLowerCase().includes(term.toLowerCase())
    ).slice(0, 15);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Cardápio & Fichas Técnicas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest">Defina preços e consumo de insumos por prato/bebida.</p>
        </div>
        <button onClick={() => { setForm({ name: '', category: '', price: 0, isActive: true, ingredients: [], yieldQty: 1, yieldUnit: 'Porção' }); setShowModal(true); setOpenSearchIdx(null); setSearchTerms({}); setOnlyInStock(false); }} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">Novo Item</button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-8 py-6">Item de Venda</th>
                <th className="px-6 py-6">Categoria</th>
                <th className="px-6 py-6 text-center">Ficha Técnica</th>
                <th className="px-6 py-6 text-right">Preço</th>
                <th className="px-8 py-6 text-right">Status / Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {items.map(it => (
                <tr key={it.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all ${!it.isActive ? 'opacity-50 grayscale' : ''}`}>
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900 dark:text-white text-base uppercase">{it.name}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase mt-1">Rendimento: {it.yieldQty} {it.yieldUnit}</p>
                  </td>
                  <td className="px-6 py-6">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">{it.category}</span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase border-b-2 border-blue-100 dark:border-blue-900/50">{it.ingredients.length} Insumos</span>
                  </td>
                  <td className="px-6 py-6 text-right font-black text-slate-900 dark:text-white text-lg">{formatCurrency(it.price)}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3 items-center">
                       <button 
                         onClick={() => togglePause(it)}
                         className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${it.isActive ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}
                         title={it.isActive ? 'Pausar Item' : 'Ativar Item'}
                       >
                         <i className={`fas ${it.isActive ? 'fa-pause' : 'fa-play'} text-xs`}></i>
                       </button>
                       <button 
                         onClick={() => { setForm(it); setShowModal(true); setOpenSearchIdx(null); setSearchTerms({}); }}
                         className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"
                       >
                         <i className="fas fa-edit text-xs"></i>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} className="py-24 text-center text-slate-300 dark:text-slate-600 font-black uppercase text-xs tracking-[0.4em] opacity-40 italic">Nenhum item cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{form.id ? 'Editar Ficha' : 'Novo Item & Ficha'}</h2>
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">Configuração Comercial e Técnica</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">01. Informações de Venda</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-2">
                       <label className="text-[9px] font-black uppercase text-slate-400">Nome do Prato/Bebida</label>
                       <input className="w-full p-4 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Burger Bacon" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400">Categoria</label>
                       <input className="w-full p-4 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Ex: Grelhados" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400 text-emerald-600">Preço Venda (R$)</label>
                       <input type="number" step="0.01" className="w-full p-4 bg-emerald-50/20 dark:bg-[#020617] border border-emerald-100 dark:border-emerald-900/30 rounded-2xl font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} />
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest">02. Ficha Técnica (Insumos)</h3>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                           <input 
                             type="checkbox" 
                             className="hidden" 
                             checked={onlyInStock} 
                             onChange={() => setOnlyInStock(!onlyInStock)} 
                           />
                           <div className={`w-8 h-4 rounded-full transition-colors relative ${onlyInStock ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                              <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${onlyInStock ? 'translate-x-4' : ''}`}></div>
                           </div>
                           <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-blue-500 transition-colors">Somente em Estoque</span>
                        </label>
                        <button onClick={addIngredient} className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase hover:underline">+ Adicionar Insumo</button>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400">Rendimento Base</label>
                       <input type="number" className="w-full p-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.yieldQty} onChange={e => setForm({...form, yieldQty: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400">Unidade de Medida</label>
                       <input className="w-full p-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.yieldUnit} onChange={e => setForm({...form, yieldUnit: e.target.value})} placeholder="Ex: Un, Porção" />
                    </div>
                 </div>

                 <div className="space-y-3 pb-40">
                    {form.ingredients?.map((ing, idx) => {
                      const materialSelected = materials.find(m => m.id === ing.materialId);
                      const currentSearch = searchTerms[idx] || (materialSelected ? materialSelected.name : '');
                      const filteredOptions = getFilteredMaterials(currentSearch);

                      return (
                        <div key={idx} className="flex gap-3 items-center animate-in slide-in-from-right-2 relative">
                           <div className="flex-1 relative">
                              <input 
                                className="w-full p-4 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-text" 
                                placeholder="Digite para procurar insumo..."
                                value={currentSearch}
                                onFocus={() => setOpenSearchIdx(idx)}
                                onChange={e => {
                                  setSearchTerms({ ...searchTerms, [idx]: e.target.value });
                                  setOpenSearchIdx(idx);
                                }}
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                 <i className="fas fa-search text-[10px]"></i>
                              </div>

                              {/* Dropdown de Busca */}
                              {openSearchIdx === idx && (
                                <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[200] mt-2 overflow-hidden animate-in fade-in zoom-in-95">
                                  <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                    {filteredOptions.map(m => {
                                      const stock = stocks.find(s => s.materialId === m.id)?.quantity || 0;
                                      return (
                                        <button 
                                          key={m.id}
                                          onClick={() => {
                                            updateIngredient(idx, 'materialId', m.id);
                                            setSearchTerms({ ...searchTerms, [idx]: m.name });
                                            setOpenSearchIdx(null);
                                          }}
                                          className="w-full p-4 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-slate-100 dark:border-slate-800 last:border-0 flex justify-between items-center group"
                                        >
                                          <div>
                                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase group-hover:text-blue-600 transition-colors">{m.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{m.sku} • {m.category}</p>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-[10px] font-black text-slate-400 uppercase block">{m.unit}</span>
                                            <span className={`text-[8px] font-black uppercase ${stock > 0 ? 'text-emerald-500' : 'text-rose-400'}`}>Sald: {stock.toFixed(2)}</span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                    {filteredOptions.length === 0 && (
                                      <div className="p-8 text-center opacity-40 font-bold text-[10px] uppercase tracking-widest text-slate-400">
                                        {onlyInStock ? 'Nenhum insumo com saldo positivo' : 'Nenhum insumo encontrado'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                           </div>
                           <div className="w-32 relative">
                              <input 
                                type="number" 
                                step="0.001" 
                                className="w-full p-4 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl text-center font-black text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500" 
                                value={ing.qty} 
                                onChange={e => updateIngredient(idx, 'qty', Number(e.target.value))} 
                                placeholder="Qtd"
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">
                                    {materialSelected?.unit || ''}
                                 </span>
                              </div>
                           </div>
                           <button onClick={() => setForm({...form, ingredients: form.ingredients?.filter((_, i) => i !== idx)})} className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center active:scale-90"><i className="fas fa-trash-alt text-sm"></i></button>
                        </div>
                      );
                    })}
                    {form.ingredients?.length === 0 && (
                       <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl opacity-40">
                          <i className="fas fa-utensils mb-2 block text-slate-400 text-2xl"></i>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nenhum ingrediente na ficha técnica</p>
                       </div>
                    )}
                 </div>
              </div>
            </div>

            <div className="p-10 bg-slate-50 dark:bg-slate-800/30 flex gap-4 border-t border-slate-200 dark:border-slate-800 relative z-[10]">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest hover:text-slate-900 dark:hover:text-white transition-all">Cancelar</button>
              <button onClick={handleSave} className="flex-[2] py-4 bg-blue-600 text-white rounded-[24px] font-black text-[10px] uppercase shadow-2xl shadow-blue-500/30 active:scale-95 transition-all hover:bg-blue-700">Salvar Item & Ficha Técnica</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
