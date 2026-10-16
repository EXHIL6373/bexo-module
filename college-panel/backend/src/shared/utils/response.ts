import { Response } from 'express';

export interface StandardSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
}

export interface StandardErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: Record<string, string[] | string> | unknown;
  requestId?: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  meta?: StandardSuccessResponse<T>['meta'],
  statusCode = 200
): Response {
  const payload: StandardSuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) payload.message = message;
  if (meta) payload.meta = meta;

  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown,
  requestId?: string
): Response {
  const payload: StandardErrorResponse = {
    success: false,
    statusCode,
    message,
    ...(errors !== undefined ? { errors } : {}),
    ...(requestId ? { requestId } : {}),
  };

  return res.status(statusCode).json(payload);
}
