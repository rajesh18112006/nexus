import { Router } from 'express';
import { ForecastingController } from '../controllers/forecasting.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/runway', ForecastingController.getRunway);
router.get('/recommendations', ForecastingController.getRecommendations);

export const forecastingRoutes = router;
