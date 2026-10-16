import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/AppError';

export interface RequestValidators {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(validators: RequestValidators) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (validators.body && req.body) {
        req.body = await validators.body.parseAsync(req.body);
      }
      if (validators.query) {
        const parsed = (await validators.query.parseAsync(req.query)) as any;
        for (const key of Object.keys(parsed)) {
          (req.query as any)[key] = parsed[key];
        }
      }
      if (validators.params) {
        const parsed = (await validators.params.parseAsync(req.params)) as any;
        for (const key of Object.keys(parsed)) {
          (req.params as any)[key] = parsed[key];
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.') || 'root';
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(issue.message);
        }
        next(new ValidationError('Request validation failed.', formattedErrors));
      } else {
        next(error);
      }
    }
  };
}
