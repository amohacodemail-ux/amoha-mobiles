import crypto from 'crypto';
import supabase from '../config/supabase';

export type BarcodeType = 'EAN13' | 'EAN8' | 'CODE128' | 'CODE39' | 'UPCA';

export interface BarcodeOptions {
  type?: BarcodeType;
  value?: string;
  prefix?: string;
}

/**
 * Calculate EAN-13 checksum digit
 * Uses the standard GS1 algorithm:
 * - Sum of digits at odd positions (1,3,5...) × 1
 * - Sum of digits at even positions (2,4,6...) × 3
 * - Checksum = (10 - (total % 10)) % 10
 */
export function calculateEAN13Checksum(base12: string): number {
  if (!/^\d{12}$/.test(base12)) {
    throw new Error('EAN-13 base must be exactly 12 digits');
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base12[i], 10);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * Calculate EAN-8 checksum digit
 */
export function calculateEAN8Checksum(base7: string): number {
  if (!/^\d{7}$/.test(base7)) {
    throw new Error('EAN-8 base must be exactly 7 digits');
  }

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(base7[i], 10);
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * Validate EAN-13 barcode (with checksum)
 */
export function validateEAN13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) return false;

  const base12 = barcode.slice(0, 12);
  const checksum = parseInt(barcode[12], 10);
  const calculated = calculateEAN13Checksum(base12);

  return checksum === calculated;
}

/**
 * Validate EAN-8 barcode (with checksum)
 */
export function validateEAN8(barcode: string): boolean {
  if (!/^\d{8}$/.test(barcode)) return false;

  const base7 = barcode.slice(0, 7);
  const checksum = parseInt(barcode[7], 10);
  const calculated = calculateEAN8Checksum(base7);

  return checksum === calculated;
}

/**
 * Validate Code 128 barcode
 * Code 128 supports ASCII 0-127, but for safety we restrict to printable chars
 */
export function validateCode128(barcode: string): boolean {
  if (!barcode || barcode.length === 0) return false;
  if (barcode.length > 48) return false; // Practical limit for scanning

  // Allow printable ASCII (32-126) and common control chars
  const validChars = /^[\x20-\x7E]+$/;
  return validChars.test(barcode);
}

/**
 * Validate UPC-A barcode (12 digits with checksum)
 */
export function validateUPCA(barcode: string): boolean {
  if (!/^\d{12}$/.test(barcode)) return false;

  // UPC-A uses same checksum algorithm as EAN-13
  const base11 = barcode.slice(0, 11);
  const checksum = parseInt(barcode[11], 10);

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(base11[i], 10);
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }

  const calculated = (10 - (sum % 10)) % 10;
  return checksum === calculated;
}

/**
 * Validate Code 39 barcode
 * Supports: 0-9, A-Z, space, and -.$/+%
 */
export function validateCode39(barcode: string): boolean {
  if (!barcode || barcode.length === 0) return false;
  if (barcode.length > 43) return false;

  const validChars = /^[0-9A-Z\-\.\s\$/\/\+\%]+$/;
  return validChars.test(barcode);
}

/**
 * Auto-detect barcode type based on format
 */
export function detectBarcodeType(barcode: string): BarcodeType | null {
  if (!barcode) return null;

  const clean = barcode.trim();

  if (/^\d{13}$/.test(clean) && validateEAN13(clean)) return 'EAN13';
  if (/^\d{8}$/.test(clean) && validateEAN8(clean)) return 'EAN8';
  if (/^\d{12}$/.test(clean) && validateUPCA(clean)) return 'UPCA';
  if (/^[0-9A-Z\-\.\s\$/\/\+\%]+$/.test(clean)) return 'CODE39';
  if (validateCode128(clean)) return 'CODE128';

  return null;
}

/**
 * Validate barcode based on type
 */
