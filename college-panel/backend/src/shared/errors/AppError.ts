export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: any;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, errors?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required. Please sign in.') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '403 Forbidden: Institutional Access Denied or Cross-Tenant Boundary Violation.') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed.', errors?: any) {
    super(message, 400, errors);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict with existing institutional record.', errors?: any) {
    super(message, 409, errors);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message = 'Institutional seat quota exceeded.') {
    super(message, 422);
  }
}

