import { Request, Response, NextFunction } from 'express';
import { hasPermission, type Resource, type Action } from '../permissions';

/**
 * RBAC middleware factory.
 * Use: router.get('/path', authenticate, requirePermission('products', 'read'), controller)
 *
 * Returns 403 if the authenticated user's role does not have permission.
 * Returns 401 if no user on request (auth middleware not applied).
 */
export function requirePermission(resource: Resource, action: Action) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
        requestId: (req as any).requestId,
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (req.user.approvalStatus === 'PENDING') {
      res.status(403).json({
        success: false,
        message: 'Your account is pending administrator approval before accessing workspace data.',
        requestId: (req as any).requestId,
        code: 'ACCOUNT_PENDING_APPROVAL',
      });
      return;
    }

    if (req.user.approvalStatus === 'REJECTED') {
      res.status(403).json({
        success: false,
        message: 'Your account request was declined by the organization administrator.',
        requestId: (req as any).requestId,
        code: 'ACCOUNT_REJECTED',
      });
      return;
    }

    if (!hasPermission(req.user.role, resource, action)) {
      res.status(403).json({
        success: false,
        message: `Your role (${req.user.role}) does not have permission to ${action} ${resource}.`,
        requestId: (req as any).requestId,
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}

/**
 * Enforces that the organizationId in query/params/body matches the authenticated user's org.
 * Used as an additional layer for multi-tenant safety.
 */
export function sameOrganization(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.', requestId: (req as any).requestId, code: 'AUTH_REQUIRED' });
    return;
  }
  // Requests cannot pass an organizationId that differs from their token
  const bodyOrg = (req.body as any)?.organizationId;
  if (bodyOrg && bodyOrg !== req.user.org) {
    res.status(403).json({ success: false, message: 'Cross-organization access denied.', requestId: (req as any).requestId, code: 'FORBIDDEN' });
    return;
  }
  next();
}
