import { Response } from 'express';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Created successfully',
) => {
  return sendSuccess(res, data, message, 201);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
    totalItems?: number;
    totalPages?: number;
    currentPage?: number;
    hasMore?: boolean;
  },
  message: string = 'Success',
) => {
  const totalItems = pagination.totalItems ?? pagination.total ?? 0;
  const currentPage = pagination.currentPage ?? pagination.page ?? 1;
  const totalPages = pagination.totalPages ?? pagination.pages ?? 1;
  const hasMore = pagination.hasMore ?? (currentPage < totalPages);
  return res.status(200).json({
    success: true,
    message,
    data: {
      totalItems,
      totalPages,
      currentPage,
      hasMore,
      items: data,
    },
  });
};

export const sendMessage = (
  res: Response,
  message: string,
  statusCode: number = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
  });
};
