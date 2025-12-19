
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useApp } from '../../contexts/AppContext';
import { Tenant, Unit, Warehouse, Sector, OperationType } from '../../types';

export const OrgManagement: React.FC = () => {
  const { notify } = useNotification();
  const { currentScope, getLabel, activeTenant } = useApp();
  const [units, setUnits] = useState<Unit[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showModal, setShowModal] = useState<'UNIT' | 'SECTOR' | 'WAREHOUSE' | null>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    if (currentScope?.tenantId) {
      const u = await api.getWorks(currentScope.tenantId);
      setUnits(u);
      
      let allSectors: Sector[] = [];
      let allWhs: Warehouse[] = [];
      for (const unit of u) {
        const s = await api.getSectors(unit.id);
        const w = await api.getWarehouses(unit.id);
        allSectors = [...allSectors, ...s];
        allWhs = [...allWhs, ...w];
      }
      setSectors(allSectors);
      setWarehouses(allWhs);
    }
  };

  useEffect(() => { load(); }, [currentScope]);

  const handleSave = async () => {
    try {
      if (showModal === 'UNIT') {
        await api.createWork({ ...form, tenantId: currentScope!.tenantId });
        notify(`${getLabel('UNIT')} cadastrada!`, 'success');
      } else if (showModal === 'SECTOR') {
        await api.createSector(form.unitId, form.name);
        notify('Setor cadastrado!', 'success');
      } else {
        await api.createWarehouse(form);
        notify('Almoxarifado cadastrado!', 'success');
      }
      setShowModal(null); setForm({}); load();
    } catch (err: any) { notify(err.message, 'error'); }
  };

  const isFactory = activeTenant?.operationType === OperationType.FACTORY;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Estrutura Organizacional</h1>
          <p className="text-gray-500 text-sm">Gerencie {getLabel('UNIT').toLowerCase()}s, setores e pontos de estoque.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal('UNIT')} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase">Nova {getLabel('UNIT')}</button>
          {isFactory && <button onClick={() => setShowModal('SECTOR')} className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg shadow-purple-200">Novo Setor</button>}
          <button onClick={() => setShowModal('WAREHOUSE')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-200">Novo Almox</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Unidades */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase text-slate-800 tracking-widest">{getLabel('UNIT')}s</h3>
              <span className="text-[10px] font-black text-slate-400">{units.length}</span>
           </div>
           <div className="divide-y divide-slate-50">
              {units.map(u => (
                <div key={u.id} className="p-4 flex justify-between items-center">
                   <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                   <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded uppercase">Ativo</span>
                </div>
              ))}
           </div>
        </div>

        {/* Setores (Se for Fábrica) */}
        {isFactory && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Setores / Áreas</h3>
                <span className="text-[10px] font-black text-slate-400">{sectors.length}</span>
             </div>
             <div className="divide-y divide-slate-50">
                {sectors.map(s => (
                  <div key={s.id} className="p-4">
                     <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">{units.find(u => u.id === s.unitId)?.name}</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Almoxarifados */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Pontos de Estoque</h3>
              <span className="text-[10px] font-black text-slate-400">{warehouses.length}</span>
           </div>
           <div className="divide-y divide-slate-50">
              {warehouses.map(wh => (
                <div key={wh.id} className="p-4">
                   <div className="flex justify-between items-start">
                     <p className="font-bold text-slate-800 text-sm">{wh.name}</p>
                     {wh.isCentral && <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-50 px-1 rounded">Central</span>}
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">
                     {units.find(u => u.id === wh.unitId)?.name} 
                     {wh.sectorId && ` • ${sectors.find(s => s.id === wh.sectorId)?.name}`}
                   </p>
                </div>
              ))}
           </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800">Nova {showModal === 'UNIT' ? getLabel('UNIT') : showModal === 'SECTOR' ? 'Área / Setor' : 'Ponto de Estoque'}</h2>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome Identificador</label>
                 <input className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>

              {(showModal === 'SECTOR' || showModal === 'WAREHOUSE') && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vincular a qual {getLabel('UNIT')}</label>
                  <select className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm outline-none" value={form.unitId} onChange={e => setForm({...form, unitId: e.target.value})}>
                      <option value="">Selecione...</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}

              {showModal === 'WAREHOUSE' && isFactory && form.unitId && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Setor do Almoxarifado (Opcional)</label>
                  <select className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm outline-none" value={form.sectorId} onChange={e => setForm({...form, sectorId: e.target.value})}>
                      <option value="">Nenhum Setor (Global)</option>
                      {sectors.filter(s => s.unitId === form.unitId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={() => setShowModal(null)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400">Descartar</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-200">Salvar Registro</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
