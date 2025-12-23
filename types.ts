
export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
  REQUESTER = 'REQUESTER',
  WH_CENTRAL = 'WH_CENTRAL',
  PURCHASING = 'PURCHASING',
  VIEWER = 'VIEWER'
}

export enum OperationType {
  STORE = 'STORE',
  CONSTRUCTION = 'CONSTRUCTION',
  FACTORY = 'FACTORY',
  RESTAURANT = 'RESTAURANT',
  OTHER = 'OTHER'
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
  | 'TABLE_MANAGE' | 'SETTINGS_MANAGE'
  | 'RESTAURANT_MANAGE';

export interface Scope {
  tenantId: string;
  unitId?: string; 
  sectorId?: string; 
  warehouseId?: string;
  workId?: string; 
}

export interface RoleAssignment {
  role: Role;
  scope: Scope;
  customPermissions?: Permission[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  personalDocument?: string;
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
  operationType?: OperationType;
}

/**
 * Added Sector interface to fix missing member error.
 */
export interface Sector {
  id: string;
  unitId: string;
  name: string;
}

/**
 * Added Warehouse interface to fix missing member error.
 */
export interface Warehouse {
  id: string;
  unitId: string;
  name: string;
  isCentral: boolean;
  active: boolean;
  workId?: string;
  // Added sectorId to fix Property 'sectorId' does not exist on type 'Warehouse' error.
  sectorId?: string;
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

export interface RecipeIngredient {
  materialId: string;
  qty: number;
}

/**
 * Added Recipe interface to fix missing member error.
 */
export interface Recipe {
  id: string;
  tenantId: string;
  unitId: string;
  name: string;
  yieldQty: number;
  yieldUnit: string;
  ingredients: RecipeIngredient[];
}

export interface MenuItem {
  id: string;
  tenantId: string;
  unitId: string;
  name: string;
  category: string;
  price: number;
  isActive: boolean;
  // Ficha Técnica acoplada
  ingredients: RecipeIngredient[];
  yieldQty: number;
  yieldUnit: string;
  notes?: string;
  createdAt: string;
}

export interface RestaurantTable {
  id: string;
  tenantId: string;
  unitId: string;
  nameOrNumber: string;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';
  activeTabId?: string;
  capacity: number;
}

export interface TabItem {
  id: string;
  menuItemId: string;
  nameSnapshot: string;
  qty: number;
  unitPriceSnapshot: number;
  status: 'PENDING' | 'IN_PREP' | 'SERVED' | 'CANCELED';
  notes?: string;
  createdAt: string;
}

export interface Tab {
  id: string;
  tenantId: string;
  unitId: string;
  tableId: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELED';
  openedAt: string;
  closedAt?: string;
  customerName?: string;
  items: TabItem[];
  totalAmount: number;
  paymentMethod?: 'CASH' | 'PIX' | 'CARD';
  peopleCount?: number;
}

export interface Movement {
  id: string;
  warehouseId: string;
  materialId: string;
  type: 'ENTRY' | 'EXIT' | 'ADJUST' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'SALE' | 'RECIPE_CONSUMPTION' | 'LOSS';
  quantity: number;
  userId: string;
  timestamp: string;
  referenceId?: string; 
  description: string;
}

export enum RMStatus { DRAFT = 'DRAFT', WAITING_L1 = 'WAITING_L1', WAITING_L2 = 'WAITING_L2', APPROVED = 'APPROVED', IN_FULFILLMENT = 'IN_FULFILLMENT', IN_TRANSIT = 'IN_TRANSIT', PARTIAL_RECEIVED = 'PARTIAL_RECEIVED', DONE = 'DONE', CANCELED = 'CANCELED' }

/**
 * Added RMItemStatus type to fix missing member error.
 */
export type RMItemStatus = 'PENDING' | 'FULFILLED' | 'FOR_PURCHASE' | 'CANCELED';

export interface RM { id: string; requesterId: string; tenantId: string; unitId: string; warehouseId: string; dateRequired: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'; status: RMStatus; observations: string; createdAt: string; workId: string; }

// Updated RMItem to use RMItemStatus
export interface RMItem { id: string; rmId: string; materialId: string; quantityRequested: number; quantityFulfilled: number; estimatedPrice: number; status: RMItemStatus; observations?: string; }
export interface Stock { warehouseId: string; materialId: string; quantity: number; reserved: number; }
export interface Sale { id: string; tenantId: string; unitId: string; warehouseId: string; sellerId: string; customerName?: string; tableNumber?: string; totalAmount: number; status: 'COMPLETED' | 'CANCELED'; createdAt: string; paymentMethod?: 'CASH' | 'PIX' | 'CARD'; }

/**
 * Added SaleItem interface to fix missing member error.
 */
export interface SaleItem {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
}

export interface PO { id: string; tenantId: string; unitId: string; supplierId: string; status: 'OPEN' | 'PARTIAL' | 'CLOSED' | 'CANCELED'; deliveryDate: string; totalAmount: number; createdAt: string; workId: string; }
export interface POItem { id: string; poId: string; rmItemId: string; materialId: string; quantity: number; unitPrice: number; }
export interface Supplier { id: string; tenantId: string; name: string; taxId: string; contactEmail: string; active: boolean; }
export interface Transfer { id: string; tenantId: string; originWarehouseId: string; destinationWarehouseId: string; status: 'CREATED' | 'SEPARATED' | 'IN_TRANSIT' | 'RECEIVED' | 'DONE' | 'DIVERGENCE'; createdAt: string; dispatchedAt?: string; receivedAt?: string; rmId?: string; }
export interface TransferItem { id: string; transferId: string; rmItemId?: string; materialId: string; quantityRequested: number; quantitySent: number; quantityReceived: number; }
export interface Document { id: string; name: string; type: 'NF' | 'CQ' | 'GUIA' | 'CONTRACT' | 'BANK' | 'OTHER'; mimeType: string; size: number; relatedId: string; uploadedAt: string; base64?: string; tenantId: string; }
export interface AuditLog { id: string; tenantId: string; entityId: string; entityType: string; action: string; userId: string; userName: string; timestamp: string; details: string; }
