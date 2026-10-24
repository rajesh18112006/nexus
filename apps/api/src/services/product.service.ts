import { Product, IProduct } from '../models/Product';
import { StockLevel } from '../models/StockLevel';
import { AppError } from '../middleware/errorHandler';
import type { CreateProductInput, UpdateProductInput, ProductQueryInput } from '@nexus/shared';

export const ProductService = {
  async list(organizationId: string, query: ProductQueryInput) {
    const filter: any = { organizationId, deletedAt: { $exists: false } };

    if (query.search) {
      filter.$or = [
        { sku: { $regex: query.search, $options: 'i' } },
        { name: { $regex: query.search, $options: 'i' } },
        { hsnCode: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;

    const skip = (query.page - 1) * query.limit;
    const sort: any = { [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
      Product.countDocuments(filter),
    ]);

    // Attach total stock across warehouses
    const productIds = products.map((p) => p._id);
    const stockAgg = await StockLevel.aggregate([
      { $match: { organizationId: filter.organizationId, productId: { $in: productIds } } },
      {
        $group: {
          _id: '$productId',
          totalOnHand: { $sum: '$quantityOnHand' },
          totalAllocated: { $sum: '$quantityAllocated' },
          totalOnOrder: { $sum: '$quantityOnOrder' },
        },
      },
    ]);

    const stockMap = new Map(stockAgg.map((s) => [s._id.toString(), s]));

    const enrichedProducts = products.map((p) => {
      const stock = stockMap.get(p._id.toString()) || { totalOnHand: 0, totalAllocated: 0, totalOnOrder: 0 };
      const available = stock.totalOnHand - stock.totalAllocated;
      const isLowStock = available <= p.reorderPoint;
      const isOutOfStock = available <= 0;
      return {
        ...p,
        id: p._id.toString(),
        totalOnHand: stock.totalOnHand,
        totalAllocated: stock.totalAllocated,
        totalOnOrder: stock.totalOnOrder,
        availableQuantity: Math.max(0, available),
        isLowStock,
        isOutOfStock,
        inventoryValuation: stock.totalOnHand * p.unitCost,
      };
    });

    const filteredResult = query.lowStockOnly
      ? enrichedProducts.filter((p) => p.isLowStock)
      : enrichedProducts;

    return {
      data: filteredResult,
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

  async getById(organizationId: string, id: string) {
    const product = await Product.findOne({ _id: id, organizationId, deletedAt: { $exists: false } }).lean();
    if (!product) throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');

    const stockLevels = await StockLevel.find({ organizationId, productId: id })
      .populate('warehouseId', 'name code type')
      .lean();

    const totalOnHand = stockLevels.reduce((sum, s) => sum + s.quantityOnHand, 0);

    return {
      ...product,
      id: product._id.toString(),
      stockLevels: stockLevels.map((s) => ({
        ...s,
        id: s._id.toString(),
        warehouse: s.warehouseId,
      })),
      totalOnHand,
      inventoryValuation: totalOnHand * product.unitCost,
    };
  },

  async create(organizationId: string, input: CreateProductInput) {
    const existing = await Product.findOne({ organizationId, sku: input.sku.toUpperCase() });
    if (existing) throw new AppError(400, `SKU '${input.sku}' already exists.`, 'DUPLICATE_SKU');

    const product = await Product.create({
      ...input,
      organizationId,
      sku: input.sku.toUpperCase(),
    });

    return product.toJSON();
  },

  async update(organizationId: string, id: string, input: UpdateProductInput) {
    const product = await Product.findOneAndUpdate(
      { _id: id, organizationId, deletedAt: { $exists: false } },
      { $set: input },
      { new: true, runValidators: true }
    );
    if (!product) throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    return product.toJSON();
  },

  async softDelete(organizationId: string, id: string) {
    const product = await Product.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: { deletedAt: new Date(), status: 'ARCHIVED' } },
      { new: true }
    );
    if (!product) throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    return { success: true };
  },

  async getMetrics(organizationId: string) {
    const [totalProducts, categoryCounts, stockAgg] = await Promise.all([
      Product.countDocuments({ organizationId, deletedAt: { $exists: false } }),
      Product.aggregate([
        { $match: { organizationId, deletedAt: { $exists: false } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      StockLevel.aggregate([
        { $match: { organizationId } },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: null,
            totalValuation: { $sum: { $multiply: ['$quantityOnHand', '$product.unitCost'] } },
            totalUnitsOnHand: { $sum: '$quantityOnHand' },
          },
        },
      ]),
    ]);

    const valuation = stockAgg[0]?.totalValuation || 0;
    const totalUnits = stockAgg[0]?.totalUnitsOnHand || 0;

    return {
      totalProducts,
      categoryCounts: Object.fromEntries(categoryCounts.map((c) => [c._id, c.count])),
      totalValuation: valuation,
      totalUnitsOnHand: totalUnits,
    };
  },
};
