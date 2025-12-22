
import { 
  User, Tenant, Unit, Sector, Warehouse, Material, RM, RMItem, Stock, 
  Movement, PO, POItem, Transfer, TransferItem, RMStatus, RMItemStatus, Role, RoleAssignment, Document, AuditLog, Supplier, OperationType, Sale, SaleItem, Scope,
  Recipe, MenuItem, RestaurantTable, Tab, TabItem
} from '../types';

const STORAGE_KEY = 'CONSTRUCT_STOCK_V2';

interface DB {
  users: User[];
  tenants: Tenant[];
  works: Unit[];
  sectors: Sector[];
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
  saleItems: SaleItem[];
  documents: Document[];
  auditLogs: AuditLog[];
  recipes: Recipe[];
  menuItems: MenuItem[];
  tables: RestaurantTable[];
  tabs: Tab[];
}

const INITIAL_DB: DB = {
  users: [
    { id: 'u1', name: 'Admin Geral', email: 'admin@example.com', password: '123', roleAssignments: [{ role: Role.OWNER, scope: { tenantId: 't1' } }] },
  ],
  tenants: [
    { id: 't1', name: 'Sua Organização', active: true, operationType: OperationType.RESTAURANT },
  ],
  works: [
    { id: 'w1', tenantId: 't1', name: 'Unidade Matriz', active: true, enabledModuleIds: ['dashboard', 'res_tables', 'res_menu', 'res_recipes', 'stock', 'movements', 'reports', 'settings'], operationType: OperationType.RESTAURANT },
  ],
  sectors: [],
  warehouses: [
    { id: 'wh1', workId: 'w1', unitId: 'w1', name: 'Almoxarifado Central', isCentral: true, active: true },
  ],
  materials: [
    { id: 'm1', sku: 'ALIM-001', name: 'Arroz Branco', unit: 'KG', category: 'Insumo', minStock: 10 },
    { id: 'm2', sku: 'ALIM-002', name: 'Coca-Cola Lata', unit: 'UN', category: 'Bebida', minStock: 24, salePrice: 6.00 },
  ],
  suppliers: [], rms: [], rmItems: [], 
  stocks: [
    { warehouseId: 'wh1', materialId: 'm1', quantity: 100, reserved: 0 },
    { warehouseId: 'wh1', materialId: 'm2', quantity: 50, reserved: 0 },
  ], 
  movements: [], pos: [], poItems: [], transfers: [], transferItems: [], sales: [], saleItems: [], documents: [], auditLogs: [],
  recipes: [], menuItems: [], tables: [], tabs: []
};

