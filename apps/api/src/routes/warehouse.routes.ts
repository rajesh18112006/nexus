import { Router } from 'express';
import { WarehouseController } from '../controllers/warehouse.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('warehouses', 'read'), WarehouseController.list);
router.get('/:id', requirePermission('warehouses', 'read'), WarehouseController.getById);
router.post('/', requirePermission('warehouses', 'create'), WarehouseController.create);
router.put('/:id', requirePermission('warehouses', 'update'), WarehouseController.update);

export default router;
