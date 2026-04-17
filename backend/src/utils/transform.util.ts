/**
 * Transforms a database row (snake_case) to camelCase, adding _id alias for id.
 * JSONB fields already stored in camelCase pass through untouched.
 */
export function transformRow(row: any): any {
  if (row === null || row === undefined) return row;
  if (Array.isArray(row)) return row.map(transformRow);
  if (typeof row !== 'object' || row instanceof Date) return row;

  const result: any = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

    if (key === 'id') {
      result._id = value;
      result.id = value;
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map((item: any) =>
        item && typeof item === 'object' && !(item instanceof Date) ? transformRow(item) : item,
      );
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      result[camelKey] = transformRow(value);
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

/**
 * Converts camelCase keys to snake_case for database inserts/updates.
 * Only transforms top-level keys — nested objects (JSONB) are left as-is.
 */
export function toDbRow(obj: any): any {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_id') continue; // Skip _id, use id instead
    const snakeKey = key.replace(/[A-Z]/g, (c: string) => `_${c.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

/**
 * Strips sensitive fields from a user row.
 */
export function stripSensitiveUser(user: any): any {
  if (!user) return user;
  const { password, refresh_token, reset_password_token, reset_password_expiry, refreshToken, resetPasswordToken, resetPasswordExpiry, ...safe } = user;
  return safe;
}

/**
 * Flattens KYC fields from the database flat structure into a nested kyc object
 * to maintain backward compatibility with the frontend.
 */
export function buildKycObject(row: any): any {
  if (!row) return row;
  const kyc: any = {
    status: row.kycStatus || row.kyc_status || 'not_submitted',
    documentType: row.kycDocumentType || row.kyc_document_type,
    documentNumber: row.kycDocumentNumber || row.kyc_document_number,
    documentImage: row.kycDocumentImage || row.kyc_document_image,
    fullName: row.kycFullName || row.kyc_full_name,
    panNumber: row.kycPanNumber || row.kyc_pan_number,
    panImage: row.kycPanImage || row.kyc_pan_image,
    bankAccountNumber: row.kycBankAccountNumber || row.kyc_bank_account_number,
    bankIfscCode: row.kycBankIfscCode || row.kyc_bank_ifsc_code,
    bankName: row.kycBankName || row.kyc_bank_name,
    bankAccountHolderName: row.kycBankAccountHolderName || row.kyc_bank_account_holder_name,
    submittedAt: row.kycSubmittedAt || row.kyc_submitted_at,
    verifiedAt: row.kycVerifiedAt || row.kyc_verified_at,
    rejectionReason: row.kycRejectionReason || row.kyc_rejection_reason,
  };
  return kyc;
}

/**
 * Transforms a user row: camelCase + _id alias + nested kyc object + strip sensitive.
 */
export function transformUser(row: any): any {
  if (!row) return row;
  const transformed = transformRow(row);
  // Build nested kyc object
  transformed.kyc = buildKycObject(transformed);
  // Remove flat kyc fields
  const kycKeys = [
    'kycStatus', 'kycDocumentType', 'kycDocumentNumber', 'kycDocumentImage',
    'kycFullName', 'kycPanNumber', 'kycPanImage', 'kycBankAccountNumber',
    'kycBankIfscCode', 'kycBankName', 'kycBankAccountHolderName',
    'kycSubmittedAt', 'kycVerifiedAt', 'kycRejectionReason',
  ];
  for (const k of kycKeys) delete transformed[k];
  return stripSensitiveUser(transformed);
}

/**
 * Flattens a nested kyc object to flat DB columns for insert/update.
 */
export function flattenKycForDb(kyc: any): any {
  if (!kyc) return {};
  return {
    kyc_status: kyc.status,
    kyc_document_type: kyc.documentType,
    kyc_document_number: kyc.documentNumber,
    kyc_document_image: kyc.documentImage,
    kyc_full_name: kyc.fullName,
    kyc_pan_number: kyc.panNumber,
    kyc_pan_image: kyc.panImage,
    kyc_bank_account_number: kyc.bankAccountNumber,
    kyc_bank_ifsc_code: kyc.bankIfscCode,
    kyc_bank_name: kyc.bankName,
    kyc_bank_account_holder_name: kyc.bankAccountHolderName,
    kyc_submitted_at: kyc.submittedAt,
    kyc_verified_at: kyc.verifiedAt,
    kyc_rejection_reason: kyc.rejectionReason,
  };
}
