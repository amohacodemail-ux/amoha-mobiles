export type BarcodeFormat = 'EAN13' | 'EAN8' | 'UPCA' | 'CODE128' | 'CODE39';

/** JsBarcode format names differ from our API type for UPC-A */
export function toJsBarcodeFormat(type: BarcodeFormat): string {
  if (type === 'UPCA') return 'UPC';
  return type;
}

export function calculateEAN13Checksum(base12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base12[i], 10);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

export function calculateEAN8Checksum(base7: string): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(base7[i], 10);
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

export function calculateUPCAChecksum(base11: string): number {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(base11[i], 10);
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

/** Append check digit when user enters base digits only (matches JsBarcode preview behaviour). */
export function normalizeBarcodeValue(code: string, type: BarcodeFormat): string {
  const trimmed = code.trim();
  switch (type) {
    case 'EAN13':
      if (/^\d{12}$/.test(trimmed)) return `${trimmed}${calculateEAN13Checksum(trimmed)}`;
      return trimmed;
    case 'EAN8':
      if (/^\d{7}$/.test(trimmed)) return `${trimmed}${calculateEAN8Checksum(trimmed)}`;
      return trimmed;
    case 'UPCA':
      if (/^\d{11}$/.test(trimmed)) return `${trimmed}${calculateUPCAChecksum(trimmed)}`;
      return trimmed;
    default:
      return trimmed;
  }
}

function isValidEAN13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  return parseInt(code[12], 10) === calculateEAN13Checksum(code.slice(0, 12));
}

function isValidEAN8(code: string): boolean {
  if (!/^\d{8}$/.test(code)) return false;
  return parseInt(code[7], 10) === calculateEAN8Checksum(code.slice(0, 7));
}

function isValidUPCA(code: string): boolean {
  if (!/^\d{12}$/.test(code)) return false;
  return parseInt(code[11], 10) === calculateUPCAChecksum(code.slice(0, 11));
}

/** Human-readable error for preview when JsBarcode cannot render. */
export function getBarcodePreviewError(code: string, type: BarcodeFormat): string {
  const trimmed = code.trim();
  if (!trimmed) return 'Barcode is required';

  switch (type) {
    case 'EAN13':
      if (!/^\d+$/.test(trimmed)) return 'EAN-13 must be digits only';
      if (trimmed.length === 12 || trimmed.length === 13) {
        const full = normalizeBarcodeValue(trimmed, 'EAN13');
        if (!isValidEAN13(full)) return 'Invalid EAN-13 check digit';
        return 'Could not render EAN-13 barcode';
      }
      return 'EAN-13: use 12 digits (check digit added) or 13 full digits';

    case 'EAN8':
      if (!/^\d+$/.test(trimmed)) return 'EAN-8 must be digits only';
      if (trimmed.length === 7 || trimmed.length === 8) {
        const full = normalizeBarcodeValue(trimmed, 'EAN8');
        if (!isValidEAN8(full)) return 'Invalid EAN-8 check digit';
        return 'Could not render EAN-8 barcode';
      }
      return 'EAN-8: use 7 digits (check digit added) or 8 full digits';

    case 'UPCA':
      if (!/^\d+$/.test(trimmed)) return 'UPC-A must be digits only';
      if (trimmed.length === 11 || trimmed.length === 12) {
        const full = normalizeBarcodeValue(trimmed, 'UPCA');
        if (!isValidUPCA(full)) return 'Invalid UPC-A check digit';
        return 'Could not render UPC-A barcode';
      }
      return 'UPC-A: use 11 digits (check digit added) or 12 full digits';

    case 'CODE128':
      if (!/^[\x20-\x7E]+$/.test(trimmed)) return 'Code 128: use printable characters (e.g. SKU)';
      if (trimmed.length > 48) return 'Code 128: max 48 characters';
      return 'Could not render Code 128 barcode';

    case 'CODE39':
      if (!/^[0-9A-Z\-\.\s$/+\%]+$/.test(trimmed)) return 'Code 39: use 0-9, A-Z, space, or -.$/+%';
      return 'Could not render Code 39 barcode';

    default:
      return 'Invalid barcode format';
  }
}

/** Resolve JsBarcode format for print windows using stored product type. */
export function resolvePrintFormat(code: string, barcodeType?: string): string {
  const type = (barcodeType || '').toUpperCase();
  if (type === 'UPCA') return 'UPC';
  if (type === 'EAN13' || type === 'EAN8' || type === 'CODE39' || type === 'CODE128') return type;
  if (/^\d{13}$/.test(code)) return 'EAN13';
  if (/^\d{12}$/.test(code)) return 'UPC';
  if (/^\d{8}$/.test(code)) return 'EAN8';
  return 'CODE128';
}

export function barcodeTypeHint(type: BarcodeFormat): string {
  switch (type) {
    case 'EAN13':
      return 'Enter 12 digits (check digit auto-added) or 13 full digits. Leave empty to auto-generate.';
    case 'EAN8':
      return 'Enter 7 digits (check digit auto-added) or 8 full digits. Leave empty to auto-generate.';
    case 'UPCA':
      return 'Enter 11 digits (check digit auto-added) or 12 full digits. Leave empty to auto-generate.';
    case 'CODE128':
      return 'Enter manually or use SKU. Alphanumeric values like AMH-… work here.';
    default:
      return `Leave empty to auto-generate ${type} on save.`;
  }
}
