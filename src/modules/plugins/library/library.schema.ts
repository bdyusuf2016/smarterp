import { z } from 'zod';

export const createBookTitleSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  title: z.string().min(2, 'Book title is required'),
  author: z.string().min(2, 'Author name is required'),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  edition: z.string().optional(),
  publicationYear: z.number().int().optional(),
  genre: z.string().optional(),
  language: z.string().optional(),
  pageCount: z.number().int().optional(),
});

export const registerBookCopySchema = z.object({
  branchId: z.string().optional(),
  bookTitleId: z.string().min(1, 'Book Title ID is required'),
  barcode: z.string().min(2, 'Barcode / Accession number is required'),
  copyNumber: z.string().min(1, 'Copy number is required'),
  shelfLocation: z.string().optional(),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'DAMAGED']).default('GOOD'),
  costPrice: z.string().optional(),
});

export const createMemberSchema = z.object({
  name: z.string().min(2, 'Member name is required'),
  phone: z.string().min(6, 'Member phone is required'),
  email: z.string().email().optional(),
  address: z.string().optional(),
  memberType: z.enum(['STUDENT', 'FACULTY', 'GENERAL', 'VIP']).default('GENERAL'),
  maxAllowedBooks: z.number().int().min(1).default(3),
});

export const issueBookSchema = z.object({
  branchId: z.string().optional(),
  memberId: z.string().min(1, 'Member ID is required'),
  bookCopyId: z.string().min(1, 'Book Copy ID is required'),
  durationDays: z.number().int().positive().default(14),
});

export const returnBookSchema = z.object({
  borrowTransactionId: z.string().min(1, 'Borrow Transaction ID is required'),
  lateFeePerDay: z.number().min(0).default(5),
});
