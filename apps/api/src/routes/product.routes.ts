import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/metrics', requirePermission('products', 'read'), ProductController.getMetrics);
router.get('/', requirePermission('products', 'read'), ProductController.list);
router.get('/:id', requirePermission('products', 'read'), ProductController.getById);
router.post('/', requirePermission('products', 'create'), ProductController.create);
router.put('/:id', requirePermission('products', 'update'), ProductController.update);
router.delete('/:id', requirePermission('products', 'delete'), ProductController.delete);

export default router;
