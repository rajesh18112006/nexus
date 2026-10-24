import { Request, Response } from 'express';
import { ForecastingService } from '../services/forecasting.service';
import { asyncHandler } from '../middleware/errorHandler';

export const ForecastingController = {
  getRunway: asyncHandler(async (req: Request, res: Response) => {
    const data = await ForecastingService.getRunwayTimeline(req.user!.org);
    res.json({ success: true, data });
  }),

  getRecommendations: asyncHandler(async (req: Request, res: Response) => {
    const data = await ForecastingService.getReorderRecommendations(req.user!.org);
    res.json({ success: true, data });
  }),
};
