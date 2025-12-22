
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
  
  const [form, setForm] = useState<Partial<Recipe>>({
    name: '', yieldQty: 1, yieldUnit: 'Porção', ingredients: []
  });

  const load = async () => {
    if (!currentScope?.tenantId || !currentScope?.unitId) return;
    setRecipes(await api.getRecipes(currentScope.tenantId, currentScope.unitId));
    setMaterials(await api.getMaterials());
    setStocks(await api.getStock(currentScope));
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Fichas Técnicas (Receitas)</h1>
          <p className="text-gray-500 text-sm italic">Decomposição de pratos e simulador de consumo de insumos.</p>
        </div>
        <button onClick={() => { setForm({ name: '', yieldQty: 1, yieldUnit: 'Porção', ingredients: [] }); setShowModal(true); }} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
          <i className="fas fa-plus"></i> Nova Receita
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="px-6 py-4">Receita</th>
              <th className="px-6 py-4">Rendimento</th>
              <th className="px-6 py-4 text-center">Ingredientes</th>
              <th className="px-8 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {recipes.map(r => (
              <tr key={r.id} className="hover:bg-blue-50/20 transition-all">
                <td className="px-6 py-5 font-bold text-slate-800 uppercase">{r.name}</td>
                <td className="px-6 py-5 text-slate-500 font-medium">{r.yieldQty} {r.yieldUnit}</td>
                <td className="px-6 py-5 text-center"><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-black text-[10px]">{r.ingredients.length} itens</span></td>
                <td className="px-8 py-5 text-right space-x-2">
                  <button onClick={() => setShowSimulate(r)} className="text-emerald-600 hover:underline font-black text-[10px] uppercase">Simular</button>
                  <button onClick={() => { setForm(r); setShowModal(true); }} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white transition-all"><i className="fas fa-edit"></i></button>
                  <button onClick={async () => { if(confirm('Excluir?')){ await api.deleteRecipe(r.id); load(); } }} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white transition-all"><i className="fas fa-trash-alt"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">Ficha Técnica</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Nome da Receita</label>
                <input className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Rendimento</label>
                   <input type="number" className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={form.yieldQty} onChange={e => setForm({...form, yieldQty: Number(e.target.value)})} /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Unidade</label>
                   <input className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={form.yieldUnit} onChange={e => setForm({...form, yieldUnit: e.target.value})} /></div>
                </div>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center border-b pb-2"><h3 className="text-[10px] font-black uppercase text-slate-800">Ingredientes do Estoque</h3>
                 <button onClick={addIngredient} className="text-blue-600 font-black text-[10px] uppercase">+ Adicionar</button></div>
                 {form.ingredients?.map((ing, idx) => (
                   <div key={idx} className="flex gap-4 items-center animate-in slide-in-from-right-2">
                      <select className="flex-1 p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={ing.materialId} onChange={e => { const n = [...form.ingredients!]; n[idx].materialId = e.target.value; setForm({...form, ingredients: n}); }}>
                        <option value="">Selecione Material...</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                      </select>
                      <input type="number" step="0.01" className="w-24 p-3 bg-gray-50 border rounded-xl text-center font-black" value={ing.qty} onChange={e => { const n = [...form.ingredients!]; n[idx].qty = Number(e.target.value); setForm({...form, ingredients: n}); }} />
                      <button onClick={() => setForm({...form, ingredients: form.ingredients?.filter((_, i) => i !== idx)})} className="text-rose-400"><i className="fas fa-trash-alt"></i></button>
                   </div>
                 ))}
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-xs font-black uppercase text-slate-400">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-lg">Salvar Ficha</button>
            </div>
          </div>
        </div>
      )}

      {showSimulate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b bg-emerald-50 flex justify-between items-center text-emerald-900">
               <div><h2 className="text-xl font-black uppercase">Simulador de Produção</h2><p className="text-xs font-bold">{showSimulate.name}</p></div>
               <button onClick={() => setShowSimulate(null)} className="text-emerald-800"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-400">Quantidade Desejada</span>
                  <div className="flex items-center gap-3">
                     <button onClick={() => setSimQty(Math.max(1, simQty-1))} className="w-8 h-8 rounded-lg bg-white border font-bold">-</button>
                     <span className="text-xl font-black w-10 text-center">{simQty}</span>
                     <button onClick={() => setSimQty(simQty+1)} className="w-8 h-8 rounded-lg bg-white border font-bold">+</button>
                     <span className="text-[10px] font-black uppercase text-slate-400">{showSimulate.yieldUnit}s</span>
                  </div>
               </div>
               <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 border-b pb-2">Necessidade de Insumos</h3>
                  {showSimulate.ingredients.map((ing, i) => {
                    const mat = materials.find(m => m.id === ing.materialId);
                    const stock = stocks.find(s => s.materialId === ing.materialId)?.quantity || 0;
                    const needed = (ing.qty / showSimulate.yieldQty) * simQty;
                    const isMissing = stock < needed;
                    return (
                      <div key={i} className={`p-4 rounded-xl border flex justify-between items-center ${isMissing ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
                         <div><p className="text-sm font-bold text-slate-800">{mat?.name}</p><p className="text-[9px] font-black uppercase text-slate-400">Estoque Atual: {stock} {mat?.unit}</p></div>
                         <div className="text-right">
                            <p className="text-sm font-black text-slate-800">{needed.toFixed(2)} {mat?.unit}</p>
                            {isMissing && <p className="text-[9px] font-black text-rose-500 uppercase animate-pulse">Falta {(needed - stock).toFixed(2)}</p>}
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>
            <div className="p-8 bg-slate-50 text-center">
               <button onClick={() => setShowSimulate(null)} className="px-10 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs">Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
