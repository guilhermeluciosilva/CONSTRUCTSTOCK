
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useApp } from '../../contexts/AppContext';
import { DocumentPanel } from '../../components/DocumentPanel';
import { Transfer, TransferItem, Material, Warehouse } from '../../types';
import { STATUS_COLORS } from '../../constants';
import { scopeFromTransfer } from '../../utils/entityScope';

export const TransferDetail: React.FC<{ id: string, onBack: () => void }> = ({ id, onBack }) => {
  const { hasPermission } = useAuth();
  const { currentScope } = useApp();
  const { notify } = useNotification();
  const [data, setData] = useState<{ transfer: Transfer, items: TransferItem[] } | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [justification, setJustification] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.getTransferById(id);
      const mats = await api.getMaterials();
      setData(res);
      setMaterials(mats);
      const initialQtys: Record<string, number> = {};
      res.items.forEach(i => initialQtys[i.id] = i.quantitySent || i.quantityRequested);
      setReceivedQtys(initialQtys);
      
      const tWorks = await api.getWorks(res.transfer.tenantId);
      let list: Warehouse[] = [];
      for (const w of tWorks) { list = [...list, ...(await api.getWarehouses(w.id))]; }
      setWarehouses(list);
      setIsLoading(false);
    } catch (err) { 
      setLoadError('Falha ao carregar transferência');
      setIsLoading(false);
      notify('Erro ao carregar transferência', 'error'); 
    }
  };

  useEffect(() => { load(); }, [id]);

  const hasDivergence = () => {
    return data?.items.some(i => receivedQtys[i.id] !== i.quantitySent);
  };

  const handleReceive = async () => {
    if (hasDivergence()) {
      if (!hasPermission('TRANSFER_REPORT_DIVERGENCE', currentScope || undefined)) {
        return notify('Acesso Negado: Você não pode reportar divergências.', 'error');
      }
      if (justification.length < 10) {
        return notify('Justificativa obrigatória (mín. 10 caracteres) para divergências.', 'warning');
      }
    }
    
    setIsProcessing(true);
    await api.receiveTransfer(id, receivedQtys);
    notify('Recebimento concluído!', 'success');
    load();
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4 block"></i>
          <p className="text-slate-600 font-bold">Carregando transferência...</p>
        </div>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-4xl text-rose-600 mb-4 block"></i>
          <p className="text-slate-600 font-bold mb-4">{loadError || 'Falha ao carregar transferência'}</p>
          <button onClick={load} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase hover:bg-blue-700 transition-all">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const transferScope = scopeFromTransfer(data.transfer);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-50 border rounded-xl text-slate-400 hover:text-blue-600 transition-all">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Guia Transferência #{data.transfer.id}</h1>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${STATUS_COLORS[data.transfer.status]}`}>{data.transfer.status}</span>
          </div>
        </div>
        <div className="flex gap-2">
           {data.transfer.status === 'CREATED' && hasPermission('TRANSFER_DISPATCH', transferScope) && (
             <button onClick={async () => { await api.dispatchTransfer(id); notify('Carga em trânsito.', 'success'); load(); }} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-200">Despachar Carga</button>
           )}
           {data.transfer.status === 'IN_TRANSIT' && hasPermission('TRANSFER_RECEIVE', transferScope) && (
             <button onClick={handleReceive} disabled={isProcessing} className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-black text-xs uppercase shadow-lg shadow-emerald-200 flex items-center gap-2">
               {isProcessing ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-check-double"></i>}
               Finalizar Conferência
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50/50 border-b flex justify-between items-center">
                 <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Conferência de Itens</h3>
                 {hasDivergence() && <span className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1 animate-pulse"><i className="fas fa-exclamation-triangle"></i> Divergência Detectada</span>}
              </div>
              <table className="w-full text-left">
                 <thead className="text-[9px] font-black uppercase text-slate-400 border-b">
                    <tr><th className="px-8 py-4">Material</th><th className="px-6 py-4 text-center">Enviado</th><th className="px-8 py-4 text-center w-32">Recebido</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {data.items.map(item => {
                      const mat = materials.find(x => x.id === item.materialId);
                      const divergent = data.transfer.status === 'IN_TRANSIT' ? receivedQtys[item.id] !== item.quantitySent : item.quantityReceived !== item.quantitySent;
                      return (
                        <tr key={item.id} className={`text-sm ${divergent ? 'bg-rose-50/30' : ''}`}>
                          <td className="px-8 py-5">
                             <p className="font-bold text-slate-800">{mat?.name}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">{mat?.sku}</p>
                          </td>
                          <td className="px-6 py-5 text-center font-bold text-blue-600">{item.quantitySent || item.quantityRequested}</td>
                          <td className="px-8 py-5 text-center">
                             {data.transfer.status === 'IN_TRANSIT' ? (
                               <input 
                                 type="number" className={`w-20 px-3 py-1.5 border rounded-lg text-center text-xs font-black focus:ring-2 focus:ring-blue-500 outline-none ${divergent ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200'}`}
                                 value={receivedQtys[item.id]}
                                 onChange={(e) => setReceivedQtys({...receivedQtys, [item.id]: Number(e.target.value)})}
                               />
                             ) : (
                               <span className={`font-black ${divergent ? 'text-rose-600' : 'text-emerald-600'}`}>{item.quantityReceived}</span>
                             )}
                          </td>
                        </tr>
                      );
                    })}
                 </tbody>
              </table>
              {data.transfer.status === 'IN_TRANSIT' && hasDivergence() && (
                 <div className="p-8 bg-rose-50/50 border-t border-rose-100">
                    <label className="text-[10px] font-black uppercase text-rose-400 mb-2 block tracking-widest">Justificativa da Divergência (Obrigatório)</label>
                    <textarea 
                      placeholder="Relate o motivo da diferença entre as quantidades (ex: avaria no transporte, sobra no envio original)..."
                      className="w-full p-4 border border-rose-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none bg-white min-h-[100px]"
                      value={justification}
                      onChange={e => setJustification(e.target.value)}
                    />
                    <p className="mt-3 text-[10px] text-rose-400 italic flex items-center gap-1">
                       <i className="fas fa-camera"></i> Sugestão: Anexe evidências fotográficas no painel lateral de documentos.
                    </p>
                 </div>
              )}
           </div>
        </div>

        <div className="space-y-6">
           <DocumentPanel relatedId={id} entityType="TRANSFER" />
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rota Logística</h3>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center"><i className="fas fa-sign-out-alt"></i></div>
                 <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Origem</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{warehouses.find(w => w.id === data.transfer.originWarehouseId)?.name || '---'}</p>
                 </div>
              </div>
              <div className="w-px h-6 bg-slate-100 ml-5"></div>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><i className="fas fa-sign-in-alt"></i></div>
                 <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Destino</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{warehouses.find(w => w.id === data.transfer.destinationWarehouseId)?.name || '---'}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
