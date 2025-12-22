
import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Document } from '../../types';

export const DocumentCenter: React.FC = () => {
  const { currentScope } = useApp();
  const { hasPermission } = useAuth();
  const { notify } = useNotification();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ type: '', entity: '', query: '' });
  
  const [uploadForm, setUploadForm] = useState({ 
    name: '', type: 'OTHER' as Document['type'], relatedId: '', entityType: 'RM' 
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocs = async () => {
    if (currentScope) {
      const all = await api.getAllDocuments(currentScope.tenantId);
      setDocuments(all);
    }
  };

  useEffect(() => { loadDocs(); }, [currentScope]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await api.uploadDocument({
          name: uploadForm.name || file.name,
          type: uploadForm.type,
          mimeType: file.type,
          size: file.size,
          relatedId: uploadForm.relatedId,
          base64: event.target?.result as string
        }, currentScope!.tenantId);
        notify('Documento arquivado com sucesso!', 'success');
        setShowModal(false);
        loadDocs();
      } catch (err) {
        notify('Erro no upload.', 'error');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const filtered = documents.filter(d => {
    const matchType = !filters.type || d.type === filters.type;
    const matchQuery = !filters.query || d.name.toLowerCase().includes(filters.query.toLowerCase()) || d.relatedId.includes(filters.query);
    return matchType && matchQuery;
  }).reverse();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Governança Documental</h1>
          <p className="text-gray-500 text-sm italic">Arquivamento centralizado de comprovações e certificados do escopo.</p>
        </div>
        {hasPermission('DOC_UPLOAD') && (
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all">
            <i className="fas fa-upload"></i> Novo Upload
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Busca Geral</label>
           <div className="relative">
             <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"></i>
             <input 
               type="text" placeholder="Nome ou ID Referência..." 
               className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
               value={filters.query}
               onChange={e => setFilters({...filters, query: e.target.value})}
             />
           </div>
        </div>
        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo de Documento</label>
           <select 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              value={filters.type}
              onChange={e => setFilters({...filters, type: e.target.value})}
           >
              <option value="">Todos os Tipos</option>
              <option value="NF">Notas Fiscais</option>
              <option value="CQ">Qualidade (CQ)</option>
              <option value="GUIA">Guia Transporte</option>
              <option value="CONTRACT">Contratos</option>
           </select>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 h-[42px] bg-slate-50 rounded-xl border border-slate-100">
          <i className="fas fa-info-circle text-blue-500"></i>
          {filtered.length} arquivos listados
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filtered.map(d => (
          <div key={d.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
            <div className={`h-24 flex items-center justify-center text-4xl ${d.mimeType.includes('pdf') ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
              <i className={`fas ${d.mimeType.includes('pdf') ? 'fa-file-pdf' : 'fa-file-image'}`}></i>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">{d.type}</p>
                <p className="text-sm font-bold text-slate-800 line-clamp-2" title={d.name}>{d.name}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">Vínculo: <span className="text-slate-700">{d.relatedId}</span></p>
              </div>
              <div className="flex gap-2">
                {hasPermission('DOC_DOWNLOAD') && (
                  <button onClick={() => window.open(d.base64)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">Baixar</button>
                )}
                {hasPermission('DOC_DELETE') && (
                  <button onClick={async () => { if(confirm('Excluir?')){ await api.deleteDocument(d.id); loadDocs(); } }} className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><i className="fas fa-trash-alt"></i></button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
               <h2 className="text-xl font-black text-slate-800 tracking-tight">Upload de Documento</h2>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Título do Documento</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-sm" value={uploadForm.name} onChange={e => setUploadForm({...uploadForm, name: e.target.value})} placeholder="Ex: NF-1234 Material Hidraulico" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vincular A:</label>
                    <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={uploadForm.entityType} onChange={e => setUploadForm({...uploadForm, entityType: e.target.value})}>
                        <option value="RM">Requisição (RM)</option>
                        <option value="PO">Pedido (PO)</option>
                        <option value="TRANSFER">Transferência</option>
                        <option value="SUP">Fornecedor</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ID Referência:</label>
                    <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={uploadForm.relatedId} onChange={e => setUploadForm({...uploadForm, relatedId: e.target.value})} placeholder="Ex: RM-987" />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo de Documento</label>
                  <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={uploadForm.type} onChange={e => setUploadForm({...uploadForm, type: e.target.value as any})}>
                      <option value="NF">Nota Fiscal (NF)</option>
                      <option value="CQ">Qualidade (CQ)</option>
                      <option value="CONTRACT">Contrato</option>
                      <option value="OTHER">Outros</option>
                  </select>
               </div>
            </div>
            <div className="p-8 bg-slate-50 border-t">
               <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
               <button 
                 disabled={!uploadForm.relatedId || isUploading}
                 onClick={() => fileInputRef.current?.click()}
                 className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-30"
               >
                 {isUploading ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-cloud-upload-alt text-lg"></i>}
                 Selecionar Arquivo e Salvar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
