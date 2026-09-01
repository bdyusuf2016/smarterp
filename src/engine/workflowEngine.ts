import {
  Tenant,
  CartItem,
  SaleTransaction,
  AccountingEntry,
  CustomerMember,
  BookItem,
  BorrowRecord,
  RepairTicket,
  TradeInRecord,
  RechargeRecord,
  ProductBatch
} from '../types';
import { storageService } from '../services/storageService';
import { RuleEngine } from './ruleEngine';

export interface WorkflowResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  auditTrail: string[];
}

export class WorkflowEngine {
  /**
   * Universal Modular Sale Pipeline:
   * Generic Sale -> Industry Validation (IMEI / Batch / Weight) -> Calculation -> Payment -> Inventory & Extension update -> Accounting -> Audit
   */
  static processSale(params: {
    tenant: Tenant;
    customer?: CustomerMember;
    cartItems: CartItem[];
    paymentMethod: 'CASH' | 'CARD' | 'MOBILE_BANKING' | 'CREDIT_DUE' | 'SPLIT';
    paidAmount: number;
    discountAmount: number;
    tradeInCredit: number;
    notes?: string;
  }): WorkflowResult<SaleTransaction> {
    const { tenant, customer, cartItems, paymentMethod, paidAmount, discountAmount, tradeInCredit, notes } = params;
    const auditTrail: string[] = [];

    if (!cartItems || cartItems.length === 0) {
      return { success: false, error: 'Cart is empty. Please add items to proceed.', auditTrail };
    }

    auditTrail.push('1. [Validate Items]: Cart items received, verifying product status & pricing.');

    // Step 1: Item & Tracking Mode Validation
    for (const item of cartItems) {
      const validation = RuleEngine.validateCartItemRequirements(item.product, {
        quantity: item.quantity,
        selected_imei: item.selected_imei,
        selected_serial: item.selected_serial,
        selected_batch: item.selected_batch,
        weight_kg: item.weight_kg
      });

      if (!validation.valid) {
        return { success: false, error: validation.errorMessage, auditTrail };
      }
    }
    auditTrail.push('2. [Industry Validation Passed]: Specialized tracking modes (IMEI, Batch, Weight, Serials) verified.');

    // Step 2: Calculations
    const config = RuleEngine.getEffectiveConfig(tenant);
    const taxRate = config.defaultTaxRate ?? 0;

    let subtotal = 0;
    cartItems.forEach(item => {
      subtotal += item.total;
    });

    const taxAmount = (subtotal * taxRate) / 100;
    const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount - tradeInCredit);
    const dueAmount = Math.max(0, grandTotal - paidAmount);

    let paymentStatus: 'PAID' | 'PARTIAL' | 'DUE' = 'PAID';
    if (dueAmount > 0) {
      paymentStatus = paidAmount > 0 ? 'PARTIAL' : 'DUE';
    }

    auditTrail.push(`3. [Calculate Total]: Subtotal: ৳${subtotal.toFixed(2)}, Tax (${taxRate}%): ৳${taxAmount.toFixed(2)}, Trade-in Credit: ৳${tradeInCredit.toFixed(2)}, Grand Total: ৳${grandTotal.toFixed(2)}.`);

    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const saleId = `sale_${Date.now()}`;

    // Step 3: Inventory Updates by Tracking Mode
    const assignedImeis: string[] = [];
    const assignedSerials: string[] = [];
    const batchDeductions: { batch_id: string; qty: number }[] = [];

    const products = storageService.getProducts();
    const devices = storageService.getDevices();
    const batches = storageService.getBatches();

