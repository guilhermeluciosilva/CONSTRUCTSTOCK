
import { Role, Permission, OperationType } from './types';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    'RM_VIEW', 'RM_CREATE', 'RM_EDIT_OWN', 'RM_APPROVE_L2', 'RM_CANCEL',
    'PO_VIEW', 'PO_CREATE', 'PO_EDIT', 'PO_CLOSE',
    'STOCK_VIEW', 'STOCK_ENTRY', 'STOCK_EXIT', 'STOCK_ADJUST', 'LEDGER_VIEW',
    'TRANSFER_CREATE', 'TRANSFER_DISPATCH', 'TRANSFER_RECEIVE', 'TRANSFER_REPORT_DIVERGENCE',
    'DOC_VIEW', 'DOC_UPLOAD', 'DOC_DOWNLOAD', 'DOC_DELETE',
    'REPORT_VIEW', 'REPORT_EXPORT',
    'USER_MANAGE', 'ORG_MANAGE', 'MATERIAL_CATALOG_MANAGE', 'SUPPLIER_MANAGE',
    'IMPORT_CSV', 'SALE_VIEW', 'SALE_CREATE', 'SALE_CANCEL', 'SALE_REPORT',
    'SETTINGS_MANAGE'
  ],
  [Role.ADMIN]: [
    'RM_VIEW', 'PO_VIEW', 'STOCK_VIEW', 'LEDGER_VIEW', 'DOC_VIEW', 'DOC_DOWNLOAD', 
    'REPORT_VIEW', 'REPORT_EXPORT', 'USER_MANAGE', 'ORG_MANAGE', 'MATERIAL_CATALOG_MANAGE', 'SUPPLIER_MANAGE',
    'IMPORT_CSV', 'SALE_VIEW'
  ],
  [Role.COORDINATOR]: [
    'RM_VIEW', 'RM_CREATE', 'RM_EDIT_OWN', 'RM_APPROVE_L1', 'RM_CANCEL', 
    'STOCK_VIEW', 'LEDGER_VIEW', 'DOC_VIEW', 'DOC_DOWNLOAD', 'REPORT_VIEW', 'REPORT_EXPORT',
    'SALE_VIEW'
  ],
  [Role.REQUESTER]: [
    'RM_VIEW', 'RM_CREATE', 'RM_EDIT_OWN', 'STOCK_VIEW', 'DOC_VIEW', 'DOC_DOWNLOAD', 'REPORT_VIEW'
  ],
  [Role.WH_CENTRAL]: [
    'RM_VIEW', 'RM_FORWARD_TO_PURCHASE', 'RM_FULFILL_FROM_STOCK', 'PO_VIEW',
    'STOCK_VIEW', 'STOCK_ENTRY', 'STOCK_EXIT', 'STOCK_ADJUST', 'LEDGER_VIEW',
    'TRANSFER_CREATE', 'TRANSFER_DISPATCH', 'TRANSFER_RECEIVE', 'TRANSFER_REPORT_DIVERGENCE',
    'DOC_VIEW', 'DOC_UPLOAD', 'DOC_DOWNLOAD',
    'REPORT_VIEW', 'REPORT_EXPORT',
    'IMPORT_CSV'
  ],
  [Role.WH_SITE]: [
    'RM_VIEW',
    'STOCK_VIEW', 'STOCK_ENTRY', 'STOCK_EXIT', 'LEDGER_VIEW',
    'TRANSFER_RECEIVE', 'TRANSFER_REPORT_DIVERGENCE',
    'DOC_VIEW', 'DOC_UPLOAD', 'DOC_DOWNLOAD',
    'REPORT_VIEW'
  ],
  [Role.PURCHASING]: [
    'RM_VIEW', 'PO_VIEW', 'PO_CREATE', 'PO_EDIT', 'PO_CLOSE', 'DOC_VIEW', 'DOC_UPLOAD', 'DOC_DOWNLOAD', 'REPORT_VIEW', 'REPORT_EXPORT', 'SUPPLIER_MANAGE',
    'IMPORT_CSV'
  ],
  [Role.VIEWER]: [
    'RM_VIEW', 'PO_VIEW', 'STOCK_VIEW', 'LEDGER_VIEW', 'DOC_VIEW', 'DOC_DOWNLOAD', 'REPORT_VIEW', 'REPORT_EXPORT', 'SALE_VIEW'
  ],
  // NOVOS CARGOS LOJA
  [Role.CAIXA_VENDEDOR]: [
    'SALE_VIEW', 'SALE_CREATE', 'STOCK_VIEW', 'DOC_VIEW'
  ],
  [Role.GERENTE_LOJA]: [
    'SALE_VIEW', 'SALE_CREATE', 'SALE_CANCEL', 'SALE_REPORT', 'STOCK_VIEW', 'STOCK_ADJUST', 'REPORT_VIEW', 'USER_MANAGE'
  ],
  // NOVOS CARGOS FÁBRICA
  [Role.GERENTE_PLANTA]: [
    'RM_VIEW', 'RM_APPROVE_L2', 'STOCK_VIEW', 'STOCK_ADJUST', 'REPORT_VIEW', 'ORG_MANAGE', 'USER_MANAGE'
  ],
  [Role.LIDER_SETOR]: [
    'RM_VIEW', 'RM_CREATE', 'RM_EDIT_OWN', 'STOCK_VIEW', 'DOC_VIEW'
  ],
  [Role.ALMOX_SETOR]: [
    'STOCK_VIEW', 'STOCK_ENTRY', 'STOCK_EXIT', 'TRANSFER_RECEIVE', 'DOC_UPLOAD'
  ]
};

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', path: '/dashboard', minPermission: 'RM_VIEW', allowedOps: [OperationType.CONSTRUCTION, OperationType.STORE, OperationType.FACTORY] },
  { id: 'sales', label: 'Vendas', icon: 'fa-cash-register', path: '/sales', minPermission: 'SALE_VIEW', allowedOps: [OperationType.STORE] },
  { id: 'rm', label: 'Requisições', icon: 'fa-file-invoice', path: '/rm', minPermission: 'RM_VIEW', allowedOps: [OperationType.CONSTRUCTION, OperationType.FACTORY] },
  { id: 'stock', label: 'Estoque', icon: 'fa-boxes-stacked', path: '/stock', minPermission: 'STOCK_VIEW', allowedOps: [OperationType.CONSTRUCTION, OperationType.STORE, OperationType.FACTORY] },
  { id: 'movements', label: 'Extrato Almox', icon: 'fa-list-ul', path: '/movements', minPermission: 'LEDGER_VIEW', allowedOps: [OperationType.CONSTRUCTION, OperationType.STORE, OperationType.FACTORY] },
  { id: 'transfers', label: 'Transferências', icon: 'fa-truck-loading', path: '/transfers', minPermission: 'TRANSFER_RECEIVE', allowedOps: [OperationType.CONSTRUCTION, OperationType.FACTORY] },
  { id: 'purchases', label: 'Compras / POs', icon: 'fa-shopping-cart', path: '/purchases', minPermission: 'PO_VIEW', allowedOps: [OperationType.CONSTRUCTION, OperationType.STORE, OperationType.FACTORY] },
  { id: 'documents', label: 'Documentos', icon: 'fa-folder-open', path: '/documents', minPermission: 'DOC_VIEW', allowedOps: [OperationType.CONSTRUCTION, OperationType.STORE, OperationType.FACTORY] },
  { id: 'reports', label: 'Relatórios', icon: 'fa-chart-pie', path: '/reports', minPermission: 'REPORT_VIEW', allowedOps: [OperationType.CONSTRUCTION, OperationType.STORE, OperationType.FACTORY] },
  { id: 'admin_users', label: 'Usuários', icon: 'fa-users-cog', path: '/admin/users', minPermission: 'USER_MANAGE', allowedOps: [OperationType.CONSTRUCTION, OperationType.STORE, OperationType.FACTORY] },
  { id: 'admin_org', label: 'Organização', icon: 'fa-sitemap', path: '/admin/org', minPermission: 'ORG_MANAGE', allowedOps: [OperationType.CONSTRUCTION, OperationType.STORE, OperationType.FACTORY] },
  { id: 'admin_materials', label: 'Materiais', icon: 'fa-tag', path: '/admin/materials', minPermission: 'MATERIAL_CATALOG_MANAGE', allowedOps: [OperationType.CONSTRUCTION, OperationType.STORE, OperationType.FACTORY] },
  { id: 'admin_suppliers', label: 'Fornecedores', icon: 'fa-handshake', path: '/admin/suppliers', minPermission: 'SUPPLIER_MANAGE', allowedOps: [OperationType.CONSTRUCTION, OperationType.STORE, OperationType.FACTORY] },
  { id: 'settings', label: 'Configurações', icon: 'fa-sliders-h', path: '/admin/settings', minPermission: 'SETTINGS_MANAGE', allowedOps: [OperationType.CONSTRUCTION, OperationType.STORE, OperationType.FACTORY] },
];

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  WAITING_L1: 'bg-blue-100 text-blue-800',
  WAITING_L2: 'bg-indigo-100 text-indigo-800',
  APPROVED: 'bg-green-100 text-green-800',
  IN_FULFILLMENT: 'bg-yellow-100 text-yellow-800',
  DONE: 'bg-emerald-100 text-emerald-800',
  CANCELED: 'bg-red-100 text-red-800',
  DIVERGENCE: 'bg-rose-100 text-rose-800',
  URGENT: 'text-red-600 font-bold',
  COMPLETED: 'bg-emerald-100 text-emerald-800'
};
