import { Router } from 'express';
import { SupplierController } from '../controllers/supplier.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', SupplierController.list);
router.get('/:id', SupplierController.getById);
router.post('/', SupplierController.create);
router.put('/:id', SupplierController.update);

export const supplierRoutes = router;
