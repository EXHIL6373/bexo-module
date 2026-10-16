import { Response } from 'express';

export interface ResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: ResponseMeta;
}

export interface ApiErrorEnvelope {
  success: false;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  meta?: ResponseMeta,
  statusCode = 200
): Response {
  const envelope: ApiResponseEnvelope<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(envelope);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: Record<string, string[]>
): Response {
  const envelope: ApiErrorEnvelope = {
    success: false,
    statusCode,
    message,
    ...(errors && Object.keys(errors).length > 0 ? { errors } : {}),
  };
  return res.status(statusCode).json(envelope);
}
