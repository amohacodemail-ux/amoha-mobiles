export interface IContactMessage {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const CONTACT_MESSAGE_TABLE = 'contact_messages';
