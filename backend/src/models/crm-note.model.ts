export interface ICrmNote {
  _id?: string;
  id?: string;
  customerId: string;
  customer?: any;
  authorId: string;
  author?: any;
  type: 'note' | 'call' | 'email' | 'meeting' | 'follow_up';
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const CRM_NOTE_TABLE = 'crm_notes';
