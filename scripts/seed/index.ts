import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from apps/api/.env
dotenv.config({ path: path.resolve(__dirname, '../../apps/api/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus';

// Define schemas inline for seed script reliability
const OrgSchema = new mongoose.Schema({ name: String, code: String }, { timestamps: true });
const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: String,
    organizationId: mongoose.Schema.Types.ObjectId,
    isActive: Boolean,
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    organizationId: mongoose.Schema.Types.ObjectId,
    sku: { type: String, uppercase: true },
    name: String,
    description: String,
    category: String,
    unit: String,
    unitCost: Number,
    sellingPrice: Number,
    minStockLevel: Number,
    reorderPoint: Number,
    reorderQuantity: Number,
    leadTimeDays: Number,
    safetyStock: Number,
    gstRate: Number,
    hsnCode: String,
    status: String,
  },
  { timestamps: true }
);

const WarehouseSchema = new mongoose.Schema(
  {
    organizationId: mongoose.Schema.Types.ObjectId,
    code: String,
    name: String,
    type: String,
    address: { street: String, city: String, state: String, postalCode: String, country: String },
    capacityVolumeSqFt: Number,
    maxPallets: Number,
    currentOccupancyPallets: Number,
    status: String,
    zones: Array,
  },
  { timestamps: true }
);

const StockLevelSchema = new mongoose.Schema(
  {
    organizationId: mongoose.Schema.Types.ObjectId,
    productId: mongoose.Schema.Types.ObjectId,
    warehouseId: mongoose.Schema.Types.ObjectId,
    binLocation: String,
    quantityOnHand: Number,
    quantityAllocated: Number,
    quantityOnOrder: Number,
    safetyStock: Number,
    reorderPoint: Number,
    lastMovementAt: Date,
  },
  { timestamps: true }
);

const StockLedgerSchema = new mongoose.Schema(
  {
    organizationId: mongoose.Schema.Types.ObjectId,
    productId: mongoose.Schema.Types.ObjectId,
    warehouseId: mongoose.Schema.Types.ObjectId,
    movementType: String,
    quantityDelta: Number,
    previousQuantityOnHand: Number,
    newQuantityOnHand: Number,
    unitCost: Number,
    totalValue: Number,
    referenceType: String,
    referenceId: String,
    performedByUserId: mongoose.Schema.Types.ObjectId,
    performedByName: String,
    notes: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const SupplierSchema = new mongoose.Schema({
  organizationId: mongoose.Schema.Types.ObjectId,
  code: String,
  name: String,
  contactName: String,
  email: String,
  phone: String,
  gstin: String,
  paymentTerms: String,
  leadTimeDays: Number,
  rating: Number,
  status: String,
}, { timestamps: true });

const POSchema = new mongoose.Schema({
  organizationId: mongoose.Schema.Types.ObjectId,
  poNumber: String,
  supplierId: mongoose.Schema.Types.ObjectId,
  supplierName: String,
  warehouseId: mongoose.Schema.Types.ObjectId,
  warehouseName: String,
  status: String,
  expectedDeliveryDate: Date,
  items: Array,
  subtotal: Number,
  taxAmount: Number,
  totalAmount: Number,
  notes: String,
  createdByUserId: mongoose.Schema.Types.ObjectId,
  createdByName: String,
}, { timestamps: true });

const AlertSchema = new mongoose.Schema({
  organizationId: mongoose.Schema.Types.ObjectId,
  type: String,
  severity: String,
  title: String,
  message: String,
  isResolved: Boolean,
}, { timestamps: true });

const GoodsReceiptSchema = new mongoose.Schema({
  organizationId: mongoose.Schema.Types.ObjectId,
  grnNumber: String,
  purchaseOrderId: mongoose.Schema.Types.ObjectId,
  warehouseId: mongoose.Schema.Types.ObjectId,
  invoiceNumber: String,
  invoiceAmount: Number,
  items: Array,
  receivedByUserId: mongoose.Schema.Types.ObjectId,
  receivedByName: String,
  notes: String,
}, { timestamps: true });

const AuditLogSchema = new mongoose.Schema({
  organizationId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  userEmail: String,
  userRole: String,
  resource: String,
  resourceId: String,
  action: String,
  before: Object,
  after: Object,
  reason: String,
  requestId: String,
  ip: String,
  userAgent: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

const Org = mongoose.model('Organization', OrgSchema);
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Warehouse = mongoose.model('Warehouse', WarehouseSchema);
const StockLevel = mongoose.model('StockLevel', StockLevelSchema);
const StockLedger = mongoose.model('StockLedger', StockLedgerSchema);
const Supplier = mongoose.model('Supplier', SupplierSchema);
const PurchaseOrder = mongoose.model('PurchaseOrder', POSchema);
const Alert = mongoose.model('Alert', AlertSchema);
const GoodsReceipt = mongoose.model('GoodsReceipt', GoodsReceiptSchema);
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

async function seed() {
  console.log('🌱 Starting NEXUS Database Seed Process...');
  console.log(`📡 Connecting to MongoDB at ${MONGODB_URI.split('@').pop() || 'localhost'}...`);

  await mongoose.connect(MONGODB_URI);

  // Clear existing collections
  console.log('🧹 Cleaning existing data...');
  await Promise.all([
    Org.deleteMany({}),
    User.deleteMany({}),
    Product.deleteMany({}),
    Warehouse.deleteMany({}),
    StockLevel.deleteMany({}),
    StockLedger.deleteMany({}),
    Supplier.deleteMany({}),
    PurchaseOrder.deleteMany({}),
    Alert.deleteMany({}),
    GoodsReceipt.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  // Create Organization
  console.log('🏢 Creating Organization...');
  const org = await Org.create({
    name: 'NEXUS Logistics & Industrial Supply Ltd.',
    code: 'NEXUS-IND',
  });

  // Create Password Hash
  const passwordHash = await bcrypt.hash('Demo@12345', 12);

  // Create Users
  console.log('👥 Creating Demo Accounts...');
  const users = await User.create([
    {
      firstName: 'Rajesh',
      lastName: 'Kumar',
      email: 'admin@nexus.demo',
      passwordHash,
      role: 'admin',
      organizationId: org._id,
      isActive: true,
      isEmailVerified: true,
    },
    {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'procure@nexus.demo',
      passwordHash,
      role: 'procurement_manager',
      organizationId: org._id,
      isActive: true,
      isEmailVerified: true,
    },
    {
      firstName: 'Vikram',
      lastName: 'Singh',
      email: 'warehouse@nexus.demo',
      passwordHash,
      role: 'warehouse_manager',
      organizationId: org._id,
      isActive: true,
      isEmailVerified: true,
    },
    {
      firstName: 'Ananya',
      lastName: 'Iyer',
      email: 'finance@nexus.demo',
      passwordHash,
      role: 'finance',
      organizationId: org._id,
      isActive: true,
      isEmailVerified: true,
    },
    {
      firstName: 'Suresh',
      lastName: 'Mehta',
      email: 'auditor@nexus.demo',
      passwordHash,
      role: 'auditor',
      organizationId: org._id,
      isActive: true,
      isEmailVerified: true,
    },
  ]);

  const adminUser = users[0];

  // Create Warehouses
  console.log('🏭 Creating Warehouses...');
  const warehouses = await Warehouse.create([
    {
      organizationId: org._id,
      code: 'WH-BOM-01',
      name: 'Mumbai Central Hub',
      type: 'CENTRAL_HUB',
      address: { street: 'Bhiwandi Logistics Park', city: 'Thane/Mumbai', state: 'Maharashtra', postalCode: '421302', country: 'India' },
      capacityVolumeSqFt: 150000,
      maxPallets: 5000,
      currentOccupancyPallets: 3850,
      status: 'ACTIVE',
      zones: [
        { code: 'Z-REC', name: 'Receiving Dock', type: 'RECEIVING', capacityUnits: 1000, currentOccupancyUnits: 200 },
        { code: 'Z-STR', name: 'Main High-Bay Storage', type: 'STORAGE', capacityUnits: 50000, currentOccupancyUnits: 38000 },
        { code: 'Z-PCK', name: 'Fast-Pick Area', type: 'PICKING', capacityUnits: 5000, currentOccupancyUnits: 3200 },
      ],
    },
    {
      organizationId: org._id,
      code: 'WH-BLR-02',
      name: 'Bengaluru Tech Logistics Hub',
      type: 'REGIONAL_DC',
      address: { street: 'Hoskote Industrial Area', city: 'Bengaluru', state: 'Karnataka', postalCode: '562114', country: 'India' },
      capacityVolumeSqFt: 100000,
      maxPallets: 3500,
      currentOccupancyPallets: 2100,
      status: 'ACTIVE',
      zones: [
        { code: 'Z-STR', name: 'General Storage', type: 'STORAGE', capacityUnits: 30000, currentOccupancyUnits: 20000 },
        { code: 'Z-PAC', name: 'Packing & Dispatch', type: 'PACKING', capacityUnits: 3000, currentOccupancyUnits: 1000 },
      ],
    },
    {
      organizationId: org._id,
      code: 'WH-DEL-03',
      name: 'Delhi-NCR Regional Logistics',
      type: 'REGIONAL_DC',
      address: { street: 'Gurugram Express Logistics Zone', city: 'Gurugram', state: 'Haryana', postalCode: '122001', country: 'India' },
      capacityVolumeSqFt: 120000,
      maxPallets: 4000,
      currentOccupancyPallets: 3200,
      status: 'ACTIVE',
    },
    {
      organizationId: org._id,
      code: 'WH-MAA-04',
      name: 'Chennai Port Logistics Depot',
      type: 'PORT_LOGISTICS',
      address: { street: 'Ennore Port Highway', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600057', country: 'India' },
      capacityVolumeSqFt: 80000,
      maxPallets: 2500,
      currentOccupancyPallets: 1900,
      status: 'ACTIVE',
    },
    {
      organizationId: org._id,
      code: 'WH-HYD-05',
      name: 'Hyderabad Pharma & Electronics Hub',
      type: 'FULFILLMENT_CENTER',
      address: { street: 'Pashamylaram Industrial Estate', city: 'Hyderabad', state: 'Telangana', postalCode: '502307', country: 'India' },
      capacityVolumeSqFt: 90000,
      maxPallets: 3000,
      currentOccupancyPallets: 1400,
      status: 'ACTIVE',
    },
  ]);

  // Create Suppliers
  console.log('🤝 Creating Suppliers...');
  const suppliers = await Supplier.create([
    {
      organizationId: org._id,
      code: 'SUP-VIMAL',
      name: 'Vimal Electronics & Industrial Ltd.',
      contactName: 'Ramesh Vimal',
      email: 'ramesh@vimal-elec.co.in',
      phone: '+91 98200 12345',
      gstin: '27AAACV1234F1Z9',
      paymentTerms: 'Net 30',
      leadTimeDays: 14,
      rating: 4.8,
      status: 'ACTIVE',
    },
    {
      organizationId: org._id,
      code: 'SUP-MEHTA',
      name: 'Mehta Traders & Components',
      contactName: 'Sanjay Mehta',
      email: 'sanjay@mehtatraders.com',
      phone: '+91 98211 56789',
      gstin: '27AABCM5678G2Z3',
      paymentTerms: 'Net 15',
      leadTimeDays: 7,
      rating: 4.2,
      status: 'ACTIVE',
    },
    {
      organizationId: org._id,
      code: 'SUP-SINHA',
      name: 'Sinha Packaging & Materials Corp',
      contactName: 'Amit Sinha',
      email: 'sales@sinhapack.in',
      phone: '+91 98300 99887',
      gstin: '19AAACS8899H1Z2',
      paymentTerms: 'Net 45',
      leadTimeDays: 5,
      rating: 4.6,
      status: 'ACTIVE',
    },
  ]);

  // Create SKUs
  console.log('📦 Creating SKUs...');
  const sampleProducts = [
    { sku: 'MCU-STM32H7-01', name: 'ARM Cortex-M7 High-Perf Microcontroller 480MHz', category: 'ELECTRONICS', unit: 'PCS', unitCost: 450, sellingPrice: 720, minStockLevel: 50, reorderPoint: 150, leadTimeDays: 14, gstRate: 18, hsnCode: '85423100' },
    { sku: 'BAT-LFP-48V100', name: 'Lithium Iron Phosphate Pack 48V 100Ah Modular', category: 'ELECTRICAL', unit: 'PCS', unitCost: 38500, sellingPrice: 52000, minStockLevel: 10, reorderPoint: 25, leadTimeDays: 21, gstRate: 18, hsnCode: '85076000' },
    { sku: 'PCB-FR4-4L-01', name: 'Multilayer FR4 Bare Board 4-Layer High-TG', category: 'COMPONENTS', unit: 'PCS', unitCost: 120, sellingPrice: 210, minStockLevel: 200, reorderPoint: 500, leadTimeDays: 10, gstRate: 18, hsnCode: '85340000' },
    { sku: 'BOX-CORR-5PLY', name: 'Heavy Duty 5-Ply Corrugated Shipping Box 400x300x300', category: 'PACKAGING', unit: 'PCS', unitCost: 35, sellingPrice: 55, minStockLevel: 500, reorderPoint: 1200, leadTimeDays: 5, gstRate: 12, hsnCode: '48191010' },
    { sku: 'RAW-ALU-6061T6', name: 'Aluminum Extrusion Profile 6061-T6 40x40mm (2m)', category: 'RAW_MATERIALS', unit: 'METERS', unitCost: 650, sellingPrice: 950, minStockLevel: 50, reorderPoint: 100, leadTimeDays: 7, gstRate: 18, hsnCode: '76042990' },
    { sku: 'SEN-TEMP-PT100', name: 'RTD Temperature Sensor Probe PT100 Stainless Steel', category: 'COMPONENTS', unit: 'PCS', unitCost: 320, sellingPrice: 580, minStockLevel: 30, reorderPoint: 80, leadTimeDays: 7, gstRate: 18, hsnCode: '90251990' },
    { sku: 'MOD-ESP32S3-W', name: 'Wi-Fi + BLE 5.0 Dual Core Wireless Module', category: 'ELECTRONICS', unit: 'PCS', unitCost: 280, sellingPrice: 420, minStockLevel: 100, reorderPoint: 300, leadTimeDays: 12, gstRate: 18, hsnCode: '85176290' },
    { sku: 'CON-M12-8PIN', name: 'Industrial Waterproof Connector M12 8-Pin A-Coded', category: 'COMPONENTS', unit: 'PCS', unitCost: 185, sellingPrice: 310, minStockLevel: 80, reorderPoint: 200, leadTimeDays: 8, gstRate: 18, hsnCode: '85366990' },
    { sku: 'TOOL-CRIMP-01', name: 'Ratchet Wire Terminal Crimper 0.5-6.0mm²', category: 'TOOLS_EQUIPMENT', unit: 'SET', unitCost: 1450, sellingPrice: 2400, minStockLevel: 5, reorderPoint: 15, leadTimeDays: 5, gstRate: 18, hsnCode: '82032000' },
    { sku: 'PUMP-SUB-2HP', name: 'Submersible Water Pump 2HP Stainless Impeller', category: 'FINISHED_GOODS', unit: 'PCS', unitCost: 8900, sellingPrice: 14200, minStockLevel: 8, reorderPoint: 20, leadTimeDays: 10, gstRate: 18, hsnCode: '84137090' },
    { sku: 'REL-SSR-40A', name: 'Solid State Relay 40A DC-AC 24-480V', category: 'ELECTRICAL', unit: 'PCS', unitCost: 420, sellingPrice: 750, minStockLevel: 25, reorderPoint: 60, leadTimeDays: 6, gstRate: 18, hsnCode: '85364900' },
    { sku: 'SDR-SOL-60W', name: 'Temperature Controlled Soldering Station 60W', category: 'TOOLS_EQUIPMENT', unit: 'SET', unitCost: 3200, sellingPrice: 4800, minStockLevel: 10, reorderPoint: 25, leadTimeDays: 7, gstRate: 18, hsnCode: '85151100' },
    { sku: 'FIL-3DP-PETG', name: 'Industrial 3D Printing Filament PETG 1.75mm 1kg', category: 'RAW_MATERIALS', unit: 'ROLLS', unitCost: 1100, sellingPrice: 1850, minStockLevel: 20, reorderPoint: 50, leadTimeDays: 4, gstRate: 18, hsnCode: '39169090' },
    { sku: 'CAB-CAT6-300M', name: 'Category 6 SFTP Copper Ethernet Cable Roll 305m', category: 'ELECTRICAL', unit: 'ROLLS', unitCost: 7400, sellingPrice: 11500, minStockLevel: 15, reorderPoint: 35, leadTimeDays: 5, gstRate: 18, hsnCode: '85444999' },
    { sku: 'TAPE-ESD-20MM', name: 'Anti-Static Polyimide Kapton Tape 20mm x 33m', category: 'PACKAGING', unit: 'ROLLS', unitCost: 220, sellingPrice: 380, minStockLevel: 40, reorderPoint: 100, leadTimeDays: 3, gstRate: 18, hsnCode: '39191000' },
  ];

  const products = await Product.create(
    sampleProducts.map((p) => ({
      ...p,
      organizationId: org._id,
      status: 'ACTIVE',
      safetyStock: Math.round(p.minStockLevel / 2),
      reorderQuantity: p.reorderPoint * 2,
    }))
  );

  // Create Sample Purchase Orders
  console.log('📜 Creating Sample Purchase Orders...');
  const createdPOs = await PurchaseOrder.create([
    {
      organizationId: org._id,
      poNumber: 'PO-2024-1821',
      supplierId: suppliers[0]._id,
      supplierName: suppliers[0].name,
      warehouseId: warehouses[0]._id,
      warehouseName: warehouses[0].name,
      status: 'approved',
      expectedDeliveryDate: new Date(Date.now() + 3 * 86400000),
      items: [
        { productId: products[0]._id, sku: 'MCU-STM32H7-01', productName: 'ARM Cortex-M7 Microcontroller', quantityOrdered: 200, quantityReceived: 0, unitPrice: 450, gstRate: 18, totalPrice: 106200 }
      ],
      subtotal: 90000,
      taxAmount: 16200,
      totalAmount: 106200,
      notes: 'Urgent replenishment for Mumbai Central Hub',
      createdByUserId: adminUser._id,
      createdByName: `${adminUser.firstName} ${adminUser.lastName}`,
    },
    {
      organizationId: org._id,
      poNumber: 'PO-2024-1798',
      supplierId: suppliers[1]._id,
      supplierName: suppliers[1].name,
      warehouseId: warehouses[1]._id,
      warehouseName: warehouses[1].name,
      status: 'pending_approval',
      expectedDeliveryDate: new Date(Date.now() + 5 * 86400000),
      items: [
        { productId: products[1]._id, sku: 'BAT-LFP-48V100', productName: 'Lithium Iron Phosphate Pack 48V', quantityOrdered: 5, quantityReceived: 0, unitPrice: 38500, gstRate: 18, totalPrice: 227150 }
      ],
      subtotal: 192500,
      taxAmount: 34650,
      totalAmount: 227150,
      createdByUserId: adminUser._id,
      createdByName: `${adminUser.firstName} ${adminUser.lastName}`,
    }
  ]);

  // Create Goods Receipts (GRN)
  console.log('📦 Creating Sample Goods Receipt Notes (GRN)...');
  await GoodsReceipt.create([
    {
      organizationId: org._id,
      grnNumber: 'GRN-2024-0891',
      purchaseOrderId: createdPOs[0]._id,
      warehouseId: warehouses[0]._id,
      invoiceNumber: 'INV-VIMAL-9821',
      invoiceAmount: 106200,
      items: [
        { productId: products[0]._id, quantityReceived: 200, quantityAccepted: 198, quantityRejected: 2, rejectionReason: 'Bent connector pins' }
      ],
      receivedByUserId: adminUser._id,
      receivedByName: `${adminUser.firstName} ${adminUser.lastName}`,
      notes: 'Received and quality inspected at Mumbai Receiving Dock Z-REC',
    }
  ]);

  // Create Audit Logs
  console.log('📜 Creating Sample Audit Logs...');
  await AuditLog.create([
    {
      organizationId: org._id,
      userId: adminUser._id,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      resource: 'PurchaseOrder',
      resourceId: createdPOs[0]._id.toString(),
      action: 'approve',
      before: { status: 'pending_approval' },
      after: { status: 'approved' },
      reason: 'Standard approval process completed',
      requestId: 'req-seed-001',
      ip: '127.0.0.1',
      userAgent: 'NEXUS-Seed-Agent/1.0',
    },
    {
      organizationId: org._id,
      userId: adminUser._id,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      resource: 'StockLedger',
      resourceId: 'INITIAL_SEED',
      action: 'adjust',
      reason: 'Initial stock ledger initialization',
      requestId: 'req-seed-002',
      ip: '127.0.0.1',
      userAgent: 'NEXUS-Seed-Agent/1.0',
    }
  ]);

  // Create Alerts
  console.log('🔔 Creating Initial Operational Alerts...');
  await Alert.create([
    {
      organizationId: org._id,
      type: 'STOCKOUT_RISK',
      severity: 'CRITICAL',
      title: 'Critical Stockout Risk — MCU-STM32H7-01',
      message: 'Stock level at 2 units in Mumbai Central Hub. Projected stockout in 1.8 days.',
      isResolved: false,
    },
    {
      organizationId: org._id,
      type: 'PO_OVERDUE',
      severity: 'WARNING',
      title: 'PO-2024-1776 Overdue by 3 Days',
      message: 'Supplier Sinha Packaging & Materials Corp delivery expected on 2024-09-26 is overdue.',
      isResolved: false,
    }
  ]);

  // Generate Stock Levels and Ledger Entries
  let totalLedgerEntries = 0;
  for (const product of products) {
    for (const warehouse of warehouses) {
      // Deterministic initial quantities
      const hash = (product.sku.length * 17 + warehouse.code.length * 31) % 100;
      const isLow = hash < 25;
      const isCritical = hash < 10;

      let qOnHand = isCritical ? 2 : isLow ? product.minStockLevel - 2 : product.reorderPoint * 3 + hash * 5;
      if (qOnHand < 0) qOnHand = 0;

      const binLoc = `AISLE-${(hash % 8) + 1}-BAY-${(hash % 12) + 1}`;

      await StockLevel.create({
        organizationId: org._id,
        productId: product._id,
        warehouseId: warehouse._id,
        binLocation: binLoc,
        quantityOnHand: qOnHand,
        quantityAllocated: Math.floor(qOnHand * 0.15),
        quantityOnOrder: isLow ? product.reorderQuantity : 0,
        safetyStock: product.safetyStock,
        reorderPoint: product.reorderPoint,
        lastMovementAt: new Date(Date.now() - hash * 3600 * 24 * 1000),
      });

      // Stock Ledger entry for initial seed
      await StockLedger.create({
        organizationId: org._id,
        productId: product._id,
        warehouseId: warehouse._id,
        movementType: 'receipt',
        quantityDelta: qOnHand,
        previousQuantityOnHand: 0,
        newQuantityOnHand: qOnHand,
        unitCost: product.unitCost,
        totalValue: qOnHand * product.unitCost,
        referenceType: 'INITIAL_SEED',
        referenceId: `SEED-${product.sku.substring(0, 6)}-${warehouse.code}`,
        performedByUserId: adminUser._id,
        performedByName: `${adminUser.firstName} ${adminUser.lastName}`,
        notes: 'Initial warehouse inventory count and seed setup',
        createdAt: new Date(Date.now() - (hash + 5) * 3600 * 24 * 1000),
      });

      totalLedgerEntries++;
    }
  }

  console.log('✅ Seed Completed Successfully!');
  console.log(`Summary:`);
  console.log(`- 1 Organization created`);
  console.log(`- 5 Users created (Admin, Proc, WH, Fin, Audit)`);
  console.log(`- 5 Warehouses created`);
  console.log(`- ${products.length} SKUs created`);
  console.log(`- ${products.length * warehouses.length} Stock Level records created`);
  console.log(`- ${totalLedgerEntries} Stock Ledger movement entries created`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed process failed:', err);
  process.exit(1);
});
