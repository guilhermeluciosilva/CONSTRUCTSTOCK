
import React, { useEffect, useState } from 'react';
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

  const load = () => api.getMaterials().then(setMaterials);
  useEffect(() => { load(); }, []);

  const handleEdit = (m: Material) => {
    setEditingId(m.id);
    setForm({ ...m });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.sku || !form.name) return notify('Preencha SKU e Nome', 'warning');
    
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight tracking-tight uppercase">Catálogo de Materiais</h1>
          <p className="text-gray-500 text-sm italic">Defina os itens padronizados que podem ser requisitados ou vendidos.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setForm({ sku: '', name: '', unit: 'UN', category: 'Basico', minStock: 0, salePrice: 0 }); setShowModal(true); }} 
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg shadow-slate-200 active:scale-95 transition-all"
        >
          <i className="fas fa-plus mr-2"></i> Cadastrar Material
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="px-8 py-5">SKU</th>
              <th className="px-6 py-5">Nome</th>
              <th className="px-6 py-5">Categoria</th>
              <th className="px-6 py-5 text-center">Unidade</th>
              <th className="px-6 py-5 text-center">Estoque Mín.</th>
              {isStore && <th className="px-6 py-5 text-right">Preço de Venda</th>}
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {materials.map(m => (
              <tr key={m.id} className="hover:bg-blue-50/20 transition-all text-sm group">
                <td className="px-8 py-5 font-mono font-bold text-blue-600">{m.sku}</td>
                <td className="px-6 py-5 font-bold text-slate-800">{m.name}</td>
                <td className="px-6 py-5">
                   <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase">{m.category}</span>
                </td>
                <td className="px-6 py-5 text-center font-bold text-slate-400">{m.unit}</td>
                <td className="px-6 py-5 text-center font-black text-slate-800">{m.minStock}</td>
                {isStore && (
                  <td className="px-6 py-5 text-right font-black text-emerald-600">
                    {m.salePrice ? formatCurrency(m.salePrice) : '---'}
                  </td>
                )}
                <td className="px-8 py-5 text-right">
                   <button 
                    onClick={() => handleEdit(m)}
                    className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center active:scale-90"
                   >
                     <i className="fas fa-edit"></i>
                   </button>
                </td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td colSpan={isStore ? 7 : 6} className="py-20 text-center text-slate-300 italic">Nenhum material cadastrado no catálogo.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">{editingId ? 'Editar Material' : 'Novo Material'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">SKU / Código</label>
                   <input className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidade Medida</label>
                   <input className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder="Ex: UN, KG, SC" />
                </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome Comercial</label>
                 <input className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Categoria</label>
                   <select className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      <option value="Basico">Básico</option>
                      <option value="Estrutura">Estrutura</option>
                      <option value="Acabamento">Acabamento</option>
                      <option value="Hidraulica">Hidráulica</option>
                      <option value="Eletrica">Elétrica</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Estoque Mínimo</label>
                   <input type="number" className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.minStock} onChange={e => setForm({...form, minStock: Number(e.target.value)})} />
                </div>
              </div>
              
              {isStore && (
                <div className="space-y-1 pt-2 animate-in slide-in-from-top-2">
                   <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Preço de Venda (R$)</label>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-sm">R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full pl-10 p-3 bg-emerald-50 border border-emerald-100 rounded-xl font-black text-sm text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500" 
                        value={form.salePrice} 
                        onChange={e => setForm({...form, salePrice: Number(e.target.value)})} 
                      />
                   </div>
                   <p className="text-[9px] text-slate-400 font-medium italic mt-1">Este valor será sugerido automaticamente no checkout do PDV.</p>
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-colors tracking-widest">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
                {editingId ? 'Confirmar Alteração' : 'Finalizar Cadastro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
