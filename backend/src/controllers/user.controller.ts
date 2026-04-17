import { Response, NextFunction } from 'express';
import userService from '../services/user.service';
import supabase from '../config/supabase';
import { transformRow, transformUser, flattenKycForDb } from '../utils/transform.util';
import { NotFoundError } from '../errors/app-error';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendMessage } from '../utils/response.util';
import { notifyKyc } from '../utils/notify';
import { sendKycStatusEmail } from '../utils/email.util';

class UserController {
  async getAddresses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { data: addresses } = await supabase.from('addresses').select('*').eq('user_id', req.user!.userId).order('created_at');
      sendSuccess(res, (addresses || []).map(transformRow), 'Addresses fetched');
    } catch (error) { next(error); }
  }

  async addAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const address = await userService.addAddress(req.user!.userId, req.body);
      sendSuccess(res, address, 'Address added', 201);
    } catch (error) { next(error); }
  }

  async updateAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const address = await userService.updateAddress(req.user!.userId, req.params.addressId, req.body);
      sendSuccess(res, address, 'Address updated');
    } catch (error) { next(error); }
  }

  async deleteAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await userService.deleteAddress(req.user!.userId, req.params.addressId);
      sendMessage(res, 'Address deleted');
    } catch (error) { next(error); }
  }

  async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await userService.getAllUsers(req.query);
      sendSuccess(res, result, 'Users fetched');
    } catch (error) { next(error); }
  }

  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id);
      sendSuccess(res, user, 'User fetched');
    } catch (error) { next(error); }
  }

  async toggleBlock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { isBlocked } = req.body;
      const user = isBlocked ? await userService.blockUser(req.params.id) : await userService.unblockUser(req.params.id);
      sendSuccess(res, user, `User ${isBlocked ? 'blocked' : 'unblocked'}`);
    } catch (error) { next(error); }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await userService.deleteUser(req.params.id);
      sendMessage(res, 'User deleted');
    } catch (error) { next(error); }
  }

  async submitKyc(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { data: user } = await supabase.from('users').select('*').eq('id', req.user!.userId).maybeSingle();
      if (!user) return next(new NotFoundError('User'));
      if (user.kyc_status === 'verified') return sendSuccess(res, { status: 'verified' }, 'KYC already verified');
      if (!req.body.documentImage) return res.status(400).json({ success: false, message: 'Document image upload is mandatory' });

      await supabase.from('users').update({
        kyc_status: 'pending', kyc_document_type: req.body.documentType,
        kyc_document_number: req.body.documentNumber, kyc_document_image: req.body.documentImage,
        kyc_full_name: req.body.fullName, kyc_submitted_at: new Date().toISOString(), kyc_rejection_reason: null,
      }).eq('id', req.user!.userId);

      notifyKyc(req.body.fullName || user.name, user.id);
      sendKycStatusEmail(user.email, user.name, 'pending').catch(() => {});
      sendSuccess(res, { status: 'pending' }, 'KYC submitted for verification');
    } catch (error) { next(error); }
  }

  async getKycStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { data: user } = await supabase.from('users').select('kyc_status, kyc_document_type, kyc_document_number, kyc_document_image, kyc_full_name, kyc_submitted_at, kyc_verified_at, kyc_rejection_reason').eq('id', req.user!.userId).maybeSingle();
      if (!user) return next(new NotFoundError('User'));
      sendSuccess(res, {
        status: user.kyc_status || 'not_submitted', documentType: user.kyc_document_type, documentNumber: user.kyc_document_number,
        documentImage: user.kyc_document_image, fullName: user.kyc_full_name, submittedAt: user.kyc_submitted_at,
        verifiedAt: user.kyc_verified_at, rejectionReason: user.kyc_rejection_reason,
      }, 'KYC status fetched');
    } catch (error) { next(error); }
  }

  async verifyKyc(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { data: user } = await supabase.from('users').select('kyc_status, email, name').eq('id', req.params.id).maybeSingle();
      if (!user) return next(new NotFoundError('User'));
      if (user.kyc_status !== 'pending') return sendMessage(res, 'Only pending KYC can be verified', 400);
      const { data: updated } = await supabase.from('users').update({ kyc_status: 'verified', kyc_verified_at: new Date().toISOString(), is_verified: true }).eq('id', req.params.id).select('*').single();
      sendKycStatusEmail(user.email, user.name, 'verified').catch(() => {});
      sendSuccess(res, transformUser(updated), 'KYC verified');
    } catch (error) { next(error); }
  }

  async rejectKyc(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { data: user } = await supabase.from('users').select('kyc_status, email, name').eq('id', req.params.id).maybeSingle();
      if (!user) return next(new NotFoundError('User'));
      if (user.kyc_status !== 'pending') return sendMessage(res, 'Only pending KYC can be rejected', 400);
      const reason = req.body.rejectionReason || req.body.reason || '';
      const { data: updated } = await supabase.from('users').update({ kyc_status: 'rejected', kyc_verified_at: null, kyc_rejection_reason: reason, is_verified: false }).eq('id', req.params.id).select('*').single();
      sendKycStatusEmail(user.email, user.name, 'rejected', reason).catch(() => {});
      sendSuccess(res, transformUser(updated), 'KYC rejected');
    } catch (error) { next(error); }
  }
}

export default new UserController();
