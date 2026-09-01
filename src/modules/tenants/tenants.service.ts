import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../config/database';
import { tenants, branches, tenantSettings, numberSequences } from '../../db/schema/tenants';
import { users, userBranchAccess } from '../../db/schema/users';
import { userRoles } from '../../db/schema/rbac';
import { accounts, units } from '../../db/schema';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { PasswordService } from '../auth/password.service';
import { BusinessService } from '../business/business.service';

export interface CreateTenantInput {
  name: string;
  code: string;
  ownerName: string;
  phone: string;
  email: string;
  password?: string;
  currency?: string;
  currencySymbol?: string;
  address?: string;
  planType?: string;
  primaryCategoryId: string;
  secondaryCategoryIds?: string[];
}

export interface CreateBranchInput {
  tenantId: string;
  name: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
  isMain?: boolean;
}

export class TenantsService {
  /**
   * Complete Tenant Provisioning Workflow:
   * 1. Creates Tenant record
   * 2. Creates Main Branch
   * 3. Provisions Default Tenant Settings
   * 4. Provisions Standard BDT Chart of Accounts
   * 5. Provisions Standard Bangladeshi Units
   * 6. Provisions Initial Number Sequences (INV, PUR, REP, TRD, etc.)
   * 7. Assigns Primary & Secondary Business Categories and auto-enables modules
   * 8. Creates Shop Owner user account with hashed credentials and assigns roles
   */
  public static async createTenant(input: CreateTenantInput) {
    const tenantId = `tenant-${crypto.randomUUID().slice(0, 8)}`;
    const mainBranchId = `branch-${tenantId}-main`;
    const ownerUserId = `user-${tenantId}-owner`;

    // 1. Create Tenant
    const [tenant] = await db
      .insert(tenants)
      .values({
        id: tenantId,
        code: input.code.toUpperCase().trim(),
        name: input.name.trim(),
        ownerName: input.ownerName.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        currency: input.currency || 'BDT',
        currencySymbol: input.currencySymbol || '৳',
        address: input.address || '',
        status: 'active',
        planType: input.planType || 'pro',
      } as any)
      .returning();

    // 2. Create Main Branch
    const [mainBranch] = await db
      .insert(branches)
      .values({
        id: mainBranchId,
        tenantId,
        code: 'MAIN',
        name: `${input.name} - Main Branch`,
        phone: input.phone,
        email: input.email,
        address: input.address || '',
        isMain: true,
        isActive: true,
      } as any)
      .returning();

    // 3. Create Tenant Settings
    await db
      .insert(tenantSettings)
      .values({
        id: `settings-${tenantId}`,
        tenantId,
        receiptHeader: `${input.name}\n${input.address || ''}`,
        receiptFooter: 'Thank you for your business! Please visit again.',
        defaultTaxRate: '0.00',
        defaultWarrantyMonths: 12,
        allowNegativeInventory: false,
        autoFocusScanner: true,
        theme: 'dark',
        language: 'bn',
      } as any)
      .onConflictDoNothing();

    // 4. Seed Standard Chart of Accounts (BDT standard)
    const defaultAccounts = [
      { id: `acc-${tenantId}-1000`, code: '1000', name: 'Cash on Hand (দোকানের ক্যাশ)', type: 'ASSET', isBank: false, isMfs: false },
      { id: `acc-${tenantId}-1010`, code: '1010', name: 'bKash Merchant (বিকাশ)', type: 'ASSET', isBank: false, isMfs: true },
      { id: `acc-${tenantId}-1020`, code: '1020', name: 'Nagad Merchant (নগদ)', type: 'ASSET', isBank: false, isMfs: true },
      { id: `acc-${tenantId}-1030`, code: '1030', name: 'Bank Main Account (ব্যাংক)', type: 'ASSET', isBank: true, isMfs: false },
      { id: `acc-${tenantId}-1100`, code: '1100', name: 'Accounts Receivable (কাস্টমার বাকি)', type: 'ASSET', isBank: false, isMfs: false },
      { id: `acc-${tenantId}-1200`, code: '1200', name: 'Inventory Stock Asset (পণ্যের স্টক)', type: 'ASSET', isBank: false, isMfs: false },
      { id: `acc-${tenantId}-2000`, code: '2000', name: 'Accounts Payable (সাপ্লায়ার পাওনা)', type: 'LIABILITY', isBank: false, isMfs: false },
      { id: `acc-${tenantId}-3000`, code: '3000', name: 'Owner Equity (মালিকের মূলধন)', type: 'EQUITY', isBank: false, isMfs: false },
      { id: `acc-${tenantId}-4000`, code: '4000', name: 'Sales Revenue (বিক্রয় আয়)', type: 'REVENUE', isBank: false, isMfs: false },
      { id: `acc-${tenantId}-5000`, code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE', isBank: false, isMfs: false },
      { id: `acc-${tenantId}-6000`, code: '6000', name: 'Operating Expenses (সাধারণ খরচ)', type: 'EXPENSE', isBank: false, isMfs: false },
    ];

    for (const acc of defaultAccounts) {
      await db
        .insert(accounts)
        .values({
          ...acc,
          tenantId,
          branchId: mainBranchId,
          isSystem: true,
          currency: input.currency || 'BDT',
          currentBalance: '0.00',
          isActive: true,
        } as any)
        .onConflictDoNothing();
    }

    // 5. Seed Standard Units
    const standardUnits = [
      { id: `unit-${tenantId}-pcs`, name: 'Piece (টি)', code: 'pcs', symbol: 'টি', allowDecimal: false },
      { id: `unit-${tenantId}-kg`, name: 'Kilogram (কেজি)', code: 'kg', symbol: 'kg', allowDecimal: true },
      { id: `unit-${tenantId}-ltr`, name: 'Liter (লিটার)', code: 'ltr', symbol: 'L', allowDecimal: true },
      { id: `unit-${tenantId}-dzn`, name: 'Dozen (ডজন)', code: 'dzn', symbol: 'ডজন', allowDecimal: false },
      { id: `unit-${tenantId}-ream`, name: 'Ream (রিম)', code: 'ream', symbol: 'রিম', allowDecimal: false },
    ];

    for (const u of standardUnits) {
      await db.insert(units).values({ ...u, tenantId } as any).onConflictDoNothing();
    }

    // 6. Seed Number Sequences
    const currentYear = new Date().getFullYear();
    const seqTypes = ['SALE', 'PURCHASE', 'REPAIR', 'TRADE_IN', 'PAYMENT', 'EXPENSE', 'JOURNAL', 'BORROW'];
    for (const st of seqTypes) {
      await db
        .insert(numberSequences)
        .values({
          id: `seq-${tenantId}-${st}-${currentYear}`,
          tenantId,
          branchId: mainBranchId,
          sequenceType: st,
          prefix: st.slice(0, 3),
          year: currentYear,
          lastNumber: 1000,
        } as any)
        .onConflictDoNothing();
    }

    // 7. Attach Primary and Secondary Categories
    if (input.primaryCategoryId) {
      await BusinessService.enableTenantCategory(tenantId, input.primaryCategoryId, true);
    }
    if (input.secondaryCategoryIds) {
      for (const catId of input.secondaryCategoryIds) {
        await BusinessService.enableTenantCategory(tenantId, catId, false);
      }
    }

    // 8. Create Shop Owner User Account
    const rawPassword = input.password || 'Admin@123456';
    const passwordHash = await PasswordService.hash(rawPassword);

    const [ownerUser] = await db
      .insert(users)
      .values({
        id: ownerUserId,
        tenantId,
        name: input.ownerName,
        phone: input.phone,
        email: input.email,
        passwordHash,
        status: 'active',
      } as any)
      .returning();

    // Assign SHOP_OWNER role
    await db
      .insert(userRoles)
      .values({
        id: `ur-${ownerUserId}-owner`,
        userId: ownerUserId,
        roleId: 'role-shop-owner',
      } as any)
      .onConflictDoNothing();

    // Assign main branch access
    await db
      .insert(userBranchAccess)
      .values({
        id: `uba-${ownerUserId}-${mainBranchId}`,
        userId: ownerUserId,
        branchId: mainBranchId,
        isDefault: true,
      } as any)
      .onConflictDoNothing();

    return {
      tenant,
      mainBranch,
      ownerUser: {
        id: ownerUser.id,
        name: ownerUser.name,
        phone: ownerUser.phone,
        email: ownerUser.email,
      },
    };
  }

  /**
   * Retrieves tenant profile
   */
  public static async getTenant(tenantId: string) {
    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant) {
      throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant not found', 404);
    }
    return tenant;
  }

