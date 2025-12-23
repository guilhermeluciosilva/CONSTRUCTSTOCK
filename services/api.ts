
import { 
  User, Tenant, Unit, Sector, Warehouse, Material, RM, RMItem, Stock, 
  Movement, PO, POItem, Transfer, TransferItem, RMStatus, Role, RoleAssignment, Document, AuditLog, Supplier, OperationType, Sale, SaleItem, Scope,
  MenuItem, RestaurantTable, Tab, TabItem, Recipe
} from '../types';

const STORAGE_KEY = 'CONSTRUCT_STOCK_V2';

// Função utilitária para manter precisão de 3 casas decimais nos cálculos
const round = (num: number) => Math.round(num * 1000) / 1000;

interface DB {
  users: User[];
  tenants: Tenant[];
  works: Unit[];
  warehouses: Warehouse[];
  materials: Material[];
  suppliers: Supplier[];
  rms: RM[];
  rmItems: RMItem[];
  stocks: Stock[];
  movements: Movement[];
  pos: PO[];
  poItems: POItem[];
  transfers: Transfer[];
  transferItems: TransferItem[];
  sales: Sale[];
  documents: Document[];
  auditLogs: AuditLog[];
  menuItems: MenuItem[];
  tables: RestaurantTable[];
  tabs: Tab[];
  recipes: Recipe[];
  sectors: Sector[];
}

