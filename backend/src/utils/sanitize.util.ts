import xss from 'xss';

const xssOptions = {
  whiteList: {},          // No HTML tags allowed
  stripIgnoreTag: true,   // Strip all unknown tags
  stripIgnoreTagBody: ['script', 'style'],
};

/**
 * Sanitize user input to prevent XSS attacks.
 * Strips all HTML tags and encodes entities.
 */
export function sanitize(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return xss(input, xssOptions).trim();
}

/**
 * Sanitize an object's string values (shallow, specified keys only).
 */
export function sanitizeFields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
  const result = { ...obj };
  for (const field of fields) {
    if (typeof result[field] === 'string') {
      (result as any)[field] = sanitize(result[field] as string);
    }
  }
  return result;
}
