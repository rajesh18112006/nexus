import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Attaches a unique request ID to every request.
 * Included in all error responses so support can trace issues.
 */
export function requestId(req: Request, _res: Response, next: NextFunction): void {
  (req as any).requestId = uuidv4();
  next();
}
