import { z } from 'zod';

export const askQuestionSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    question: z.string().min(1, 'Question is required').max(1000),
  }),
});

export const addAnswerSchema = z.object({
  params: z.object({
    questionId: z.string().uuid('Invalid question ID'),
  }),
  body: z.object({
    answer: z.string().min(1, 'Answer is required').max(2000),
  }),
});
