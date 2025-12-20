import { Permission, Scope } from '../types';
import { normalizeScope } from './scope';

/**
 * Validates and normalizes a scope, ensuring tenantId exists
 */
export const requireScope = (scope?: Scope): Scope => {
  if (!scope || !scope.tenantId) {
    throw new Error('Scope must have tenantId');
  }
  return normalizeScope(scope);
};

/**
 * Wrapper around hasPermission that enforces scope validation
 */
export const can = (
  permission: Permission,
  scope: Scope | undefined,
  hasPermissionFn: (permission: Permission, scope?: Scope) => boolean
): boolean => {
  if (!scope) return false;
  const normalizedScope = requireScope(scope);
  return hasPermissionFn(permission, normalizedScope);
};
