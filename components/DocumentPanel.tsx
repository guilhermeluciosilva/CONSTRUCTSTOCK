
import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useNotification } from '../contexts/NotificationContext';
import { Document } from '../types';

interface DocumentPanelProps {
  relatedId: string;
  entityType: 'RM' | 'PO' | 'TRANSFER' | 'MATERIAL' | 'ORG';
  onUpdate?: () => void;
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({ relatedId, entityType, onUpdate }) => {
  const { hasPermission } = useAuth();
  const { currentScope } = useApp();
  const { notify } = useNotification();
  const [docs, setDocs] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<Document['type']>('OTHER');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const data = await api.getDocuments(relatedId);
    setDocs(data);
  };

  useEffect(() => { load(); }, [relatedId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Fix: Added tenantId argument
        await api.uploadDocument({
          name: file.name,
          type: selectedType,
          mimeType: file.type,
          size: file.size,
          relatedId: relatedId,
          base64: event.target?.result as string
        }, currentScope!.tenantId);
        notify('Documento anexado!', 'success');
        load();
        if (onUpdate) onUpdate();
      } catch (err) {
        notify('Erro ao anexar documento.', 'error');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteDoc = async (id: string) => {
    if (!window.confirm('Excluir anexo permanentemente?')) return;
    await api.deleteDocument(id);
    notify('Anexo removido.', 'info');
    load();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 bg-slate-50/50 border-b flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
          <i className="fas fa-paperclip text-blue-500"></i> Anexos e Documentos
        </h3>
        <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{docs.length}</span>
      </div>

      <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar">
        {docs.map(doc => (
          <div key={doc.id} className="group p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-white hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 min-w-0">
               <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${doc.mimeType.includes('pdf') ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                 <i className={`fas ${doc.mimeType.includes('pdf') ? 'fa-file-pdf' : 'fa-file-image'}`}></i>
               </div>
               <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate" title={doc.name}>{doc.name}</p>
                  <p className="text-[8px] font-black uppercase text-slate-400">{doc.type} • {(doc.size / 1024).toFixed(0)}KB</p>
               </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               {hasPermission('DOC_DOWNLOAD') && (
                 <button onClick={() => window.open(doc.base64)} className="w-7 h-7 flex items-center justify-center bg-white border rounded-lg text-slate-400 hover:text-blue-600"><i className="fas fa-download text-[10px]"></i></button>
               )}
               {hasPermission('DOC_DELETE') && (
                 <button onClick={() => deleteDoc(doc.id)} className="w-7 h-7 flex items-center justify-center bg-white border rounded-lg text-slate-400 hover:text-rose-600"><i className="fas fa-trash text-[10px]"></i></button>
               )}
            </div>
          </div>
        ))}
        {docs.length === 0 && (
          <div className="py-10 text-center text-slate-300 italic flex flex-col items-center gap-2">
            <i className="fas fa-folder-open text-3xl opacity-20"></i>
            <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum documento</p>
          </div>
        )}
      </div>

      {hasPermission('DOC_UPLOAD') && (
        <div className="p-4 bg-gray-50/50 border-t space-y-3">
          <select 
            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-blue-500"
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as any)}
          >
            <option value="NF">Nota Fiscal (NF)</option>
            <option value="CQ">Qualidade (CQ)</option>
            <option value="GUIA">Guia Transporte</option>
            <option value="OTHER">Outro Anexo</option>
          </select>
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleUpload} accept=".pdf,.png,.jpg" />
          <button 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isUploading ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-plus"></i>}
            Anexar Novo Arquivo
          </button>
        </div>
      )}
    </div>
  );
};
