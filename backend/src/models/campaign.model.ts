export interface ICampaign {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  
  targetType: 'all' | 'segment';
  targetSegment?: string; // 'vip', 'loyal', 'regular', 'new'
  
  productTargetType: 'all' | 'products' | 'category';
  productIds?: string[];
  categoryId?: string;
  
  couponId?: string;
  
  startDate: Date;
  endDate: Date;
  
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';
  
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const CAMPAIGN_TABLE = 'campaigns';
