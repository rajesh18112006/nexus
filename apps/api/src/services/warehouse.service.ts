import { Warehouse } from '../models/Warehouse';
import { StockLevel } from '../models/StockLevel';
import { AppError } from '../middleware/errorHandler';
import type { CreateWarehouseInput, UpdateWarehouseInput } from '@nexus/shared';

export const WarehouseService = {
  async list(organizationId: string) {
    const warehouses = await Warehouse.find({ organizationId, deletedAt: { $exists: false } }).lean();

    const warehouseIds = warehouses.map((w) => w._id);
    const stockStats = await StockLevel.aggregate([
      { $match: { organizationId, warehouseId: { $in: warehouseIds } } },
      {
        $group: {
          _id: '$warehouseId',
          totalSkus: { $sum: 1 },
          totalUnitsOnHand: { $sum: '$quantityOnHand' },
        },
      },
    ]);

    const statsMap = new Map(stockStats.map((s) => [s._id.toString(), s]));

    return warehouses.map((w) => {
      const stats = statsMap.get(w._id.toString()) || { totalSkus: 0, totalUnitsOnHand: 0 };
      const occupancyRate = w.maxPallets > 0 ? (w.currentOccupancyPallets / w.maxPallets) * 100 : 0;
      return {
        ...w,
        id: w._id.toString(),
        totalSkus: stats.totalSkus,
        totalUnitsOnHand: stats.totalUnitsOnHand,
        occupancyRatePercentage: Math.round(occupancyRate * 10) / 10,
      };
    });
  },

  async getById(organizationId: string, id: string) {
    const warehouse = await Warehouse.findOne({ _id: id, organizationId, deletedAt: { $exists: false } }).lean();
    if (!warehouse) throw new AppError(404, 'Warehouse not found', 'WAREHOUSE_NOT_FOUND');

    const stockLevels = await StockLevel.find({ organizationId, warehouseId: id })
      .populate('productId', 'sku name category unit unitCost reorderPoint')
      .lean();

    return {
      ...warehouse,
      id: warehouse._id.toString(),
      stockLevels: stockLevels.map((s) => ({
        ...s,
        id: s._id.toString(),
        product: s.productId,
      })),
    };
  },

  async create(organizationId: string, input: CreateWarehouseInput) {
    const existing = await Warehouse.findOne({ organizationId, code: input.code.toUpperCase() });
    if (existing) throw new AppError(400, `Warehouse code '${input.code}' already exists.`, 'DUPLICATE_CODE');

    const warehouse = await Warehouse.create({
      ...input,
      organizationId,
      code: input.code.toUpperCase(),
    });

    return warehouse.toJSON();
  },

  async update(organizationId: string, id: string, input: UpdateWarehouseInput) {
    const warehouse = await Warehouse.findOneAndUpdate(
      { _id: id, organizationId, deletedAt: { $exists: false } },
      { $set: input },
      { new: true, runValidators: true }
    );
    if (!warehouse) throw new AppError(404, 'Warehouse not found', 'WAREHOUSE_NOT_FOUND');
    return warehouse.toJSON();
  },
};
