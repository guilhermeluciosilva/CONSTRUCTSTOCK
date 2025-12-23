
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { User, Role, RoleAssignment, Unit, Permission } from '../../types';
import { PERMISSION_LABELS } from '../../constants';

// Agrupamento de permissões para facilitar a visualização no checklist
const PERMISSION_GROUPS: Record<string, Permission[]> = {
  'Estoque & Inventário': ['STOCK_VIEW', 'STOCK_ENTRY', 'STOCK_EXIT', 'STOCK_ADJUST', 'LEDGER_VIEW'],
  'Vendas & PDV': ['SALE_VIEW', 'SALE_CREATE', 'SALE_CANCEL', 'SALE_REPORT'],
  'Gastronomia (Restaurante)': ['TABLE_MANAGE', 'RESTAURANT_MANAGE'],
  'Requisições (RM)': ['RM_VIEW', 'RM_CREATE', 'RM_EDIT_OWN', 'RM_APPROVE_L1', 'RM_APPROVE_L2', 'RM_CANCEL', 'RM_FORWARD_TO_PURCHASE', 'RM_FULFILL_FROM_STOCK'],
  'Compras (PO)': ['PO_VIEW', 'PO_CREATE', 'PO_EDIT', 'PO_CLOSE'],
  'Logística & Transferências': ['TRANSFER_CREATE', 'TRANSFER_DISPATCH', 'TRANSFER_RECEIVE', 'TRANSFER_REPORT_DIVERGENCE'],
  'Documentos & Relatórios': ['DOC_VIEW', 'DOC_UPLOAD', 'DOC_DOWNLOAD', 'DOC_DELETE', 'REPORT_VIEW', 'REPORT_EXPORT'],
  'Administração & Sistema': ['USER_MANAGE', 'ORG_MANAGE', 'MATERIAL_CATALOG_MANAGE', 'SUPPLIER_MANAGE', 'IMPORT_CSV', 'SETTINGS_MANAGE']
};

