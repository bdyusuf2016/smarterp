import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../src/middleware/validation.middleware';
import { errorHandler } from '../../src/middleware/error.middleware';
import { ResponseUtil } from '../../src/shared/utils/response';

describe('Validation Middleware Integration Tests', () => {
  const app = express();
  app.use(express.json());

  const testSchema = {
    body: z.object({
      name: z.string().min(3, 'Name must be at least 3 characters'),
      price: z.number().positive('Price must be positive'),
    }),
  };

  app.post('/test-validate', validateRequest(testSchema), (_req: Request, res: Response) => {
    ResponseUtil.success(res, { valid: true }, 'Validated successfully');
  });

  app.use(errorHandler);

  it('should return 400 with VALIDATION_ERROR on invalid payload', async () => {
    const res = await request(app)
      .post('/test-validate')
      .send({ name: 'ab', price: -5 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveLength(2);
  });

  it('should pass and return 200 on valid payload', async () => {
    const res = await request(app)
      .post('/test-validate')
      .send({ name: 'Samsung Galaxy', price: 15000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
  });
});
