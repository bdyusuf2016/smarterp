export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message: string | null;
  meta?: ApiMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Result Type Pattern for Service Layers
export type Result<T, E = Error> =
  | { success: true; value: T; error?: never }
  | { success: false; error: E; value?: never };

export const Result = {
  ok: <T>(value: T): Result<T, never> => ({ success: true, value }),
  err: <E>(error: E): Result<never, E> => ({ success: false, error }),
};
