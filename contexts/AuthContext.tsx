
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

    return user.roleAssignments.some(ra => {
      const rolePerms = ROLE_PERMISSIONS[ra.role] || [];
      const customPerms = ra.customPermissions || [];
      
      // 1. O papel do usuário OU as permissões customizadas possuem essa permissão?
      if (!rolePerms.includes(permission) && !customPerms.includes(permission)) return false;

      // 2. Se não houver escopo alvo (ex: verificação genérica de menu), basta ter a permissão.
      if (!targetScope) return true;

      // 3. Validação de Tenant
      if (ra.scope.tenantId !== targetScope.tenantId) return false;

      // 4. Lógica de Hierarquia de Escopo:
      if (!ra.scope.workId && !ra.scope.warehouseId) return true;
      if (!targetScope.workId && !targetScope.warehouseId) return true;

      if (ra.scope.workId) {
        if (targetScope.workId && ra.scope.workId !== targetScope.workId) return false;
      }

      if (ra.scope.warehouseId) {
        if (targetScope.warehouseId && ra.scope.warehouseId !== targetScope.warehouseId) return false;
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
