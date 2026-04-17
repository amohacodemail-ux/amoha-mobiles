import { Request, Response, NextFunction } from 'express';

/**
 * Sets Cache-Control headers for public GET responses.
 * Short TTL (60s) so content stays fresh under high traffic
 * while still reducing DB load for 1000+ concurrent users.
 */
export const cachePublic = (maxAge = 60) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge * 2}, stale-while-revalidate=${maxAge * 4}`);
    next();
  };
};

/**
 * Mark responses as private (no CDN/proxy caching).
 */
export const cachePrivate = (_req: Request, res: Response, next: NextFunction) => {
  res.set('Cache-Control', 'private, no-cache');
  next();
};