export const UserManagement: React.FC = () => {
  const { currentScope, units, getLabel } = useApp();
  const { notify } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    unitId: '',
    permissions: [] as Permission[] 
  });

  useEffect(() => {
    if (currentScope?.tenantId) loadUsers();
  }, [currentScope]);

  const loadUsers = async () => {
    const data = await api.getUsers(currentScope!.tenantId);
    setUsers(data);
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) return notify('Preencha os campos obrigatórios', 'warning');
    if (newUser.permissions.length === 0) return notify('Selecione pelo menos uma permissão', 'warning');
    
    try {
      const user = await api.createUser(newUser.name, newUser.email, currentScope!.tenantId, newUser.password);
      await api.updateUserAssignments(user.id, [{ 
        role: Role.VIEWER, 
        scope: { tenantId: currentScope!.tenantId, unitId: newUser.unitId || undefined, workId: newUser.unitId || undefined },
        customPermissions: newUser.permissions
      }]);
      notify('Colaborador adicionado com permissões customizadas!', 'success');
      setShowAddModal(false);
      setNewUser({ name: '', email: '', password: '', unitId: '', permissions: [] });
      loadUsers();
    } catch (err: any) { notify(err.message, 'error'); }
  };

  const handleSaveAssignments = async () => {
    if (!selectedUser) return;
    await api.updateUserAssignments(selectedUser.id, selectedUser.roleAssignments);
    notify('Acessos atualizados com sucesso!', 'success');
    setIsEditing(false);
    loadUsers();
  };

  const addAssignment = () => {
    if (!selectedUser) return;
    const newRA: RoleAssignment = { 
      role: Role.VIEWER, 
      scope: { tenantId: currentScope!.tenantId }, 
      customPermissions: [] 
    };
    setSelectedUser({ ...selectedUser, roleAssignments: [...selectedUser.roleAssignments, newRA] });
  };

  const updateAssignment = (index: number, updates: Partial<RoleAssignment>) => {
    if (!selectedUser) return;
    const newAssignments = [...selectedUser.roleAssignments];
    newAssignments[index] = { ...newAssignments[index], ...updates };
    setSelectedUser({ ...selectedUser, roleAssignments: newAssignments });
  };

  const togglePermission = (raIdx: number, perm: Permission) => {
    if (!selectedUser) return;
    const ra = selectedUser.roleAssignments[raIdx];
    const current = ra.customPermissions || [];
    const updated = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
    updateAssignment(raIdx, { customPermissions: updated });
  };

  const toggleNewUserPermission = (perm: Permission) => {
    setNewUser(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm) 
        ? prev.permissions.filter(p => p !== perm) 
        : [...prev.permissions, perm]
    }));
  };

  const PermissionChecklist = ({ 
    selectedPerms, 
    onToggle, 
    disabled = false 
  }: { 
    selectedPerms: Permission[], 
    onToggle: (p: Permission) => void,
    disabled?: boolean 
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      {Object.entries(PERMISSION_GROUPS).map(([groupName, perms]) => (
        <div key={groupName} className="space-y-3">
          <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-b border-blue-50 pb-1">{groupName}</h4>
          <div className="space-y-2">
            {perms.map(p => (
              <label key={p} className={`flex items-center gap-3 cursor-pointer group transition-opacity ${disabled ? 'opacity-60 cursor-default' : ''}`}>
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    className="peer hidden" 
                    checked={selectedPerms.includes(p)}
                    onChange={() => !disabled && onToggle(p)}
                    disabled={disabled}
                  />
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${selectedPerms.includes(p) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200 group-hover:border-blue-400'}`}>
                    {selectedPerms.includes(p) && <i className="fas fa-check text-[10px] text-white"></i>}
                  </div>
                </div>
                <span className={`text-[11px] font-bold uppercase transition-colors ${selectedPerms.includes(p) ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {PERMISSION_LABELS[p]}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Time & Permissões</h1>
          <p className="text-gray-500 text-sm">Configure acessos granulares para cada membro da equipe.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">
          <i className="fas fa-user-plus mr-2"></i> Adicionar Membro
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lista de Usuários */}
        <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col max-h-[700px]">
          <div className="p-5 bg-slate-50 border-b shrink-0"><h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Colaboradores ({users.length})</h3></div>
          <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar flex-1">
            {users.map(u => (
              <button 
                key={u.id} onClick={() => { setSelectedUser(u); setIsEditing(false); }}
                className={`w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition-all text-left group ${selectedUser?.id === u.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm transition-colors ${selectedUser?.id === u.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{u.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold truncate">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Painel de Permissões */}
        <div className="lg:col-span-9 bg-white rounded-[32px] shadow-sm border border-slate-100 min-h-[600px] flex flex-col overflow-hidden">
          {selectedUser ? (
            <div className="flex flex-col h-full">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-2xl shadow-blue-500/30">{selectedUser.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{selectedUser.name}</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-blue-600 font-black text-xs uppercase shadow-sm hover:border-blue-500 transition-all">Editar Permissões</button>
                  ) : (
                    <>
                      <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                      <button onClick={handleSaveAssignments} className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">Salvar Alterações</button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-10 bg-slate-50/30">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Escopos de Acesso</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Defina permissões específicas para cada unidade operacional.</p>
                  </div>
                  {isEditing && <button onClick={addAssignment} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-black text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all">+ Nova Unidade</button>}
                </div>

                <div className="space-y-8">
                  {selectedUser.roleAssignments.map((ra, idx) => (
                    <div key={idx} className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm animate-in slide-in-from-bottom-2">
                      <div className="p-6 bg-slate-50/80 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1 flex-1 w-full md:w-auto">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Unidade Vinculada</label>
                          <select 
                            disabled={!isEditing} 
                            className="w-full md:w-64 p-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                            value={ra.scope.unitId || ''} 
                            onChange={e => updateAssignment(idx, { scope: { ...ra.scope, unitId: e.target.value, workId: e.target.value } })}
                          >
                            <option value="">Acesso Global (Todas Unidades)</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                        {isEditing && (
                          <button onClick={() => setSelectedUser({...selectedUser, roleAssignments: selectedUser.roleAssignments.filter((_, i) => i !== idx)})} className="text-rose-500 text-[10px] font-black uppercase flex items-center gap-2 hover:bg-rose-50 px-3 py-2 rounded-lg transition-all">
                            <i className="fas fa-trash-alt"></i> Remover Escopo
                          </button>
                        )}
                      </div>
                      
                      <div className="p-8 bg-white">
                         <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Módulos & Ações Permitidas</h5>
                         <PermissionChecklist 
                           selectedPerms={ra.customPermissions || []} 
                           onToggle={(p) => togglePermission(idx, p)}
                           disabled={!isEditing}
                         />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-4xl text-slate-200 shadow-inner border border-slate-50"><i className="fas fa-user-shield"></i></div>
              <div className="space-y-2">
                 <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Gestão de Permissões</h3>
                 <p className="text-slate-300 font-bold uppercase text-[10px] tracking-widest max-w-[280px]">Selecione um colaborador ao lado para configurar seus acessos detalhados por unidade.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Adição com Checklist de Permissões Iniciais */}
      {showAddModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Novo Colaborador</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Configurar perfil e acessos iniciais</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors"><i className="fas fa-times text-2xl"></i></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Informações Básicas</h3>
                   <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Nome Completo</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600 shadow-inner" placeholder="Ex: João da Silva" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">E-mail de Acesso</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600 shadow-inner" placeholder="Ex: joao@empresa.com" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Senha Provisória</label>
                        <input type="password" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600 shadow-inner" placeholder="Mínimo 4 caracteres" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                     </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Escopo Inicial</h3>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Unidade Padrão</label>
                      <select 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600 shadow-inner uppercase"
                        value={newUser.unitId} 
                        onChange={e => setNewUser({...newUser, unitId: e.target.value})}
                      >
                         <option value="">Acesso Global (Todas)</option>
                         {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-3 font-medium leading-relaxed italic">Este usuário será criado com o papel de observador, mas as permissões abaixo darão o controle real das ferramentas.</p>
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-2 flex justify-between items-center">
                  Configurar Grade de Permissões
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg">{newUser.permissions.length} Selecionadas</span>
                </h3>
                <PermissionChecklist 
                  selectedPerms={newUser.permissions}
                  onToggle={toggleNewUserPermission}
                />
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
              <button 
                onClick={handleCreateUser} 
                className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase shadow-2xl shadow-blue-500/30 active:scale-95 transition-all hover:bg-blue-700"
              >
                Finalizar Cadastro e Liberar Acessos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
