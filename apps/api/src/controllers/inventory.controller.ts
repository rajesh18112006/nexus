import { Request, Response } from 'express';
import { AdjustStockSchema, StockLedgerQuerySchema } from '@nexus/shared';
import { InventoryService } from '../services/inventory.service';
import { asyncHandler } from '../middleware/errorHandler';

export const InventoryController = {
  listStockLevels: asyncHandler(async (req: Request, res: Response) => {
    const { warehouseId, productId } = req.query as { warehouseId?: string; productId?: string };
    const stockLevels = await InventoryService.listStockLevels(req.user!.org, warehouseId, productId);
    res.json({ success: true, data: stockLevels });
  }),

  adjustStock: asyncHandler(async (req: Request, res: Response) => {
    const input = AdjustStockSchema.parse(req.body);
    const userName = (req.user as any)?.name || (req.user as any)?.email || 'User';
    const result = await InventoryService.adjustStock(req.user!.org, req.user!.sub, userName, input);
    res.json({ success: true, data: result, message: 'Stock adjusted successfully.' });
  }),

  transferStock: asyncHandler(async (req: Request, res: Response) => {
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;
    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      res.status(400).json({ success: false, message: 'Missing required transfer fields' });
      return;
    }
    const userName = (req.user as any)?.name || (req.user as any)?.email || 'User';
    const result = await InventoryService.transferStock(req.user!.org, req.user!.sub, userName, {
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity: Number(quantity),
      notes,
    });
    res.json({ success: true, data: result, message: 'Stock transferred successfully.' });
  }),

  getStockLedger: asyncHandler(async (req: Request, res: Response) => {
    const query = StockLedgerQuerySchema.parse(req.query);
    const result = await InventoryService.getStockLedger(req.user!.org, query);
    res.json({ success: true, ...result });
  }),
};
