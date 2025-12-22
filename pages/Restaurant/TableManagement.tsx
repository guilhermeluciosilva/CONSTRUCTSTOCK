
import React, { useState, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useApp } from '../../contexts/AppContext';

interface Table {
  id: number;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';
  capacity: number;
}

export const TableManagement: React.FC = () => {
  const { notify } = useNotification();
  const { activeUnit } = useApp();
  const [tables, setTables] = useState<Table[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTable, setNewTable] = useState({ number: '', capacity: 4 });

  // Simulando carga inicial ou persistência local
  useEffect(() => {
    const saved = localStorage.getItem(`TABLES_${activeUnit?.id || 'GLOBAL'}`);
    if (saved) {
      setTables(JSON.parse(saved));
    } else {
      // Mesas iniciais padrão
      const initial = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        status: 'FREE' as const,
        capacity: 4
      }));
      setTables(initial);
    }
  }, [activeUnit]);

  const saveTables = (list: Table[]) => {
    setTables(list);
    localStorage.setItem(`TABLES_${activeUnit?.id || 'GLOBAL'}`, JSON.stringify(list));
  };

  const toggleStatus = (id: number) => {
    const updated = tables.map(t => {
      if (t.id === id) {
        let nextStatus: Table['status'] = 'FREE';
        if (t.status === 'FREE') nextStatus = 'OCCUPIED';
        else if (t.status === 'OCCUPIED') nextStatus = 'RESERVED';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveTables(updated);
    notify(`Mesa ${id} atualizada!`, 'info');
  };

  const addTable = () => {
    const num = parseInt(newTable.number);
    if (isNaN(num)) return notify('Número inválido', 'warning');
    if (tables.some(t => t.id === num)) return notify('Mesa já existe', 'warning');

    const updated = [...tables, { id: num, capacity: newTable.capacity, status: 'FREE' as const }].sort((a, b) => a.id - b.id);
    saveTables(updated);
    setShowAddModal(false);
    notify('Mesa adicionada!', 'success');
  };

  const deleteTable = (id: number) => {
    if (!window.confirm(`Excluir mesa ${id}?`)) return;
    saveTables(tables.filter(t => t.id !== id));
    notify('Mesa removida', 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Mapa de Mesas</h1>
          <p className="text-gray-500 text-sm">Controle de ocupação e reservas do salão.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg shadow-slate-200 flex items-center gap-2 active:scale-95 transition-all"
        >
          <i className="fas fa-plus"></i> Adicionar Mesa
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
         <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Livre ({tables.filter(t => t.status === 'FREE').length})
         </div>
         <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div> Ocupada ({tables.filter(t => t.status === 'OCCUPIED').length})
         </div>
         <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div> Reservada ({tables.filter(t => t.status === 'RESERVED').length})
         </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
         {tables.map(table => (
           <div 
             key={table.id}
             className={`relative group p-6 rounded-[32px] border-2 transition-all cursor-pointer select-none active:scale-95 ${
               table.status === 'FREE' ? 'bg-white border-emerald-100 hover:border-emerald-500' :
               table.status === 'OCCUPIED' ? 'bg-rose-50 border-rose-200 hover:border-rose-500 shadow-lg shadow-rose-100' :
               'bg-amber-50 border-amber-200 hover:border-amber-500 shadow-lg shadow-amber-100'
             }`}
             onClick={() => toggleStatus(table.id)}
           >
              <div className="flex flex-col items-center gap-3">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                    table.status === 'FREE' ? 'bg-emerald-50 text-emerald-600' :
                    table.status === 'OCCUPIED' ? 'bg-rose-600 text-white shadow-lg' :
                    'bg-amber-600 text-white shadow-lg'
                 }`}>
                    <i className="fas fa-chair"></i>
                 </div>
                 <div className="text-center">
                    <p className={`text-xl font-black ${table.status === 'FREE' ? 'text-slate-800' : 'text-slate-900'}`}>#{table.id}</p>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Cap: {table.capacity} pessoas</p>
                 </div>
              </div>

              {/* Botão Deletar Invisível (aparece no hover) */}
              <button 
                onClick={(e) => { e.stopPropagation(); deleteTable(table.id); }}
                className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-slate-100 text-rose-300 hover:text-rose-600 rounded-full shadow-md items-center justify-center flex opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <i className="fas fa-times text-[10px]"></i>
              </button>

              {/* Tag de Status */}
              <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                table.status === 'FREE' ? 'bg-emerald-100 text-emerald-700' :
                table.status === 'OCCUPIED' ? 'bg-rose-100 text-rose-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {table.status === 'FREE' ? 'Livre' : table.status === 'OCCUPIED' ? 'Ocupada' : 'Reservada'}
              </div>
           </div>
         ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
             <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800">Adicionar Mesa</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times"></i></button>
             </div>
             <div className="p-8 space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Número da Mesa</label>
                   <input 
                     type="number" className="w-full p-3 bg-gray-50 border rounded-xl font-black text-lg outline-none focus:ring-2 focus:ring-blue-500" 
                     placeholder="Ex: 13" 
                     value={newTable.number}
                     onChange={e => setNewTable({...newTable, number: e.target.value})}
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Capacidade de Pessoas</label>
                   <div className="flex gap-2">
                      {[2, 4, 6, 8].map(cap => (
                        <button 
                          key={cap}
                          onClick={() => setNewTable({...newTable, capacity: cap})}
                          className={`flex-1 py-2 rounded-lg font-black text-xs transition-all ${newTable.capacity === cap ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                        >
                          {cap}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
             <div className="p-8 bg-slate-50 flex gap-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400">Descartar</button>
                <button onClick={addTable} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">Salvar Mesa</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