const INITIAL_DB: DB = {
  users: [
    { id: 'u1', name: 'Admin Geral', email: 'admin@example.com', password: '123', roleAssignments: [{ role: Role.OWNER, scope: { tenantId: 't1' } }] },
  ],
  tenants: [
    { id: 't1', name: 'Sua Organização', active: true, operationType: OperationType.RESTAURANT },
  ],
  works: [
    { 
      id: 'w1', 
      tenantId: 't1', 
      name: 'Unidade Matriz', 
      active: true, 
      enabledModuleIds: ['dashboard', 'res_tables', 'res_menu', 'res_insumos', 'stock', 'movements', 'sales', 'admin_users', 'settings'], 
      operationType: OperationType.RESTAURANT 
    },
  ],
  warehouses: [
    { id: 'wh1', unitId: 'w1', name: 'Almoxarifado Central', isCentral: true, active: true, workId: 'w1' },
  ],
  materials: [
    // --- INSUMOS DE COZINHA ---
    { id: 'INS-0001', sku: 'INS-0001', name: 'Arroz Branco T1', category: 'Insumos (Cozinha)', unit: 'kg', minStock: 20 },
    { id: 'INS-0002', sku: 'INS-0002', name: 'Feijão Carioca', category: 'Insumos (Cozinha)', unit: 'kg', minStock: 15 },
    { id: 'INS-0003', sku: 'INS-0003', name: 'Óleo de Soja 900ml', category: 'Insumos (Cozinha)', unit: 'un', minStock: 10 },
    { id: 'INS-0004', sku: 'INS-0004', name: 'Sal Refinado 1kg', category: 'Insumos (Cozinha)', unit: 'un', minStock: 5 },
    { id: 'INS-0005', sku: 'INS-0005', name: 'Açúcar Cristal 1kg', category: 'Insumos (Cozinha)', unit: 'un', minStock: 5 },
    { id: 'INS-0006', sku: 'INS-0006', name: 'Café em Pó 500g', category: 'Insumos (Cozinha)', unit: 'un', minStock: 4 },
    { id: 'INS-0007', sku: 'INS-0007', name: 'Farinha de Trigo', category: 'Insumos (Cozinha)', unit: 'kg', minStock: 10 },
    { id: 'INS-0008', sku: 'INS-0008', name: 'Macarrão Espaguete', category: 'Insumos (Cozinha)', unit: 'kg', minStock: 10 },
    { id: 'INS-0009', sku: 'INS-0009', name: 'Molho de Tomate Sachê', category: 'Insumos (Cozinha)', unit: 'un', minStock: 20 },
    { id: 'INS-0010', sku: 'INS-0010', name: 'Manteiga com Sal', category: 'Insumos (Cozinha)', unit: 'kg', minStock: 2 },

    // --- PROTEÍNAS / CARNES ---
    { id: 'PRT-0001', sku: 'PRT-0001', name: 'Peito de Frango', category: 'Proteínas / Carnes', unit: 'kg', minStock: 10 },
    { id: 'PRT-0002', sku: 'PRT-0002', name: 'Carne Moída (Patinho)', category: 'Proteínas / Carnes', unit: 'kg', minStock: 8 },
    { id: 'PRT-0003', sku: 'PRT-0003', name: 'Alcatra Bovina', category: 'Proteínas / Carnes', unit: 'kg', minStock: 15 },
    { id: 'PRT-0004', sku: 'PRT-0004', name: 'Bacon Defumado', category: 'Proteínas / Carnes', unit: 'kg', minStock: 5 },
    { id: 'PRT-0005', sku: 'PRT-0005', name: 'Ovos Brancos (Dúzia)', category: 'Proteínas / Carnes', unit: 'dz', minStock: 10 },

    // --- HORTIFRUTI ---
    { id: 'HRT-0001', sku: 'HRT-0001', name: 'Alho Processado', category: 'Hortifruti', unit: 'kg', minStock: 2 },
    { id: 'HRT-0002', sku: 'HRT-0002', name: 'Cebola Branca', category: 'Hortifruti', unit: 'kg', minStock: 10 },
    { id: 'HRT-0003', sku: 'HRT-0003', name: 'Batata Inglesa', category: 'Hortifruti', unit: 'kg', minStock: 20 },
    { id: 'HRT-0004', sku: 'HRT-0004', name: 'Tomate Italiano', category: 'Hortifruti', unit: 'kg', minStock: 10 },
    { id: 'HRT-0005', sku: 'HRT-0005', name: 'Alface Crespa', category: 'Hortifruti', unit: 'un', minStock: 15 },

    // --- BEBIDAS ---
    { id: 'BEB-0001', sku: 'BEB-0001', name: 'Água Mineral 500ml', category: 'Bebidas', unit: 'un', minStock: 48, salePrice: 4.5 },
    { id: 'BEB-0002', sku: 'BEB-0002', name: 'Coca-Cola Lata 350ml', category: 'Bebidas', unit: 'un', minStock: 24, salePrice: 7.0 },
    { id: 'BEB-0003', sku: 'BEB-0003', name: 'Guaraná Antarctica 350ml', category: 'Bebidas', unit: 'un', minStock: 24, salePrice: 6.5 },
    { id: 'BEB-0004', sku: 'BEB-0004', name: 'Suco de Laranja 1L', category: 'Bebidas', unit: 'un', minStock: 10, salePrice: 12.0 },
    { id: 'BEB-0005', sku: 'BEB-0005', name: 'Cerveja Heineken Long Neck', category: 'Bebidas', unit: 'un', minStock: 24, salePrice: 15.0 },

    // --- PRODUTOS DE LIMPEZA ---
    { id: 'LIM-0001', sku: 'LIM-0001', name: 'Detergente Neutro 500ml', category: 'Produtos de Limpeza', unit: 'un', minStock: 10 },
    { id: 'LIM-0002', sku: 'LIM-0002', name: 'Desinfetante Pinho 2L', category: 'Produtos de Limpeza', unit: 'un', minStock: 4 },
    { id: 'LIM-0003', sku: 'LIM-0003', name: 'Água Sanitária 2L', category: 'Produtos de Limpeza', unit: 'un', minStock: 4 },
    { id: 'LIM-0004', sku: 'LIM-0004', name: 'Esponja de Louça', category: 'Produtos de Limpeza', unit: 'un', minStock: 12 },
    { id: 'LIM-0005', sku: 'LIM-0005', name: 'Papel Toalha Interfolha', category: 'Produtos de Limpeza', unit: 'fdo', minStock: 2 },
    { id: 'LIM-0006', sku: 'LIM-0006', name: 'Sabão Líquido Lavanderia', category: 'Produtos de Limpeza', unit: 'gl', minStock: 1 },
    { id: 'LIM-0007', sku: 'LIM-0007', name: 'Álcool 70% 1L', category: 'Produtos de Limpeza', unit: 'un', minStock: 6 },
  ],
  suppliers: [], rms: [], rmItems: [], 
  stocks: [
    { warehouseId: 'wh1', materialId: 'INS-0001', quantity: 50, reserved: 0 },
    { warehouseId: 'wh1', materialId: 'BEB-0001', quantity: 100, reserved: 0 },
    { warehouseId: 'wh1', materialId: 'BEB-0002', quantity: 48, reserved: 0 },
    { warehouseId: 'wh1', materialId: 'LIM-0001', quantity: 20, reserved: 0 },
    { warehouseId: 'wh1', materialId: 'PRT-0001', quantity: 15, reserved: 0 },
  ], 
  movements: [], pos: [], poItems: [], transfers: [], transferItems: [], sales: [], documents: [], auditLogs: [],
  menuItems: [
    {
      id: 'MENU-1',
      tenantId: 't1',
      unitId: 'w1',
      name: 'EXECUTIVO DE FRANGO',
      category: 'ALMOÇO',
      price: 32.9,
      isActive: true,
      ingredients: [
        { materialId: 'PRT-0001', qty: 0.200 },
        { materialId: 'INS-0001', qty: 0.150 },
        { materialId: 'INS-0002', qty: 0.100 }
      ],
      yieldQty: 1,
      yieldUnit: 'Prato',
      createdAt: new Date().toISOString()
    }
  ], 
  tables: [
    { id: 'TBL-1', tenantId: 't1', unitId: 'w1', nameOrNumber: '1', status: 'FREE', capacity: 4 },
    { id: 'TBL-2', tenantId: 't1', unitId: 'w1', nameOrNumber: '2', status: 'FREE', capacity: 4 }
  ], 
  tabs: [],
  recipes: [],
  sectors: []
};

