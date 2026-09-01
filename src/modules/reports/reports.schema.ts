import { z } from 'zod';

export const queryExecutiveSummarySchema = z.object({
  branchId: z.string().optional(),
});

export const querySalesAnalyticsSchema = z.object({
  branchId: z.string().optional(),
  fromDate: z.string().datetime().optional().transform((d) => (d ? new Date(d) : undefined)),
  toDate: z.string().datetime().optional().transform((d) => (d ? new Date(d) : undefined)),
});

export const queryInventoryValuationSchema = z.object({
  branchId: z.string().optional(),
});

export const queryAuditLogsSchema = z.object({
  module: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});