    for (const item of cartItems) {
      // 1. Generic product stock deduction
      const prod = products.find(p => p.id === item.product.id);
      if (prod) {
        prod.stock_quantity = Math.max(0, prod.stock_quantity - item.quantity);
        storageService.saveProduct(prod);
      }

      // 2. Specialized IMEI status transition
      if (item.selected_imei) {
        assignedImeis.push(item.selected_imei);
        const dev = devices.find(d => d.imei === item.selected_imei);
        if (dev) {
          dev.status = 'sold';
          dev.sold_invoice_no = invoiceNo;
          storageService.saveDevice(dev);
          auditTrail.push(`4a. [IMEI Registered]: Device ${dev.model} (IMEI: ${dev.imei}) registered to invoice ${invoiceNo}.`);
        }
      }

      // 3. Specialized Batch deduction
      if (item.selected_batch) {
        batchDeductions.push({ batch_id: item.selected_batch, qty: item.quantity });
        const batch = batches.find(b => b.id === item.selected_batch);
        if (batch) {
          batch.quantity = Math.max(0, batch.quantity - item.quantity);
          if (batch.quantity === 0) batch.status = 'depleted';
          storageService.saveBatch(batch);
          auditTrail.push(`4b. [Batch Deducted]: Lot ${batch.batch_number} decremented by ${item.quantity} ${item.product.unit}.`);
        }
      }

      // 4. Specialized Serial
      if (item.selected_serial) {
        assignedSerials.push(item.selected_serial);
      }
    }

    // Step 4: Customer Dues / Loyalty points
    if (customer) {
      const customers = storageService.getCustomers();
      const cust = customers.find(c => c.id === customer.id);
      if (cust) {
        cust.total_spent += paidAmount;
        if (dueAmount > 0) {
          cust.current_due += dueAmount;
        }
        cust.loyalty_points += Math.floor(grandTotal / 10);
        storageService.saveCustomer(cust);
      }
    }

    // Step 5: Create Sale Transaction
    const saleTransaction: SaleTransaction = {
      id: saleId,
      invoice_no: invoiceNo,
      tenant_id: tenant.id,
      business_category_id: tenant.active_categories.find(c => c.is_primary)?.business_category_id || 'cat_general',
      customer_id: customer?.id,
      customer_name: customer?.name || 'Walk-in Customer',
      customer_phone: customer?.phone,
      items: cartItems,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      trade_in_credit: tradeInCredit,
      grand_total: grandTotal,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      notes,
      specialized_data: {
        assigned_imeis: assignedImeis.length > 0 ? assignedImeis : undefined,
        assigned_serials: assignedSerials.length > 0 ? assignedSerials : undefined,
        batch_deductions: batchDeductions.length > 0 ? batchDeductions : undefined
      },
      created_at: new Date().toISOString()
    };

    storageService.saveSale(saleTransaction);
    auditTrail.push('5. [Sale Recorded]: Transaction committed to persistent storage.');

    // Step 6: Double-Entry Accounting Ledger Entry
    const debitAccount = paymentMethod === 'CASH' 
      ? 'ক্যাশ ড্রয়ার / কাউন্টার ক্যাশ (Cash in Hand)' 
      : paymentMethod === 'CARD' 
        ? 'বাণিজ্যিক ব্যাংক হিসাব (Bank Account)' 
        : paymentMethod === 'CREDIT_DUE' 
          ? 'গ্রাহক দেনাদার / বাকি পাওনা (Accounts Receivable)' 
          : 'বিকাশ ও MFS ওয়ালেট (Mobile Financial Services)';

    const accountingEntry: AccountingEntry = {
      id: `acc_${Date.now()}`,
      tenant_id: tenant.id,
      reference_type: 'SALE',
      reference_id: saleTransaction.id,
      title: `বিক্রয় মেমো #${invoiceNo} (${cartItems.length} টি আইটেম)`,
      debit_account: debitAccount,
      credit_account: 'পণ্য বিক্রয় রাজস্ব (Sales Revenue)',
      amount: paidAmount > 0 ? paidAmount : grandTotal,
      created_at: new Date().toISOString()
    };

    storageService.saveAccountingEntry(accountingEntry);
    auditTrail.push(`6. [Accounting Posted]: Double-entry journal voucher recorded (৳${accountingEntry.amount.toFixed(2)} to ${debitAccount}).`);

