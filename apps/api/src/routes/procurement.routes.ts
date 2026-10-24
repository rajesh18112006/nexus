import { Router } from 'express';
import { ProcurementController } from '../controllers/procurement.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/pos', ProcurementController.listPOs);
router.get('/pos/:id', ProcurementController.getPOById);
router.post('/pos', ProcurementController.createPO);
router.patch('/pos/:id/status', ProcurementController.updatePOStatus);

router.post('/grn', ProcurementController.createGRN);
router.get('/pos/:poId/grns', ProcurementController.getGRNsForPO);

export const procurementRoutes = router;
