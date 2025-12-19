
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { Material } from '../../types';

export const MaterialManagement: React.FC = () => {
  const { notify } = useNotification();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<Material>>({ sku: '', name: '', unit: 'UN', category: 'Basico', minStock: 0 });

  const load = () => api.getMaterials().then(setMaterials);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.sku || !form.name) return notify('Preencha SKU e Nome', 'warning');
    await api.createMaterial(form);
    notify('Material cadastrado!', 'success');
    setShowModal(false);
    setForm({ sku: '', name: '', unit: 'UN', category: 'Basico', minStock: 0 });
    load();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Catálogo de Materiais</h1>
          <p className="text-gray-500 text-sm">Defina os itens padronizados que podem ser requisitados pelas obras.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg">
          Cadastrar Material
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {materials.map(m => (
              <tr key={m.id} className="hover:bg-blue-50/20 transition-all text-sm">
                <td className="px-8 py-5 font-mono font-bold text-blue-600">{m.sku}</td>
                <td className="px-6 py-5 font-bold text-slate-800">{m.name}</td>
                <td className="px-6 py-5">
                   <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase">{m.category}</span>
                </td>
                <td className="px-6 py-5 text-center font-bold text-slate-400">{m.unit}</td>
                <td className="px-6 py-5 text-center font-black text-slate-800">{m.minStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800">Novo Material</h2>
            </div>
            <div className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">SKU</label>
                   <input className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold text-sm" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Unidade</label>
                   <input className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold text-sm" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">Nome Comercial</label>
                 <input className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold text-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Categoria</label>
                   <select className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold text-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      <option value="Basico">Básico</option>
                      <option value="Estrutura">Estrutura</option>
                      <option value="Acabamento">Acabamento</option>
                      <option value="Hidraulica">Hidráulica</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Estoque Mínimo</label>
                   <input type="number" className="w-full p-2.5 bg-gray-50 border rounded-xl font-bold text-sm" value={form.minStock} onChange={e => setForm({...form, minStock: Number(e.target.value)})} />
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-xs font-black uppercase text-slate-400">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-lg">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