export function validateBarcode(barcode: string, type: BarcodeType): { valid: boolean; error?: string } {
  if (!barcode || barcode.trim() === '') {
    return { valid: false, error: 'Barcode is required' };
  }

  switch (type) {
    case 'EAN13':
      if (!/^\d{13}$/.test(barcode)) {
        return { valid: false, error: 'EAN-13 must be exactly 13 digits' };
      }
      if (!validateEAN13(barcode)) {
        return { valid: false, error: 'Invalid EAN-13 checksum' };
      }
      return { valid: true };

    case 'EAN8':
      if (!/^\d{8}$/.test(barcode)) {
        return { valid: false, error: 'EAN-8 must be exactly 8 digits' };
      }
      if (!validateEAN8(barcode)) {
        return { valid: false, error: 'Invalid EAN-8 checksum' };
      }
      return { valid: true };

    case 'UPCA':
      if (!/^\d{12}$/.test(barcode)) {
        return { valid: false, error: 'UPC-A must be exactly 12 digits' };
      }
      if (!validateUPCA(barcode)) {
        return { valid: false, error: 'Invalid UPC-A checksum' };
      }
      return { valid: true };

    case 'CODE128':
      if (!validateCode128(barcode)) {
        return { valid: false, error: 'Code 128 must be 1-48 printable ASCII characters' };
      }
      return { valid: true };

    case 'CODE39':
      if (!validateCode39(barcode)) {
        return { valid: false, error: 'Code 39 must be 0-9, A-Z, space, or -.$/+%' };
      }
      return { valid: true };

    default:
      return { valid: false, error: 'Unknown barcode type' };
  }
}

/**
 * Check if barcode already exists in database
 */
export async function isBarcodeExists(barcode: string, excludeProductId?: string): Promise<boolean> {
  let query = supabase.from('products').select('id').eq('barcode', barcode);

  if (excludeProductId) {
    query = query.neq('id', excludeProductId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error checking barcode existence:', error);
    return true; // Fail safe - assume exists on error
  }

  return !!data;
}

/**
 * Generate unique EAN-13 barcode
 * Uses 200 prefix (reserved for internal use) + random 9 digits + checksum
 */
export async function generateEAN13(prefix: string = '200'): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate random 9-digit number
    const randomPart = crypto.randomInt(0, 999999999).toString().padStart(9, '0');
    const base12 = prefix + randomPart;
    const checksum = calculateEAN13Checksum(base12);
    const barcode = base12 + checksum;

    // Check for duplicates
    const exists = await isBarcodeExists(barcode);
    if (!exists) {
      return barcode;
    }
  }

  throw new Error(`Failed to generate unique EAN-13 barcode after ${maxAttempts} attempts`);
}

/**
 * Generate unique Code 128 barcode
 * Format: SKU-based or random alphanumeric
 */
export async function generateCode128(prefix: string = 'AMH'): Promise<string> {
  const maxAttempts = 10;
  const timestamp = Date.now().toString(36).toUpperCase();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    const barcode = `${prefix}-${timestamp}-${randomPart}`;

    // Check for duplicates
    const exists = await isBarcodeExists(barcode);
    if (!exists) {
      return barcode;
    }
  }

  throw new Error(`Failed to generate unique Code-128 barcode after ${maxAttempts} attempts`);
}

/**
 * Generate barcode based on type
 */
export async function generateBarcode(type: BarcodeType = 'EAN13', prefix?: string): Promise<string> {
  switch (type) {
    case 'EAN13':
      return generateEAN13(prefix || '200');
    case 'CODE128':
      return generateCode128(prefix || 'AMH');
    case 'EAN8':
      // Generate shorter EAN-8
      const base7 = crypto.randomInt(0, 9999999).toString().padStart(7, '0');
      const checksum = calculateEAN8Checksum(base7);
      return base7 + checksum;
    case 'UPCA':
      // Generate UPC-A (mostly for North American products)
      const upcBase = '0' + crypto.randomInt(0, 9999999999).toString().padStart(10, '0');
      let sum = 0;
      for (let i = 0; i < 11; i++) {
        sum += parseInt(upcBase[i], 10) * (i % 2 === 0 ? 3 : 1);
      }
      const upcChecksum = (10 - (sum % 10)) % 10;
      return upcBase + upcChecksum;
    default:
      throw new Error(`Barcode generation not implemented for type: ${type}`);
  }
}

