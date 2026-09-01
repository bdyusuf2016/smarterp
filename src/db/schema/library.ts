import { pgTable, varchar, timestamp, numeric, integer, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tenants, branches } from './tenants';
import { products } from './products';

export const bookTitles = pgTable('book_titles', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 64 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  isbn: varchar('isbn', { length: 32 }),
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  publisher: varchar('publisher', { length: 255 }).default(''),
  edition: varchar('edition', { length: 64 }).default(''),
  publicationYear: integer('publication_year'),
  genre: varchar('genre', { length: 64 }).default(''),
  language: varchar('language', { length: 32 }).default('Bengali'),
  pageCount: integer('page_count'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIsbnIdx: index('book_titles_tenant_isbn_idx').on(table.tenantId, table.isbn),
  tenantAuthorIdx: index('book_titles_tenant_author_idx').on(table.tenantId, table.author),
  productBookIdx: index('book_titles_product_idx').on(table.productId),
}));

export const bookCopies = pgTable('book_copies', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  bookTitleId: varchar('book_title_id', { length: 64 }).notNull().references(() => bookTitles.id, { onDelete: 'cascade' }),
  barcode: varchar('barcode', { length: 128 }).notNull(),
  copyNumber: varchar('copy_number', { length: 32 }).notNull(),
  shelfLocation: varchar('shelf_location', { length: 64 }).default(''),
  condition: varchar('condition', { length: 32 }).notNull().default('GOOD'), // NEW, GOOD, FAIR, DAMAGED
  costPrice: numeric('cost_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 32 }).notNull().default('AVAILABLE'), // AVAILABLE, BORROWED, LOST, DAMAGED, RESERVED
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantCopyBarcodeUnique: uniqueIndex('book_copies_tenant_barcode_unique').on(table.tenantId, table.barcode),
  tenantBookStatusIdx: index('book_copies_tenant_status_idx').on(table.tenantId, table.status),
  bookTitleIdx: index('book_copies_title_idx').on(table.bookTitleId),
}));

export const libraryMembers = pgTable('library_members', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  memberNo: varchar('member_no', { length: 64 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 32 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address').default(''),
  memberType: varchar('member_type', { length: 32 }).notNull().default('GENERAL'), // STUDENT, FACULTY, GENERAL, VIP
  maxAllowedBooks: integer('max_allowed_books').notNull().default(3),
  status: varchar('status', { length: 32 }).notNull().default('ACTIVE'), // ACTIVE, SUSPENDED, EXPIRED
  joinedDate: timestamp('joined_date', { withTimezone: true }).notNull().defaultNow(),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantMemberNoUnique: uniqueIndex('library_members_tenant_no_unique').on(table.tenantId, table.memberNo),
  tenantMemberPhoneIdx: index('library_members_tenant_phone_idx').on(table.tenantId, table.phone),
}));

export const borrowTransactions = pgTable('borrow_transactions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  memberId: varchar('member_id', { length: 64 }).notNull().references(() => libraryMembers.id, { onDelete: 'cascade' }),
  bookCopyId: varchar('book_copy_id', { length: 64 }).notNull().references(() => bookCopies.id, { onDelete: 'cascade' }),
  issueDate: timestamp('issue_date', { withTimezone: true }).notNull().defaultNow(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  returnDate: timestamp('return_date', { withTimezone: true }),
  returnedToBranchId: varchar('returned_to_branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 32 }).notNull().default('ISSUED'), // ISSUED, RETURNED, OVERDUE, LOST
  lateFeeCharged: numeric('late_fee_charged', { precision: 14, scale: 2 }).notNull().default('0.00'),
  lateFeePaid: numeric('late_fee_paid', { precision: 14, scale: 2 }).notNull().default('0.00'),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantBorrowStatusIdx: index('borrow_transactions_tenant_status_idx').on(table.tenantId, table.status),
  borrowMemberIdx: index('borrow_transactions_member_idx').on(table.memberId),
  borrowCopyIdx: index('borrow_transactions_copy_idx').on(table.bookCopyId),
}));
