import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import logger from '../utils/logger.util';
import env from '../config/env';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
    return;
  }

  // PostgreSQL unique constraint violation
  if ((err as any).code === '23505') {
    const detail = (err as any).detail || '';
    const match = detail.match(/Key \((\w+)\)/);
    const field = match ? match[1] : 'value';
    const safeFieldNames: Record<string, string> = {
      email: 'Email',
      phone: 'Phone number',
      slug: 'This item',
      sku: 'SKU',
      barcode: 'Barcode',
      code: 'Code',
      order_number: 'Order number',
    };
    const displayName = safeFieldNames[field] || 'This value';
    res.status(409).json({
      success: false,
      message: `${displayName} already exists`,
    });
    return;
  }

  // PostgreSQL foreign key violation
  if ((err as any).code === '23503') {
    res.status(400).json({
      success: false,
      message: 'This item cannot be deleted because it is linked to existing records',
    });
    return;
  }

  // PostgreSQL check constraint violation
  if ((err as any).code === '23514') {
    res.status(400).json({
      success: false,
      message: 'Invalid data: constraint violation',
    });
    return;
  }

  // PostgreSQL not-null violation
  if ((err as any).code === '23502') {
    const column = (err as any).column || 'field';
    res.status(400).json({
      success: false,
      message: `Missing required field: ${column}`,
    });
    return;
  }

  // Invalid UUID format
  if ((err as any).code === '22P02') {
    const pgMessage = (err as any).message || '';
    const valueMatch = pgMessage.match(/invalid input syntax for type uuid: "(.+?)"/);
    const badValue = valueMatch ? valueMatch[1] : undefined;
    logger.warn('Invalid UUID format:', pgMessage);
    res.status(400).json({
      success: false,
      message: badValue
        ? `Invalid ID format: "${badValue}" is not a valid ID`
        : 'Invalid ID format',
    });
    return;
  }

  // Log unexpected errors
  logger.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    message: env.IS_PRODUCTION ? 'Internal server error' : err.message,
    ...(! env.IS_PRODUCTION && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
