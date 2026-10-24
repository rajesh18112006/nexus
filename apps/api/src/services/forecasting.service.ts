import { Product } from '../models/Product';
import { StockLevel } from '../models/StockLevel';
import { Supplier } from '../models/Supplier';
import { PurchaseOrder } from '../models/PurchaseOrder';

export const ForecastingService = {
  async getRunwayTimeline(organizationId: string) {
    const products = await Product.find({ organizationId, status: 'ACTIVE' });
    const stockLevels = await StockLevel.find({ organizationId });
    const suppliers = await Supplier.find({ organizationId, status: 'ACTIVE' });

    const supplierMap = new Map(suppliers.map((s) => [s._id.toString(), s.name]));

    const items = [];

    for (const prod of products) {
      const prodStockLevels = stockLevels.filter((s) => s.productId.toString() === prod._id.toString());
      const totalStock = prodStockLevels.reduce((sum, s) => sum + s.quantityOnHand, 0);

      // Deterministic avg daily demand computation from minStock & reorderPoint
      const avgDailyDemand = Math.max(1, Math.round(prod.reorderPoint / (prod.leadTimeDays || 7)));
      const daysOfCover = Math.round((totalStock / avgDailyDemand) * 10) / 10;

      const now = new Date();
      const stockoutTime = new Date(now.getTime() + daysOfCover * 24 * 60 * 60 * 1000);

      let riskLevel: 'CRITICAL' | 'WARNING' | 'LOW' | 'HEALTHY' = 'HEALTHY';
      if (daysOfCover <= 3) {
        riskLevel = 'CRITICAL';
      } else if (daysOfCover <= prod.leadTimeDays) {
        riskLevel = 'WARNING';
      } else if (daysOfCover <= prod.leadTimeDays * 1.5) {
        riskLevel = 'LOW';
      }

      items.push({
        productId: prod._id.toString(),
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        currentStock: totalStock,
        avgDailyDemand,
        daysOfCover,
        stockoutDate: stockoutTime.toISOString(),
        replenishmentDate: new Date(now.getTime() + (prod.leadTimeDays || 7) * 86400000).toISOString(),
        riskLevel,
        suggestedReorderQty: prod.reorderQuantity || prod.reorderPoint * 2,
        estimatedCost: (prod.reorderQuantity || prod.reorderPoint * 2) * prod.unitCost,
        supplierName: suppliers[0] ? suppliers[0].name : 'Primary Vendor',
      });
    }

    items.sort((a, b) => a.daysOfCover - b.daysOfCover);

    return items;
  },

  async getReorderRecommendations(organizationId: string) {
    const timeline = await this.getRunwayTimeline(organizationId);
    const criticalAndWarning = timeline.filter((item) => item.riskLevel === 'CRITICAL' || item.riskLevel === 'WARNING');

    return criticalAndWarning.map((item) => {
      const isCritical = item.riskLevel === 'CRITICAL';
      return {
        id: `rec-${item.sku}`,
        productId: item.productId,
        sku: item.sku,
        productName: item.name,
        severity: item.riskLevel,
        what: `Raise PO for ${item.name} (${item.sku})`,
        why: `Stockout projected in ${item.daysOfCover} days. Average daily consumption is ${item.avgDailyDemand} units while current stock is ${item.currentStock} units.`,
        evidence: `Avg demand: ${item.avgDailyDemand} units/day. On-hand: ${item.currentStock} units across warehouses. Lead time: 7 days.`,
        impact: `Replenishing ${item.suggestedReorderQty} units extends runway by ${Math.round(item.suggestedReorderQty / item.avgDailyDemand)} days and prevents stockout loss.`,
        suggestedQty: item.suggestedReorderQty,
        estimatedCost: item.estimatedCost,
        supplierName: item.supplierName,
      };
    });
  },
};
