
import { 
  User, Tenant, Unit, Sector, Warehouse, Material, RM, RMItem, Stock, 
  Movement, PO, POItem, Transfer, TransferItem, RMStatus, RMItemStatus, Role, RoleAssignment, Document, AuditLog, Supplier, OperationType, Sale, SaleItem, Scope
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
}

const INITIAL_DB: DB = {
  users: [
    { id: 'u1', name: 'João Dono', email: 'owner@example.com', password: '123', roleAssignments: [{ role: Role.OWNER, scope: { tenantId: 't1' } }] },
  ],
  tenants: [
    { id: 't1', name: 'Construtora Master', active: true, operationType: OperationType.CONSTRUCTION },
  ],
  works: [
    { id: 'w1', tenantId: 't1', name: 'Edifício Horizonte', active: true, enabledModuleIds: ['rm', 'stock', 'movements', 'transfers', 'purchases', 'documents', 'reports', 'admin_import'], operationType: OperationType.CONSTRUCTION },
  ],
  sectors: [],
  warehouses: [
    { id: 'wh1', workId: 'w1', unitId: 'w1', name: 'Almox Central', isCentral: true, active: true },
  ],
  materials: [
    { id: 'm1', sku: 'CIM-001', name: 'Cimento CP-II 50kg', unit: 'SC', category: 'Basico', minStock: 100, salePrice: 45.90 },
    { id: 'm2', sku: 'FER-012', name: 'Ferro 10mm', unit: 'BAR', category: 'Estrutura', minStock: 50, salePrice: 78.50 },
  ],
  suppliers: [], rms: [], rmItems: [], stocks: [], movements: [], pos: [], poItems: [], transfers: [], transferItems: [], sales: [], saleItems: [], documents: [], auditLogs: []
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

  async onboard(adminData: any, companyData: any) {
    const tenantId = `t-${Date.now()}`;
    const unitId = `u-${Date.now()}`;
    const userId = `u-${Date.now()}`;

    const newTenant: Tenant = {
      id: tenantId,
      name: companyData.name,
      operationType: companyData.operationType,
      active: true
    };

    // Configuração de módulos padrão baseada no tipo de operação
    const defaultModules = ['rm', 'stock', 'movements', 'purchases', 'documents', 'reports', 'admin_import'];
    
    if (companyData.operationType === OperationType.STORE) {
      defaultModules.push('sales');
      defaultModules.push('transfers');
    } else if (companyData.operationType === OperationType.RESTAURANT) {
      defaultModules.push('sales');
      defaultModules.push('tables');
      // Transferências não incluídas por padrão no restaurante conforme pedido
    } else {
      defaultModules.push('transfers');
    }

    const newUnit: Unit = {
      id: unitId,
      tenantId: tenantId,
      name: companyData.unitName,
      active: true,
      operationType: companyData.operationType,
      enabledModuleIds: defaultModules
    };

    const newUser: User = {
      id: userId,
      name: adminData.name,
      email: adminData.email,
      password: adminData.password,
      roleAssignments: [{ role: Role.OWNER, scope: { tenantId } }]
    };

    this.db.tenants.push(newTenant);
    this.db.works.push(newUnit);
    this.db.users.push(newUser);

    this.db.warehouses.push({ id: `wh-${Date.now()}`, unitId, workId: unitId, name: 'Estoque Geral', isCentral: true, active: true });
    
    this.save();
    return newUser;
  }

  async getTenants(): Promise<Tenant[]> { return this.db.tenants.filter(t => t.active); }
  async getWorks(tenantId: string): Promise<Unit[]> { return this.db.works.filter(w => w.tenantId === tenantId && w.active); }
  async getSectors(unitId: string): Promise<Sector[]> { return this.db.sectors.filter(s => s.unitId === unitId && s.active); }
  async getWarehouses(unitId: string): Promise<Warehouse[]> { return this.db.warehouses.filter(wh => wh.unitId === unitId && wh.active); }
  async getMaterials(): Promise<Material[]> { return this.db.materials; }
  async getUsers(tenantId: string): Promise<User[]> { return this.db.users.filter(u => u.roleAssignments.some(ra => ra.scope.tenantId === tenantId)); }
  async getUserById(id: string): Promise<User | undefined> { return this.db.users.find(u => u.id === id); }

  async login(email: string, password?: string): Promise<User> {
    const user = this.db.users.find(u => u.email === email && (!password || u.password === password));
    if (!user) throw new Error('Email ou senha inválidos');
    return user;
  }

  async createWork(data: any): Promise<Unit> {
    const newW = { ...data, id: `w-${Date.now()}`, active: true };
    this.db.works.push(newW);
    this.save();
    return newW;
  }

  async createSector(unitId: string, name: string): Promise<Sector> {
    const newSec = { id: `sec-${Date.now()}`, unitId, name, active: true };
    this.db.sectors.push(newSec);
    this.save();
    return newSec;
  }

  async createWarehouse(data: any): Promise<Warehouse> {
    const newWh = { ...data, id: `wh-${Date.now()}`, active: true, workId: data.unitId };
    this.db.warehouses.push(newWh);
    this.save();
    return newWh;
  }

  async createUser(name: string, email: string, tenantId: string, password?: string): Promise<User> {
    const newUser: User = { id: `u${Date.now()}`, name, email, password: password || '123456', roleAssignments: [] };
    this.db.users.push(newUser);
    this.save();
    return newUser;
  }

  // Fix: Added updateUserAssignments method
  async updateUserAssignments(userId: string, roleAssignments: RoleAssignment[]): Promise<void> {
    const user = this.db.users.find(u => u.id === userId);
    if (user) {
      user.roleAssignments = roleAssignments;
      this.save();
    }
  }

  // Fix: Added updateUser method
  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    const userIndex = this.db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      this.db.users[userIndex] = { ...this.db.users[userIndex], ...data };
      this.save();
    }
  }

  // Fix: Added deleteUser method
  async deleteUser(userId: string): Promise<void> {
    this.db.users = this.db.users.filter(u => u.id !== userId);
    this.save();
  }

  // Fix: Added deleteTenant method
  async deleteTenant(tenantId: string): Promise<void> {
    this.db.tenants = this.db.tenants.filter(t => t.id !== tenantId);
    this.db.works = this.db.works.filter(w => w.tenantId !== tenantId);
    this.db.rms = this.db.rms.filter(r => r.tenantId !== tenantId);
    this.db.pos = this.db.pos.filter(p => p.tenantId !== tenantId);
    this.db.suppliers = this.db.suppliers.filter(s => s.tenantId !== tenantId);
    this.db.users = this.db.users.filter(u => !u.roleAssignments.every(ra => ra.scope.tenantId === tenantId));
    this.save();
  }

  // Fix: Added changePassword method
  async changePassword(userId: string, current: string, newPass: string): Promise<void> {
    const user = this.db.users.find(u => u.id === userId);
    if (!user || user.password !== current) throw new Error('Senha atual incorreta');
    user.password = newPass;
    this.save();
  }

  // Fix: Added updateUnitModules method
  async updateUnitModules(unitId: string, moduleIds: string[]): Promise<void> {
    const unit = this.db.works.find(w => w.id === unitId);
    if (unit) {
      unit.enabledModuleIds = moduleIds;
      this.save();
    }
  }

  async getRMs(scope: Scope) { 
    const unitId = scope.unitId || scope.workId;
    return this.db.rms.filter(r => r.tenantId === scope.tenantId && (!unitId || r.unitId === unitId)); 
  }

  async getRMById(id: string) {
    const rm = this.db.rms.find(r => r.id === id);
    if (!rm) throw new Error('RM não encontrada');
    const items = this.db.rmItems.filter(i => i.rmId === id);
    return { rm, items };
  }

  async createRM(data: any, items: any[]) {
    const rmId = `RM-${Date.now()}`;
    const newRM: RM = { ...data, id: rmId, requesterId: data.requesterId || 'u1', createdAt: new Date().toISOString(), status: RMStatus.WAITING_L1 };
    this.db.rms.push(newRM);
    items.forEach(i => {
      this.db.rmItems.push({ ...i, id: `RMI-${Date.now()}`, rmId, quantityFulfilled: 0, status: RMItemStatus.PENDING, estimatedPrice: 0 });
    });
    this.save();
    return newRM;
  }

  // Fix: Added updateRM method
  async updateRM(id: string, data: any, items: any[]) {
    const rmIndex = this.db.rms.findIndex(r => r.id === id);
    if (rmIndex === -1) throw new Error('RM não encontrada');
    this.db.rms[rmIndex] = { ...this.db.rms[rmIndex], ...data };
    this.db.rmItems = this.db.rmItems.filter(i => i.rmId !== id);
    items.forEach(i => {
      this.db.rmItems.push({ ...i, id: `RMI-${Date.now()}-${Math.random()}`, rmId: id, quantityFulfilled: i.quantityFulfilled || 0, status: i.status || RMItemStatus.PENDING, estimatedPrice: i.estimatedPrice || 0 });
    });
    this.save();
  }

  // Fix: Added updateRMStatus method
  async updateRMStatus(id: string, status: RMStatus, userId?: string) {
    const rm = this.db.rms.find(r => r.id === id);
    if (!rm) throw new Error('RM não encontrada');
    rm.status = status;
    this.logAudit({ tenantId: rm.tenantId, entityId: id, entityType: 'RM', action: 'STATUS_UPDATE', userId: userId || 'system', userName: 'User', details: `Status alterado para ${status}` });
    this.save();
  }

  // Fix: Added processRMFulfillment method
  async processRMFulfillment(rmId: string, itemProcessing: any[], userId: string) {
    const { rm, items } = await this.getRMById(rmId);
    const centralWh = this.db.warehouses.find(w => w.isCentral && w.unitId === rm.unitId) || this.db.warehouses.find(w => w.isCentral);
    
    if (itemProcessing.some(ip => ip.attended > 0) && centralWh) {
      // Logic for transfer if stock is available would go here. For now just update items.
    }

    itemProcessing.forEach(ip => {
      const item = this.db.rmItems.find(i => i.id === ip.id);
      if (item) {
        item.quantityFulfilled += ip.attended;
        if (ip.purchase > 0) item.status = RMItemStatus.FOR_PURCHASE;
        else if (item.quantityFulfilled >= item.quantityRequested) item.status = RMItemStatus.RECEIVED;
      }
    });

    rm.status = RMStatus.IN_FULFILLMENT;
    this.logAudit({ tenantId: rm.tenantId, entityId: rmId, entityType: 'RM', action: 'FULFILLMENT', userId, userName: 'User', details: 'Triagem de itens realizada.' });
    this.save();
  }

  async getMovements(scope: Scope) { 
    const unitId = scope.unitId || scope.workId;
    return this.db.movements.filter(m => {
       const wh = this.db.warehouses.find(w => w.id === m.warehouseId);
       if (scope.warehouseId) return m.warehouseId === scope.warehouseId;
       if (unitId) return wh?.unitId === unitId;
       return true;
    }); 
  }

  async getStock(scope: Scope) { 
    const unitId = scope.unitId || scope.workId;
    return this.db.stocks.filter(s => {
       const wh = this.db.warehouses.find(w => w.id === s.warehouseId);
       if (scope.warehouseId) return s.warehouseId === scope.warehouseId;
       if (unitId) return wh?.unitId === unitId;
       return true;
    }); 
  }

  async addMovement(data: any) {
    const movement: Movement = { ...data, id: `MOV-${Date.now()}`, timestamp: new Date().toISOString() };
    this.db.movements.push(movement);
    let stock = this.db.stocks.find(s => s.warehouseId === data.warehouseId && s.materialId === data.materialId);
    if (!stock) { stock = { warehouseId: data.warehouseId, materialId: data.materialId, quantity: 0, reserved: 0 }; this.db.stocks.push(stock); }
    if (['ENTRY', 'TRANSFER_IN', 'SALE_CANCEL'].includes(data.type)) stock.quantity += data.quantity;
    else stock.quantity -= data.quantity;
    this.save();
    return movement;
  }

  // Fix: Added updateMaterial method
  async updateMaterial(id: string, data: Partial<Material>) {
    const idx = this.db.materials.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.db.materials[idx] = { ...this.db.materials[idx], ...data };
      this.save();
    }
  }

  // Fix: Added createMaterial method
  async createMaterial(data: any) {
    const newM = { ...data, id: `m-${Date.now()}` };
    this.db.materials.push(newM);
    this.save();
    return newM;
  }

  async createSale(data: any, items: any[]) {
    const saleId = `SALE-${Date.now()}`;
    const newSale: Sale = { ...data, id: saleId, status: 'COMPLETED', createdAt: new Date().toISOString(), totalAmount: items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0) };
    this.db.sales.push(newSale);
    items.forEach(i => {
      this.db.saleItems.push({ ...i, id: `SI-${Date.now()}`, saleId });
      this.addMovement({ warehouseId: data.warehouseId, materialId: i.materialId, type: 'SALE', quantity: i.quantity, description: `Venda ${saleId}`, userId: data.sellerId });
    });
    this.save();
    return newSale;
  }

  async getSales(scope: Scope) { 
    const unitId = scope.unitId || scope.workId;
    return this.db.sales.filter(s => s.tenantId === scope.tenantId && (!unitId || s.unitId === unitId)); 
  }

  async getPOs(scope: Scope) { 
    const unitId = scope.unitId || scope.workId;
    return this.db.pos.filter(p => p.tenantId === scope.tenantId && (!unitId || p.unitId === unitId)); 
  }

  // Fix: Added getPOById method
  async getPOById(id: string) {
    const po = this.db.pos.find(p => p.id === id);
    if (!po) throw new Error('PO não encontrada');
    const items = this.db.poItems.filter(i => i.poId === id);
    return { po, items };
  }

  // Fix: Added createPO method
  async createPO(data: any, items: any[]) {
    const poId = `PO-${Date.now()}`;
    const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
    const newPO: PO = { ...data, id: poId, status: 'OPEN', createdAt: new Date().toISOString(), totalAmount, unitId: data.workId };
    this.db.pos.push(newPO);
    items.forEach(i => {
      this.db.poItems.push({ ...i, id: `POI-${Date.now()}`, poId });
      // Update RM Item status
      const rmItem = this.db.rmItems.find(rmi => rmi.id === i.rmItemId);
      if (rmItem) rmItem.status = RMItemStatus.SEPARATION;
    });
    this.save();
    return newPO;
  }

  // Fix: Added closePO method
  async closePO(id: string, status: 'CLOSED' | 'CANCELED') {
    const po = this.db.pos.find(p => p.id === id);
    if (po) {
      po.status = status;
      this.save();
    }
  }

  // Fix: Added getPurchaseBacklog method
  async getPurchaseBacklog(tenantId: string) {
    const backlogItems = this.db.rmItems.filter(i => i.status === RMItemStatus.FOR_PURCHASE);
    return backlogItems.map(item => {
      const rm = this.db.rms.find(r => r.id === item.rmId)!;
      const material = this.db.materials.find(m => m.id === item.materialId)!;
      return { item, rm, material };
    }).filter(b => b.rm.tenantId === tenantId);
  }

  async getSuppliers(tenantId: string) { return this.db.suppliers.filter(s => s.tenantId === tenantId); }
  
  // Fix: Added createSupplier method
  async createSupplier(data: any) {
    const newS = { ...data, id: `sup-${Date.now()}`, active: true };
    this.db.suppliers.push(newS);
    this.save();
    return newS;
  }

  // Fix: Added updateSupplier method
  async updateSupplier(id: string, data: Partial<Supplier>) {
    const idx = this.db.suppliers.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.db.suppliers[idx] = { ...this.db.suppliers[idx], ...data };
      this.save();
    }
  }

  // Fix: Added getTransfers method
  async getTransfers(scope: Scope) {
    const unitId = scope.unitId || scope.workId;
    return this.db.transfers.filter(t => t.tenantId === scope.tenantId);
  }

  // Fix: Added getTransferById method
  async getTransferById(id: string) {
    const transfer = this.db.transfers.find(t => t.id === id);
    if (!transfer) throw new Error('Transferência não encontrada');
    const items = this.db.transferItems.filter(i => i.transferId === id);
    return { transfer, items };
  }

  // Fix: Added createTransfer method
  async createTransfer(data: any, items: any[]) {
    const tId = `TR-${Date.now()}`;
    const newT: Transfer = { ...data, id: tId, status: 'CREATED', createdAt: new Date().toISOString() };
    this.db.transfers.push(newT);
    items.forEach(i => {
      this.db.transferItems.push({ ...i, id: `TRI-${Date.now()}`, transferId: tId, quantitySent: 0, quantityReceived: 0 });
    });
    this.save();
    return newT;
  }

  // Fix: Added dispatchTransfer method
  async dispatchTransfer(id: string) {
    const t = this.db.transfers.find(tr => tr.id === id);
    if (!t) return;
    t.status = 'IN_TRANSIT';
    t.dispatchedAt = new Date().toISOString();
    const items = this.db.transferItems.filter(i => i.transferId === id);
    items.forEach(item => {
      item.quantitySent = item.quantityRequested;
      this.addMovement({
        warehouseId: t.originWarehouseId,
        materialId: item.materialId,
        type: 'TRANSFER_OUT',
        quantity: item.quantitySent,
        description: `Saída p/ Transferência ${id}`,
        userId: 'system'
      });
    });
    this.save();
  }

  // Fix: Added receiveTransfer method
  async receiveTransfer(id: string, receivedQtys: Record<string, number>) {
    const t = this.db.transfers.find(tr => tr.id === id);
    if (!t) return;
    t.status = 'DONE';
    t.receivedAt = new Date().toISOString();
    const items = this.db.transferItems.filter(i => i.transferId === id);
    items.forEach(item => {
      item.quantityReceived = receivedQtys[item.id] || 0;
      this.addMovement({
        warehouseId: t.destinationWarehouseId,
        materialId: item.materialId,
        type: 'TRANSFER_IN',
        quantity: item.quantityReceived,
        description: `Entrada de Transferência ${id}`,
        userId: 'system'
      });
    });
    this.save();
  }

  async getDocuments(relatedId: string) { return this.db.documents.filter(d => d.relatedId === relatedId); }
  async getAllDocuments(tenantId: string) { return this.db.documents.filter(d => d.tenantId === tenantId); }
  
  // Fix: Added uploadDocument method
  async uploadDocument(data: any, tenantId: string) {
    const newDoc: Document = { ...data, id: `doc-${Date.now()}`, tenantId, uploadedAt: new Date().toISOString() };
    this.db.documents.push(newDoc);
    this.save();
    return newDoc;
  }

  // Fix: Added deleteDocument method
  async deleteDocument(id: string) {
    this.db.documents = this.db.documents.filter(d => d.id !== id);
    this.save();
  }

  async getAuditLogsByEntity(entityId: string) { return this.db.auditLogs.filter(l => l.entityId === entityId).reverse(); }
  
  async importCSVBatch(lines: any[], config: any) { return { success: lines.length, errors: 0 }; }
}

export const api = new ApiService();
