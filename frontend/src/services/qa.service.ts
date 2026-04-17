import apiClient from '@/lib/api-client';
import { ApiResponse, ProductQuestion } from '@/types';

const qaService = {
  getByProduct: async (productId: string, page = 1, limit = 10) => {
    const res = await apiClient.get<ApiResponse<{ items: ProductQuestion[]; totalItems: number; totalPages: number; currentPage: number }>>(`/qa/product/${productId}?page=${page}&limit=${limit}`);
    return res.data.data;
  },

  askQuestion: async (productId: string, question: string) => {
    const res = await apiClient.post<ApiResponse<ProductQuestion>>(`/qa/product/${productId}`, { question });
    return res.data.data;
  },

  addAnswer: async (questionId: string, answer: string) => {
    const res = await apiClient.post<ApiResponse<ProductQuestion>>(`/qa/${questionId}/answer`, { answer });
    return res.data.data;
  },

  upvoteQuestion: async (questionId: string) => {
    const res = await apiClient.post<ApiResponse<ProductQuestion>>(`/qa/${questionId}/upvote`);
    return res.data.data;
  },

  upvoteAnswer: async (questionId: string, answerId: string) => {
    const res = await apiClient.post<ApiResponse<ProductQuestion>>(`/qa/${questionId}/answer/${answerId}/upvote`);
    return res.data.data;
  },

  deleteQuestion: async (questionId: string) => {
    await apiClient.delete(`/qa/${questionId}`);
  },

  deleteAnswer: async (questionId: string, answerId: string) => {
    await apiClient.delete(`/qa/${questionId}/answer/${answerId}`);
  },
};

export default qaService;
