import { Request, Response, Router } from 'express';
import { AlertService } from '../services/alert.service';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

export const AlertController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const isResolved = req.query.isResolved === 'true';
    const alerts = await AlertService.listAlerts(req.user!.org, isResolved);
    res.json({ success: true, data: alerts });
  }),

  resolve: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const alert = await AlertService.resolveAlert(req.user!.org, id, req.user!.sub);
    res.json({ success: true, data: alert });
  }),

  morningBrief: asyncHandler(async (req: Request, res: Response) => {
    const brief = await AlertService.getMorningBrief(req.user!.org);
    res.json({ success: true, data: brief });
  }),
};

const router = Router();
router.use(authenticate);
router.get('/', AlertController.list);
router.patch('/:id/resolve', AlertController.resolve);
router.get('/morning-brief', AlertController.morningBrief);

export const alertRoutes = router;
