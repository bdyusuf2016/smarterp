import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ResponseUtil } from '../shared/utils/response';
import { ErrorCodes } from '../shared/errors/error-codes';

interface RequestValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validateRequest(schema: RequestValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as Record<string, string>;
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as Record<string, string>;
      }
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        ResponseUtil.error(
          res,
          ErrorCodes.VALIDATION_ERROR,
          'Request validation failed',
          400,
          details
        );
        return;
      }
      next(error);
    }
  };
}

export function validateBody(bodySchema: AnyZodObject) {
  return validateRequest({ body: bodySchema });
}

export function validateQuery(querySchema: AnyZodObject) {
  return validateRequest({ query: querySchema });
}

export function validateParams(paramsSchema: AnyZodObject) {
  return validateRequest({ params: paramsSchema });
}
