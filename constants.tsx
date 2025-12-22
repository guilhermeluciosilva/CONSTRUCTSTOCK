
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
    'TABLE_MANAGE', 'SETTINGS_MANAGE', 'RESTAURANT_MANAGE'
  ],
  [Role.ADMIN]: [
    'RM_VIEW', 'PO_VIEW', 'STOCK_VIEW', 'LEDGER_VIEW', 'DOC_VIEW', 'DOC_DOWNLOAD', 
    'REPORT_VIEW', 'REPORT_EXPORT', 'USER_MANAGE', 'ORG_MANAGE', 'MATERIAL_CATALOG_MANAGE', 'SUPPLIER_MANAGE',
    'IMPORT_CSV', 'SALE_VIEW', 'RESTAURANT_MANAGE'
  ],
  [Role.MANAGER]: [
    'RM_VIEW', 'RM_CREATE', 'RM_EDIT_OWN', 'RM_APPROVE_L1', 'RM_CANCEL', 
    'STOCK_VIEW', 'STOCK_ENTRY', 'STOCK_EXIT', 'STOCK_ADJUST', 'LEDGER_VIEW',
    'SALE_VIEW', 'SALE_CREATE', 'SALE_CANCEL', 'SALE_REPORT',
    'DOC_VIEW', 'DOC_UPLOAD', 'REPORT_VIEW', 'RESTAURANT_MANAGE', 'TABLE_MANAGE'
  ],
  [Role.OPERATOR]: [
    'SALE_VIEW', 'SALE_CREATE', 'STOCK_VIEW', 'STOCK_ENTRY', 'STOCK_EXIT', 
    'RM_VIEW', 'RM_CREATE', 'RESTAURANT_MANAGE'
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
  [Role.PURCHASING]: [
    'RM_VIEW', 'PO_VIEW', 'PO_CREATE', 'PO_EDIT', 'PO_CLOSE', 'DOC_VIEW', 'DOC_UPLOAD', 'DOC_DOWNLOAD', 'REPORT_VIEW', 'REPORT_EXPORT', 'SUPPLIER_MANAGE',
    'IMPORT_CSV'
  ],
  [Role.VIEWER]: [
    'RM_VIEW', 'PO_VIEW', 'STOCK_VIEW', 'LEDGER_VIEW', 'DOC_VIEW', 'DOC_DOWNLOAD', 'REPORT_VIEW', 'REPORT_EXPORT', 'SALE_VIEW'
  ]
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.OWNER]: 'Acesso total e gestão financeira da organização.',
  [Role.ADMIN]: 'Administração de cadastros, fornecedores e auditoria.',
  [Role.MANAGER]: 'Gestão operacional completa da unidade (Loja/Restaurante/Obra).',
  [Role.OPERATOR]: 'Atendimento, vendas, lançamentos e controle de estoque local.',
  [Role.REQUESTER]: 'Apenas solicitação de materiais.',
  [Role.WH_CENTRAL]: 'Operação de almoxarifado central e logística.',
  [Role.PURCHASING]: 'Comprador focado em negociação e suprimentos.',
  [Role.VIEWER]: 'Apenas visualização de dados.'
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  RM_VIEW: 'Visualizar Requisições',
  RM_CREATE: 'Criar Requisições',
  RM_EDIT_OWN: 'Editar Própria Requisição',
  RM_APPROVE_L1: 'Aprovação Nível 1',
  RM_APPROVE_L2: 'Aprovação Nível 2',
  RM_CANCEL: 'Cancelar Requisições',
  RM_FORWARD_TO_PURCHASE: 'Enviar para Compras',
  RM_FULFILL_FROM_STOCK: 'Atender do Estoque',
  PO_VIEW: 'Ver Pedidos de Compra',
  PO_CREATE: 'Criar Pedidos de Compra',
  PO_EDIT: 'Editar Pedidos de Compra',
  PO_CLOSE: 'Fechar Pedidos',
  STOCK_VIEW: 'Ver Saldo',
  STOCK_ENTRY: 'Entrada de Estoque',
  STOCK_EXIT: 'Saída de Estoque',
  STOCK_ADJUST: 'Ajuste de Inventário',
  LEDGER_VIEW: 'Extrato de Movimentação',
  TRANSFER_CREATE: 'Criar Transferências',
  TRANSFER_DISPATCH: 'Despachar Transferência',
  TRANSFER_RECEIVE: 'Receber Transferência',
  TRANSFER_REPORT_DIVERGENCE: 'Divergência de Transf.',
  DOC_VIEW: 'Ver Documentos',
  DOC_UPLOAD: 'Subir Arquivos',
  DOC_DOWNLOAD: 'Baixar Arquivos',
  DOC_DELETE: 'Excluir Arquivos',
  REPORT_VIEW: 'Acessar Relatórios',
  REPORT_EXPORT: 'Exportar Dados',
  USER_MANAGE: 'Gerir Usuários',
  ORG_MANAGE: 'Gerir Estrutura',
  MATERIAL_CATALOG_MANAGE: 'Gerir Materiais',
  SUPPLIER_MANAGE: 'Gerir Fornecedores',
  IMPORT_CSV: 'Importação CSV',
  SALE_VIEW: 'Ver Vendas',
  SALE_CREATE: 'Realizar Vendas',
  SALE_CANCEL: 'Cancelar Vendas',
  SALE_REPORT: 'Faturamento',
  TABLE_MANAGE: 'Gestão de Mesas',
  RESTAURANT_MANAGE: 'Gestão de Restaurante',
  SETTINGS_MANAGE: 'Configurações'
};

