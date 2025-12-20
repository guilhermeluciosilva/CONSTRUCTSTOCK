import { Scope, RM, PO, Transfer } from '../types';
import { normalizeScope } from './scope';

/**
 * Construct a scope from an RM (Requisição de Materiais)
 */
export const scopeFromRM = (rm: RM): Scope => {
  return normalizeScope({
    tenantId: rm.tenantId,
    unitId: rm.unitId,
    workId: rm.workId,
    warehouseId: rm.warehouseId,
  });
};

/**
 * Construct a scope from a PO (Pedido de Compra)
 */
export const scopeFromPO = (po: PO): Scope => {
  return normalizeScope({
    tenantId: po.tenantId,
    unitId: po.unitId,
    workId: po.workId,
  });
};

/**
 * Construct a scope from a Transfer
 */
export const scopeFromTransfer = (transfer: Transfer): Scope => {
  return normalizeScope({
    tenantId: transfer.tenantId,
  });
};
