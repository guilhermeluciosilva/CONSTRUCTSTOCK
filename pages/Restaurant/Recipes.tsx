
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Recipe, Material, Stock } from '../../types';

export const Recipes: React.FC = () => {
  const { currentScope } = useApp();
  const { notify } = useNotification();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showSimulate, setShowSimulate] = useState<Recipe | null>(null);
  const [simQty, setSimQty] = useState(1);
  const [searchTerms, setSearchTerms] = useState<Record<number, string>>({});
  const [openSearchIdx, setOpenSearchIdx] = useState<number | null>(null);
  
  const [form, setForm] = useState<Partial<Recipe>>({
    name: '', yieldQty: 1, yieldUnit: 'Porção', ingredients: []
  });

  const load = async () => {
    if (!currentScope?.tenantId || !currentScope?.unitId) return;
    
    const [rawRecipes, mats, currentStock] = await Promise.all([
      api.getRecipes(currentScope.tenantId, currentScope.unitId),
      api.getMaterials(),
      api.getStock(currentScope)
    ]);

    setRecipes(rawRecipes);
    setMaterials(mats.sort((a, b) => a.name.localeCompare(b.name)));
    setStocks(currentStock);
  };

  useEffect(() => { load(); }, [currentScope]);

  const handleSave = async () => {
    if (!form.name || (form.ingredients?.length || 0) === 0) return notify('Preencha o nome e adicione ingredientes.', 'warning');
    await api.saveRecipe({ ...form, tenantId: currentScope!.tenantId, unitId: currentScope!.unitId! });
    notify('Receita salva!', 'success');
    setShowModal(false);
    load();
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
    return materials.filter(m => 
      m.name.toLowerCase().includes(term.toLowerCase()) || 
      m.sku.toLowerCase().includes(term.toLowerCase())
    ).slice(0, 10);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Fichas Técnicas (Receitas)</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Decomposição de pratos e simulador de consumo de insumos.</p>
        </div>
        <button onClick={() => { setForm({ name: '', yieldQty: 1, yieldUnit: 'Porção', ingredients: [] }); setShowModal(true); setOpenSearchIdx(null); setSearchTerms({}); }} className="bg-slate-900 dark:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
          <i className="fas fa-plus"></i> Nova Receita
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-5">Receita</th>
                <th className="px-6 py-5">Rendimento</th>
                <th className="px-6 py-5 text-center">Ingredientes</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {recipes.map(r => (
                <tr key={r.id} className="hover:bg-blue-50/20 dark:hover:bg-blue-500/5 transition-all">
                  <td className="px-6 py-5 font-bold text-slate-800 dark:text-slate-100 uppercase">{r.name}</td>
                  <td className="px-6 py-5 text-slate-500 dark:text-slate-400 font-medium">{r.yieldQty} {r.yieldUnit}</td>
                  <td className="px-6 py-5 text-center"><span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg font-black text-[10px] uppercase border border-blue-100 dark:border-blue-500/20">{r.ingredients.length} itens</span></td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button onClick={() => setShowSimulate(r)} className="text-emerald-600 dark:text-emerald-400 hover:underline font-black text-[10px] uppercase mr-3">Simular</button>
                    <button onClick={() => { setForm(r); setShowModal(true); setOpenSearchIdx(null); setSearchTerms({}); }} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-blue-600 hover:text-white transition-all active:scale-90"><i className="fas fa-edit"></i></button>
                    <button onClick={async () => { if(confirm('Excluir?')){ await api.deleteRecipe(r.id); load(); } }} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-rose-600 hover:text-white transition-all active:scale-90"><i className="fas fa-trash-alt"></i></button>
                  </td>
                </tr>
              ))}
              {recipes.length === 0 && (
                <tr><td colSpan={4} className="py-24 text-center opacity-30 text-slate-400 dark:text-slate-600 italic font-black text-xs uppercase tracking-widest">Nenhuma ficha cadastrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Ficha Técnica</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Nome da Receita</label>
                <input className="w-full p-3 bg-gray-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Massa de Pizza" /></div>
                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Rendimento</label>
                   <input type="number" className="w-full p-3 bg-gray-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.yieldQty} onChange={e => setForm({...form, yieldQty: Number(e.target.value)})} /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Unidade</label>
                   <input className="w-full p-3 bg-gray-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.yieldUnit} onChange={e => setForm({...form, yieldUnit: e.target.value})} /></div>
                </div>
              </div>
              <div className="space-y-3 pb-40">
                 <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-widest">Ingredientes do Estoque</h3>
                    <button onClick={addIngredient} className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase hover:underline">+ Adicionar Insumo</button>
                 </div>
                 {form.ingredients?.map((ing, idx) => {
                    const materialSelected = materials.find(m => m.id === ing.materialId);
                    const currentSearch = searchTerms[idx] || (materialSelected ? materialSelected.name : '');
                    const filteredOptions = getFilteredMaterials(currentSearch);

                    return (
                      <div key={idx} className="flex gap-4 items-center animate-in slide-in-from-right-2 relative">
                         <div className="flex-1 relative">
                            <input 
                              className="w-full p-4 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-text" 
                              placeholder="Digite para procurar..."
                              value={currentSearch}
                              onFocus={() => setOpenSearchIdx(idx)}
                              onChange={e => {
                                setSearchTerms({ ...searchTerms, [idx]: e.target.value });
                                setOpenSearchIdx(idx);
                              }}
                            />
                            
                            {openSearchIdx === idx && (
                                <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[200] mt-2 overflow-hidden animate-in fade-in zoom-in-95">
                                  <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {filteredOptions.map(m => (
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
                                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{m.sku}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{m.unit}</span>
                                      </button>
                                    ))}
                                    {filteredOptions.length === 0 && (
                                      <div className="p-8 text-center opacity-40 font-bold text-[10px] uppercase tracking-widest text-slate-400">Não encontrado</div>
                                    )}
                                  </div>
                                </div>
                              )}
                         </div>
                         <div className="w-32 relative">
                           <input 
                             type="number" 
                             step="0.01" 
                             className="w-full p-4 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl text-center font-black text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500" 
                             value={ing.qty} 
                             onChange={e => updateIngredient(idx, 'qty', Number(e.target.value))} 
                           />
                           <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <span className="text-[8px] font-black text-slate-400 uppercase">
                                 {materialSelected?.unit || ''}
                              </span>
                           </div>
                         </div>
                         <button onClick={() => setForm({...form, ingredients: form.ingredients?.filter((_, i) => i !== idx)})} className="w-12 h-12 flex items-center justify-center bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"><i className="fas fa-trash-alt text-sm"></i></button>
                      </div>
                    );
                 })}
                 {form.ingredients?.length === 0 && (
                   <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl opacity-40">
                      <i className="fas fa-boxes mb-2 block text-slate-400 text-2xl"></i>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Sua receita ainda não possui ingredientes</p>
                   </div>
                 )}
              </div>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-800/30 flex gap-4 border-t border-slate-200 dark:border-slate-800 relative z-[10]">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest hover:text-slate-900 dark:hover:text-white transition-all">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700">Salvar Ficha Técnica</button>
            </div>
          </div>
        </div>
      )}

      {showSimulate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 flex justify-between items-center text-emerald-900 dark:text-emerald-400">
               <div><h2 className="text-xl font-black uppercase tracking-tight">Simulador de Produção</h2><p className="text-xs font-bold opacity-70">{showSimulate.name}</p></div>
               <button onClick={() => setShowSimulate(null)} className="text-emerald-800 dark:text-emerald-400"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Volume de Produção</span>
                  <div className="flex items-center gap-4">
                     <button onClick={() => setSimQty(Math.max(1, simQty-1))} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-black text-slate-900 dark:text-white transition-all active:scale-90 shadow-sm">-</button>
                     <span className="text-3xl font-black w-10 text-center text-slate-900 dark:text-white">{simQty}</span>
                     <button onClick={() => setSimQty(simQty+1)} className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-500 text-white font-black transition-all active:scale-90 shadow-lg shadow-blue-500/20">+</button>
                     <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{showSimulate.yieldUnit}s</span>
                  </div>
               </div>
               <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 border-b border-slate-100 dark:border-slate-800 pb-2 tracking-widest">Necessidade de Insumos</h3>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {showSimulate.ingredients.map((ing, i) => {
                      const mat = materials.find(m => m.id === ing.materialId);
                      const stock = stocks.find(s => s.materialId === ing.materialId)?.quantity || 0;
                      const needed = (ing.qty / showSimulate.yieldQty) * simQty;
                      const isMissing = stock < needed;
                      return (
                        <div key={i} className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${isMissing ? 'bg-rose-50/5 border-rose-500/20' : 'bg-white dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 shadow-sm'}`}>
                           <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase truncate">{mat?.name}</p>
                              <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-600">Disponível: {stock} {mat?.unit}</p>
                           </div>
                           <div className="text-right whitespace-nowrap ml-4">
                              <p className="text-sm font-black text-slate-800 dark:text-white">{needed.toFixed(2)} {mat?.unit}</p>
                              {isMissing && <p className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase animate-pulse">Falta {(needed - stock).toFixed(2)}</p>}
                           </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-800/30 text-center border-t border-slate-200 dark:border-slate-800">
               <button onClick={() => setShowSimulate(null)} className="px-12 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all">Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
