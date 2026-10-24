import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/stock-levels', requirePermission('inventory', 'read'), InventoryController.listStockLevels);
router.post('/adjustments', requirePermission('inventory', 'update'), InventoryController.adjustStock);
router.post('/adjust', requirePermission('inventory', 'update'), InventoryController.adjustStock);
router.post('/transfer', requirePermission('inventory', 'update'), InventoryController.transferStock);
router.get('/ledger', requirePermission('stock_movements', 'read'), InventoryController.getStockLedger);

export default router;
