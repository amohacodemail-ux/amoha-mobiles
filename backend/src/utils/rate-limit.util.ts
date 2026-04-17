import { Request } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';

const firstHeaderValue = (value: string | string[] | undefined): string | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0]?.trim();
  return value.split(',')[0]?.trim();
};

const parseForwardedFor = (forwarded: string): string | undefined => {
  const match = forwarded.match(/for=("?)([^;,"]+)\1/i);
  if (!match?.[2]) return undefined;
  return match[2].replace(/^\[/, '').replace(/\]$/, '').trim();
};

export const getRateLimitKey = (req: Request): string => {
  const xForwardedFor = firstHeaderValue(req.headers['x-forwarded-for']);
  if (xForwardedFor) return ipKeyGenerator(xForwardedFor.toLowerCase());

  const forwarded = firstHeaderValue(req.headers.forwarded);
  if (forwarded) {
    const parsed = parseForwardedFor(forwarded);
    if (parsed) return ipKeyGenerator(parsed.toLowerCase());
  }

  return ipKeyGenerator((req.ip || req.socket.remoteAddress || '127.0.0.1').toLowerCase());
};
