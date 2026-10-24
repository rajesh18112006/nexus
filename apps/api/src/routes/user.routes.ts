import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Public: organization lookup for Join Organization signup flow
router.get('/organization-lookup/:slug', UserController.lookupOrganization);

// Protected Admin routes
router.use(authenticate);

router.get('/', requirePermission('users', 'read'), UserController.listMembers);
router.get('/pending', requirePermission('users', 'read'), UserController.getPending);
router.post('/:id/approve', requirePermission('users', 'update'), UserController.approveUser);
router.post('/:id/reject', requirePermission('users', 'update'), UserController.rejectUser);
router.patch('/:id/role', requirePermission('users', 'update'), UserController.updateRole);
router.patch('/:id/status', requirePermission('users', 'update'), UserController.toggleStatus);

export default router;
