
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useApp } from '../../contexts/AppContext';
import { Material, OperationType } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const Insumos: React.FC = () => {
  const { notify } = useNotification();
  const { activeTenant } = useApp();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Material>>({ sku: '', name: '', unit: 'UN', category: 'Insumos', minStock: 0, salePrice: 0 });
  
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const load = () => api.getMaterials().then(setMaterials);
  useEffect(() => { load(); }, []);

  // Categorias focadas em Restaurante
  const restaurantCategories = [
    'Insumos (Cozinha)', 
    'Bebidas', 
    'Produtos de Limpeza', 
    'Hortifruti', 
    'Proteínas / Carnes',
    'Embalagens',
    'Outros'
  ];

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesName = m.name.toLowerCase().includes(filterName.toLowerCase()) || m.sku.toLowerCase().includes(filterName.toLowerCase());
      const matchesCategory = !filterCategory || m.category === filterCategory;
      return matchesName && matchesCategory;
    });
  }, [materials, filterName, filterCategory]);

  const handleEdit = (m: Material) => {
    setEditingId(m.id);
    setForm({ ...m });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.sku || !form.name) return notify('Preencha Código e Nome', 'warning');
    
    try {
      if (editingId) {
        await api.updateMaterial(editingId, form);
        notify('Item atualizado no catálogo!', 'success');
      } else {
        await api.createMaterial(form);
        notify('Novo item cadastrado!', 'success');
      }
      setShowModal(false);
      setEditingId(null);
      load();
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Catálogo de Insumos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium uppercase tracking-widest">Gestão de Bebidas, Alimentos e Materiais de Apoio.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setForm({ sku: '', name: '', unit: 'UN', category: 'Insumos (Cozinha)', minStock: 0, salePrice: 0 }); setShowModal(true); }} 
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> Novo Item
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Buscar por Nome ou SKU</label>
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input 
              type="text" 
              className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Filtrar Categoria</label>
          <select 
            className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-900 dark:text-white outline-none"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">Todas as Categorias</option>
            {restaurantCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <button onClick={() => {setFilterName(''); setFilterCategory('');}} className="text-[10px] font-black text-slate-400 uppercase hover:text-blue-600 transition-colors pb-4">Limpar Filtros</button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-8 py-5">Código</th>
              <th className="px-6 py-5">Nome do Item</th>
              <th className="px-6 py-5">Categoria</th>
              <th className="px-6 py-5 text-center">Unidade</th>
              <th className="px-6 py-5 text-center">Estoque Mín.</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {filteredMaterials.map(m => (
              <tr key={m.id} className="hover:bg-blue-50/20 dark:hover:bg-blue-500/5 transition-all text-sm group">
                <td className="px-8 py-5 font-mono font-bold text-blue-600 dark:text-blue-400">{m.sku}</td>
                <td className="px-6 py-5 font-black text-slate-900 dark:text-white uppercase">{m.name}</td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                    m.category === 'Bebidas' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    m.category === 'Produtos de Limpeza' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                    'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {m.category}
                  </span>
                </td>
                <td className="px-6 py-5 text-center font-bold text-slate-400 uppercase">{m.unit}</td>
                <td className="px-6 py-5 text-center font-black">{m.minStock}</td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => handleEdit(m)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"><i className="fas fa-edit text-xs"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingId ? 'Editar Cadastro' : 'Novo Cadastro'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Código / SKU</label>
                   <input className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="Ex: BEB-001" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Unidade</label>
                   <input className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder="Ex: UN, KG, LT" />
                </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Descrição do Item</label>
                 <input className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Coca-Cola Lata 350ml" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Categoria</label>
                   <select className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      {restaurantCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Estoque Crítico</label>
                   <input type="number" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.minStock} onChange={e => setForm({...form, minStock: Number(e.target.value)})} />
                </div>
              </div>
            </div>
            <div className="p-10 bg-slate-50 dark:bg-slate-800/30 flex gap-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-900">Descartar</button>
              <button onClick={handleSave} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-2xl active:scale-95 transition-all">Salvar Cadastro</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
