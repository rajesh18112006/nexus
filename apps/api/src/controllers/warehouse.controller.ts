import { Request, Response } from 'express';
import { CreateWarehouseSchema, UpdateWarehouseSchema } from '@nexus/shared';
import { WarehouseService } from '../services/warehouse.service';
import { asyncHandler } from '../middleware/errorHandler';

export const WarehouseController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const warehouses = await WarehouseService.list(req.user!.org);
    res.json({ success: true, data: warehouses, warehouses });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const warehouse = await WarehouseService.getById(req.user!.org, id);
    res.json({ success: true, data: warehouse });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = CreateWarehouseSchema.parse(req.body);
    const warehouse = await WarehouseService.create(req.user!.org, input);
    res.status(201).json({ success: true, data: warehouse });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const input = UpdateWarehouseSchema.parse(req.body);
    const warehouse = await WarehouseService.update(req.user!.org, id, input);
    res.json({ success: true, data: warehouse });
  }),
};
