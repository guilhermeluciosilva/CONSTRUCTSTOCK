
import { Scope } from '../types';

/**
 * Retorna o unitId canônico do escopo, aceitando tanto unitId quanto workId (legado).
 */
export const getScopeUnitId = (scope: Scope | null | undefined): string | undefined => {
  return scope?.unitId || scope?.workId;
};

/**
 * Garante que unitId e workId estejam sincronizados no objeto de escopo para evitar quebras em telas legadas.
 */
export const normalizeScope = (scope: Scope): Scope => {
  const unitId = scope.unitId || scope.workId;
  return {
    ...scope,
    unitId: unitId,
    workId: unitId
  };
};
