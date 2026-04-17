import { Request, Response, NextFunction } from 'express';
import barcodeService from '../services/barcode.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendMessage } from '../utils/response.util';

class BarcodeController {
  /** Lookup product by barcode or SKU */
  async lookup(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      if (!code) return sendMessage(res, 'Barcode or SKU is required', 400);
      const product = await barcodeService.lookupByBarcode(code);
      sendSuccess(res, product, 'Product found');
    } catch (error) {
      next(error);
    }
  }

  /** Stock check by barcode scan */
  async stockCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      if (!code) return sendMessage(res, 'Barcode or SKU is required', 400);
      const stock = await barcodeService.getStockByBarcode(code);
      sendSuccess(res, stock, 'Stock info fetched');
    } catch (error) {
      next(error);
    }
  }

  /** Bulk lookup */
  async bulkLookup(req: Request, res: Response, next: NextFunction) {
    try {
      const { codes } = req.body;
      if (!codes || !Array.isArray(codes)) return sendMessage(res, 'codes array is required', 400);
      const products = await barcodeService.bulkLookup(codes);
      sendSuccess(res, products, 'Products found');
    } catch (error) {
      next(error);
    }
  }

  /** Regenerate barcode for a product */
  async regenerate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const product = await barcodeService.regenerateBarcode(productId);
      sendSuccess(res, product, 'Barcode regenerated');
    } catch (error) {
      next(error);
    }
  }
}

export default new BarcodeController();
