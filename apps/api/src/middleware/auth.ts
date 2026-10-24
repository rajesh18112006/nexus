import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayloadSchema, type TokenPayload } from '@nexus/shared';

// Extend Express Request to carry auth payload
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Verifies the Bearer JWT access token.
 * Attaches decoded payload to req.user.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid Bearer token.',
      requestId: (req as any).requestId,
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as unknown;
    const result = TokenPayloadSchema.safeParse(decoded);

    if (!result.success) {
      res.status(401).json({
        success: false,
        message: 'Invalid token payload.',
        requestId: (req as any).requestId,
        code: 'TOKEN_INVALID',
      });
      return;
    }

    req.user = result.data;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Session expired. Please refresh your token.',
        requestId: (req as any).requestId,
        code: 'TOKEN_EXPIRED',
      });
      return;
    }
    res.status(401).json({
      success: false,
      message: 'Invalid or malformed token.',
      requestId: (req as any).requestId,
      code: 'TOKEN_INVALID',
    });
  }
}
