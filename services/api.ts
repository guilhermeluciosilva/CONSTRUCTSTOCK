
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
  // RESTAURANTE
  recipes: Recipe[];
  menuItems: MenuItem[];
  tables: RestaurantTable[];
  tabs: Tab[];
}

const INITIAL_DB: DB = {
  users: [
    // RESTAURANTE
    { id: 'u1', name: 'Admin Restaurante', email: 'rest@example.com', password: '123', roleAssignments: [{ role: Role.OWNER, scope: { tenantId: 't1' } }] },
    { id: 'u2', name: 'Gerente Restaurante', email: 'gerente.rest@example.com', password: '123', roleAssignments: [{ role: Role.CAIXA_VENDEDOR, scope: { tenantId: 't1' } }] },
    // OBRA
    { id: 'u3', name: 'Admin Obra', email: 'obra@example.com', password: '123', roleAssignments: [{ role: Role.OWNER, scope: { tenantId: 't2' } }] },
    { id: 'u4', name: 'Coordenador Obra', email: 'coord.obra@example.com', password: '123', roleAssignments: [{ role: Role.COORDINATOR, scope: { tenantId: 't2', unitId: 'w2' } }] },
    { id: 'u5', name: 'Almoxarife', email: 'almox@example.com', password: '123', roleAssignments: [{ role: Role.WH_CENTRAL, scope: { tenantId: 't2', unitId: 'w2' } }] },
    // FÁBRICA
    { id: 'u6', name: 'Admin Fábrica', email: 'fabrica@example.com', password: '123', roleAssignments: [{ role: Role.OWNER, scope: { tenantId: 't3' } }] },
    { id: 'u7', name: 'Gerente Planta', email: 'gerente.planta@example.com', password: '123', roleAssignments: [{ role: Role.GERENTE_PLANTA, scope: { tenantId: 't3', unitId: 'w3' } }] },
    { id: 'u8', name: 'Líder Setor', email: 'lider@example.com', password: '123', roleAssignments: [{ role: Role.LIDER_SETOR, scope: { tenantId: 't3', unitId: 'w3', sectorId: 's1' } }] },
    // LOJA
    { id: 'u9', name: 'Admin Loja', email: 'loja@example.com', password: '123', roleAssignments: [{ role: Role.OWNER, scope: { tenantId: 't4' } }] },
    { id: 'u10', name: 'Gerente Loja', email: 'gerente.loja@example.com', password: '123', roleAssignments: [{ role: Role.GERENTE_LOJA, scope: { tenantId: 't4', unitId: 'w4' } }] },
  ],
  tenants: [
    { id: 't1', name: 'Restaurante Sabor Local', active: true, operationType: OperationType.RESTAURANT },
    { id: 't2', name: 'Construtora ABC', active: true, operationType: OperationType.CONSTRUCTION },
    { id: 't3', name: 'Fábrica XYZ', active: true, operationType: OperationType.FACTORY },
    { id: 't4', name: 'Loja São Paulo', active: true, operationType: OperationType.STORE },
  ],
  works: [
    // RESTAURANTE
    { id: 'w1', tenantId: 't1', name: 'Unidade Matriz', active: true, enabledModuleIds: ['res_tables', 'res_menu', 'res_recipes', 'stock', 'reports'], operationType: OperationType.RESTAURANT },
    // OBRA
    { id: 'w2', tenantId: 't2', name: 'Obra Centro', active: true, enabledModuleIds: ['rm', 'transfers', 'purchases', 'stock', 'reports'], operationType: OperationType.CONSTRUCTION },
    // FÁBRICA
    { id: 'w3', tenantId: 't3', name: 'Planta Campinas', active: true, enabledModuleIds: ['rm', 'transfers', 'purchases', 'stock', 'reports'], operationType: OperationType.FACTORY },
    // LOJA
    { id: 'w4', tenantId: 't4', name: 'Filial Centro', active: true, enabledModuleIds: ['sales', 'stock', 'reports'], operationType: OperationType.STORE },
  ],
  sectors: [
    // FÁBRICA SETORES
    { id: 's1', unitId: 'w3', name: 'Setor Usinagem', active: true },
    { id: 's2', unitId: 'w3', name: 'Setor Montagem', active: true },
  ],
  warehouses: [
    // RESTAURANTE
    { id: 'wh1', workId: 'w1', unitId: 'w1', name: 'Cozinha Central', isCentral: true, active: true },
    // OBRA
    { id: 'wh2', workId: 'w2', unitId: 'w2', name: 'Almoxarifado Central', isCentral: true, active: true },
    { id: 'wh3', workId: 'w2', unitId: 'w2', name: 'Estoque Canteiro', isCentral: false, active: true },
    // FÁBRICA
    { id: 'wh4', workId: 'w3', unitId: 'w3', name: 'Armazém Principal', isCentral: true, active: true },
    { id: 'wh5', workId: 'w3', unitId: 'w3', name: 'Setor Usinagem', isCentral: false, sectorId: 's1', active: true },
    { id: 'wh6', workId: 'w3', unitId: 'w3', name: 'Setor Montagem', isCentral: false, sectorId: 's2', active: true },
    // LOJA
    { id: 'wh7', workId: 'w4', unitId: 'w4', name: 'Estoque Loja', isCentral: true, active: true },
  ],
  materials: [
    // ALIMENTAÇÃO (Restaurante + Loja)
    { id: 'm1', sku: 'ALIM-001', name: 'Arroz Branco', unit: 'KG', category: 'Cozinha', minStock: 20 },
    { id: 'm2', sku: 'BEB-001', name: 'Coca-Cola Lata', unit: 'UN', category: 'Bebida', minStock: 50, salePrice: 6.50 },
    // CONSTRUÇÃO (Obra)
    { id: 'm3', sku: 'CONST-001', name: 'Cimento Portland', unit: 'SC', category: 'Estrutura', minStock: 100 },
    { id: 'm4', sku: 'CONST-002', name: 'Ferro Construção', unit: 'KG', category: 'Estrutura', minStock: 500 },
    { id: 'm5', sku: 'CONST-003', name: 'Areia', unit: 'M³', category: 'Agregados', minStock: 50 },
    // INDUSTRIAL (Fábrica)
    { id: 'm6', sku: 'IND-001', name: 'Aço Carbono 1045', unit: 'KG', category: 'Matéria Prima', minStock: 1000 },
    { id: 'm7', sku: 'IND-002', name: 'Óleo Hidráulico', unit: 'L', category: 'Fluidos', minStock: 100 },
    { id: 'm8', sku: 'IND-003', name: 'Parafuso M12', unit: 'UN', category: 'Fixação', minStock: 5000 },
    // VAREJO (Loja)
    { id: 'm9', sku: 'VAR-001', name: 'Camiseta Básica', unit: 'UN', category: 'Vestuário', minStock: 100, salePrice: 49.90 },
    { id: 'm10', sku: 'VAR-002', name: 'Calça Jeans', unit: 'UN', category: 'Vestuário', minStock: 50, salePrice: 129.90 },
  ],
  suppliers: [
    { id: 'sup1', tenantId: 't2', name: 'Fornecedor Construção ABC', taxId: '12345678000100', contactEmail: 'contato@const-abc.com', active: true },
    { id: 'sup2', tenantId: 't3', name: 'Aços e Metais XYZ', taxId: '98765432000150', contactEmail: 'vendas@acos-xyz.com', active: true },
  ],
  rms: [],
  rmItems: [],
  stocks: [
    // RESTAURANTE
    { warehouseId: 'wh1', materialId: 'm1', quantity: 50, reserved: 0 },
    { warehouseId: 'wh1', materialId: 'm2', quantity: 100, reserved: 0 },
    // OBRA
    { warehouseId: 'wh2', materialId: 'm3', quantity: 200, reserved: 0 },
    { warehouseId: 'wh2', materialId: 'm4', quantity: 1000, reserved: 0 },
    { warehouseId: 'wh2', materialId: 'm5', quantity: 100, reserved: 0 },
    { warehouseId: 'wh3', materialId: 'm3', quantity: 50, reserved: 0 },
    // FÁBRICA
    { warehouseId: 'wh4', materialId: 'm6', quantity: 2000, reserved: 0 },
    { warehouseId: 'wh4', materialId: 'm7', quantity: 500, reserved: 0 },
    { warehouseId: 'wh4', materialId: 'm8', quantity: 10000, reserved: 0 },
    { warehouseId: 'wh5', materialId: 'm6', quantity: 500, reserved: 0 },
    { warehouseId: 'wh6', materialId: 'm8', quantity: 2000, reserved: 0 },
    // LOJA
    { warehouseId: 'wh7', materialId: 'm2', quantity: 200, reserved: 0 },
    { warehouseId: 'wh7', materialId: 'm9', quantity: 150, reserved: 0 },
    { warehouseId: 'wh7', materialId: 'm10', quantity: 75, reserved: 0 },
  ],
  movements: [],
  pos: [],
  poItems: [],
  transfers: [],
  transferItems: [],
  sales: [],
  saleItems: [],
  documents: [],
  auditLogs: [],
  recipes: [],
  menuItems: [],
  tables: [],
  tabs: []
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

  // AUTH & BASE
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
  async getUsers(tenantId: string): Promise<User[]> { return this.db.users.filter(u => u.roleAssignments.some(ra => ra.scope.tenantId === tenantId)); }

  async createUser(name: string, email: string, tenantId: string, password?: string): Promise<User> {
    const user: User = {
      id: `U-${Date.now()}`,
      name,
      email,
      password,
      roleAssignments: [{ role: Role.VIEWER, scope: { tenantId } }]
    };
    this.db.users.push(user);
    this.save();
    return user;
  }

  // ESTOQUE
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

  // RESTAURANTE: RECEITAS
  async getRecipes(tenantId: string, unitId: string): Promise<Recipe[]> {
    return this.db.recipes.filter(r => r.tenantId === tenantId && r.unitId === unitId);
  }
  async saveRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
    const id = recipe.id || `REC-${Date.now()}`;
    const idx = this.db.recipes.findIndex(r => r.id === id);
    const newRecipe = { ...recipe, id, createdAt: recipe.createdAt || new Date().toISOString() } as Recipe;
    if (idx >= 0) this.db.recipes[idx] = newRecipe;
    else this.db.recipes.push(newRecipe);
    this.save();
    return newRecipe;
  }
  async deleteRecipe(id: string) {
    this.db.recipes = this.db.recipes.filter(r => r.id !== id);
    this.save();
  }

  // RESTAURANTE: CARDÁPIO
  async getMenuItems(tenantId: string, unitId: string): Promise<MenuItem[]> {
    return this.db.menuItems.filter(m => m.tenantId === tenantId && m.unitId === unitId);
  }
  async saveMenuItem(item: Partial<MenuItem>): Promise<MenuItem> {
    const id = item.id || `MENU-${Date.now()}`;
    const idx = this.db.menuItems.findIndex(m => m.id === id);
    const newItem = { ...item, id } as MenuItem;
    if (idx >= 0) this.db.menuItems[idx] = newItem;
    else this.db.menuItems.push(newItem);
    this.save();
    return newItem;
  }

  // RESTAURANTE: MESAS
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
  async deleteTable(id: string) {
    const table = this.db.tables.find(t => t.id === id);
    if (table?.activeTabId) throw new Error('Não é possível excluir mesa com comanda aberta.');
    this.db.tables = this.db.tables.filter(t => t.id !== id);
    this.save();
  }

  // RESTAURANTE: COMANDAS (TABS)
  async getTabById(id: string): Promise<Tab | undefined> {
    return this.db.tabs.find(t => t.id === id);
  }
  async openTab(tableId: string, tenantId: string, unitId: string, customerName?: string, peopleCount?: number): Promise<Tab> {
    const table = this.db.tables.find(t => t.id === tableId);
    if (!table) throw new Error('Mesa não encontrada');
    if (table.status !== 'FREE') throw new Error('Mesa já ocupada');

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
    if (!tab || tab.status !== 'OPEN') throw new Error('Comanda não pode ser fechada.');

    const neededMaterials: Record<string, number> = {};
    for (const item of tab.items.filter(i => i.status !== 'CANCELED')) {
      const menu = this.db.menuItems.find(m => m.id === item.menuItemId);
      if (!menu) continue;

      if (menu.linkType === 'MATERIAL_DIRECT') {
        const matId = menu.materialId!;
        neededMaterials[matId] = (neededMaterials[matId] || 0) + (menu.directQty! * item.qty);
      } else {
        const recipe = this.db.recipes.find(r => r.id === menu.recipeId);
        if (!recipe) continue;
        for (const ing of recipe.ingredients) {
          neededMaterials[ing.materialId] = (neededMaterials[ing.materialId] || 0) + (ing.qty * item.qty);
        }
      }
    }

    const currentStocks = this.db.stocks.filter(s => s.warehouseId === warehouseId);
    const missing: string[] = [];
    for (const [matId, qty] of Object.entries(neededMaterials)) {
      const s = currentStocks.find(x => x.materialId === matId);
      if (!s || s.quantity < qty) {
        const mat = this.db.materials.find(m => m.id === matId);
        missing.push(`${mat?.name || matId} (Falta ${(qty - (s?.quantity || 0)).toFixed(2)})`);
      }
    }

    if (missing.length > 0) throw new Error(`Estoque insuficiente: \n${missing.join('\n')}`);

    for (const [matId, qty] of Object.entries(neededMaterials)) {
      await this.addMovement({
        warehouseId, materialId: matId, type: 'RECIPE_CONSUMPTION',
        quantity: qty, userId, description: `Consumo Comanda #${tab.id}`, referenceId: tab.id
      });
    }

    tab.status = 'CLOSED';
    tab.closedAt = new Date().toISOString();
    tab.paymentMethod = paymentMethod;

    const table = this.db.tables.find(t => t.id === tab.tableId);
    if (table) { table.status = 'FREE'; delete table.activeTabId; }

    this.logAudit({ tenantId: tab.tenantId, entityId: tab.id, entityType: 'TAB', action: 'CLOSE', userId, userName: 'User', details: `Fechamento comanda valor ${tab.totalAmount}` });
    this.save();
  }

  async createWork(data: any) { 
    const work: Unit = {
      ...data,
      id: `W-${Date.now()}`,
      active: true,
      enabledModuleIds: []
    };
    this.db.works.push(work);
    this.save();
    return work;
  }

  async createSector(unitId: string, name: string): Promise<Sector> {
    const sector: Sector = {
      id: `SEC-${Date.now()}`,
      unitId,
      name,
      active: true
    };
    this.db.sectors.push(sector);
    this.save();
    return sector;
  }

  async createWarehouse(data: any): Promise<Warehouse> {
    const warehouse: Warehouse = {
      ...data,
      id: `WH-${Date.now()}`,
      active: true
    };
    this.db.warehouses.push(warehouse);
    this.save();
    return warehouse;
  }

  async createSale(data: any, items: any[]) { 
    const id = `SALE-${Date.now()}`;
    const sale: Sale = { ...data, id, status: 'COMPLETED', createdAt: new Date().toISOString() };
    this.db.sales.push(sale);
    items.forEach(i => this.db.saleItems.push({ ...i, id: `SALI-${Math.random()}`, saleId: id }));
    this.save();
    return sale;
  }
  async getSales(scope: Scope) { 
    return this.db.sales.filter(s => s.tenantId === scope.tenantId && (!scope.unitId || s.unitId === scope.unitId));
  }
  async getPOs(scope: Scope) { 
    return this.db.pos.filter(p => p.tenantId === scope.tenantId && (!scope.unitId || p.unitId === scope.unitId));
  }
  async getPOById(id: string) { 
    const po = this.db.pos.find(p => p.id === id);
    const items = this.db.poItems.filter(i => i.poId === id);
    return { po: po!, items };
  }
  async createPO(data: any, items: any[]) { 
    const id = `PO-${Date.now()}`;
    const po: PO = { ...data, id, status: 'OPEN', totalAmount: items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0), createdAt: new Date().toISOString() };
    this.db.pos.push(po);
    items.forEach(i => this.db.poItems.push({ ...i, id: `POI-${Math.random()}`, poId: id }));
    this.save();
    return po;
  }
  async closePO(id: string, status: any) {
    const po = this.db.pos.find(p => p.id === id);
    if (po) { po.status = status; this.save(); }
  }
  async getPurchaseBacklog(tenantId: string) { 
    return this.db.rmItems.filter(i => i.status === RMItemStatus.FOR_PURCHASE).map(item => ({
      item,
      rm: this.db.rms.find(r => r.id === item.rmId)!,
      material: this.db.materials.find(m => m.id === item.materialId)!
    }));
  }
  async getSuppliers(tenantId: string) { return this.db.suppliers.filter(s => s.tenantId === tenantId); }
  async createSupplier(data: any) { 
    const s: Supplier = { ...data, id: `SUP-${Date.now()}`, active: true };
    this.db.suppliers.push(s);
    this.save();
    return s;
  }
  async updateSupplier(id: string, data: any) {
    const idx = this.db.suppliers.findIndex(s => s.id === id);
    if (idx >= 0) { this.db.suppliers[idx] = { ...this.db.suppliers[idx], ...data }; this.save(); }
  }
  async getTransfers(scope: Scope) { 
    return this.db.transfers.filter(t => t.tenantId === scope.tenantId);
  }
  async getTransferById(id: string) { 
    const transfer = this.db.transfers.find(t => t.id === id);
    const items = this.db.transferItems.filter(i => i.transferId === id);
    return { transfer: transfer!, items };
  }
  async createTransfer(data: any, items: any[]) { 
    const id = `TRF-${Date.now()}`;
    const trf: Transfer = { ...data, id, status: 'CREATED', createdAt: new Date().toISOString() };
    this.db.transfers.push(trf);
    items.forEach(i => this.db.transferItems.push({ ...i, id: `TRFI-${Math.random()}`, transferId: id, quantitySent: 0, quantityReceived: 0 }));
    this.save();
    return trf;
  }
  async dispatchTransfer(id: string) {
    const trf = this.db.transfers.find(t => t.id === id);
    if (trf) { trf.status = 'IN_TRANSIT'; trf.dispatchedAt = new Date().toISOString(); this.save(); }
  }
  async receiveTransfer(id: string, qtys: any) {
    const trf = this.db.transfers.find(t => t.id === id);
    if (trf) {
      trf.status = 'DONE';
      trf.receivedAt = new Date().toISOString();
      Object.entries(qtys).forEach(([itemId, qty]) => {
        const item = this.db.transferItems.find(i => i.id === itemId);
        if (item) item.quantityReceived = qty as number;
      });
      this.save();
    }
  }
  async getDocuments(id: string) { return this.db.documents.filter(d => d.relatedId === id); }
  async getAllDocuments(id: string) { return this.db.documents.filter(d => d.tenantId === id); }
  async uploadDocument(data: any, tenantId: string) { 
    const doc: Document = { ...data, id: `DOC-${Date.now()}`, uploadedAt: new Date().toISOString(), tenantId };
    this.db.documents.push(doc);
    this.save();
    return doc;
  }
  async deleteDocument(id: string) { this.db.documents = this.db.documents.filter(d => d.id !== id); this.save(); }
  async getAuditLogsByEntity(id: string) { return this.db.auditLogs.filter(l => l.entityId === id); }
  async importCSVBatch(l: any, c: any) { return { success: l.length, errors: 0 }; }
  async getSectors(id: string) { return this.db.sectors.filter(s => s.unitId === id); }
  async updateMaterial(id: string, d: any) {
    const idx = this.db.materials.findIndex(m => m.id === id);
    if (idx >= 0) { this.db.materials[idx] = { ...this.db.materials[idx], ...d }; this.save(); }
  }
  async createMaterial(d: any) { 
    const mat: Material = { ...d, id: `M-${Date.now()}` };
    this.db.materials.push(mat);
    this.save();
    return mat;
  }
  async onboard(a: any, c: any) { 
    const tenantId = `T-${Date.now()}`;
    const unitId = `W-${Date.now()}`;
    const t: Tenant = { id: tenantId, name: c.name, active: true, operationType: c.operationType };
    const u: Unit = { id: unitId, tenantId, name: c.unitName, active: true, operationType: c.operationType, enabledModuleIds: [] };
    const user: User = { id: `U-${Date.now()}`, name: a.name, email: a.email, password: a.password, roleAssignments: [{ role: Role.OWNER, scope: { tenantId } }] };
    this.db.tenants.push(t);
    this.db.works.push(u);
    this.db.users.push(user);
    this.save();
  }
  async updateUserAssignments(id: string, a: any) {
    const user = this.db.users.find(u => u.id === id);
    if (user) { user.roleAssignments = a; this.save(); }
  }
  async updateUser(id: string, d: any) {
    const idx = this.db.users.findIndex(u => u.id === id);
    if (idx >= 0) { this.db.users[idx] = { ...this.db.users[idx], ...d }; this.save(); }
  }
  async deleteUser(id: string) { this.db.users = this.db.users.filter(u => u.id !== id); this.save(); }
  async deleteTenant(id: string) { 
    this.db.tenants = this.db.tenants.filter(t => t.id !== id); 
    this.db.works = this.db.works.filter(w => w.tenantId !== id);
    this.save();
  }
  async changePassword(id: string, c: string, n: string) {
    const user = this.db.users.find(u => u.id === id);
    if (user && user.password === c) { user.password = n; this.save(); }
    else throw new Error('Senha atual incorreta');
  }
  async updateUnitModules(id: string, m: string[]) {
    const unit = this.db.works.find(w => w.id === id);
    if (unit) { unit.enabledModuleIds = m; this.save(); }
  }
  async getRMs(s: Scope) { 
    return this.db.rms.filter(r => r.tenantId === s.tenantId && (!s.unitId || r.unitId === s.unitId));
  }
  async getRMById(id: string) { 
    const rm = this.db.rms.find(r => r.id === id);
    const items = this.db.rmItems.filter(i => i.rmId === id);
    return { rm: rm!, items };
  }
  async createRM(d: any, i: any[]) { 
    const id = `RM-${Date.now()}`;
    const rm: RM = { ...d, id, createdAt: new Date().toISOString(), status: RMStatus.WAITING_L1, requesterId: 'u1' };
    this.db.rms.push(rm);
    i.forEach(item => this.db.rmItems.push({ ...item, id: `RMI-${Math.random()}`, rmId: id, quantityFulfilled: 0, status: RMItemStatus.PENDING }));
    this.save();
    return rm;
  }
  async updateRM(id: string, d: any, i: any[]) {
    const idx = this.db.rms.findIndex(r => r.id === id);
    if (idx >= 0) {
      this.db.rms[idx] = { ...this.db.rms[idx], ...d };
      this.db.rmItems = this.db.rmItems.filter(item => item.rmId !== id);
      i.forEach(item => this.db.rmItems.push({ ...item, id: `RMI-${Math.random()}`, rmId: id, quantityFulfilled: 0, status: RMItemStatus.PENDING }));
      this.save();
    }
  }
  async updateRMStatus(id: string, s: any, u: string) {
    const rm = this.db.rms.find(r => r.id === id);
    if (rm) { rm.status = s; this.save(); }
  }
  async processRMFulfillment(id: string, p: any[], u: string) {
    const rm = this.db.rms.find(r => r.id === id);
    if (rm) {
      rm.status = RMStatus.DONE;
      p.forEach(pItem => {
        const item = this.db.rmItems.find(i => i.id === pItem.id);
        if (item) {
          item.quantityFulfilled = pItem.attended;
          item.status = RMItemStatus.RECEIVED;
        }
      });
      this.save();
    }
  }
}

export const api = new ApiService();
