
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
    { id: 'w1', tenantId: 't1', name: 'Edifício Horizonte', active: true, enabledModuleIds: ['rm', 'stock', 'movements', 'transfers', 'purchases', 'documents', 'reports'] },
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

    const newUnit: Unit = {
      id: unitId,
      tenantId: tenantId,
      name: companyData.unitName,
      active: true,
      enabledModuleIds: []
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

    if (companyData.operationType === OperationType.FACTORY) {
      const secId = `sec-${Date.now()}`;
      this.db.sectors.push({ id: secId, unitId, name: 'Produção Central', active: true });
      this.db.warehouses.push({ id: `wh-${Date.now()}`, unitId, workId: unitId, sectorId: secId, name: 'Estoque Geral', isCentral: true, active: true });
    } else {
      // Para STORE e CONSTRUCTION, agora sempre criamos um 'Estoque Geral' por padrão
      this.db.warehouses.push({ id: `wh-${Date.now()}`, unitId, workId: unitId, name: 'Estoque Geral', isCentral: true, active: true });
    }

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

  async createUser(name: string, email: string, tenantId: string): Promise<User> {
    const newUser: User = { id: `u${Date.now()}`, name, email, roleAssignments: [{ role: Role.VIEWER, scope: { tenantId } }] };
    this.db.users.push(newUser);
    this.save();
    return newUser;
  }

  async updateUserAssignments(userId: string, roleAssignments: RoleAssignment[]) {
    const user = this.db.users.find(u => u.id === userId);
    if (user) { user.roleAssignments = roleAssignments; this.save(); }
  }

  async updateUnitModules(unitId: string, enabledModuleIds: string[]) {
    const unit = this.db.works.find(u => u.id === unitId);
    if (unit) { unit.enabledModuleIds = enabledModuleIds; this.save(); }
  }

  async getRMs(scope: Scope) { 
    return this.db.rms.filter(r => r.tenantId === scope.tenantId); 
  }

  async getRMById(id: string) {
    const rm = this.db.rms.find(r => r.id === id);
    if (!rm) throw new Error('RM não encontrada');
    const items = this.db.rmItems.filter(i => i.rmId === id);
    return { rm, items };
  }

  async createRM(data: any, items: any[]) {
    const rmId = `RM-${Date.now()}`;
    const newRM: RM = {
      ...data,
      id: rmId,
      requesterId: this.db.users[0].id,
      createdAt: new Date().toISOString(),
      status: RMStatus.WAITING_L1
    };
    this.db.rms.push(newRM);
    items.forEach(i => {
      this.db.rmItems.push({
        ...i,
        id: `RMI-${Math.random().toString(36).substr(2, 9)}`,
        rmId,
        quantityFulfilled: 0,
        status: RMItemStatus.PENDING,
        estimatedPrice: 0
      });
    });
    this.save();
    return newRM;
  }

  async updateRM(id: string, data: any, items: any[]) {
    const idx = this.db.rms.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.db.rms[idx] = { ...this.db.rms[idx], ...data };
      this.db.rmItems = this.db.rmItems.filter(i => i.rmId !== id);
      items.forEach(i => {
        this.db.rmItems.push({
          ...i,
          id: `RMI-${Math.random().toString(36).substr(2, 9)}`,
          rmId: id,
          quantityFulfilled: 0,
          status: RMItemStatus.PENDING,
          estimatedPrice: 0
        });
      });
      this.save();
    }
  }

  async updateRMStatus(id: string, status: RMStatus) {
    const rm = this.db.rms.find(r => r.id === id);
    if (rm) {
      rm.status = status;
      this.save();
    }
  }

  async triageRMItem(itemId: string, attended: number, purchase: number) {
    const item = this.db.rmItems.find(i => i.id === itemId);
    if (item) {
      item.quantityFulfilled = attended;
      item.status = purchase > 0 ? RMItemStatus.FOR_PURCHASE : RMItemStatus.FROM_STOCK;
      this.save();
    }
  }

  async addMovement(data: any) {
    const movement: Movement = {
      ...data,
      id: `MOV-${Date.now()}`,
      userId: this.db.users[0].id,
      timestamp: new Date().toISOString()
    };
    this.db.movements.push(movement);
    
    let stock = this.db.stocks.find(s => s.warehouseId === data.warehouseId && s.materialId === data.materialId);
    if (!stock) {
      stock = { warehouseId: data.warehouseId, materialId: data.materialId, quantity: 0, reserved: 0 };
      this.db.stocks.push(stock);
    }
    
    if (['ENTRY', 'TRANSFER_IN'].includes(data.type)) {
      stock.quantity += data.quantity;
    } else {
      stock.quantity -= data.quantity;
    }
    
    this.save();
    return movement;
  }

  async getMovements(scope: Scope) { 
    if (scope.warehouseId) return this.db.movements.filter(m => m.warehouseId === scope.warehouseId);
    return this.db.movements; 
  }

  async getStock(scope: Scope) { 
    if (scope.warehouseId) return this.db.stocks.filter(s => s.warehouseId === scope.warehouseId);
    return this.db.stocks; 
  }

  async getPurchaseBacklog(tenantId: string) {
    return this.db.rmItems
      .filter(i => i.status === RMItemStatus.FOR_PURCHASE)
      .map(i => {
        const rm = this.db.rms.find(r => r.id === i.rmId)!;
        const material = this.db.materials.find(m => m.id === i.materialId)!;
        return { item: i, rm, material };
      });
  }

  async createPO(data: any, items: any[]) {
    const poId = `PO-${Date.now()}`;
    const newPO: PO = {
      ...data,
      id: poId,
      status: 'OPEN',
      totalAmount: items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0),
      createdAt: new Date().toISOString()
    };
    this.db.pos.push(newPO);
    items.forEach(i => {
      this.db.poItems.push({
        ...i,
        id: `POI-${Math.random().toString(36).substr(2, 9)}`,
        poId
      });
    });
    this.save();
    return newPO;
  }

  async getPOById(id: string) {
    const po = this.db.pos.find(p => p.id === id);
    if (!po) throw new Error('PO não encontrada');
    const items = this.db.poItems.filter(i => i.poId === id);
    return { po, items };
  }

  async closePO(id: string, status: any) {
    const po = this.db.pos.find(p => p.id === id);
    if (po) {
      po.status = status;
      this.save();
    }
  }

  async getPOs(tenantId: string) { return this.db.pos.filter(p => p.tenantId === tenantId); }
  async getSuppliers(tenantId: string) { return this.db.suppliers.filter(s => s.tenantId === tenantId); }

  async getTransfers(scope: Scope) {
    return this.db.transfers.filter(t => t.tenantId === scope.tenantId);
  }

  async getTransferById(id: string) {
    const transfer = this.db.transfers.find(t => t.id === id);
    if (!transfer) throw new Error('Transferência não encontrada');
    const items = this.db.transferItems.filter(i => i.transferId === id);
    return { transfer, items };
  }

  async dispatchTransfer(id: string) {
    const t = this.db.transfers.find(x => x.id === id);
    if (t) {
      t.status = 'IN_TRANSIT';
      t.dispatchedAt = new Date().toISOString();
      this.save();
    }
  }

  async receiveTransfer(id: string, receivedQtys: Record<string, number>) {
    const t = this.db.transfers.find(x => x.id === id);
    if (t) {
      t.status = 'DONE';
      t.receivedAt = new Date().toISOString();
      const items = this.db.transferItems.filter(i => i.transferId === id);
      items.forEach(item => {
        item.quantityReceived = receivedQtys[item.id] || 0;
      });
      this.save();
    }
  }

  async createTransfer(data: any, items: any[]) {
    const transferId = `TR-${Date.now()}`;
    const newT: Transfer = {
      ...data,
      id: transferId,
      status: 'CREATED',
      createdAt: new Date().toISOString()
    };
    this.db.transfers.push(newT);
    items.forEach(i => {
      this.db.transferItems.push({
        ...i,
        id: `TRI-${Math.random().toString(36).substr(2, 9)}`,
        transferId,
        quantitySent: i.quantityRequested,
        quantityReceived: 0
      });
    });
    this.save();
    return newT;
  }

  async createMaterial(data: any) {
    const newM = { ...data, id: `m-${Date.now()}` };
    this.db.materials.push(newM);
    this.save();
    return newM;
  }

  async createWork(data: any) {
    const newW = { ...data, id: `w-${Date.now()}`, active: true };
    this.db.works.push(newW);
    this.save();
    return newW;
  }

  async updateSupplier(id: string, data: any) {
    const idx = this.db.suppliers.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.db.suppliers[idx] = { ...this.db.suppliers[idx], ...data };
      this.save();
    }
  }

  async createSupplier(data: any) {
    const newS = { ...data, id: `s-${Date.now()}`, active: true };
    this.db.suppliers.push(newS);
    this.save();
    return newS;
  }

  async uploadDocument(data: any) {
    const newD = { ...data, id: `doc-${Date.now()}`, uploadedAt: new Date().toISOString() };
    this.db.documents.push(newD);
    this.save();
    return newD;
  }

  async deleteDocument(id: string) {
    this.db.documents = this.db.documents.filter(d => d.id !== id);
    this.save();
  }

  async getDocuments(relatedId: string) { 
    return this.db.documents.filter(d => d.relatedId === relatedId); 
  }
  
  async getAllDocuments(tenantId: string) { 
    return this.db.documents; 
  }
  
  async getAuditLogsByEntity(entityId: string) { 
    return this.db.auditLogs.filter(l => l.entityId === entityId); 
  }

  async createSale(data: any, items: any[]) {
    const saleId = `SALE-${Date.now()}`;
    const newSale: Sale = {
      ...data,
      id: saleId,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      totalAmount: items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0)
    };
    this.db.sales.push(newSale);
    items.forEach(i => {
      this.db.saleItems.push({ ...i, id: `SI-${Date.now()}`, saleId });
      this.addMovement({
        warehouseId: data.warehouseId,
        materialId: i.materialId,
        type: 'SALE',
        quantity: i.quantity,
        description: `Venda ${saleId}`
      });
    });
    this.save();
    return newSale;
  }

  async getSales(tenantId: string) { 
    return this.db.sales.filter(s => s.tenantId === tenantId); 
  }

  async importCSVBatch(lines: any[], config: any) {
    return { success: lines.length };
  }
}

export const api = new ApiService();
