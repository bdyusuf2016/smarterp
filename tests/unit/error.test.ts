import { describe, it, expect } from 'vitest';
import { AppError, ValidationError, NotFoundError, ForbiddenError } from '../../src/shared/errors/app-error';
import { ErrorCodes } from '../../src/shared/errors/error-codes';

describe('AppError Hierarchy Unit Tests', () => {
  it('should instantiate ValidationError with status 400 and VALIDATION_ERROR code', () => {
    const error = new ValidationError('Invalid email format', [{ field: 'email', message: 'Invalid' }]);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    expect(error.message).toBe('Invalid email format');
    expect(error.details).toEqual([{ field: 'email', message: 'Invalid' }]);
  });

  it('should instantiate NotFoundError with status 404', () => {
    const error = new NotFoundError('Product not found', ErrorCodes.PRODUCT_NOT_FOUND);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ErrorCodes.PRODUCT_NOT_FOUND);
    expect(error.message).toBe('Product not found');
  });

  it('should instantiate ForbiddenError with status 403', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe(ErrorCodes.FORBIDDEN);
  });
});
