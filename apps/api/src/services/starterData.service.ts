import mongoose from 'mongoose';
import { Warehouse } from '../models/Warehouse';
import { Supplier } from '../models/Supplier';
import { Product } from '../models/Product';
import { StockLevel } from '../models/StockLevel';
import { StockLedger } from '../models/StockLedger';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Alert } from '../models/Alert';

/**
 * Bootstraps initial operational data for a newly registered organization.
 * Ensures that the newly created account immediately has active warehouses,
 * vetted suppliers, a rich inventory catalog, real stock levels, ledger history,
 * and pending operational alerts.
 */
export async function bootstrapOrganizationData(organizationId: string, adminUserId: string, adminName: string) {
  const orgId = new mongoose.Types.ObjectId(organizationId);
  const userId = new mongoose.Types.ObjectId(adminUserId);

  // 1. Create 2 Logistics Hubs
  const [mumbaiHub, bangaloreHub] = await Promise.all([
    Warehouse.create({
      organizationId: orgId,
      code: 'MUM-01',
      name: 'Mumbai Central Logistics Hub',
      type: 'CENTRAL_HUB',
      address: {
        street: 'Plot 42, MIDC Industrial Area, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400093',
        country: 'India',
      },
      capacityVolumeSqFt: 85000,
      maxPallets: 4200,
      currentOccupancyPallets: 2890,
      status: 'ACTIVE',
      zones: [
        { code: 'Z-IN', name: 'Inbound Receiving Dock', type: 'RECEIVING', capacityUnits: 500, currentOccupancyUnits: 120 },
        { code: 'Z-BAY1', name: 'High-Bay Rack A', type: 'STORAGE', capacityUnits: 2500, currentOccupancyUnits: 1850 },
        { code: 'Z-DISP', name: 'Outbound Dispatch Zone', type: 'SHIPPING', capacityUnits: 1200, currentOccupancyUnits: 920 },
      ],
    }),
    Warehouse.create({
      organizationId: orgId,
      code: 'BLR-01',
      name: 'Bengaluru Tech Logistics Depot',
      type: 'REGIONAL_DC',
      address: {
        street: 'Electronic City Phase 2, Hosur Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560100',
        country: 'India',
      },
      capacityVolumeSqFt: 55000,
      maxPallets: 2800,
      currentOccupancyPallets: 1650,
      status: 'ACTIVE',
      zones: [
        { code: 'Z-REC', name: 'Dock 1 Receiving', type: 'RECEIVING', capacityUnits: 400, currentOccupancyUnits: 80 },
        { code: 'Z-STK', name: 'Automated Carousel Storage', type: 'STORAGE', capacityUnits: 2000, currentOccupancyUnits: 1350 },
        { code: 'Z-EXP', name: 'Express Dispatch Bay', type: 'SHIPPING', capacityUnits: 400, currentOccupancyUnits: 220 },
      ],
    }),
  ]);

  // 2. Create 2 Verified Suppliers
  const [apexSupplier, pinnacleSupplier] = await Promise.all([
    Supplier.create({
      organizationId: orgId,
      code: 'SUP-APEX',
      name: 'Apex Industrial & Microelectronics Ltd',
      contactName: 'Rohit Verma',
      email: 'orders@apex-micro.in',
      phone: '+91 98201 44521',
      gstin: '27AABCA1234F1Z8',
      address: {
        street: '401 Electronic Hub, Phase 1',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400093',
        country: 'India',
      },
      paymentTerms: 'Net 30',
      leadTimeDays: 7,
      rating: 4.8,
      status: 'ACTIVE',
    }),
    Supplier.create({
      organizationId: orgId,
      code: 'SUP-PINN',
      name: 'Pinnacle Smart Materials & Packaging Corp',
      contactName: 'Anil Deshmukh',
      email: 'sales@pinnaclepack.com',
      phone: '+91 98112 39011',
      gstin: '29ABCDE5678G1Z2',
      address: {
        street: '12 Packaging Park, Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560066',
        country: 'India',
      },
      paymentTerms: 'Net 45',
      leadTimeDays: 5,
      rating: 4.6,
      status: 'ACTIVE',
    }),
  ]);

  // 3. Create Core Catalog Products
  const products = await Product.create([
    {
      organizationId: orgId,
      sku: 'MCU-STM32-01',
      name: 'STM32 ARM Cortex-M4 Microcontroller',
      description: '32-bit RISC core embedded processor for industrial telemetry systems',
      category: 'ELECTRONICS',
      unit: 'PCS',
      unitCost: 450,
      sellingPrice: 720,
      minStockLevel: 50,
      reorderPoint: 120,
      reorderQuantity: 300,
      leadTimeDays: 7,
      safetyStock: 40,
      gstRate: 18,
      hsnCode: '85423100',
      status: 'ACTIVE',
    },
    {
      organizationId: orgId,
      sku: 'PWR-LIPO-48V',
      name: 'Industrial LiFePO4 48V Battery Pack',
      description: 'High-density backup storage battery with integrated CAN Bus BMS',
      category: 'ELECTRICAL',
      unit: 'PCS',
      unitCost: 14500,
      sellingPrice: 19800,
      minStockLevel: 10,
      reorderPoint: 25,
      reorderQuantity: 60,
      leadTimeDays: 12,
      safetyStock: 10,
      gstRate: 18,
      hsnCode: '85076000',
      status: 'ACTIVE',
    },
    {
      organizationId: orgId,
      sku: 'MOT-STP-N23',
      name: 'NEMA 23 High-Torque Hybrid Stepper Motor',
      description: '1.8 degree step angle motor for precision conveyor sorting arms',
      category: 'COMPONENTS',
      unit: 'PCS',
      unitCost: 1250,
      sellingPrice: 1950,
      minStockLevel: 30,
      reorderPoint: 75,
      reorderQuantity: 150,
      leadTimeDays: 6,
      safetyStock: 25,
      gstRate: 18,
      hsnCode: '85011019',
      status: 'ACTIVE',
    },
    {
      organizationId: orgId,
      sku: 'SNS-OPT-DIFF',
      name: 'Diffuse-Reflective Optical Proximity Sensor',
      description: 'IP67 rated optical distance sensor with PNP digital output',
      category: 'ELECTRONICS',
      unit: 'PCS',
      unitCost: 850,
      sellingPrice: 1350,
      minStockLevel: 20,
      reorderPoint: 45,
      reorderQuantity: 100,
      leadTimeDays: 5,
      safetyStock: 15,
      gstRate: 18,
      hsnCode: '90318000',
      status: 'ACTIVE',
    },
    {
      organizationId: orgId,
      sku: 'BOX-CRG-HVY',
      name: 'Heavy Duty 5-Ply Corrugated Shipping Box',
      description: 'Impact-resistant export grade packaging container 40x30x30 cm',
      category: 'PACKAGING',
      unit: 'BOXES',
      unitCost: 38,
      sellingPrice: 65,
      minStockLevel: 300,
      reorderPoint: 800,
      reorderQuantity: 2000,
      leadTimeDays: 4,
      safetyStock: 250,
      gstRate: 12,
      hsnCode: '48191010',
      status: 'ACTIVE',
    },
  ]);

  // 4. Create Stock Levels & Ledger for each product across warehouses
  const now = new Date();
  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    // Give product 0 a critical runway scenario so forecasting is immediately interactive
    const qtyMUM = i === 0 ? 14 : i === 1 ? 18 : 140;
    const qtyBLR = i === 0 ? 8 : i === 1 ? 12 : 90;

    // Mumbai Stock Level
    await StockLevel.create({
      organizationId: orgId,
      productId: prod._id,
      warehouseId: mumbaiHub._id,
      binLocation: `AISLE-${i + 1}-BAY-02`,
      quantityOnHand: qtyMUM,
      quantityAllocated: Math.floor(qtyMUM * 0.1),
      quantityOnOrder: i === 0 ? prod.reorderQuantity : 0,
      safetyStock: prod.safetyStock,
      reorderPoint: prod.reorderPoint,
      lastMovementAt: now,
    });

    // Bangalore Stock Level
    await StockLevel.create({
      organizationId: orgId,
      productId: prod._id,
      warehouseId: bangaloreHub._id,
      binLocation: `ZONE-B-RACK-${i + 1}`,
      quantityOnHand: qtyBLR,
      quantityAllocated: Math.floor(qtyBLR * 0.1),
      quantityOnOrder: 0,
      safetyStock: prod.safetyStock,
      reorderPoint: prod.reorderPoint,
      lastMovementAt: now,
    });

    // Initial Ledger Entry
    await StockLedger.create({
      organizationId: orgId,
      productId: prod._id,
      warehouseId: mumbaiHub._id,
      movementType: 'receipt',
      quantityDelta: qtyMUM,
      previousQuantityOnHand: 0,
      newQuantityOnHand: qtyMUM,
      unitCost: prod.unitCost,
      totalValue: qtyMUM * prod.unitCost,
      referenceType: 'INITIAL_SEED',
      referenceId: `INIT-${prod.sku}`,
      performedByUserId: userId,
      performedByName: adminName,
      notes: 'Initial inventory bootstrap for new organization',
    });
  }

  // 5. Create Starter Purchase Order
  const poTotal = 150 * 1250;
  const poGst = (poTotal * 18) / 100;
  await PurchaseOrder.create({
    organizationId: orgId,
    poNumber: `PO-${now.getFullYear()}-1001`,
    supplierId: apexSupplier._id,
    supplierName: apexSupplier.name,
    warehouseId: mumbaiHub._id,
    warehouseName: mumbaiHub.name,
    status: 'SUBMITTED',
    expectedDeliveryDate: new Date(now.getTime() + 6 * 86400000),
    items: [
      {
        productId: products[2]._id,
        sku: products[2].sku,
        productName: products[2].name,
        quantityOrdered: 150,
        quantityReceived: 0,
        unitPrice: 1250,
        gstRate: 18,
        totalPrice: poTotal,
      },
    ],
    subtotal: poTotal,
    taxAmount: poGst,
    totalAmount: poTotal + poGst,
    notes: 'Initial replenishment batch order',
    createdByUserId: userId,
    createdByName: adminName,
  });

  // 6. Create Initial Operational Alert
  await Alert.create([
    {
      organizationId: orgId,
      type: 'STOCKOUT_RISK',
      severity: 'CRITICAL',
      title: `Low Stock Horizon Warning: ${products[0].sku}`,
      message: `${products[0].name} has only 22 units remaining across hubs. Projected stockout within 2.8 days.`,
      isResolved: false,
    },
    {
      organizationId: orgId,
      type: 'PO_OVERDUE',
      severity: 'LOW',
      title: 'Active Purchase Order In-Transit',
      message: `PO-${now.getFullYear()}-1001 for NEMA 23 Motors is pending approval from Apex Industrial.`,
      isResolved: false,
    },
  ]);
}
