import { StockLevel } from '../models/StockLevel';
import { StockLedger } from '../models/StockLedger';
import { Product } from '../models/Product';
import { AppError } from '../middleware/errorHandler';
import type { AdjustStockInput, StockLedgerQueryInput } from '@nexus/shared';

export const InventoryService = {
  async listStockLevels(organizationId: string, warehouseId?: string, productId?: string) {
    const filter: any = { organizationId };
    if (warehouseId) filter.warehouseId = warehouseId;
    if (productId) filter.productId = productId;

    const stockLevels = await StockLevel.find(filter)
      .populate('productId', 'sku name category unit unitCost reorderPoint minStockLevel safetyStock status')
      .populate('warehouseId', 'code name type')
      .sort({ updatedAt: -1 })
      .lean();

    return stockLevels.map((s: any) => {
      const product = s.productId || {};
      const warehouse = s.warehouseId || {};
      const available = (s.quantityOnHand || 0) - (s.quantityAllocated || 0);
      const isLowStock = available <= (s.reorderPoint || product.reorderPoint || 10);
      const isOutOfStock = available <= 0;

      return {
        id: s._id.toString(),
        organizationId: s.organizationId,
        productId: product._id?.toString(),
        warehouseId: warehouse._id?.toString(),
        productSku: product.sku,
        productName: product.name,
        productCategory: product.category,
        productUnit: product.unit,
        unitCost: product.unitCost || 0,
        warehouseCode: warehouse.code,
        warehouseName: warehouse.name,
        binLocation: s.binLocation,
        quantityOnHand: s.quantityOnHand,
        quantityAllocated: s.quantityAllocated,
        quantityOnOrder: s.quantityOnOrder,
        availableQuantity: Math.max(0, available),
        safetyStock: s.safetyStock,
        reorderPoint: s.reorderPoint,
        isLowStock,
        isOutOfStock,
        valuation: (s.quantityOnHand || 0) * (product.unitCost || 0),
        lastMovementAt: s.lastMovementAt,
        updatedAt: s.updatedAt,
      };
    });
  },

  async adjustStock(organizationId: string, userId: string, userName: string, input: AdjustStockInput) {
    const product = await Product.findOne({ _id: input.productId, organizationId });
    if (!product) throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');

    let stockLevel = await StockLevel.findOne({
      organizationId,
      productId: input.productId,
      warehouseId: input.warehouseId,
    });

    if (!stockLevel) {
      stockLevel = new StockLevel({
        organizationId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantityOnHand: 0,
        quantityAllocated: 0,
        quantityOnOrder: 0,
        safetyStock: product.safetyStock,
        reorderPoint: product.reorderPoint,
      });
    }

    const prevQty = stockLevel.quantityOnHand;
    let newQty = prevQty;
    let delta = 0;

    if (input.adjustmentType === 'IN') {
      delta = input.quantity;
      newQty = prevQty + delta;
    } else if (input.adjustmentType === 'OUT') {
      delta = -input.quantity;
      newQty = prevQty + delta;
      if (newQty < 0) {
        throw new AppError(400, `Cannot reduce stock below zero. Current stock: ${prevQty}`, 'INSUFFICIENT_STOCK');
      }
    } else if (input.adjustmentType === 'SET') {
      newQty = input.quantity;
      delta = newQty - prevQty;
    }

    stockLevel.quantityOnHand = newQty;
    stockLevel.lastMovementAt = new Date();
    await stockLevel.save();

    // Append to Stock Ledger
    const ledgerEntry = await StockLedger.create({
      organizationId,
      productId: input.productId,
      warehouseId: input.warehouseId,
      movementType: 'adjustment',
      quantityDelta: delta,
      previousQuantityOnHand: prevQty,
      newQuantityOnHand: newQty,
      unitCost: product.unitCost,
      totalValue: Math.abs(delta) * product.unitCost,
      referenceType: 'ADJUSTMENT',
      referenceId: input.reference || `ADJ-${Date.now()}`,
      performedByUserId: userId,
      performedByName: userName,
      notes: input.notes || `Stock adjustment: ${input.reason}`,
    });

    return {
      stockLevel: stockLevel.toJSON(),
      ledgerEntry: ledgerEntry.toJSON(),
    };
  },

  async transferStock(
    organizationId: string,
    userId: string,
    userName: string,
    input: { productId: string; fromWarehouseId: string; toWarehouseId: string; quantity: number; notes?: string }
  ) {
    if (input.fromWarehouseId === input.toWarehouseId) {
      throw new AppError(400, 'Source and destination warehouses cannot be the same', 'INVALID_TRANSFER');
    }
    const product = await Product.findOne({ _id: input.productId, organizationId });
    if (!product) throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');

    const sourceStock = await StockLevel.findOne({
      organizationId,
      productId: input.productId,
      warehouseId: input.fromWarehouseId,
    });

    if (!sourceStock || sourceStock.quantityOnHand < input.quantity) {
      throw new AppError(400, `Insufficient stock at source warehouse. Available: ${sourceStock?.quantityOnHand || 0}`, 'INSUFFICIENT_STOCK');
    }

    let targetStock = await StockLevel.findOne({
      organizationId,
      productId: input.productId,
      warehouseId: input.toWarehouseId,
    });

    if (!targetStock) {
      targetStock = new StockLevel({
        organizationId,
        productId: input.productId,
        warehouseId: input.toWarehouseId,
        quantityOnHand: 0,
        quantityAllocated: 0,
        quantityOnOrder: 0,
        safetyStock: product.safetyStock,
        reorderPoint: product.reorderPoint,
      });
    }

    const transferRef = `TRF-${Date.now()}`;
    const prevSrc = sourceStock.quantityOnHand;
    const prevTgt = targetStock.quantityOnHand;

    sourceStock.quantityOnHand = prevSrc - input.quantity;
    sourceStock.lastMovementAt = new Date();
    await sourceStock.save();

    targetStock.quantityOnHand = prevTgt + input.quantity;
    targetStock.lastMovementAt = new Date();
    await targetStock.save();

    await StockLedger.create([
      {
        organizationId,
        productId: product._id,
        warehouseId: input.fromWarehouseId,
        movementType: 'transfer_out',
        quantityDelta: -input.quantity,
        previousQuantityOnHand: prevSrc,
        newQuantityOnHand: sourceStock.quantityOnHand,
        unitCost: product.unitCost,
        totalValue: -input.quantity * product.unitCost,
        referenceType: 'TRANSFER',
        referenceId: transferRef,
        performedByUserId: userId,
        performedByName: userName,
        notes: input.notes || `Stock transfer to destination warehouse`,
      },
      {
        organizationId,
        productId: product._id,
        warehouseId: input.toWarehouseId,
        movementType: 'transfer_in',
        quantityDelta: input.quantity,
        previousQuantityOnHand: prevTgt,
        newQuantityOnHand: targetStock.quantityOnHand,
        unitCost: product.unitCost,
        totalValue: input.quantity * product.unitCost,
        referenceType: 'TRANSFER',
        referenceId: transferRef,
        performedByUserId: userId,
        performedByName: userName,
        notes: input.notes || `Stock transfer from source warehouse`,
      },
    ]);

    return { success: true, transferRef, transferredQty: input.quantity };
  },

  async getStockLedger(organizationId: string, query: StockLedgerQueryInput) {
    const filter: any = { organizationId };
    if (query.productId) filter.productId = query.productId;
    if (query.warehouseId) filter.warehouseId = query.warehouseId;
    if (query.movementType) filter.movementType = query.movementType;
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const skip = (query.page - 1) * query.limit;
    const sort: any = { [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 };

    const [entries, total] = await Promise.all([
      StockLedger.find(filter)
        .populate('productId', 'sku name category unit')
        .populate('warehouseId', 'code name')
        .sort(sort)
        .skip(skip)
        .limit(query.limit)
        .lean(),
      StockLedger.countDocuments(filter),
    ]);

    return {
      data: entries.map((e: any) => ({
        ...e,
        id: e._id.toString(),
        product: e.productId,
        warehouse: e.warehouseId,
      })),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page * query.limit < total,
        hasPrev: query.page > 1,
      },
    };
  },
};
