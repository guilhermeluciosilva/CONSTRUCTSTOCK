
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { MenuItem, Recipe, Material } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const Menu: React.FC = () => {
  const { currentScope } = useApp();
  const { notify } = useNotification();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<MenuItem>>({
    name: '', category: '', price: 0, isActive: true, linkType: 'MATERIAL_DIRECT'
  });

  const load = async () => {
    if (!currentScope?.tenantId || !currentScope?.unitId) return;
    setItems(await api.getMenuItems(currentScope.tenantId, currentScope.unitId));
    setRecipes(await api.getRecipes(currentScope.tenantId, currentScope.unitId));
    setMaterials(await api.getMaterials());
  };

  useEffect(() => { load(); }, [currentScope]);

  const handleSave = async () => {
    if (!form.name || !form.price) return notify('Nome e Preço obrigatórios.', 'warning');
    if (form.linkType === 'RECIPE' && !form.recipeId) return notify('Vincule uma receita.', 'warning');
    if (form.linkType === 'MATERIAL_DIRECT' && !form.materialId) return notify('Vincule um material.', 'warning');

    await api.saveMenuItem({ ...form, tenantId: currentScope!.tenantId, unitId: currentScope!.unitId! });
    notify('Cardápio atualizado!', 'success');
    setShowModal(false);
    load();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-black text-slate-800 tracking-tight">Cardápio de Vendas</h1><p className="text-gray-500 text-sm">Configure os itens que serão vendidos e seus vínculos de estoque.</p></div>
        <button onClick={() => { setForm({ name: '', category: '', price: 0, isActive: true, linkType: 'MATERIAL_DIRECT' }); setShowModal(true); }} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg">Novo Item</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
            <tr><th className="px-6 py-4">Item</th><th className="px-6 py-4">Categoria</th><th className="px-6 py-4">Vínculo Técnico</th><th className="px-6 py-4 text-right">Preço</th><th className="px-8 py-4 text-right">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map(it => (
              <tr key={it.id} className="hover:bg-blue-50/20 transition-all cursor-pointer" onClick={() => { setForm(it); setShowModal(true); }}>
                <td className="px-6 py-5 font-bold text-slate-800 uppercase">{it.name}</td>
                <td className="px-6 py-5 text-slate-500">{it.category}</td>
                <td className="px-6 py-5">
                   {it.linkType === 'RECIPE' ? (
                     <span className="text-[9px] font-black bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100 uppercase">Receita: {recipes.find(r => r.id === it.recipeId)?.name}</span>
                   ) : (
                     <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 uppercase">Material: {it.directQty} {materials.find(m => m.id === it.materialId)?.unit}</span>
                   )}
                </td>
                <td className="px-6 py-5 text-right font-black text-slate-900">{formatCurrency(it.price)}</td>
                <td className="px-8 py-5 text-right"><span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${it.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{it.isActive ? 'Ativo' : 'Inativo'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">{form.id ? 'Editar Item' : 'Novo Item Cardápio'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Nome no Cardápio</label>
                <input className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Categoria</label>
                   <input className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Ex: Bebidas, Sobremesas" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Preço Venda (R$)</label>
                   <input type="number" className="w-full p-3 bg-gray-50 border rounded-xl font-black text-sm" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} /></div>
                </div>

                <div className="space-y-1 pt-4 border-t"><label className="text-[10px] font-black uppercase text-slate-400">Tipo de Abatimento no Estoque</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                   <button onClick={() => setForm({...form, linkType: 'RECIPE'})} className={`p-4 rounded-2xl border text-center transition-all ${form.linkType === 'RECIPE' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-100 opacity-60'}`}><i className="fas fa-utensils mb-2 block"></i><span className="text-[10px] font-black uppercase">Receita Complexa</span></button>
                   <button onClick={() => setForm({...form, linkType: 'MATERIAL_DIRECT'})} className={`p-4 rounded-2xl border text-center transition-all ${form.linkType === 'MATERIAL_DIRECT' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-100 opacity-60'}`}><i className="fas fa-cube mb-2 block"></i><span className="text-[10px] font-black uppercase">Material Direto</span></button>
                </div></div>

                {form.linkType === 'RECIPE' && (
                  <div className="space-y-1 animate-in zoom-in-95"><label className="text-[10px] font-black uppercase text-slate-400">Selecionar Ficha Técnica</label>
                  <select className="w-full p-3 bg-white border rounded-xl font-bold text-sm" value={form.recipeId} onChange={e => setForm({...form, recipeId: e.target.value})}>
                     <option value="">Escolha uma receita...</option>
                     {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select></div>
                )}

                {form.linkType === 'MATERIAL_DIRECT' && (
                  <div className="grid grid-cols-3 gap-2 animate-in zoom-in-95">
                    <div className="col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Material</label>
                    <select className="w-full p-3 bg-white border rounded-xl font-bold text-sm" value={form.materialId} onChange={e => setForm({...form, materialId: e.target.value})}>
                       <option value="">Escolha...</option>
                       {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Qtd.</label>
                    <input type="number" className="w-full p-3 bg-white border rounded-xl font-black text-sm" value={form.directQty} onChange={e => setForm({...form, directQty: Number(e.target.value)})} /></div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-xs font-black uppercase text-slate-400">Descartar</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-lg">Confirmar Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
