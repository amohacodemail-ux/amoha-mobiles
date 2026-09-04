import { Request, Response, NextFunction } from 'express';
import campaignService from '../services/campaign.service';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';
import { AuthenticatedRequest } from '../types';
import activityLogService from '../services/activity-log.service';

class CampaignController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await campaignService.getCampaigns(req.query);
      sendSuccess(res, data, 'Campaigns fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignService.getCampaignById(req.params.id);
      sendSuccess(res, campaign, 'Campaign fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user?.userId;
      const campaign = await campaignService.createCampaign(req.body, adminId);
      
      activityLogService.log({
        adminId,
        action: 'create',
        entity: 'campaign',
        entityId: campaign._id || campaign.id,
        details: `Created campaign: ${campaign.name}`,
        ipAddress: req.ip
      }).catch(() => {});

      sendCreated(res, campaign, 'Campaign created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user?.userId;
      const campaign = await campaignService.updateCampaign(req.params.id, req.body);
      
      activityLogService.log({
        adminId,
        action: 'update',
        entity: 'campaign',
        entityId: campaign._id || campaign.id,
        details: `Updated campaign: ${campaign.name}`,
        ipAddress: req.ip
      }).catch(() => {});

      sendSuccess(res, campaign, 'Campaign updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user?.userId;
      const result = await campaignService.deleteCampaign(req.params.id);
      
      activityLogService.log({
        adminId,
        action: 'delete',
        entity: 'campaign',
        entityId: req.params.id,
        details: `Deleted campaign`,
        ipAddress: req.ip
      }).catch(() => {});

      sendMessage(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new CampaignController();
