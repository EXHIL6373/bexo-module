import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../shared/errors/AppError';

export interface ValidationTargets {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(schemas: ValidationTargets) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        const parsedParams = await schemas.params.parseAsync(req.params);
        try {
          Object.defineProperty(req, 'params', {
            value: parsedParams,
            configurable: true,
            enumerable: true,
            writable: true,
          });
        } catch {
          Object.assign(req.params, parsedParams);
        }
      }
      if (schemas.query) {
        const parsedQuery = await schemas.query.parseAsync(req.query);
        try {
          Object.defineProperty(req, 'query', {
            value: parsedQuery,
            configurable: true,
            enumerable: true,
            writable: true,
          });
        } catch {
          Object.assign(req.query, parsedQuery);
        }
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const field = issue.path.join('.') || 'root';
          if (!fieldErrors[field]) {
            fieldErrors[field] = [];
          }
          fieldErrors[field].push(issue.message);
        }
        return next(new ValidationError('Request validation failed.', fieldErrors));
      }
      return next(error);
    }
  };
}