class ApiService {
  private db: DB;
  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.db = saved ? JSON.parse(saved) : INITIAL_DB;
    if (!saved) this.save();
  }
  private save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db)); }

  private logAudit(data: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      ...data,
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString()
    };
    this.db.auditLogs.push(log);
    this.save();
  }

  // AUTH & CORE
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
  
  // Fix: unified duplicate function implementations and kept tenant filtering logic
  async getUsers(tenantId: string): Promise<User[]> { 
    return this.db.users.filter(u => u.roleAssignments.some(ra => ra.scope.tenantId === tenantId)); 
  }

  // STOCK & MOVEMENTS
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
    if (['ENTRY', 'TRANSFER_IN'].includes(data.type)) stock.quantity += data.quantity;
    else stock.quantity -= data.quantity;
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

  // RESTAURANTE: COMANDAS
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

    const neededMaterials: Record<string, number> = {};
    for (const item of tab.items.filter(i => i.status !== 'CANCELED')) {
      const menu = this.db.menuItems.find(m => m.id === item.menuItemId);
      if (!menu) continue;
      if (menu.linkType === 'MATERIAL_DIRECT') {
        neededMaterials[menu.materialId!] = (neededMaterials[menu.materialId!] || 0) + (menu.directQty! * item.qty);
      } else {
        const recipe = this.db.recipes.find(r => r.id === menu.recipeId);
        if (recipe) recipe.ingredients.forEach(ing => {
          neededMaterials[ing.materialId] = (neededMaterials[ing.materialId] || 0) + (ing.qty * item.qty);
        });
      }
    }

    // Baixa do estoque
    for (const [matId, qty] of Object.entries(neededMaterials)) {
      await this.addMovement({
        warehouseId, materialId: matId, type: 'RECIPE_CONSUMPTION',
        quantity: qty, userId, description: `Consumo Mesa #${tabId}`, referenceId: tabId
      });
    }

    tab.status = 'CLOSED';
    tab.closedAt = new Date().toISOString();
    tab.paymentMethod = paymentMethod;
    const table = this.db.tables.find(t => t.id === tab.tableId);
    if (table) { table.status = 'FREE'; delete table.activeTabId; }
    this.save();
  }

  // OUTROS MÉTODOS (CONSTRUCTION, SALES, ETC) - Mantidos para funcionamento pleno
  async getRMs(s: Scope) { return this.db.rms.filter(r => r.tenantId === s.tenantId && (!s.unitId || r.unitId === s.unitId)); }
  async getRMById(id: string) { return { rm: this.db.rms.find(r => r.id === id)!, items: this.db.rmItems.filter(i => i.rmId === id) }; }
  async createRM(d: any, i: any[]) { 
    const id = `RM-${Date.now()}`; 
    this.db.rms.push({ ...d, id, createdAt: new Date().toISOString(), status: RMStatus.WAITING_L1, requesterId: 'u1' });
    i.forEach(it => this.db.rmItems.push({ ...it, id: `RMI-${Math.random()}`, rmId: id, quantityFulfilled: 0, status: RMItemStatus.PENDING }));
    this.save();
  }
  // Fix: Added missing updateRM implementation
  async updateRM(id: string, data: any, items: any[]) {
    const rmIdx = this.db.rms.findIndex(r => r.id === id);
    if (rmIdx === -1) throw new Error('RM não encontrada');
    this.db.rms[rmIdx] = { ...this.db.rms[rmIdx], ...data };
    
    // Replace items
    this.db.rmItems = this.db.rmItems.filter(i => i.rmId !== id);
    items.forEach(it => this.db.rmItems.push({ ...it, id: `RMI-${Math.random()}`, rmId: id, quantityFulfilled: 0, status: RMItemStatus.PENDING }));
    this.save();
  }

  async getPOs(s: Scope) { return this.db.pos.filter(p => p.tenantId === s.tenantId); }
  async getPOById(id: string) { return { po: this.db.pos.find(p => p.id === id)!, items: this.db.poItems.filter(i => i.poId === id) }; }
  async createPO(d: any, i: any[]) {
    const id = `PO-${Date.now()}`;
    this.db.pos.push({ ...d, id, status: 'OPEN', totalAmount: i.reduce((s, x) => s + (x.quantity * x.unitPrice), 0), createdAt: new Date().toISOString() });
    i.forEach(it => this.db.poItems.push({ ...it, id: `POI-${Math.random()}`, poId: id }));
    this.save();
  }
  // Fix: Added missing closePO implementation
  async closePO(id: string, status: 'CLOSED' | 'CANCELED') {
    const po = this.db.pos.find(p => p.id === id);
    if (po) {
      po.status = status;
      this.save();
    }
  }

  async getTransfers(s: Scope) { return this.db.transfers.filter(t => t.tenantId === s.tenantId); }
  async getTransferById(id: string) { return { transfer: this.db.transfers.find(t => t.id === id)!, items: this.db.transferItems.filter(i => i.transferId === id) }; }
  async createTransfer(d: any, i: any[]) {
    const id = `TRF-${Date.now()}`;
    this.db.transfers.push({ ...d, id, status: 'CREATED', createdAt: new Date().toISOString() });
    i.forEach(it => this.db.transferItems.push({ ...it, id: `TRFI-${Math.random()}`, transferId: id, quantitySent: it.quantityRequested, quantityReceived: 0 }));
    this.save();
  }
  // Fix: Added missing dispatchTransfer implementation
  async dispatchTransfer(id: string) {
    const transfer = this.db.transfers.find(t => t.id === id);
    if (!transfer) throw new Error('Transferência não encontrada');
    const items = this.db.transferItems.filter(i => i.transferId === id);
    
    for (const it of items) {
      await this.addMovement({
        warehouseId: transfer.originWarehouseId,
        materialId: it.materialId,
        type: 'TRANSFER_OUT',
        quantity: it.quantitySent || it.quantityRequested,
        userId: 'u1',
        description: `Saída Transferência #${id}`
      });
    }
    
    transfer.status = 'IN_TRANSIT';
    transfer.dispatchedAt = new Date().toISOString();
    this.save();
  }

  // Fix: Added missing receiveTransfer implementation
  async receiveTransfer(id: string, receivedQtys: Record<string, number>) {
    const transfer = this.db.transfers.find(t => t.id === id);
    if (!transfer) throw new Error('Transferência não encontrada');
    const items = this.db.transferItems.filter(i => i.transferId === id);
    
    let hasDivergence = false;
    for (const it of items) {
      const qty = receivedQtys[it.id];
      it.quantityReceived = qty;
      if (qty !== (it.quantitySent || it.quantityRequested)) hasDivergence = true;
      
      await this.addMovement({
        warehouseId: transfer.destinationWarehouseId,
        materialId: it.materialId,
        type: 'TRANSFER_IN',
        quantity: qty,
        userId: 'u1',
        description: `Entrada Transferência #${id}`
      });
    }
    
    transfer.status = hasDivergence ? 'DIVERGENCE' : 'DONE';
    transfer.receivedAt = new Date().toISOString();
    this.save();
  }

  async getSales(s: Scope) { return this.db.sales.filter(sl => sl.tenantId === s.tenantId); }
  async createSale(d: any, i: any[]) {
    const id = `SALE-${Date.now()}`;
    this.db.sales.push({ ...d, id, status: 'COMPLETED', createdAt: new Date().toISOString(), totalAmount: i.reduce((s, x) => s + (x.quantity * x.unitPrice), 0) });
    for (const it of i) {
      await this.addMovement({ warehouseId: d.warehouseId, materialId: it.materialId, type: 'SALE', quantity: it.quantity, userId: 'u1', description: `Venda ${id}` });
    }
    this.save();
  }
  async getRecipes(t: string, u: string) { return this.db.recipes.filter(r => r.tenantId === t && r.unitId === u); }
  async saveRecipe(r: any) { 
    const id = r.id || `REC-${Date.now()}`;
    const idx = this.db.recipes.findIndex(x => x.id === id);
    if (idx >= 0) this.db.recipes[idx] = { ...r, id }; else this.db.recipes.push({ ...r, id });
    this.save();
  }
  // Fix: Added missing deleteRecipe implementation
  async deleteRecipe(id: string) {
    this.db.recipes = this.db.recipes.filter(r => r.id !== id);
    this.save();
  }

  async getMenuItems(t: string, u: string) { return this.db.menuItems.filter(m => m.tenantId === t && m.unitId === u); }
  async saveMenuItem(m: any) {
    const id = m.id || `MENU-${Date.now()}`;
    const idx = this.db.menuItems.findIndex(x => x.id === id);
    if (idx >= 0) this.db.menuItems[idx] = { ...m, id }; else this.db.menuItems.push({ ...m, id });
    this.save();
  }
  // Admin & Helpers
  // Fix: Added missing createUser implementation and removed duplicate getUsers that was here
  async createUser(name: string, email: string, tenantId: string, password?: string): Promise<User> {
    const id = `U-${Date.now()}`;
    const newUser: User = { id, name, email, password: password || '123', roleAssignments: [] };
    this.db.users.push(newUser);
    this.save();
    return newUser;
  }

  async onboard(a: any, c: any) { 
    const tId = `T-${Date.now()}`; const uId = `W-${Date.now()}`;
    this.db.tenants.push({ id: tId, name: c.name, active: true, operationType: c.operationType });
    this.db.works.push({ id: uId, tenantId: tId, name: c.unitName, active: true, enabledModuleIds: ['dashboard', 'stock', 'settings'], operationType: c.operationType });
    this.db.users.push({ id: `U-${Date.now()}`, name: a.name, email: a.email, password: a.password, roleAssignments: [{ role: Role.OWNER, scope: { tenantId: tId } }] });
    this.save();
  }
  async updateUnitModules(id: string, mods: string[]) {
    const u = this.db.works.find(x => x.id === id);
    if (u) { u.enabledModuleIds = mods; this.save(); }
  }
  async updateRMStatus(id: string, s: RMStatus, u: string) { const rm = this.db.rms.find(x => x.id === id); if (rm) { rm.status = s; this.save(); } }
  async processRMFulfillment(id: string, items: any[], u: string) {
    const rm = this.db.rms.find(x => x.id === id);
    if (rm) {
      rm.status = RMStatus.DONE;
      items.forEach(it => {
        const rmi = this.db.rmItems.find(x => x.id === it.id);
        if (rmi) { rmi.quantityFulfilled = it.attended; rmi.status = RMItemStatus.RECEIVED; }
      });
      this.save();
    }
  }
  async getDocuments(rid: string) { return this.db.documents.filter(d => d.relatedId === rid); }
  async getAllDocuments(tid: string) { return this.db.documents.filter(d => d.tenantId === tid); }
  async uploadDocument(d: any, tid: string) { this.db.documents.push({ ...d, id: `DOC-${Date.now()}`, uploadedAt: new Date().toISOString(), tenantId: tid }); this.save(); }
  async deleteDocument(id: string) { this.db.documents = this.db.documents.filter(x => x.id !== id); this.save(); }
  async getAuditLogsByEntity(id: string) { return this.db.auditLogs.filter(x => x.entityId === id); }
  async importCSVBatch(l: any, c: any) { return { success: l.length, errors: 0 }; }
  async getSectors(uid: string) { return this.db.sectors.filter(s => s.unitId === uid); }
  async createWork(w: any) { const id = `W-${Date.now()}`; this.db.works.push({ ...w, id, active: true }); this.save(); }
  async createSector(uid: string, n: string) { this.db.sectors.push({ id: `S-${Date.now()}`, unitId: uid, name: n, active: true }); this.save(); }
  async createWarehouse(wh: any) { this.db.warehouses.push({ ...wh, id: `WH-${Date.now()}`, active: true }); this.save(); }
  async updateMaterial(id: string, d: any) { const idx = this.db.materials.findIndex(x => x.id === id); if (idx >= 0) this.db.materials[idx] = { ...this.db.materials[idx], ...d }; this.save(); }
  async createMaterial(d: any) { this.db.materials.push({ ...d, id: `M-${Date.now()}` }); this.save(); }
  async updateSupplier(id: string, d: any) { const idx = this.db.suppliers.findIndex(x => x.id === id); if (idx >= 0) this.db.suppliers[idx] = { ...this.db.suppliers[idx], ...d }; this.save(); }
  async createSupplier(d: any) { this.db.suppliers.push({ ...d, id: `SUP-${Date.now()}`, active: true }); this.save(); }
  async getSuppliers(tid: string) { return this.db.suppliers.filter(s => s.tenantId === tid); }
  async getPurchaseBacklog(tid: string) { return this.db.rmItems.filter(i => i.status === RMItemStatus.PENDING).map(i => ({ item: i, rm: this.db.rms.find(r => r.id === i.rmId)!, material: this.db.materials.find(m => m.id === i.materialId)! })); }
  async updateUser(id: string, d: any) { const u = this.db.users.find(x => x.id === id); if (u) { Object.assign(u, d); this.save(); } }
  async changePassword(id: string, curr: string, next: string) { const u = this.db.users.find(x => x.id === id); if (u?.password === curr) { u.password = next; this.save(); } else throw new Error('Senha atual incorreta'); }
  async deleteTenant(id: string) { this.db.tenants = this.db.tenants.filter(x => x.id !== id); this.save(); }
  async deleteUser(id: string) { this.db.users = this.db.users.filter(x => x.id !== id); this.save(); }
  async updateUserAssignments(id: string, a: any) { const u = this.db.users.find(x => x.id === id); if (u) { u.roleAssignments = a; this.save(); } }
}

export const api = new ApiService();
