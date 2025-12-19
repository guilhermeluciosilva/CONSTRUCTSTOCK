
export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  COORDINATOR = 'COORDINATOR',
  REQUESTER = 'REQUESTER',
  WH_CENTRAL = 'WH_CENTRAL',
  WH_SITE = 'WH_SITE',
  PURCHASING = 'PURCHASING',
  VIEWER = 'VIEWER',
  // Novos Cargos Loja
  CAIXA_VENDEDOR = 'CAIXA_VENDEDOR',
  GERENTE_LOJA = 'GERENTE_LOJA',
  // Novos Cargos Fábrica
  GERENTE_PLANTA = 'GERENTE_PLANTA',
  LIDER_SETOR = 'LIDER_SETOR',
  ALMOX_SETOR = 'ALMOX_SETOR'
}

export enum OperationType {
  STORE = 'STORE',    // LOJA
  CONSTRUCTION = 'CONSTRUCTION', // OBRAS
  FACTORY = 'FACTORY' // FÁBRICA
}

export type Permission = 
  | 'RM_VIEW' | 'RM_CREATE' | 'RM_EDIT_OWN' | 'RM_APPROVE_L1' | 'RM_APPROVE_L2' | 'RM_CANCEL'
  | 'RM_FORWARD_TO_PURCHASE' | 'RM_FULFILL_FROM_STOCK'
  | 'PO_VIEW' | 'PO_CREATE' | 'PO_EDIT' | 'PO_CLOSE'
  | 'STOCK_VIEW' | 'STOCK_ENTRY' | 'STOCK_EXIT' | 'STOCK_ADJUST' | 'LEDGER_VIEW'
  | 'TRANSFER_CREATE' | 'TRANSFER_DISPATCH' | 'TRANSFER_RECEIVE' | 'TRANSFER_REPORT_DIVERGENCE'
  | 'DOC_VIEW' | 'DOC_UPLOAD' | 'DOC_DOWNLOAD' | 'DOC_DELETE'
  | 'REPORT_VIEW' | 'REPORT_EXPORT'
  | 'USER_MANAGE' | 'ORG_MANAGE' | 'MATERIAL_CATALOG_MANAGE' | 'SUPPLIER_MANAGE'
  | 'IMPORT_CSV'
  | 'SALE_VIEW' | 'SALE_CREATE' | 'SALE_CANCEL' | 'SALE_REPORT'
  | 'SETTINGS_MANAGE';

export interface Scope {
  tenantId: string;
  unitId?: string; 
  sectorId?: string; 
  warehouseId?: string;
  // Compatibilidade
  workId?: string; 
}

export interface RoleAssignment {
  role: Role;
  scope: Scope;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  roleAssignments: RoleAssignment[];
}

export interface Tenant {
  id: string;
  name: string;
  operationType: OperationType;
  active: boolean;
}

export interface Unit {
  id: string;
  tenantId: string;
  name: string;
  active: boolean;
  enabledModuleIds?: string[];
}

export interface Sector {
  id: string;
  unitId: string;
  name: string;
  active: boolean;
}

export interface Warehouse {
  id: string;
  unitId: string;
  sectorId?: string; 
  name: string;
  isCentral: boolean;
  active: boolean;
  workId: string;
}

export interface Material {
  id: string;
  sku: string;
  name: string;
  unit: string;
  category: string;
  minStock: number;
  salePrice?: number;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  taxId: string;
  contactEmail: string;
  active: boolean;
}

export enum RMStatus {
  DRAFT = 'DRAFT',
  WAITING_L1 = 'WAITING_L1',
  WAITING_L2 = 'WAITING_L2',
  APPROVED = 'APPROVED',
  IN_FULFILLMENT = 'IN_FULFILLMENT',
  IN_TRANSIT = 'IN_TRANSIT',
  PARTIAL_RECEIVED = 'PARTIAL_RECEIVED',
  DONE = 'DONE',
  CANCELED = 'CANCELED'
}

export enum RMItemStatus {
  PENDING = 'PENDING',
  FROM_STOCK = 'FROM_STOCK',
  FOR_PURCHASE = 'FOR_PURCHASE',
  SEPARATION = 'SEPARATION',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED_PARTIAL = 'RECEIVED_PARTIAL',
  RECEIVED = 'RECEIVED',
  CANCELED = 'CANCELED'
}

export interface RM {
  id: string;
  requesterId: string;
  tenantId: string;
  unitId: string;
  warehouseId: string;
  dateRequired: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: RMStatus;
  observations: string;
  createdAt: string;
  workId: string;
}

export interface RMItem {
  id: string;
  rmId: string;
  materialId: string;
  quantityRequested: number;
  quantityFulfilled: number;
  estimatedPrice: number;
  status: RMItemStatus;
  observations?: string;
}

export interface Stock {
  warehouseId: string;
  materialId: string;
  quantity: number;
  reserved: number;
}

export interface Movement {
  id: string;
  warehouseId: string;
  materialId: string;
  type: 'ENTRY' | 'EXIT' | 'ADJUST' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'SALE';
  quantity: number;
  userId: string;
  timestamp: string;
  referenceId?: string; 
  description: string;
}

export interface Sale {
  id: string;
  tenantId: string;
  unitId: string;
  warehouseId: string;
  sellerId: string;
  customerName?: string;
  totalAmount: number;
  status: 'COMPLETED' | 'CANCELED';
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
}

export interface PO {
  id: string;
  tenantId: string;
  unitId: string;
  supplierId: string;
  status: 'OPEN' | 'PARTIAL' | 'CLOSED' | 'CANCELED';
  deliveryDate: string;
  totalAmount: number;
  createdAt: string;
  workId: string;
}

export interface POItem {
  id: string;
  poId: string;
  rmItemId: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
}

export interface Transfer {
  id: string;
  tenantId: string;
  originWarehouseId: string;
  destinationWarehouseId: string;
  status: 'CREATED' | 'SEPARATED' | 'IN_TRANSIT' | 'RECEIVED' | 'DONE' | 'DIVERGENCE';
  createdAt: string;
  dispatchedAt?: string;
  receivedAt?: string;
  rmId?: string;
}

export interface TransferItem {
  id: string;
  transferId: string;
  rmItemId?: string;
  materialId: string;
  quantityRequested: number;
  quantitySent: number;
  quantityReceived: number;
}

export interface Document {
  id: string;
  name: string;
  type: 'NF' | 'CQ' | 'GUIA' | 'CONTRACT' | 'BANK' | 'OTHER';
  mimeType: string;
  size: number;
  relatedId: string; 
  uploadedAt: string;
  base64?: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  entityId: string;
  entityType: 'RM' | 'TRANSFER' | 'PO' | 'STOCK' | 'USER' | 'MATERIAL' | 'ORG' | 'SALE';
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
}

export type Work = Unit;
