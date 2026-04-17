export interface IImage {
  _id?: string;
  id?: string;
  data: Buffer;
  contentType: string;
  folder: string;
  createdAt?: Date;
}

export const IMAGE_TABLE = 'images';
