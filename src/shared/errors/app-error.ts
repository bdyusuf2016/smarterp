import { ErrorCode, ErrorCodes } from './error-codes';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: unknown;
  public readonly isOperational: boolean;

  constructor(
    codeOrParams:
      | ErrorCode
      | {
          code: ErrorCode;
          message: string;
          statusCode?: number;
          details?: unknown;
          isOperational?: boolean;
        },
    message?: string,
    statusCode?: number,
    details?: unknown
  ) {
    if (typeof codeOrParams === 'object') {
      super(codeOrParams.message);
      this.name = this.constructor.name;
      this.code = codeOrParams.code;
      this.statusCode = codeOrParams.statusCode ?? 500;
      this.details = codeOrParams.details ?? null;
      this.isOperational = codeOrParams.isOperational ?? true;
    } else {
      super(message || 'An error occurred');
      this.name = this.constructor.name;
      this.code = codeOrParams;
      this.statusCode = statusCode ?? 500;
      this.details = details ?? null;
      this.isOperational = true;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super({
      code: ErrorCodes.VALIDATION_ERROR,
      message,
      statusCode: 400,
      details,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCodes.NOT_FOUND) {
    super({
      code,
      message,
      statusCode: 404,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', code: ErrorCode = ErrorCodes.UNAUTHORIZED) {
    super({
      code,
      message,
      statusCode: 401,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden: Insufficient permissions', code: ErrorCode = ErrorCodes.FORBIDDEN) {
    super({
      code,
      message,
      statusCode: 403,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCodes.CONFLICT) {
    super({
      code,
      message,
      statusCode: 409,
    });
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCodes.BAD_REQUEST, details?: unknown) {
    super({
      code,
      message,
      statusCode: 422,
      details,
    });
  }
}
