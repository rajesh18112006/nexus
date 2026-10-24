import { Request, Response, Router } from 'express';
import { CostService } from '../services/cost.service';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

export const CostController = {
  getABCAnalysis: asyncHandler(async (req: Request, res: Response) => {
    const data = await CostService.getABCAnalysis(req.user!.org);
    res.json({ success: true, data });
  }),
};

const router = Router();
router.use(authenticate);
router.get('/abc', CostController.getABCAnalysis);

export const costRoutes = router;
