
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Material } from '../../types';
import { getScopeUnitId } from '../../utils/scope';

export const RMNew: React.FC<{ onFinished: () => void, editId?: string }> = ({ onFinished, editId }) => {
  const { currentScope, warehouses, getLabel } = useApp();
  const { notify } = useNotification();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ dateRequired: '', priority: 'MEDIUM' as any, observations: '', warehouseId: '' });
  const [items, setItems] = useState<any[]>([{ materialId: '', quantityRequested: 1, observations: '' }]);

  const currentUnitId = getScopeUnitId(currentScope);

  useEffect(() => {
    const load = async () => {
       setMaterials(await api.getMaterials());
       if (editId) {
          const { rm, items: rmItems } = await api.getRMById(editId);
          setFormData({ dateRequired: rm.dateRequired.split('T')[0], priority: rm.priority, observations: rm.observations, warehouseId: rm.warehouseId });
          setItems(rmItems.map(i => ({ materialId: i.materialId, quantityRequested: i.quantityRequested, observations: i.observations })));
       }
    };
    load();
  }, [editId]);

  useEffect(() => {
    if (!editId) {
       if (currentScope?.warehouseId) setFormData(prev => ({ ...prev, warehouseId: currentScope.warehouseId! }));
       else if (warehouses.length === 1) setFormData(prev => ({ ...prev, warehouseId: warehouses[0].id }));
    }
  }, [currentScope, warehouses, editId]);

  const handleSubmit = async () => {
    if (!formData.warehouseId || !formData.dateRequired || items.some(i => !i.materialId)) return notify('Verifique os campos.', 'warning');
    if (!currentUnitId) return notify('Erro: Unidade não identificada.', 'error');

    setIsSubmitting(true);
    try {
      if (editId) await api.updateRM(editId, { ...formData, tenantId: currentScope!.tenantId, unitId: currentUnitId, workId: currentUnitId }, items);
      else await api.createRM({ ...formData, tenantId: currentScope!.tenantId, unitId: currentUnitId, workId: currentUnitId }, items);
      notify(editId ? 'RM atualizada!' : 'RM criada!', 'success');
      onFinished();
    } catch (e: any) { notify(e.message, 'error'); }
    finally { setIsSubmitting(false); }
  };

  if (!currentUnitId) return <div className="p-20 text-center text-slate-300 font-bold uppercase">Selecione uma {getLabel('UNIT')} no topo para continuar.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-black text-slate-800 tracking-tight">{editId ? `Editar ${getLabel('RM')}` : `Nova ${getLabel('RM')}`}</h1><p className="text-gray-500 text-sm">Defina os materiais e as datas de expectativa para a unidade.</p></div>
        <button onClick={onFinished} className="text-gray-400 font-bold hover:text-slate-600 uppercase text-xs tracking-widest">Cancelar</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b bg-slate-50/30 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Expectativa de Uso</label><input type="date" className="w-full p-3 border rounded-xl font-bold text-sm" value={formData.dateRequired} onChange={e => setFormData({ ...formData, dateRequired: e.target.value })} /></div>
           <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Prioridade</label><select className="w-full p-3 border rounded-xl font-bold text-sm" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}> <option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></select></div>
           <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Almoxarifado Destino</label><select className="w-full p-3 border rounded-xl font-bold text-sm" value={formData.warehouseId} onChange={e => setFormData({...formData, warehouseId: e.target.value})}> <option value="">Selecione...</option>{warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}</select></div>
        </div>

        <div className="p-8 space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-800 border-b pb-2">Itens Solicitados</h3>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-center animate-in slide-in-from-right-2">
               <select className="flex-1 p-3 bg-gray-50 border rounded-xl font-bold text-sm" value={item.materialId} onChange={e => { const n = [...items]; n[idx].materialId = e.target.value; setItems(n); }}>
                  <option value="">Selecione Material...</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.sku} | {m.name}</option>)}
               </select>
               <input type="number" className="w-24 p-3 bg-gray-50 border rounded-xl text-center font-black" value={item.quantityRequested} onChange={e => { const n = [...items]; n[idx].quantityRequested = Number(e.target.value); setItems(n); }} />
               <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-rose-300 hover:text-rose-500 transition-colors"><i className="fas fa-trash-alt"></i></button>
            </div>
          ))}
          <button onClick={() => setItems([...items, { materialId: '', quantityRequested: 1, observations: '' }])} className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all">Adicionar novo item</button>
        </div>

        <div className="p-8 bg-slate-900 flex justify-between items-center text-white">
           <div className="text-xs font-black uppercase tracking-widest">{items.length} skus listados</div>
           <button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-500/30 active:scale-95 transition-all">
              {isSubmitting ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-check-circle mr-2"></i>}
              {editId ? 'Salvar Alterações' : 'Enviar p/ Aprovação'}
           </button>
        </div>
      </div>
    </div>
  );
};
