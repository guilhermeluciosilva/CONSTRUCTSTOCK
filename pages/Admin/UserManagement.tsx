
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { User, Role, RoleAssignment, Unit, Warehouse, Sector, OperationType, Permission } from '../../types';
import { ROLE_DESCRIPTIONS, PERMISSION_LABELS, ROLE_PERMISSIONS } from '../../constants';

export const UserManagement: React.FC = () => {
  const { currentScope, units, warehouses, sectors, activeTenant, getLabel } = useApp();
  const { notify } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: Role.VIEWER });

  useEffect(() => {
    if (currentScope?.tenantId) loadUsers();
  }, [currentScope]);

  const loadUsers = async () => {
    const data = await api.getUsers(currentScope!.tenantId);
    setUsers(data);
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) return notify('Preencha os campos obrigatórios', 'warning');
    try {
      const user = await api.createUser(newUser.name, newUser.email, currentScope!.tenantId, newUser.password);
      await api.updateUserAssignments(user.id, [{ role: newUser.role, scope: { tenantId: currentScope!.tenantId } }]);
      notify('Colaborador criado com sucesso!', 'success');
      setShowAddModal(false);
      setNewUser({ name: '', email: '', password: '', role: Role.VIEWER });
      loadUsers();
    } catch (err: any) { notify(err.message, 'error'); }
  };

  const handleSaveAssignments = async () => {
    if (!selectedUser) return;
    await api.updateUserAssignments(selectedUser.id, selectedUser.roleAssignments);
    notify('Permissões atualizadas!', 'success');
    setIsEditing(false);
    loadUsers();
  };

  const getCompatibleRoles = () => {
    const base = [Role.OWNER, Role.ADMIN, Role.PURCHASING, Role.VIEWER];
    if (activeTenant?.operationType === OperationType.STORE) return [...base, Role.CAIXA_VENDEDOR, Role.GERENTE_LOJA];
    if (activeTenant?.operationType === OperationType.FACTORY) return [...base, Role.GERENTE_PLANTA, Role.LIDER_SETOR, Role.ALMOX_SETOR];
    return [...base, Role.COORDINATOR, Role.REQUESTER, Role.WH_CENTRAL, Role.WH_SITE];
  };

  const addAssignment = () => {
    if (!selectedUser) return;
    const newRA: RoleAssignment = { role: Role.VIEWER, scope: { tenantId: currentScope!.tenantId }, customPermissions: [] };
    setSelectedUser({ ...selectedUser, roleAssignments: [...selectedUser.roleAssignments, newRA] });
  };

  const updateAssignment = (index: number, updates: Partial<RoleAssignment>) => {
    if (!selectedUser) return;
    const newAssignments = [...selectedUser.roleAssignments];
    newAssignments[index] = { ...newAssignments[index], ...updates };
    setSelectedUser({ ...selectedUser, roleAssignments: newAssignments });
  };

  const toggleCustomPermission = (raIdx: number, perm: Permission) => {
    if (!selectedUser) return;
    const ra = selectedUser.roleAssignments[raIdx];
    const current = ra.customPermissions || [];
    const updated = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
    updateAssignment(raIdx, { customPermissions: updated });
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Colaboradores</h1>
          <p className="text-gray-500 text-sm italic">Atribua cargos e defina o escopo de atuação (setores e unidades).</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg shadow-slate-200">
          <i className="fas fa-user-plus mr-2"></i> Adicionar Colaborador
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b"><h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Membros da Empresa</h3></div>
          <div className="divide-y divide-slate-50 overflow-y-auto max-h-[600px] custom-scrollbar">
            {users.map(u => (
              <button 
                key={u.id} onClick={() => { setSelectedUser(u); setIsEditing(false); }}
                className={`w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-all text-left ${selectedUser?.id === u.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-black">{u.name.charAt(0)}</div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{u.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[500px]">
          {selectedUser ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-blue-200">{selectedUser.name.charAt(0)}</div>
                  <div><h2 className="text-lg font-black text-slate-800">{selectedUser.name}</h2><p className="text-xs text-slate-400 font-medium">{selectedUser.email}</p></div>
                </div>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-white border rounded-xl text-blue-600 font-black text-xs uppercase shadow-sm">Editar Acessos</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-400 font-black text-xs">Cancelar</button>
                    <button onClick={handleSaveAssignments} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-200">Salvar</button>
                  </div>
                )}
              </div>

              <div className="p-8 flex-1 space-y-8 overflow-y-auto max-h-[700px] custom-scrollbar">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Escopos Atribuídos</h3>
                  {isEditing && <button onClick={addAssignment} className="text-blue-600 font-black text-[10px] uppercase hover:underline">+ Nova Regra</button>}
                </div>

                <div className="space-y-6">
                  {selectedUser.roleAssignments.map((ra, idx) => (
                    <div key={idx} className="p-6 bg-slate-50 border rounded-3xl space-y-4 shadow-inner">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400">Cargo / Role</label>
                          <select 
                            disabled={!isEditing} className="w-full p-3 bg-white border rounded-xl text-xs font-bold outline-none shadow-sm"
                            value={ra.role} onChange={e => updateAssignment(idx, { role: e.target.value as Role })}
                          >
                            {getCompatibleRoles().map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400">Unidade ({getLabel('UNIT')})</label>
                          <select 
                            disabled={!isEditing} className="w-full p-3 bg-white border rounded-xl text-xs font-bold outline-none shadow-sm"
                            value={ra.scope.unitId || ra.scope.workId || ''} onChange={e => updateAssignment(idx, { scope: { ...ra.scope, unitId: e.target.value, workId: e.target.value, sectorId: undefined, warehouseId: undefined } })}
                          >
                            <option value="">Todas as {getLabel('UNIT')}s</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                      </div>
                      
                      <div className="px-2 py-1">
                        <p className="text-[10px] font-medium text-slate-500 italic leading-relaxed">
                          <i className="fas fa-info-circle mr-1 text-blue-400"></i>
                          {ROLE_DESCRIPTIONS[ra.role]}
                        </p>
                      </div>

                      {/* Nova seção de personalização */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                         <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Permissões Extras (Opcional)</h4>
                            {(ra.customPermissions?.length || 0) > 0 && <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black">{ra.customPermissions?.length} adicionadas</span>}
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(PERMISSION_LABELS).map(([perm, label]) => {
                               const isBase = ROLE_PERMISSIONS[ra.role]?.includes(perm as Permission);
                               const isCustom = ra.customPermissions?.includes(perm as Permission);
                               return (
                                 <button 
                                   key={perm}
                                   disabled={!isEditing || isBase}
                                   onClick={() => toggleCustomPermission(idx, perm as Permission)}
                                   className={`p-2 rounded-lg text-left text-[10px] font-bold transition-all border flex items-center gap-2 ${
                                     isBase ? 'bg-emerald-50 border-emerald-100 text-emerald-700 opacity-60' :
                                     isCustom ? 'bg-blue-600 border-blue-600 text-white shadow-md' :
                                     'bg-white border-slate-200 text-slate-500 hover:border-blue-400'
                                   }`}
                                 >
                                    <i className={`fas ${isBase ? 'fa-check-double' : isCustom ? 'fa-check' : 'fa-plus'} w-3`}></i>
                                    <span className="truncate">{label}</span>
                                 </button>
                               );
                            })}
                         </div>
                         <p className="text-[8px] text-slate-400 mt-2 font-black uppercase tracking-tighter">As permissões em verde já fazem parte do cargo base e não podem ser removidas individualmente.</p>
                      </div>

                      {isEditing && (
                        <div className="pt-2">
                           <button onClick={() => setSelectedUser({...selectedUser, roleAssignments: selectedUser.roleAssignments.filter((_, i) => i !== idx)})} className="text-rose-500 text-[10px] font-black uppercase hover:underline">Remover Regra</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-3xl text-slate-200"><i className="fas fa-users-cog"></i></div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Selecione um colaborador para ver as permissões</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800">Novo Colaborador</h2>
            </div>
            <div className="p-8 space-y-4">
              <input className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm outline-none" placeholder="Nome Completo" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              <input className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm outline-none" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              <input type="password" className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm outline-none" placeholder="Senha Temporária" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Cargo Inicial</label>
                <select className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-sm outline-none" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})}>
                  {getCompatibleRoles().map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 italic mt-2 px-1">{ROLE_DESCRIPTIONS[newUser.role]}</p>
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400">Descartar</button>
              <button onClick={handleCreateUser} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg">Criar Usuário</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
