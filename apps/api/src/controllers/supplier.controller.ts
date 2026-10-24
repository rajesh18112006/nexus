import { Request, Response } from 'express';
import { CreateSupplierSchema, UpdateSupplierSchema, SupplierQuerySchema } from '@nexus/shared';
import { SupplierService } from '../services/supplier.service';
import { asyncHandler } from '../middleware/errorHandler';

export const SupplierController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = SupplierQuerySchema.parse(req.query);
    const result = await SupplierService.list(req.user!.org, query);
    res.json({ success: true, ...result, data: result.suppliers });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const supplier = await SupplierService.getById(req.user!.org, id);
    res.json({ success: true, data: supplier });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = CreateSupplierSchema.parse(req.body);
    const supplier = await SupplierService.create(req.user!.org, input);
    res.status(201).json({ success: true, data: supplier });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const input = UpdateSupplierSchema.parse(req.body);
    const supplier = await SupplierService.update(req.user!.org, id, input);
    res.json({ success: true, data: supplier });
  }),
};