class ApiService {
  private db: DB;
  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.db = saved ? JSON.parse(saved) : INITIAL_DB;
    if (!saved) this.save();
  }
  private save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db)); }

  async login(email: string, password?: string): Promise<User> {
    const user = this.db.users.find(u => u.email === email && (!password || u.password === password));
    if (!user) throw new Error('Credenciais inválidas');
    return user;
  }
  async getTenants(): Promise<Tenant[]> { return this.db.tenants.filter(t => t.active); }
  async getWorks(tenantId: string): Promise<Unit[]> { return this.db.works.filter(w => w.tenantId === tenantId && w.active); }
  async getWarehouses(unitId: string): Promise<Warehouse[]> { return this.db.warehouses.filter(wh => wh.unitId === unitId && wh.active); }
  async getMaterials(): Promise<Material[]> { return this.db.materials; }
  async getUserById(id: string): Promise<User | undefined> { return this.db.users.find(u => u.id === id); }
  async getUsers(tenantId: string): Promise<User[]> { 
    return this.db.users.filter(u => u.roleAssignments.some(ra => ra.scope.tenantId === tenantId)); 
  }

  async getStock(scope: Scope) { 
    return this.db.stocks.filter(s => {
       const wh = this.db.warehouses.find(w => w.id === s.warehouseId);
       if (scope.warehouseId) return s.warehouseId === scope.warehouseId;
       if (scope.unitId || scope.workId) return wh?.unitId === (scope.unitId || scope.workId);
       return true;
    }); 
  }
  async addMovement(data: any) {
    const movement: Movement = { ...data, id: `MOV-${Date.now()}`, timestamp: new Date().toISOString() };
    this.db.movements.push(movement);
    let stock = this.db.stocks.find(s => s.warehouseId === data.warehouseId && s.materialId === data.materialId);
    if (!stock) { stock = { warehouseId: data.warehouseId, materialId: data.materialId, quantity: 0, reserved: 0 }; this.db.stocks.push(stock); }
    if (['ENTRY', 'TRANSFER_IN'].includes(data.type)) stock.quantity = round(stock.quantity + data.quantity);
    else stock.quantity = round(stock.quantity - data.quantity);
    this.save();
    return movement;
  }
  async getMovements(scope: Scope) { 
    return this.db.movements.filter(m => {
       const wh = this.db.warehouses.find(w => w.id === m.warehouseId);
       if (scope.warehouseId) return m.warehouseId === scope.warehouseId;
       if (scope.unitId || scope.workId) return wh?.unitId === (scope.unitId || scope.workId);
       return true;
    }); 
  }

  async getTables(tenantId: string, unitId: string): Promise<RestaurantTable[]> {
    return this.db.tables.filter(t => t.tenantId === tenantId && t.unitId === unitId);
  }
  async saveTable(table: Partial<RestaurantTable>): Promise<RestaurantTable> {
    const id = table.id || `TBL-${Date.now()}`;
    const idx = this.db.tables.findIndex(t => t.id === id);
    const newTable = { ...table, id } as RestaurantTable;
    if (idx >= 0) this.db.tables[idx] = newTable;
    else this.db.tables.push(newTable);
    this.save();
    return newTable;
  }
  async getTabById(id: string): Promise<Tab | undefined> { return this.db.tabs.find(t => t.id === id); }
  
  async openTab(tableId: string, tenantId: string, unitId: string, customerName?: string, peopleCount?: number): Promise<Tab> {
    const table = this.db.tables.find(t => t.id === tableId);
    if (!table || table.status !== 'FREE') throw new Error('Mesa não disponível');
    const tabId = `TAB-${Date.now()}`;
    const newTab: Tab = {
      id: tabId, tenantId, unitId, tableId, status: 'OPEN',
      openedAt: new Date().toISOString(), customerName, items: [], totalAmount: 0,
      peopleCount: peopleCount || 1
    };
    this.db.tabs.push(newTab);
    table.status = 'OCCUPIED';
    table.activeTabId = tabId;
    this.save();
    return newTab;
  }

  async updateTab(tab: Tab) {
    const idx = this.db.tabs.findIndex(t => t.id === tab.id);
    if (idx >= 0) {
      tab.totalAmount = tab.items.reduce((acc, i) => i.status !== 'CANCELED' ? acc + (i.qty * i.unitPriceSnapshot) : acc, 0);
      this.db.tabs[idx] = tab;
      this.save();
    }
  }

  async closeTab(tabId: string, warehouseId: string, paymentMethod: Tab['paymentMethod'], userId: string): Promise<void> {
    const tab = this.db.tabs.find(t => t.id === tabId);
    if (!tab || tab.status !== 'OPEN') throw new Error('Comanda inválida');

    const table = this.db.tables.find(t => t.id === tab.tableId);
    const tableLabel = table ? `Mesa ${table.nameOrNumber}` : 'Mesa Desconhecida';

    const neededMaterials: Record<string, number> = {};
    const itemNames: string[] = [];

    for (const item of tab.items.filter(i => i.status !== 'CANCELED')) {
      const menu = this.db.menuItems.find(m => m.id === item.menuItemId);
      if (!menu) continue;
      itemNames.push(menu.name);
      menu.ingredients.forEach(ing => {
         neededMaterials[ing.materialId] = round((neededMaterials[ing.materialId] || 0) + (ing.qty * item.qty));
      });
    }

    const uniqueItems = Array.from(new Set(itemNames));
    const summary = uniqueItems.join(', ');
    const finalDesc = `Saída: ${summary.length > 35 ? summary.substring(0, 32) + '...' : summary} (${tableLabel})`;

    for (const [matId, qty] of Object.entries(neededMaterials)) {
      await this.addMovement({
        warehouseId, materialId: matId, type: 'RECIPE_CONSUMPTION',
        quantity: qty, userId, description: finalDesc, referenceId: tabId
      });
    }

    const saleId = `SALE-${Date.now()}`;
    const newSale: Sale = {
      id: saleId,
      tenantId: tab.tenantId,
      unitId: tab.unitId,
      warehouseId: warehouseId,
      sellerId: userId,
      customerName: tab.customerName || 'Consumidor Final',
      tableNumber: table?.nameOrNumber,
      totalAmount: tab.totalAmount,
      status: 'COMPLETED',
      paymentMethod: paymentMethod,
      createdAt: new Date().toISOString()
    };
    this.db.sales.push(newSale);

    tab.status = 'CLOSED';
    tab.closedAt = new Date().toISOString();
    tab.paymentMethod = paymentMethod;
    if (table) { table.status = 'FREE'; delete table.activeTabId; }
    
    this.save();
  }

  async getRMs(s: Scope) { return this.db.rms.filter(r => r.tenantId === s.tenantId && (!s.unitId || r.unitId === s.unitId)); }
  async getRMById(id: string) { return { rm: this.db.rms.find(r => r.id === id)!, items: this.db.rmItems.filter(i => i.rmId === id) }; }

  async createRM(data: any, items: any[]) {
    const id = `RM-${Date.now()}`;
    const rm: RM = { ...data, id, status: RMStatus.WAITING_L1, createdAt: new Date().toISOString(), requesterId: 'u1' };
    this.db.rms.push(rm);
    const newItems = items.map(i => ({ ...i, id: `RMI-${Date.now()}-${Math.random()}`, rmId: id, status: 'PENDING', quantityFulfilled: 0 }));
    this.db.rmItems.push(...newItems);
    this.save();
    return rm;
  }

  async updateRM(id: string, data: any, items: any[]) {
    const rmIdx = this.db.rms.findIndex(r => r.id === id);
    if (rmIdx >= 0) {
      this.db.rms[rmIdx] = { ...this.db.rms[rmIdx], ...data };
      this.db.rmItems = this.db.rmItems.filter(i => i.rmId !== id);
      const newItems = items.map(i => ({ ...i, id: `RMI-${Date.now()}-${Math.random()}`, rmId: id, status: 'PENDING' }));
      this.db.rmItems.push(...newItems);
      this.save();
    }
  }

  async updateRMStatus(id: string, status: RMStatus, userId: string) {
    const rm = this.db.rms.find(r => r.id === id);
    if (rm) {
       rm.status = status;
       this.save();
    }
  }

  async processRMFulfillment(id: string, items: any[], userId: string) {
    for(const item of items) {
      const rmItem = this.db.rmItems.find(i => i.id === item.id);
      if(rmItem) {
        rmItem.quantityFulfilled = item.attended;
        rmItem.status = 'FULFILLED';
      }
    }
    const rm = this.db.rms.find(r => r.id === id);
    if(rm) rm.status = RMStatus.DONE;
    this.save();
  }
  
  async getSales(s: Scope) { return this.db.sales.filter(sl => sl.tenantId === s.tenantId); }
  async createSale(d: any, i: any[]) {
    const id = `SALE-${Date.now()}`;
    const saleItemsNames = i.map(item => this.db.materials.find(m => m.id === item.materialId)?.name).filter(Boolean);
    const summary = saleItemsNames.join(', ');
    const finalDesc = `Venda: ${summary.length > 35 ? summary.substring(0, 32) + '...' : summary}`;

    this.db.sales.push({ 
        ...d, 
        id, 
        status: 'COMPLETED', 
        createdAt: new Date().toISOString(), 
        totalAmount: i.reduce((s, x) => s + (x.quantity * x.unitPrice), 0) 
    });

    for (const it of i) {
      await this.addMovement({ 
          warehouseId: d.warehouseId, 
          materialId: it.materialId, 
          type: 'SALE', 
          quantity: it.quantity, 
          userId: 'u1', 
          description: finalDesc 
      });
    }
    this.save();
  }

  async getMenuItems(t: string, u: string) { return this.db.menuItems.filter(m => m.tenantId === t && m.unitId === u); }
  async saveMenuItem(m: any) {
    const id = m.id || `MENU-${Date.now()}`;
    const idx = this.db.menuItems.findIndex(x => x.id === id);
    const data = { ...m, id, createdAt: m.createdAt || new Date().toISOString() };
    if (idx >= 0) this.db.menuItems[idx] = data; else this.db.menuItems.push(data);
    this.save();
  }
  
  async createUser(name: string, email: string, tenantId: string, password?: string): Promise<User> {
    const id = `U-${Date.now()}`;
    const newUser: User = { id, name, email, password: password || '123', roleAssignments: [] };
    this.db.users.push(newUser);
    this.save();
    return newUser;
  }

  async onboard(a: any, c: any) { 
    const tId = `T-${Date.now()}`; 
    const uId = `W-${Date.now()}`;
    const whId = `WH-${Date.now()}`;
    
    // Módulos padrão baseados no tipo de operação
    let defaultModules = ['dashboard', 'stock', 'movements', 'admin_users', 'settings'];
    if (c.operationType === OperationType.RESTAURANT) {
      defaultModules = [...defaultModules, 'res_tables', 'res_menu', 'res_insumos', 'sales'];
    } else if (c.operationType === OperationType.STORE) {
      defaultModules = [...defaultModules, 'sales', 'res_insumos'];
    } else {
      defaultModules = [...defaultModules, 'rm', 'transfers', 'purchases'];
    }

    this.db.tenants.push({ id: tId, name: c.name, active: true, operationType: c.operationType });
    this.db.works.push({ 
      id: uId, 
      tenantId: tId, 
      name: c.unitName, 
      active: true, 
      enabledModuleIds: defaultModules, 
      operationType: c.operationType 
    });
    this.db.warehouses.push({ id: whId, unitId: uId, name: 'Estoque Principal', isCentral: true, active: true, workId: uId });
    this.db.users.push({ id: `U-${Date.now()}`, name: a.name, email: a.email, password: a.password, roleAssignments: [{ role: Role.OWNER, scope: { tenantId: tId, unitId: uId, workId: uId, warehouseId: whId } }] });
    this.save();
  }

  async getSectors(uid: string): Promise<Sector[]> { 
    return this.db.sectors.filter(s => s.unitId === uid);
  }

  async createSector(unitId: string, name: string) {
    const sector: Sector = { id: `SEC-${Date.now()}`, unitId, name };
    this.db.sectors.push(sector);
    this.save();
    return sector;
  }

  async getDocuments(rid: string) { return this.db.documents.filter(d => d.relatedId === rid); }
  async getAllDocuments(tid: string) { return this.db.documents.filter(d => d.tenantId === tid); }
  async uploadDocument(d: any, tid: string) { this.db.documents.push({ ...d, id: `DOC-${Date.now()}`, uploadedAt: new Date().toISOString(), tenantId: tid }); this.save(); }
  async deleteDocument(id: string) { this.db.documents = this.db.documents.filter(x => x.id !== id); this.save(); }
  async getAuditLogsByEntity(id: string) { return []; }
  async importCSVBatch(l: any, c: any) { return { success: l.length, errors: 0 }; }
  async createWork(w: any) { const id = `W-${Date.now()}`; this.db.works.push({ ...w, id, active: true }); this.save(); }
  async createWarehouse(wh: any) { this.db.warehouses.push({ ...wh, id: `WH-${Date.now()}`, active: true }); this.save(); }
  async updateMaterial(id: string, d: any) { const idx = this.db.materials.findIndex(x => x.id === id); if (idx >= 0) this.db.materials[idx] = { ...this.db.materials[idx], ...d }; this.save(); }
  async createMaterial(d: any) { this.db.materials.push({ ...d, id: `M-${Date.now()}` }); this.save(); }
  async getSuppliers(tid: string) { return this.db.suppliers.filter(s => s.tenantId === tid); }
  
  async getPurchaseBacklog(tid: string) {
    return this.db.rmItems
      .filter(i => i.status === 'FOR_PURCHASE')
      .map(i => {
        const rm = this.db.rms.find(r => r.id === i.rmId)!;
        const material = this.db.materials.find(m => m.id === i.materialId)!;
        return { item: i, rm, material };
      });
  }

  async updateUser(id: string, d: any) { const u = this.db.users.find(x => x.id === id); if (u) { Object.assign(u, d); this.save(); } }
  async changePassword(id: string, curr: string, next: string) { const u = this.db.users.find(x => x.id === id); if (u?.password === curr) { u.password = next; this.save(); } else throw new Error('Senha atual incorreta'); }
  async deleteTenant(id: string) { this.db.tenants = this.db.tenants.filter(x => x.id !== id); this.save(); }
  async deleteUser(id: string) { this.db.users = this.db.users.filter(x => x.id !== id); this.save(); }
  async updateUserAssignments(id: string, a: any) { const u = this.db.users.find(x => x.id === id); if (u) { u.roleAssignments = a; this.save(); } }
  async updateUnitModules(id: string, mods: string[]) {
    const u = this.db.works.find(x => x.id === id);
    if (u) { u.enabledModuleIds = mods; this.save(); }
  }

  async getPOs(scope: Scope) {
    return this.db.pos.filter(p => p.tenantId === scope.tenantId);
  }
  async createPO(data: any, items: any[]) {
    const id = `PO-${Date.now()}`;
    const po: PO = { ...data, id, status: 'OPEN', createdAt: new Date().toISOString(), totalAmount: items.reduce((s, x) => s + (x.quantity * x.unitPrice), 0) };
    this.db.pos.push(po);
    const newItems = items.map(i => ({ ...i, id: `POI-${Date.now()}-${Math.random()}`, poId: id }));
    this.db.poItems.push(...newItems);
    this.save();
    return po;
  }
  async getPOById(id: string) {
    return { po: this.db.pos.find(p => p.id === id)!, items: this.db.poItems.filter(i => i.poId === id) };
  }
  async closePO(id: string, status: string) {
    const po = this.db.pos.find(p => p.id === id);
    if (po) {
      po.status = status as any;
      this.save();
    }
  }

  async getTransfers(scope: Scope) {
    return this.db.transfers.filter(t => t.tenantId === scope.tenantId);
  }
  async getTransferById(id: string) {
    return { transfer: this.db.transfers.find(t => t.id === id)!, items: this.db.transferItems.filter(i => i.transferId === id) };
  }
  async receiveTransfer(id: string, qtys: Record<string, number>) {
    const transfer = this.db.transfers.find(t => t.id === id);
    if (transfer) {
      transfer.status = 'DONE';
      const items = this.db.transferItems.filter(i => i.transferId === id);
      for(const i of items) {
        i.quantityReceived = qtys[i.id];
      }
      this.save();
    }
  }
  async dispatchTransfer(id: string) {
    const transfer = this.db.transfers.find(t => t.id === id);
    if (transfer) {
      transfer.status = 'IN_TRANSIT';
      this.save();
    }
  }
  async createTransfer(data: any, items: any[]) {
    const id = `TR-${Date.now()}`;
    const transfer: Transfer = { ...data, id, status: 'CREATED', createdAt: new Date().toISOString() };
    this.db.transfers.push(transfer);
    const newItems = items.map(i => ({ ...i, id: `TRI-${Date.now()}-${Math.random()}`, transferId: id, quantitySent: i.quantityRequested, quantityReceived: 0 }));
    this.db.transferItems.push(...newItems);
    this.save();
    return transfer;
  }

  async updateSupplier(id: string, data: any) {
    const s = this.db.suppliers.find(x => x.id === id);
    if (s) { Object.assign(s, data); this.save(); }
  }
  async createSupplier(data: any) {
    const s = { ...data, id: `SUP-${Date.now()}`, active: true };
    this.db.suppliers.push(s);
    this.save();
    return s;
  }

  async getRecipes(tid: string, uid: string): Promise<Recipe[]> {
    return this.db.recipes.filter(r => r.tenantId === tid && r.unitId === uid);
  }
  async saveRecipe(data: any) {
    const id = data.id || `REC-${Date.now()}`;
    const idx = this.db.recipes.findIndex(x => x.id === id);
    if(idx >= 0) this.db.recipes[idx] = { ...data, id };
    else this.db.recipes.push({ ...data, id });
    this.save();
  }
  async deleteRecipe(id: string) {
    this.db.recipes = this.db.recipes.filter(x => x.id !== id);
    this.save();
  }
}

export const api = new ApiService();
