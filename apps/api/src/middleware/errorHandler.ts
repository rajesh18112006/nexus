import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as any).requestId ?? 'unknown';

  // Zod validation errors — return as 400 with field details
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed. Please check the request data.',
      requestId,
      code: 'VALIDATION_ERROR',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    logger.warn({ requestId, code: err.code, statusCode: err.statusCode, message: err.message });
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      requestId,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Unknown errors — log fully, return generic message (no leaking internals)
  logger.error({ requestId, err }, 'Unhandled error');
  res.status(500).json({
    success: false,
    message: 'Something went wrong. Our team has been notified. Please quote your request ID when contacting support.',
    requestId,
    code: 'INTERNAL_ERROR',
  });
}

/** Async route wrapper — catches promise rejections and forwards to errorHandler */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
