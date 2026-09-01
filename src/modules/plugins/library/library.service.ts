import { eq, and, desc, count, sql, isNull } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../../config/database';
import {
  bookTitles,
  bookCopies,
  libraryMembers,
  borrowTransactions,
} from '../../../db/schema/library';
import { AppError } from '../../../shared/errors/app-error';
import { ErrorCodes } from '../../../shared/errors/error-codes';
import { SequenceService } from '../../business/sequence.service';

export interface CreateBookTitleInput {
  tenantId: string;
  productId: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  edition?: string;
  publicationYear?: number;
  genre?: string;
  language?: string;
  pageCount?: number;
}

export interface RegisterBookCopyInput {
  tenantId: string;
  branchId?: string;
  bookTitleId: string;
  barcode: string;
  copyNumber: string;
  shelfLocation?: string;
  condition?: 'NEW' | 'GOOD' | 'FAIR' | 'DAMAGED';
  costPrice?: string;
}

export interface CreateMemberInput {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  memberType?: 'STUDENT' | 'FACULTY' | 'GENERAL' | 'VIP';
  maxAllowedBooks?: number;
}

export interface IssueBookInput {
  tenantId: string;
  branchId?: string;
  memberId: string;
  bookCopyId: string;
  durationDays?: number; // default 14 days
}

export class LibraryService {
  /**
   * Creates a book title bibliographic record
   */
  public static async createBookTitle(input: CreateBookTitleInput) {
    const titleId = `bt-${crypto.randomUUID().slice(0, 10)}`;

    const [newTitle] = await db
      .insert(bookTitles)
      .values({
        id: titleId,
        tenantId: input.tenantId,
        productId: input.productId,
        title: input.title.trim(),
        author: input.author.trim(),
        isbn: input.isbn || null,
        publisher: input.publisher || '',
        edition: input.edition || '',
        publicationYear: input.publicationYear || null,
        genre: input.genre || '',
        language: input.language || 'Bengali',
        pageCount: input.pageCount || null,
      } as any)
      .returning();

    return newTitle;
  }

