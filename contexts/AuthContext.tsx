
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, Permission, RoleAssignment, Scope } from '../types';
import { ROLE_PERMISSIONS } from '../constants';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission, scope?: Scope) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('AUTH_USER');
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  const login = async (email: string, password?: string) => {
    const user = await api.login(email, password);
    setUser(user);
    localStorage.setItem('AUTH_USER', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('AUTH_USER');
  };

  const hasPermission = (permission: Permission, targetScope?: Scope): boolean => {
    if (!user) return false;

    // Verifica se alguma das atribuições do usuário concede a permissão solicitada no escopo alvo
    return user.roleAssignments.some(ra => {
      const rolePerms = ROLE_PERMISSIONS[ra.role] || [];
      
      // 1. O papel do usuário possui essa permissão?
      if (!rolePerms.includes(permission)) return false;

      // 2. Se não houver escopo alvo (ex: verificação genérica de menu), 
      // basta ter a permissão em algum lugar.
      if (!targetScope) return true;

      // 3. Validação de Tenant (Empresa)
      if (ra.scope.tenantId !== targetScope.tenantId) return false;

      // 4. Lógica de Hierarquia de Escopo:
      // Se a atribuição do usuário é global (só tenant), ele tem acesso a tudo.
      if (!ra.scope.workId && !ra.scope.warehouseId) return true;

      // Se o alvo da verificação é global, mas o usuário é restrito, 
      // permitimos a visão (ex: ver o menu), mas a filtragem de dados cuidará do resto.
      if (!targetScope.workId && !targetScope.warehouseId) return true;

      // Se a atribuição do usuário é de Obra:
      if (ra.scope.workId) {
        // Bloqueia se a obra alvo for diferente da obra permitida
        if (targetScope.workId && ra.scope.workId !== targetScope.workId) return false;
      }

      // Se a atribuição do usuário é de Almoxarifado:
      if (ra.scope.warehouseId) {
        // Bloqueia se o almoxarifado alvo for diferente do permitido
        if (targetScope.warehouseId && ra.scope.warehouseId !== targetScope.warehouseId) return false;
        // Se o alvo for uma obra, mas o usuário for restrito a um almox dela, 
        // ele tem acesso à obra (visão parcial).
      }

      return true;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
