
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { User, Role, RoleAssignment, Unit, Warehouse, Sector, OperationType } from '../../types';

export const UserManagement: React.FC = () => {
  const { currentScope, units, warehouses, sectors, activeTenant, getLabel } = useApp();
  const { notify } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '' });

  useEffect(() => {
    if (currentScope?.tenantId) loadUsers();
  }, [currentScope]);

  const loadUsers = async () => {
    const data = await api.getUsers(currentScope!.tenantId);
    setUsers(data);
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
    const newRA: RoleAssignment = { role: Role.VIEWER, scope: { tenantId: currentScope!.tenantId } };
    setSelectedUser({ ...selectedUser, roleAssignments: [...selectedUser.roleAssignments, newRA] });
  };

  const updateAssignment = (index: number, updates: Partial<RoleAssignment>) => {
    if (!selectedUser) return;
    const newAssignments = [...selectedUser.roleAssignments];
    newAssignments[index] = { ...newAssignments[index], ...updates };
    setSelectedUser({ ...selectedUser, roleAssignments: newAssignments });
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

              <div className="p-8 flex-1 space-y-8 overflow-y-auto max-h-[500px] custom-scrollbar">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Escopos Atribuídos</h3>
                  {isEditing && <button onClick={addAssignment} className="text-blue-600 font-black text-[10px] uppercase hover:underline">+ Nova Regra</button>}
                </div>

                <div className="space-y-4">
                  {selectedUser.roleAssignments.map((ra, idx) => (
                    <div key={idx} className="p-5 bg-slate-50 border rounded-2xl space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400">Cargo / Role</label>
                          <select 
                            disabled={!isEditing} className="w-full p-2.5 bg-white border rounded-xl text-xs font-bold outline-none"
                            value={ra.role} onChange={e => updateAssignment(idx, { role: e.target.value as Role })}
                          >
                            {getCompatibleRoles().map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400">Unidade ({getLabel('UNIT')})</label>
                          <select 
                            disabled={!isEditing} className="w-full p-2.5 bg-white border rounded-xl text-xs font-bold outline-none"
                            value={ra.scope.unitId || ''} onChange={e => updateAssignment(idx, { scope: { ...ra.scope, unitId: e.target.value, sectorId: undefined, warehouseId: undefined } })}
                          >
                            <option value="">Todas as {getLabel('UNIT')}s</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                      </div>

                      {activeTenant?.operationType === OperationType.FACTORY && ra.scope.unitId && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400">Setor Atribuído</label>
                          <select 
                            disabled={!isEditing} className="w-full p-2.5 bg-white border rounded-xl text-xs font-bold outline-none"
                            value={ra.scope.sectorId || ''} onChange={e => updateAssignment(idx, { scope: { ...ra.scope, sectorId: e.target.value } })}
                          >
                            <option value="">Todo a Planta (Geral)</option>
                            {sectors.filter(s => s.unitId === ra.scope.unitId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 italic">
                        <p><i className="fas fa-shield-alt mr-1 text-blue-500"></i> Este colaborador poderá realizar ações permitidas pelo cargo em todo o escopo definido.</p>
                        {isEditing && <button onClick={() => setSelectedUser({...selectedUser, roleAssignments: selectedUser.roleAssignments.filter((_, i) => i !== idx)})} className="text-rose-500 hover:underline">Remover</button>}
                      </div>
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
    </div>
  );
};
