import { Request, Response } from 'express';
import { Router } from 'express';
import { SimulationInputSchema } from '@nexus/shared';
import { SimulatorService } from '../services/simulator.service';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

export const SimulatorController = {
  simulate: asyncHandler(async (req: Request, res: Response) => {
    const input = SimulationInputSchema.parse(req.body);
    const result = await SimulatorService.runSimulation(req.user!.org, input);
    res.json({ success: true, data: result });
  }),
};

const router = Router();
router.use(authenticate);
router.post('/', SimulatorController.simulate);

export const simulatorRoutes = router;