  /**
   * Registers a physical book copy with unique barcode
   */
  public static async registerBookCopy(input: RegisterBookCopyInput) {
    const cleanBarcode = input.barcode.trim();

    const existing = await db.query.bookCopies.findFirst({
      where: and(eq(bookCopies.tenantId, input.tenantId), eq(bookCopies.barcode, cleanBarcode)),
    });

    if (existing) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, `Book copy barcode '${cleanBarcode}' already exists`, 400);
    }

    const copyId = `bc-${crypto.randomUUID().slice(0, 10)}`;

    const [newCopy] = await db
      .insert(bookCopies)
      .values({
        id: copyId,
        tenantId: input.tenantId,
        branchId: input.branchId || null,
        bookTitleId: input.bookTitleId,
        barcode: cleanBarcode,
        copyNumber: input.copyNumber.trim(),
        shelfLocation: input.shelfLocation || '',
        condition: input.condition || 'GOOD',
        costPrice: input.costPrice || '0.00',
        status: 'AVAILABLE',
      } as any)
      .returning();

    return newCopy;
  }

  /**
   * Registers a library member with phone uniqueness check
   */
  public static async createMember(input: CreateMemberInput) {
    const cleanPhone = input.phone.trim();

    const existing = await db.query.libraryMembers.findFirst({
      where: and(eq(libraryMembers.tenantId, input.tenantId), eq(libraryMembers.phone, cleanPhone)),
    });

    if (existing) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, `Library member with phone '${cleanPhone}' already registered`, 400);
    }

    const memberId = `mem-${crypto.randomUUID().slice(0, 10)}`;
    const memberNo = `M-${Math.floor(1000 + Math.random() * 9000)}`;

    const [newMember] = await db
      .insert(libraryMembers)
      .values({
        id: memberId,
        tenantId: input.tenantId,
        memberNo,
        name: input.name.trim(),
        phone: cleanPhone,
        email: input.email?.trim() || null,
        address: input.address || '',
        memberType: input.memberType || 'GENERAL',
        maxAllowedBooks: input.maxAllowedBooks || 3,
        status: 'ACTIVE',
      } as any)
      .returning();

    return newMember;
  }

  /**
   * Book Issue Workflow:
   * 1. Checks member active status & current borrowed count against maxAllowedBooks
   * 2. Checks book copy availability
   * 3. Sets copy status to BORROWED
   * 4. Creates borrow transaction record
   */
  public static async issueBook(input: IssueBookInput) {
    const { tenantId, branchId, memberId, bookCopyId, durationDays = 14 } = input;

    const member = await db.query.libraryMembers.findFirst({
      where: and(eq(libraryMembers.id, memberId), eq(libraryMembers.tenantId, tenantId)),
    });
    if (!member || member.status !== 'ACTIVE') {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Active library member not found', 404);
    }

    // Check active borrows count
    const activeBorrows = await db.select({ count: count() }).from(borrowTransactions).where(
      and(
        eq(borrowTransactions.tenantId, tenantId),
        eq(borrowTransactions.memberId, memberId),
        eq(borrowTransactions.status, 'ISSUED')
      )
    );
    const borrowedCount = Number(activeBorrows[0]?.count || 0);

    if (borrowedCount >= member.maxAllowedBooks) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        `Member has reached borrow limit of ${member.maxAllowedBooks} books`,
        400
      );
    }

    const copy = await db.query.bookCopies.findFirst({
      where: and(eq(bookCopies.id, bookCopyId), eq(bookCopies.tenantId, tenantId)),
    });
    if (!copy || copy.status !== 'AVAILABLE') {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, `Book copy is currently ${copy?.status || 'unavailable'}`, 400);
    }

    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + durationDays);

    const borrowId = `bw-${crypto.randomUUID().slice(0, 10)}`;

    return await db.transaction(async (tx) => {
      // Set copy to BORROWED
      await tx
        .update(bookCopies)
        .set({ status: 'BORROWED', updatedAt: new Date() } as any)
        .where(eq(bookCopies.id, bookCopyId));

      const [trans] = await tx
        .insert(borrowTransactions)
        .values({
          id: borrowId,
          tenantId,
          branchId: branchId || null,
          memberId,
          bookCopyId,
          issueDate,
          dueDate,
          status: 'ISSUED',
          lateFeeCharged: '0.00',
          lateFeePaid: '0.00',
        } as any)
        .returning();

      return trans;
    });
  }

  /**
   * Book Return Workflow:
   * 1. Calculates overdue days & late fee (e.g. 5 BDT per day overdue)
   * 2. Sets copy status to AVAILABLE
   * 3. Updates borrow transaction to RETURNED
   */
  public static async returnBook(borrowTransactionId: string, tenantId: string, lateFeePerDay = 5) {
    const trans = await db.query.borrowTransactions.findFirst({
      where: and(
        eq(borrowTransactions.id, borrowTransactionId),
        eq(borrowTransactions.tenantId, tenantId)
      ),
    });

    if (!trans) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Borrow transaction not found', 404);
    }
    if (trans.status !== 'ISSUED') {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, `Book is already ${trans.status}`, 400);
    }

    const returnDate = new Date();
    const dueTime = new Date(trans.dueDate).getTime();
    const returnTime = returnDate.getTime();

    let lateFee = 0;
    if (returnTime > dueTime) {
      const overdueDays = Math.ceil((returnTime - dueTime) / (1000 * 60 * 60 * 24));
      lateFee = overdueDays * lateFeePerDay;
    }

    return await db.transaction(async (tx) => {
      // Set copy back to AVAILABLE
      await tx
        .update(bookCopies)
        .set({ status: 'AVAILABLE', updatedAt: new Date() } as any)
        .where(eq(bookCopies.id, trans.bookCopyId));

      const [updated] = await tx
        .update(borrowTransactions)
        .set({
          status: 'RETURNED',
          returnDate,
          lateFeeCharged: lateFee.toFixed(2),
          updatedAt: new Date(),
        } as any)
        .where(eq(borrowTransactions.id, borrowTransactionId))
        .returning();

      return {
        ...updated,
        overdueFineAmount: lateFee,
      };
    });
  }
}