/**
 * Generate barcode for product with all safety checks
 */
export async function generateProductBarcode(
  options: BarcodeOptions = {}
): Promise<{ barcode: string; type: BarcodeType }> {
  const type = options.type || 'EAN13';

  // If value is provided, validate it
  if (options.value) {
    const validation = validateBarcode(options.value, type);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const exists = await isBarcodeExists(options.value);
    if (exists) {
      throw new Error('Barcode already exists in database');
    }

    return { barcode: options.value, type };
  }

  // Generate new barcode
  const barcode = await generateBarcode(type, options.prefix);
  return { barcode, type };
}

/**
 * Bulk generate unique barcodes
 */
export async function bulkGenerateBarcodes(
  count: number,
  type: BarcodeType = 'EAN13'
): Promise<string[]> {
  const barcodes: string[] = [];
  const used = new Set<string>();

  // Also check against existing database barcodes
  const { data: existing } = await supabase.from('products').select('barcode').not('barcode', 'is', null);
  existing?.forEach(p => used.add(p.barcode));

  let attempts = 0;
  const maxAttempts = count * 20; // Generous retry limit

  while (barcodes.length < count && attempts < maxAttempts) {
    attempts++;

    try {
      let barcode: string;

      switch (type) {
        case 'EAN13':
          const randomPart = crypto.randomInt(0, 999999999).toString().padStart(9, '0');
          const base12 = '200' + randomPart;
          barcode = base12 + calculateEAN13Checksum(base12);
          break;
        case 'CODE128':
          const timestamp = Date.now().toString(36).toUpperCase();
          const random = crypto.randomBytes(3).toString('hex').toUpperCase();
          barcode = `AMH-${timestamp}-${random}`;
          break;
        default:
          throw new Error(`Bulk generation not implemented for type: ${type}`);
      }

      if (!used.has(barcode)) {
        used.add(barcode);
        barcodes.push(barcode);
      }
    } catch (err) {
      console.error('Error generating barcode:', err);
    }
  }

  if (barcodes.length < count) {
    throw new Error(`Only generated ${barcodes.length}/${count} unique barcodes`);
  }

  return barcodes;
}

/**
 * Format barcode for display (add spacing for readability)
 */
export function formatBarcodeForDisplay(barcode: string, type?: BarcodeType): string {
  if (!barcode) return '';

  const detectedType = type || detectBarcodeType(barcode);

  switch (detectedType) {
    case 'EAN13':
      // Format: X XXX XXX XXXXX X
      return barcode.replace(/(\d)(\d{3})(\d{3})(\d{5})(\d)/, '$1 $2 $3 $4 $5');
    case 'EAN8':
      // Format: X XXX XXX X
      return barcode.replace(/(\d)(\d{3})(\d{3})(\d)/, '$1 $2 $3 $4');
    case 'UPCA':
      // Format: X XXXXX XXXXX X
      return barcode.replace(/(\d)(\d{5})(\d{5})(\d)/, '$1 $2 $3 $4');
    default:
      return barcode;
  }
}

/**
 * Get barcode format requirements for UI display
 */
export function getBarcodeRequirements(type: BarcodeType): {
  length: string;
  charset: string;
  example: string;
} {
  switch (type) {
    case 'EAN13':
      return {
        length: '13 digits',
        charset: 'Numeric only (0-9)',
        example: '2001234567890'
      };
    case 'EAN8':
      return {
        length: '8 digits',
        charset: 'Numeric only (0-9)',
        example: '20123456'
      };
    case 'UPCA':
      return {
        length: '12 digits',
        charset: 'Numeric only (0-9)',
        example: '012345678905'
      };
    case 'CODE128':
      return {
        length: '1-48 characters',
        charset: 'All printable ASCII',
        example: 'AMH-ABC123-X7K9'
      };
    case 'CODE39':
      return {
        length: '1-43 characters',
        charset: '0-9, A-Z, -.$/+% and space',
        example: 'AMH-123-ABC'
      };
    default:
      return { length: 'Unknown', charset: 'Unknown', example: '' };
  }
}
