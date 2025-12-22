
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useApp } from '../../contexts/AppContext';
import { DocumentPanel } from '../../components/DocumentPanel';
import { RM, RMItem, RMStatus, Material, User, AuditLog, Scope } from '../../types';
import { STATUS_COLORS } from '../../constants';

export const RMDetail: React.FC<{ id: string, onBack: () => void, onEdit?: (id: string) => void }> = ({ id, onBack, onEdit }) => {
  const { user, hasPermission } = useAuth();
  const { notify } = useNotification();
  const { works } = useApp();
  const [data, setData] = useState<{ rm: RM; items: RMItem[] } | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [requester, setRequester] = useState<User | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [loading, setLoading] = useState(true);

  const [triageMap, setTriageMap] = useState<Record<string, { attended: number; purchase: number }>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getRMById(id);
      const mats = await api.getMaterials();
      const req = await api.getUserById(res.rm.requesterId);
      const l = await api.getAuditLogsByEntity(id);
      setData(res);
      setMaterials(mats);
      setRequester(req || null);
      setLogs(l);

      const initialMap: Record<string, { attended: number; purchase: number }> = {};
      res.items.forEach(i => {
        initialMap[i.id] = { 
          attended: i.quantityFulfilled || 0, 
          purchase: (i.status === 'FOR_PURCHASE') ? i.quantityRequested - i.quantityFulfilled : 0 
        };
      });
      setTriageMap(initialMap);

    } catch (err) { 
      notify('Erro ao carregar RM.', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleStatusUpdate = async (newStatus: RMStatus) => {
    await api.updateRMStatus(id, newStatus, user?.id || '');
    notify('Status atualizado com sucesso!', 'success');
    loadData();
  };

  const handleFinalizeTriage = async () => {
    if (!data || !user) return;
    try {
      const itemsToProcess = data.items.map(i => ({
        id: i.id,
        attended: triageMap[i.id]?.attended || 0,
        purchase: triageMap[i.id]?.purchase || 0
      }));

      await api.processRMFulfillment(id, itemsToProcess, user.id);
      notify('Triagem finalizada!', 'success');
      loadData();
    } catch (err: any) { 
      notify(err.message, 'error'); 
    }
  };

  if (loading && !data) return <div className="p-20 text-center"><i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i></div>;
  if (!data) return <div className="p-20 text-center">RM não encontrada</div>;

  const { rm, items } = data;
  const currentWork = works.find(w => w.id === rm.unitId);

  const rmScope: Scope = {
    tenantId: rm.tenantId,
    unitId: rm.unitId,
    warehouseId: rm.warehouseId
  };

  const canApproveL1 = hasPermission('RM_APPROVE_L1', rmScope) && rm.status === RMStatus.WAITING_L1;
  const canApproveL2 = hasPermission('RM_APPROVE_L2', rmScope) && rm.status === RMStatus.WAITING_L2;
  const canTriage = hasPermission('RM_FULFILL_FROM_STOCK', rmScope) && rm.status === RMStatus.APPROVED;
  const canCancel = hasPermission('RM_CANCEL', rmScope) && ['WAITING_L1', 'WAITING_L2', 'APPROVED'].includes(rm.status);
  const canEdit = (rm.requesterId === user?.id || hasPermission('RM_CREATE', rmScope)) && rm.status === RMStatus.WAITING_L1;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">RM #{rm.id}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Solicitada em {new Date(rm.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && onEdit && (
            <button onClick={() => onEdit(rm.id)} className="bg-white text-blue-600 border border-blue-100 px-6 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-blue-50 transition-all">Editar</button>
          )}
          {canApproveL1 && <button onClick={() => handleStatusUpdate(RMStatus.WAITING_L2)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg">Aprovar (L1)</button>}
          {canApproveL2 && <button onClick={() => handleStatusUpdate(RMStatus.APPROVED)} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg">Aprovar (L2)</button>}
          {canTriage && <button onClick={handleFinalizeTriage} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg">Finalizar Atendimento</button>}
          {canCancel && <button onClick={() => handleStatusUpdate(RMStatus.CANCELED)} className="bg-white text-rose-600 border border-rose-100 px-6 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-rose-50 transition-all">Cancelar</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-8 rounded-2xl border border-slate-100 grid grid-cols-2 gap-8 shadow-sm">
              <div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Destino</p>
                 <p className="font-bold text-slate-800 flex items-center gap-2">
                    <i className="fas fa-location-dot text-blue-500"></i>
                    {currentWork?.name || rm.unitId}
                 </p>
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Status Atual</p>
                 <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${STATUS_COLORS[rm.status]}`}>
                    {rm.status.replace('_', ' ')}
                 </span>
              </div>
           </div>

           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                 <h3 className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Itens da Requisição</h3>
              </div>
              <table className="w-full text-left">
                <thead className="text-[9px] font-black uppercase text-slate-400 border-b">
                    <tr>
                      <th className="px-8 py-4">Item</th>
                      <th className="px-6 py-4 text-center">Solicitado</th>
                      <th className="px-6 py-4 text-center">{canTriage ? 'Atender' : 'Fulfilled'}</th>
                      <th className="px-8 py-4 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {items.map(item => {
                      const mat = materials.find(m => m.id === item.materialId);
                      const tri = triageMap[item.id] || { attended: 0, purchase: 0 };
                      return (
                        <tr key={item.id} className="text-sm hover:bg-slate-50/50 transition-all">
                          <td className="px-8 py-5">
                              <p className="font-bold text-slate-800">{mat?.name}</p>
                              <p className="text-[10px] font-black text-blue-500">{mat?.sku}</p>
                          </td>
                          <td className="px-6 py-5 text-center font-black">{item.quantityRequested}</td>
                          <td className="px-6 py-5 text-center">
                            {canTriage ? (
                              <input 
                                type="number" 
                                className="w-20 p-2 border rounded-lg text-center text-xs font-black bg-blue-50 outline-none" 
                                value={tri.attended} 
                                onChange={e => setTriageMap({...triageMap, [item.id]: { ...tri, attended: Number(e.target.value) }})} 
                              />
                            ) : (
                              <span className="font-black text-emerald-600">{item.quantityFulfilled}</span>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                             <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${item.status === 'PENDING' ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                                {item.status}
                             </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white">
              <h3 className="text-xs font-black uppercase tracking-widest mb-6">Rastreabilidade</h3>
              <div className="space-y-4">
                 <div className="flex gap-4">
                    <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                    <div>
                       <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Solicitante</p>
                       <p className="text-xs font-bold">{requester?.name || '---'}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowLogs(true)} className="mt-8 w-full py-3 border border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all">Ver Auditoria</button>
              </div>
           </div>
           <DocumentPanel relatedId={id} entityType="RM" onUpdate={loadData} />
        </div>
      </div>

      {showLogs && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl h-[600px] flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
               <h2 className="text-lg font-black text-slate-800">Logs de Auditoria</h2>
               <button onClick={() => setShowLogs(false)} className="text-slate-400"><i className="fas fa-times"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
               {logs.map(log => (
                 <div key={log.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                       <p className="text-xs font-black uppercase text-blue-600">{log.action}</p>
                       <p className="text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-slate-600">{log.details}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Por: {log.userName}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
