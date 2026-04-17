export interface IAnswer {
  _id?: string;
  id?: string;
  questionId?: string;
  userId?: string;
  user?: any;
  answer: string;
  isSellerAnswer: boolean;
  upvotes: number;
  upvotedBy: string[];
  createdAt?: Date;
}

export interface IProductQA {
  _id?: string;
  id?: string;
  productId: string;
  product?: any;
  userId: string;
  user?: any;
  question: string;
  answers?: IAnswer[];
  upvotes: number;
  upvotedBy: string[];
  isAnswered: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const PRODUCT_QA_TABLE = 'product_qa';
export const QA_ANSWER_TABLE = 'qa_answers';
