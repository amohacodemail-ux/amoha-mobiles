import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { addressSchema, updateAddressSchema } from '../validators/user.validator';

const router = Router();

// Protected routes
router.get('/addresses', authenticate, userController.getAddresses);
router.post('/addresses', authenticate, validate(addressSchema), userController.addAddress);
router.put('/addresses/:addressId', authenticate, validate(updateAddressSchema), userController.updateAddress);
router.delete('/addresses/:addressId', authenticate, userController.deleteAddress);

// KYC
router.get('/kyc', authenticate, userController.getKycStatus);
router.post('/kyc', authenticate, userController.submitKyc);

// Admin
router.get('/all', authenticate, isAdmin, userController.getAllUsers);
router.patch('/:id/kyc/verify', authenticate, isAdmin, userController.verifyKyc);
router.patch('/:id/kyc/reject', authenticate, isAdmin, userController.rejectKyc);

export default router;
