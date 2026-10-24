import { Product } from '../models/Product';
import { StockLevel } from '../models/StockLevel';
import { SimulationInput } from '@nexus/shared';

export const SimulatorService = {
  async runSimulation(organizationId: string, input: SimulationInput) {
    const products = await Product.find({ organizationId, status: 'ACTIVE' });
    const stockLevels = await StockLevel.find({ organizationId });

    let affectedCount = 0;
    let baselineStockouts = 0;
    let simulatedStockouts = 0;
    let totalFinancialImpact = 0;

    const skuResults = [];

    for (const prod of products) {
      if (input.affectedCategory && input.affectedCategory !== 'ALL' && prod.category !== input.affectedCategory) {
        continue;
      }
      affectedCount++;

      const prodStock = stockLevels
        .filter((s) => s.productId.toString() === prod._id.toString())
        .reduce((sum, s) => sum + s.quantityOnHand, 0);

      const baseDemand = Math.max(1, Math.round(prod.reorderPoint / (prod.leadTimeDays || 7)));
      const baseLeadTime = prod.leadTimeDays || 7;

      const baseDaysCover = Math.round((prodStock / baseDemand) * 10) / 10;
      if (baseDaysCover < baseLeadTime) {
        baselineStockouts++;
      }

      // Apply simulation factors
      const simDemand = baseDemand * (1 + (input.demandSurgePercent || 0) / 100);
      const simLeadTime = baseLeadTime + (input.leadTimeIncreaseDays || 0);
      const simUnitCost = prod.unitCost * (1 + (input.priceInflationPercent || 0) / 100);

      const simDaysCover = Math.round((prodStock / simDemand) * 10) / 10;

      if (simDaysCover < simLeadTime) {
        simulatedStockouts++;
        const deficitDays = Math.max(0, simLeadTime - simDaysCover);
        const lostSalesUnits = deficitDays * simDemand;
        const price = prod.sellingPrice || prod.unitCost * 1.5;
        totalFinancialImpact += lostSalesUnits * price;
      }

      skuResults.push({
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        currentStock: prodStock,
        baselineDaysCover: baseDaysCover,
        simulatedDaysCover: simDaysCover,
        baselineLeadTime: baseLeadTime,
        simulatedLeadTime: simLeadTime,
        stockoutRisk: simDaysCover < simLeadTime ? 'HIGH' : simDaysCover < simLeadTime * 1.5 ? 'MEDIUM' : 'LOW',
        estimatedCostIncrease: Math.round((simUnitCost - prod.unitCost) * prod.reorderQuantity),
      });
    }

    return {
      parameters: input,
      summary: {
        totalSkusAnalyzed: affectedCount,
        baselineStockouts,
        simulatedStockouts,
        additionalStockoutSkus: Math.max(0, simulatedStockouts - baselineStockouts),
        totalFinancialRiskINR: Math.round(totalFinancialImpact),
      },
      affectedSKUs: skuResults.sort((a, b) => a.simulatedDaysCover - b.simulatedDaysCover),
    };
  },
};
