
import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { Supplier, Document } from '../../types';

export const SupplierManagement: React.FC = () => {
  const { notify } = useNotification();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Supplier>>({ name: '', taxId: '', contactEmail: '' });
  const [activeTab, setActiveTab] = useState<'DATA' | 'DOCS'>('DATA');
  
  // Document state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<Document['type']>('OTHER');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const tenants = await api.getTenants();
    const data = await api.getSuppliers(tenants[0].id);
    setSuppliers(data);
  };

  useEffect(() => { load(); }, []);

  const openModal = async (s?: Supplier) => {
    if (s) {
      setEditingId(s.id);
      setForm(s);
      const docs = await api.getDocuments(s.id);
      setDocuments(docs);
    } else {
      setEditingId(null);
      setForm({ name: '', taxId: '', contactEmail: '' });
      setDocuments([]);
    }
    setActiveTab('DATA');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.taxId) return notify('Preencha os campos obrigatórios', 'warning');
    
    try {
      if (editingId) {
        await api.updateSupplier(editingId, form);
        notify('Fornecedor atualizado!', 'success');
      } else {
        const tenants = await api.getTenants();
        await api.createSupplier({ ...form, tenantId: tenants[0].id });
        notify('Fornecedor cadastrado!', 'success');
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingId) return;

    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        await api.uploadDocument({
          name: file.name,
          type: selectedDocType,
          mimeType: file.type,
          size: file.size,
          relatedId: editingId,
          base64: base64
        });
        const docs = await api.getDocuments(editingId);
        setDocuments(docs);
        notify('Documento anexado!', 'success');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    } catch (err) {
      notify('Erro no upload', 'error');
      setIsUploading(false);
    }
  };

  const downloadDoc = (doc: Document) => {
    if (!doc.base64) return;
    const link = document.createElement('a');
    link.href = doc.base64;
    link.download = doc.name;
    link.click();
  };

  const deleteDoc = async (id: string) => {
    if (!editingId) return;
    if (!window.confirm('Deseja realmente excluir este anexo?')) return;
    await api.deleteDocument(id);
    const docs = await api.getDocuments(editingId);
    setDocuments(docs);
    notify('Documento removido', 'info');
  };

  const getDocTypeLabel = (type: Document['type']) => {
    switch (type) {
      case 'CONTRACT': return 'Contrato / Razão Social';
      case 'BANK': return 'Dados Bancários';
      case 'NF': return 'Nota Fiscal';
      default: return 'Outros Documentos';
    }
  };

  const getDocTypeColor = (type: Document['type']) => {
    switch (type) {
      case 'CONTRACT': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'BANK': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Fornecedores</h1>
          <p className="text-gray-500 text-sm">Controle de homologação, dados cadastrais e conformidade documental.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> Novo Fornecedor
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="px-8 py-5">Fornecedor</th>
              <th className="px-6 py-5">CNPJ / CPF</th>
              <th className="px-6 py-5">Contato</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-blue-50/20 transition-all text-sm group">
                <td className="px-8 py-5 font-bold text-slate-800">{s.name}</td>
                <td className="px-6 py-5 text-slate-500 font-mono text-xs">{s.taxId}</td>
                <td className="px-6 py-5 text-slate-500 text-xs">{s.contactEmail}</td>
                <td className="px-6 py-5">
                   <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase">Homologado</span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button 
                    onClick={() => openModal(s)}
                    className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-800">{editingId ? 'Ficha do Fornecedor' : 'Novo Fornecedor'}</h2>
                <p className="text-xs text-slate-400 font-bold uppercase">{editingId || 'Aguardando Cadastro'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {editingId && (
              <div className="flex border-b border-gray-100 bg-white">
                <button 
                  onClick={() => setActiveTab('DATA')}
                  className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'DATA' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  <i className="fas fa-info-circle mr-2"></i> Dados Cadastrais
                </button>
                <button 
                  onClick={() => setActiveTab('DOCS')}
                  className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'DOCS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  <i className="fas fa-file-shield mr-2"></i> Documentos & Conformidade
                </button>
              </div>
            )}

            <div className="p-8">
              {activeTab === 'DATA' ? (
                <div className="space-y-6">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Razão Social / Nome</label>
                     <input className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">CNPJ / CPF</label>
                       <input className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.taxId} onChange={e => setForm({...form, taxId: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email de Contato</label>
                       <input type="email" className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo de Anexo</label>
                       <select 
                         className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
                         value={selectedDocType}
                         onChange={(e) => setSelectedDocType(e.target.value as any)}
                       >
                         <option value="CONTRACT">Contrato Social / Razão Social</option>
                         <option value="BANK">Comprovante Bancário</option>
                         <option value="OTHER">Outras Certidões/Docs</option>
                       </select>
                    </div>
                    <div className="flex items-end">
                      <input 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload}
                        accept=".pdf,.png,.jpg,.jpeg"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full bg-blue-600 text-white p-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {isUploading ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-upload"></i>}
                        Selecionar e Enviar Arquivo
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2">
                    {documents.map(doc => (
                      <div key={doc.id} className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${
                            doc.mimeType.includes('pdf') ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'
                          }`}>
                            <i className={`fas ${doc.mimeType.includes('pdf') ? 'fa-file-pdf' : 'fa-file-image'}`}></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-800 truncate max-w-[180px]">{doc.name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getDocTypeColor(doc.type)}`}>
                                {getDocTypeLabel(doc.type)}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{(doc.size / 1024).toFixed(1)} KB • Enviado em {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => downloadDoc(doc)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center">
                            <i className="fas fa-download"></i>
                          </button>
                          <button onClick={() => deleteDoc(doc.id)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center">
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                    {documents.length === 0 && (
                      <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                        <i className="fas fa-folder-open text-3xl text-slate-100 mb-2"></i>
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Nenhum documento de conformidade anexado.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
                {editingId ? 'Confirmar Atualização' : 'Finalizar Cadastro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