    // Step 7: Audit log
    storageService.addAuditLog(
      'SALE_COMPLETED',
      'SALES',
      `ইনভয়েস #${invoiceNo} সফলভাবে সম্পন্ন। মোট: ৳${grandTotal.toFixed(2)}, জমা: ৳${paidAmount.toFixed(2)}, বাকি: ৳${dueAmount.toFixed(2)}`
    );
    auditTrail.push('7. [Audit Trail Created]: System audit log created.');

    return {
      success: true,
      data: saleTransaction,
      auditTrail
    };
  }

  /**
   * Library Workflow: Book Issue Pipeline
   */
  static processBookIssue(params: {
    tenant: Tenant;
    member: CustomerMember;
    book: BookItem;
    durationDays?: number;
  }): WorkflowResult<BorrowRecord> {
    const { tenant, member, book, durationDays = 14 } = params;
    const auditTrail: string[] = [];

    // Step 1: Member eligibility
    const eligibility = RuleEngine.checkMemberBorrowEligibility(member, tenant);
    if (!eligibility.allowed) {
      return { success: false, error: eligibility.reason, auditTrail };
    }
    auditTrail.push(`1. [Member Verified]: ${member.name} (Card: ${member.membership_card_no || 'N/A'}) eligible.`);

    // Step 2: Book availability
    if (book.available_copies <= 0) {
      return { success: false, error: `No available copies of "${book.title}". All copies currently in circulation.`, auditTrail };
    }
    auditTrail.push(`2. [Book Availability]: Copy allocated from ${book.shelf_location}.`);

    // Step 3: Issue Record
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + durationDays);

    const record: BorrowRecord = {
      id: `bor_${Date.now()}`,
      tenant_id: tenant.id,
      member_id: member.id,
      member_name: member.name,
      member_card_no: member.membership_card_no || 'N/A',
      book_id: book.id,
      book_title: book.title,
      isbn: book.isbn,
      issue_date: issueDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      late_fee_per_day: 1.0,
      calculated_late_fee: 0,
      late_fee_paid: false,
      status: 'borrowed'
    };

    // Step 4: Decrement available book copy & increment member count
    const books = storageService.getBooks();
    const targetBook = books.find(b => b.id === book.id);
    if (targetBook) {
      targetBook.available_copies = Math.max(0, targetBook.available_copies - 1);
      storageService.saveBook(targetBook);
    }

    const customers = storageService.getCustomers();
    const targetMember = customers.find(c => c.id === member.id);
    if (targetMember) {
      targetMember.active_borrow_count = (targetMember.active_borrow_count || 0) + 1;
      storageService.saveCustomer(targetMember);
    }

    storageService.saveBorrowRecord(record);
    auditTrail.push(`3. [Circulation Updated]: Due on ${record.due_date}. Book copy reserved.`);

    storageService.addAuditLog('BOOK_ISSUED', 'BORROWING', `Book "${book.title}" issued to ${member.name}. Due on ${record.due_date}.`);

    return { success: true, data: record, auditTrail };
  }

  /**
   * Library Workflow: Book Return & Late Fee Pipeline
   */
  static processBookReturn(params: {
    borrowRecord: BorrowRecord;
    collectLateFee: boolean;
  }): WorkflowResult<BorrowRecord> {
    const { borrowRecord, collectLateFee } = params;
    const auditTrail: string[] = [];

    const { daysOverdue, lateFee } = RuleEngine.calculateBorrowLateFee(borrowRecord, borrowRecord.late_fee_per_day);

    borrowRecord.status = 'returned';
    borrowRecord.return_date = new Date().toISOString().split('T')[0];
    borrowRecord.calculated_late_fee = lateFee;
    borrowRecord.late_fee_paid = collectLateFee;

    // Restore book copy
    const books = storageService.getBooks();
    const targetBook = books.find(b => b.id === borrowRecord.book_id);
    if (targetBook) {
      targetBook.available_copies = Math.min(targetBook.total_copies, targetBook.available_copies + 1);
      storageService.saveBook(targetBook);
    }

    // Decrement member count
    const customers = storageService.getCustomers();
    const targetMember = customers.find(c => c.id === borrowRecord.member_id);
    if (targetMember) {
      targetMember.active_borrow_count = Math.max(0, (targetMember.active_borrow_count || 1) - 1);
      if (lateFee > 0 && !collectLateFee) {
        targetMember.current_due += lateFee;
      }
      storageService.saveCustomer(targetMember);
    }

    storageService.saveBorrowRecord(borrowRecord);
    auditTrail.push(`1. [Book Returned]: "${borrowRecord.book_title}" returned. Overdue: ${daysOverdue} days.`);

    // If late fee collected, post accounting entry
    if (lateFee > 0 && collectLateFee) {
      storageService.saveAccountingEntry({
        id: `acc_${Date.now()}`,
        tenant_id: borrowRecord.tenant_id,
        reference_type: 'LATE_FEE',
        reference_id: borrowRecord.id,
        title: `Library Overdue Late Fee Collection (${borrowRecord.member_name})`,
        debit_account: 'Cash in Register',
        credit_account: 'Late Fee Penalties Income',
        amount: lateFee,
        created_at: new Date().toISOString()
      });
      auditTrail.push(`2. [Late Fee Settled]: $${lateFee.toFixed(2)} posted to accounting.`);
    }

    storageService.addAuditLog('BOOK_RETURNED', 'BORROWING', `Book "${borrowRecord.book_title}" returned by ${borrowRecord.member_name}. Late fee: $${lateFee.toFixed(2)}.`);

    return { success: true, data: borrowRecord, auditTrail };
  }

  /**
   * Telecom Workflow: Instant Airtime Recharge
   */
  static processRecharge(params: {
    tenant: Tenant;
    operator: 'Vodafone' | 'Airtel' | 'Orange' | 'Grameenphone' | 'Jio' | 'TelecomX';
    rechargeType: 'Airtime Topup' | 'Data Bundle' | 'Postpaid Bill' | 'Utility';
    phoneNumber: string;
    amount: number;
    commissionRate?: number;
  }): WorkflowResult<RechargeRecord> {
    const { tenant, operator, rechargeType, phoneNumber, amount, commissionRate = 0.03 } = params;
    const auditTrail: string[] = [];

    const commissionEarned = Math.round(amount * commissionRate * 100) / 100;
    const txnRef = `TXN-${operator.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const recharge: RechargeRecord = {
      id: `rec_${Date.now()}`,
      tenant_id: tenant.id,
      operator,
      recharge_type: rechargeType,
      phone_number: phoneNumber,
      amount,
      commission_rate: commissionRate,
      commission_earned: commissionEarned,
      status: 'success',
      transaction_ref: txnRef,
      created_at: new Date().toISOString()
    };

    storageService.saveRecharge(recharge);
    auditTrail.push(`1. [Recharge Processed]: $${amount} sent to ${phoneNumber} on ${operator}. Ref: ${txnRef}.`);

    // Accounting entry for commission
    storageService.saveAccountingEntry({
      id: `acc_${Date.now()}`,
      tenant_id: tenant.id,
      reference_type: 'RECHARGE_COMMISSION',
      reference_id: recharge.id,
      title: `${operator} ${rechargeType} Topup Commission`,
      debit_account: 'Telecom Wallet Balance',
      credit_account: 'Commission Income',
      amount: commissionEarned,
      created_at: new Date().toISOString()
    });
    auditTrail.push(`2. [Commission Credited]: $${commissionEarned.toFixed(2)} posted to Commission Income.`);

    storageService.addAuditLog('RECHARGE_PROCESSED', 'RECHARGE', `Airtime recharge of $${amount} to ${phoneNumber} (${operator}). Commission earned: $${commissionEarned.toFixed(2)}.`);

    return { success: true, data: recharge, auditTrail };
  }
}
