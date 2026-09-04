import { Router } from 'express';
import campaignController from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createCampaignValidator,
  updateCampaignValidator,
  idValidator,
  getCampaignsValidator
} from '../validators/campaign.validator';

const router = Router();

// Protect all campaign routes - require admin or marketing roles
router.use(authenticate);
router.use(authorize('admin', 'marketing', 'sales')); // Sales gets read access, marketing/admin get write

// Fetch all campaigns
router.get(
  '/',
  validate(getCampaignsValidator),
  campaignController.getAll
);

// Fetch a single campaign
router.get(
  '/:id',
  validate(idValidator),
  campaignController.getById
);

// Require admin or marketing role for write operations
const writeRoles = authorize('admin', 'marketing');

// Create campaign
router.post(
  '/',
  writeRoles,
  validate(createCampaignValidator),
  campaignController.create
);

// Update campaign
router.patch(
  '/:id',
  writeRoles,
  validate(updateCampaignValidator),
  campaignController.update
);

// Delete campaign
router.delete(
  '/:id',
  writeRoles,
  validate(idValidator),
  campaignController.delete
);

export default router;
