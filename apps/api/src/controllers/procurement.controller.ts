import { Request, Response } from 'express';
import { CreatePOSchema, CreateGRNSchema, POQuerySchema, UpdatePOStatusSchema } from '@nexus/shared';
import { ProcurementService } from '../services/procurement.service';
import { asyncHandler } from '../middleware/errorHandler';

export const ProcurementController = {
  listPOs: asyncHandler(async (req: Request, res: Response) => {
    const query = POQuerySchema.parse(req.query);
    const result = await ProcurementService.listPOs(req.user!.org, query);
    res.json({ success: true, ...result, data: result.purchaseOrders });
  }),

  getPOById: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const po = await ProcurementService.getPOById(req.user!.org, id);
    res.json({ success: true, data: po });
  }),

  createPO: asyncHandler(async (req: Request, res: Response) => {
    const input = CreatePOSchema.parse(req.body);
    const userName = (req.user as any)?.name || req.user!.sub;
    const po = await ProcurementService.createPO(req.user!.org, req.user!.sub, userName, input);
    res.status(201).json({ success: true, data: po });
  }),

  updatePOStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status, notes } = UpdatePOStatusSchema.parse(req.body);
    const userName = (req.user as any)?.name || req.user!.sub;
    const po = await ProcurementService.updatePOStatus(req.user!.org, id, req.user!.sub, userName, status, notes);
    res.json({ success: true, data: po });
  }),

  createGRN: asyncHandler(async (req: Request, res: Response) => {
    const input = CreateGRNSchema.parse(req.body);
    const userName = (req.user as any)?.name || req.user!.sub;
    const result = await ProcurementService.createGRN(req.user!.org, req.user!.sub, userName, input);
    res.status(201).json({ success: true, data: result });
  }),

  getGRNsForPO: asyncHandler(async (req: Request, res: Response) => {
    const poId = req.params.poId as string;
    const grns = await ProcurementService.getGRNsForPO(req.user!.org, poId);
    res.json({ success: true, data: grns });
  }),
};
