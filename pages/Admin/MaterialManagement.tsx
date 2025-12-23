
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useApp } from '../../contexts/AppContext';
import { Material, OperationType } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const MaterialManagement: React.FC = () => {
  const { notify } = useNotification();
  const { activeTenant } = useApp();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Material>>({ sku: '', name: '', unit: 'UN', category: 'Basico', minStock: 0, salePrice: 0 });
  
  // Estados de Filtro
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'ALL' | 'CRITICAL' | 'OK'>('ALL');

  const load = () => api.getMaterials().then(setMaterials);
  useEffect(() => { load(); }, []);

  const categories = useMemo(() => Array.from(new Set(materials.map(m => m.category))).sort(), [materials]);
  const unitsList = useMemo(() => Array.from(new Set(materials.map(m => m.unit))).sort(), [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesName = m.name.toLowerCase().includes(filterName.toLowerCase()) || m.sku.toLowerCase().includes(filterName.toLowerCase());
      const matchesCategory = !filterCategory || m.category === filterCategory;
      const matchesUnit = !filterUnit || m.unit === filterUnit;
      
      // Nota: A lógica de estoque aqui é simplificada pois o saldo real está no StockList, 
      // mas mantemos o gancho para futura integração.
      return matchesName && matchesCategory && matchesUnit;
    });
  }, [materials, filterName, filterCategory, filterUnit, filterStockStatus]);

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
        notify('Material atualizado!', 'success');
      } else {
        await api.createMaterial(form);
        notify('Material cadastrado!', 'success');
      }
      setShowModal(false);
      setEditingId(null);
      setForm({ sku: '', name: '', unit: 'UN', category: 'Basico', minStock: 0, salePrice: 0 });
      load();
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  const isStore = activeTenant?.operationType === OperationType.STORE;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header com Botão de Cadastro */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Catálogo de Materiais</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium uppercase tracking-widest">Gerencie os insumos padronizados da sua operação.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setForm({ sku: '', name: '', unit: 'UN', category: 'Basico', minStock: 0, salePrice: 0 }); setShowModal(true); }} 
          className="bg-slate-900 dark:bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> Cadastrar Material
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Procurar</label>
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              type="text" 
              placeholder="Nome ou Código..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Categoria</label>
          <select 
            className="w-full p-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Todas</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Unidade</label>
          <select 
            className="w-full p-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
          >
            <option value="">Todas</option>
            {unitsList.map(unit => <option key={unit} value={unit}>{unit}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => { setFilterName(''); setFilterCategory(''); setFilterUnit(''); }}
            className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all tracking-widest"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Tabela de Resultados */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-8 py-5">Código Produto</th>
                <th className="px-6 py-5">Nome</th>
                <th className="px-6 py-5">Categoria</th>
                <th className="px-6 py-5 text-center">Unidade</th>
                <th className="px-6 py-5 text-center">Estoque Mín.</th>
                {isStore && <th className="px-6 py-5 text-right">Preço Venda</th>}
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredMaterials.map(m => (
                <tr key={m.id} className="hover:bg-blue-50/20 dark:hover:bg-blue-500/5 transition-all text-sm group">
                  <td className="px-8 py-5 font-mono font-bold text-blue-600 dark:text-blue-400">{m.sku}</td>
                  <td className="px-6 py-5 font-black text-slate-900 dark:text-slate-100 uppercase">{m.name}</td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[9px] font-black uppercase border border-slate-200 dark:border-slate-700">
                      {m.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-slate-400 dark:text-slate-600 uppercase">{m.unit}</td>
                  <td className="px-6 py-5 text-center font-black text-slate-900 dark:text-slate-100">{m.minStock}</td>
                  {isStore && (
                    <td className="px-6 py-5 text-right font-black text-emerald-600 dark:text-emerald-400">
                      {m.salePrice ? formatCurrency(m.salePrice) : '---'}
                    </td>
                  )}
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => handleEdit(m)}
                      className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center active:scale-90"
                    >
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={isStore ? 7 : 6} className="py-24 text-center opacity-30 text-slate-400 dark:text-slate-600 italic font-black text-xs uppercase tracking-[0.4em]">
                    Nenhum item encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingId ? 'Editar Material' : 'Novo Material'}</h2>
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">Configuração do Catálogo</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Código / Ref</label>
                   <input className="w-full p-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="Ex: INS-001" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Unidade</label>
                   <input className="w-full p-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder="Ex: KG, UN, L" />
                </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Nome Comercial</label>
                 <input className="w-full p-4 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Arroz Branco T1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Categoria</label>
                   <select className="w-full p-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      <option value="Basico">Básico</option>
                      <option value="Bebidas">Bebidas</option>
                      <option value="Cereais e Grãos">Cereais e Grãos</option>
                      <option value="Carnes">Carnes</option>
                      <option value="Laticínios">Laticínios</option>
                      <option value="Legumes e Verduras">Legumes e Verduras</option>
                      <option value="Outros">Outros</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Estoque Mínimo</label>
                   <input type="number" className="w-full p-3 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={form.minStock} onChange={e => setForm({...form, minStock: Number(e.target.value)})} />
                </div>
              </div>
              
              {isStore && (
                <div className="space-y-1 pt-2">
                   <label className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest ml-1">Preço de Venda Sugerido (R$)</label>
                   <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-sm">R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full pl-12 p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl font-black text-sm text-emerald-700 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                        value={form.salePrice} 
                        onChange={e => setForm({...form, salePrice: Number(e.target.value)})} 
                      />
                   </div>
                </div>
              )}
            </div>
            <div className="p-10 bg-slate-50 dark:bg-slate-800/30 flex gap-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest hover:text-slate-900 dark:hover:text-white transition-all">Descartar</button>
              <button onClick={handleSave} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-2xl shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all">
                {editingId ? 'Salvar Alteração' : 'Finalizar Cadastro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
