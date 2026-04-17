import { Request, Response, NextFunction } from 'express';

/**
 * Sets Cache-Control headers for public GET responses.
 * Default 5-minute TTL for high-traffic routes to reduce DB load.
 * CDN/proxy gets double the TTL, stale-while-revalidate for seamless background refresh.
 */
export const cachePublic = (maxAge = 300) => {
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
