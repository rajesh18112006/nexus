import { Request, Response } from 'express';
import { CreateProductSchema, UpdateProductSchema, ProductQuerySchema } from '@nexus/shared';
import { ProductService } from '../services/product.service';
import { asyncHandler } from '../middleware/errorHandler';

export const ProductController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = ProductQuerySchema.parse(req.query);
    const result = await ProductService.list(req.user!.org, query);
    res.json({ success: true, ...result, products: result.data });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const product = await ProductService.getById(req.user!.org, id);
    res.json({ success: true, data: product });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = CreateProductSchema.parse(req.body);
    const product = await ProductService.create(req.user!.org, input);
    res.status(201).json({ success: true, data: product });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const input = UpdateProductSchema.parse(req.body);
    const product = await ProductService.update(req.user!.org, id, input);
    res.json({ success: true, data: product });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await ProductService.softDelete(req.user!.org, id);
    res.json({ success: true, message: 'Product archived successfully.' });
  }),

  getMetrics: asyncHandler(async (req: Request, res: Response) => {
    const metrics = await ProductService.getMetrics(req.user!.org);
    res.json({ success: true, data: metrics });
  }),
};