export const MENU_CATEGORIES = {
  MAIN: 'Principal',
  RESTAURANT: 'Gastronomia',
  STORE: 'Varejo / Loja',
  OPERATIONAL: 'Logística & Suprimentos',
  ADMIN: 'Administração',
  SYSTEM: 'Sistema'
};

const ALL_OPS = [OperationType.CONSTRUCTION, OperationType.STORE, OperationType.FACTORY, OperationType.RESTAURANT, OperationType.OTHER];

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', path: '/dashboard', minPermission: 'RM_VIEW', allowedOps: ALL_OPS, category: 'MAIN' },
  
  // RESTAURANTE
  { id: 'res_tables', label: 'Mesas & Comandas', icon: 'fa-chair', path: '/restaurant/tables', minPermission: 'RESTAURANT_MANAGE', allowedOps: [OperationType.RESTAURANT], category: 'RESTAURANT' },
  { id: 'res_menu', label: 'Cardápio', icon: 'fa-book-open', path: '/restaurant/menu', minPermission: 'RESTAURANT_MANAGE', allowedOps: [OperationType.RESTAURANT], category: 'RESTAURANT' },
  { id: 'res_recipes', label: 'Receitas (Fichas)', icon: 'fa-utensils', path: '/restaurant/recipes', minPermission: 'RESTAURANT_MANAGE', allowedOps: [OperationType.RESTAURANT], category: 'RESTAURANT' },

  // LOJA / VENDAS PDV (Agora habilitado para Restaurantes também)
  { id: 'sales', label: 'Vendas PDV', icon: 'fa-cash-register', path: '/sales', minPermission: 'SALE_VIEW', allowedOps: [OperationType.STORE, OperationType.RESTAURANT], category: 'STORE' },
  
  // OPERACIONAL
  { id: 'rm', label: 'Requisições', icon: 'fa-file-invoice', path: '/rm', minPermission: 'RM_VIEW', allowedOps: [OperationType.CONSTRUCTION, OperationType.FACTORY], category: 'OPERATIONAL' },
  { id: 'transfers', label: 'Transferências', icon: 'fa-truck-loading', path: '/transfers', minPermission: 'TRANSFER_RECEIVE', allowedOps: [OperationType.CONSTRUCTION, OperationType.FACTORY], category: 'OPERATIONAL' },
  { id: 'purchases', label: 'Compras / POs', icon: 'fa-shopping-cart', path: '/purchases', minPermission: 'PO_VIEW', allowedOps: [OperationType.CONSTRUCTION, OperationType.FACTORY, OperationType.OTHER], category: 'OPERATIONAL' },

  // COMPARTILHADOS
  { id: 'stock', label: 'Estoque', icon: 'fa-boxes-stacked', path: '/stock', minPermission: 'STOCK_VIEW', allowedOps: ALL_OPS, category: 'MAIN' },
  { id: 'movements', label: 'Extrato', icon: 'fa-list-ul', path: '/movements', minPermission: 'LEDGER_VIEW', allowedOps: ALL_OPS, category: 'MAIN' },
  
  { id: 'documents', label: 'Documentos', icon: 'fa-folder-open', path: '/documents', minPermission: 'DOC_VIEW', allowedOps: ALL_OPS, category: 'ADMIN' },
  { id: 'reports', label: 'BI & Relatórios', icon: 'fa-chart-pie', path: '/reports', minPermission: 'REPORT_VIEW', allowedOps: ALL_OPS, category: 'ADMIN' },
  
  { id: 'admin_users', label: 'Usuários', icon: 'fa-users-cog', path: '/admin/users', minPermission: 'USER_MANAGE', allowedOps: ALL_OPS, category: 'ADMIN' },
  { id: 'admin_org', label: 'Estrutura', icon: 'fa-sitemap', path: '/admin/org', minPermission: 'ORG_MANAGE', allowedOps: ALL_OPS, category: 'ADMIN' },
  { id: 'admin_materials', label: 'Catálogo', icon: 'fa-tag', path: '/admin/materials', minPermission: 'MATERIAL_CATALOG_MANAGE', allowedOps: ALL_OPS, category: 'ADMIN' },
  { id: 'admin_suppliers', label: 'Fornecedores', icon: 'fa-handshake', path: '/admin/suppliers', minPermission: 'SUPPLIER_MANAGE', allowedOps: ALL_OPS, category: 'ADMIN' },
  { id: 'admin_import', label: 'Carga de Dados', icon: 'fa-file-csv', path: '/admin/import', minPermission: 'IMPORT_CSV', allowedOps: ALL_OPS, category: 'ADMIN' },
  { id: 'settings', label: 'Configurações', icon: 'fa-sliders-h', path: '/admin/settings', minPermission: 'RM_VIEW', allowedOps: ALL_OPS, category: 'SYSTEM' },
];

export const STATUS_COLORS: Record<string, string> = {
  FREE: 'bg-emerald-100 text-emerald-800',
  OCCUPIED: 'bg-rose-100 text-rose-800',
  RESERVED: 'bg-amber-100 text-amber-800',
  OPEN: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-emerald-100 text-emerald-800',
  CANCELED: 'bg-red-100 text-red-800',
  PENDING: 'bg-gray-100 text-gray-800',
  IN_PREP: 'bg-indigo-100 text-indigo-800',
  SERVED: 'bg-emerald-100 text-emerald-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  APPROVED: 'bg-green-100 text-green-800',
  URGENT: 'text-red-600 font-bold',
  COMPLETED: 'bg-emerald-100 text-emerald-800'
};