  /**
   * Updates tenant profile information
   */
  public static async updateTenant(tenantId: string, updates: Partial<typeof tenants.$inferInsert>) {
    const [updated] = await db
      .update(tenants)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(tenants.id, tenantId))
      .returning();

    return updated;
  }

  /**
   * Retrieves tenant settings
   */
  public static async getTenantSettings(tenantId: string) {
    const settings = await db.query.tenantSettings.findFirst({
      where: eq(tenantSettings.tenantId, tenantId),
    });
    return settings;
  }

  /**
   * Updates tenant settings
   */
  public static async updateTenantSettings(tenantId: string, updates: Partial<typeof tenantSettings.$inferInsert>) {
    const [updated] = await db
      .update(tenantSettings)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(tenantSettings.tenantId, tenantId))
      .returning();

    return updated;
  }

  /**
   * BRANCHES: List all branches for tenant
   */
  public static async getBranches(tenantId: string) {
    return db.query.branches.findMany({
      where: and(eq(branches.tenantId, tenantId), eq(branches.isActive, true)),
    });
  }

  /**
   * BRANCHES: Create new branch
   */
  public static async createBranch(input: CreateBranchInput) {
    const branchId = `branch-${crypto.randomUUID().slice(0, 8)}`;

    const [newBranch] = await db
      .insert(branches)
      .values({
        id: branchId,
        tenantId: input.tenantId,
        code: input.code.toUpperCase().trim(),
        name: input.name.trim(),
        phone: input.phone || '',
        email: input.email || '',
        address: input.address || '',
        isMain: input.isMain || false,
        isActive: true,
      } as any)
      .returning();

    return newBranch;
  }

  /**
   * BRANCHES: Update branch
   */
  public static async updateBranch(branchId: string, tenantId: string, updates: Partial<typeof branches.$inferInsert>) {
    const [updated] = await db
      .update(branches)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(and(eq(branches.id, branchId), eq(branches.tenantId, tenantId)))
      .returning();

    return updated;
  }
}
