import { Product } from '../models/Product';
import { StockLevel } from '../models/StockLevel';

export const CostService = {
  async getABCAnalysis(organizationId: string) {
    const products = await Product.find({ organizationId, status: 'ACTIVE' });
    const stockLevels = await StockLevel.find({ organizationId });

    const items = products.map((prod) => {
      const totalQty = stockLevels
        .filter((s) => s.productId.toString() === prod._id.toString())
        .reduce((sum, s) => sum + s.quantityOnHand, 0);

      const totalValue = totalQty * prod.unitCost;

      return {
        productId: prod._id.toString(),
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        totalQuantity: totalQty,
        unitCost: prod.unitCost,
        totalValue,
        cumulativePercentage: 0,
        categoryClass: 'C' as 'A' | 'B' | 'C',
      };
    });

    // Sort descending by total valuation
    items.sort((a, b) => b.totalValue - a.totalValue);

    const grandTotalValuation = items.reduce((sum, item) => sum + item.totalValue, 0);

    let cumulativeSum = 0;
    items.forEach((item) => {
      cumulativeSum += item.totalValue;
      item.cumulativePercentage = grandTotalValuation > 0 ? Math.round((cumulativeSum / grandTotalValuation) * 1000) / 10 : 0;

      if (item.cumulativePercentage <= 80) {
        item.categoryClass = 'A';
      } else if (item.cumulativePercentage <= 95) {
        item.categoryClass = 'B';
      } else {
        item.categoryClass = 'C';
      }
    });

    const classA = items.filter((i) => i.categoryClass === 'A');
    const classB = items.filter((i) => i.categoryClass === 'B');
    const classC = items.filter((i) => i.categoryClass === 'C');

    return {
      grandTotalValuation,
      summary: {
        classA: { count: classA.length, value: classA.reduce((s, i) => s + i.totalValue, 0), percentage: classA.length ? Math.round((classA.reduce((s, i) => s + i.totalValue, 0) / grandTotalValuation) * 100) : 0 },
        classB: { count: classB.length, value: classB.reduce((s, i) => s + i.totalValue, 0), percentage: classB.length ? Math.round((classB.reduce((s, i) => s + i.totalValue, 0) / grandTotalValuation) * 100) : 0 },
        classC: { count: classC.length, value: classC.reduce((s, i) => s + i.totalValue, 0), percentage: classC.length ? Math.round((classC.reduce((s, i) => s + i.totalValue, 0) / grandTotalValuation) * 100) : 0 },
      },
      items,
    };
  },
};
