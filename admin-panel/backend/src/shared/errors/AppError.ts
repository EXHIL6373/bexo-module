export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Record<string, string[]>;

  constructor(message: string, statusCode = 500, errors?: Record<string, string[]>, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Requested resource not found.') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Session expired or unauthorized. Please sign in again.') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden: You lack permission for this administrative action.') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed for request parameters.', errors?: Record<string, string[]>) {
    super(message, 400, errors);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict detected.') {
    super(message, 409);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message = 'Institutional seat quota exceeded.') {
    super(message, 422);
  }
}
