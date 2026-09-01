/**
 * Dokan Manager V2 — Universal Printable Documents & Reports Engine
 * Incorporates EXACT 1:1 Invoice, Thermal Print, Statement, Barcode & Report Layouts from Dokan Manager V1.
 * Supports Thermal 80mm/58mm, Full Page A4, A5, and Sticker Labels with BDT (৳) Currency.
 */

import { generateQrCodeSvg } from './qrCode';

// Helper to trigger clean isolated iframe printing
function triggerPrint(htmlContent: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  }
}

// =========================================================================
// 1. EXACT V1 POS INVOICE & THERMAL RECEIPT (80mm, 58mm, A4, A5)
// =========================================================================

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  imei?: string;
  warrantyMonths?: number;
  warranty?: string;
  batchNumber?: string;
}

export interface ReceiptData {
  shopName: string;
  shopBranch?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopEmail?: string;
  vatRegNo?: string;
  invoiceNo: string;
  date?: string | Date;
  cashierName?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  taxRate?: number;
  adjustment?: number;
  tradeInCredit?: number;
  grandTotal: number;
  paidAmount?: number;
  dueAmount?: number;
  changeAmount?: number;
  paymentMethod?: string;
  notes?: string;
  paperFormat?: '80mm' | '58mm' | 'A4' | 'A5';
  isPaid?: boolean;
  softwareBranding?: string;
  systemSoftwareName?: string;
}

export function printPosReceipt(data: ReceiptData) {
  const format = data.paperFormat || '80mm';
  const isA4 = format === 'A4';
  const isA5 = format === 'A5';
  const is58mm = format === '58mm';
  const isThermal = !isA4 && !isA5;

  const dateObj = data.date ? new Date(data.date) : new Date();
  const formattedDate = dateObj.toLocaleDateString('en-GB') + ' ' + dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const isCredit = data.paymentMethod === 'Credit' || data.paymentMethod === 'CREDIT_DUE' || (data.dueAmount && data.dueAmount > 0);
  const watermarkText = isCredit ? 'DUE' : 'PAID';
  const watermarkClass = isCredit ? 'unpaid' : 'paid';

  const discountVal = data.discount || 0;
  const taxVal = data.tax || 0;
  const adjustmentVal = data.adjustment || 0;
  const paidVal = isCredit ? (data.paidAmount || 0) : data.grandTotal;
  const dueVal = isCredit ? (data.dueAmount || (data.grandTotal - paidVal)) : 0;

  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${data.invoiceNo}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${isA4 ? 'A4 portrait' : isA5 ? 'A5 portrait' : is58mm ? '58mm auto' : '80mm auto'};
      margin: ${isA4 ? '8mm 10mm' : isA5 ? '5mm 6mm' : '0'};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Hind Siliguri', 'Inter', system-ui, -apple-system, sans-serif;
      background: #ffffff;
      color: #0f172a;
      width: ${isA4 ? '100%' : isA5 ? '100%' : is58mm ? '54mm' : '76mm'};
      margin: 0 auto;
      padding: ${isA4 ? '2px' : isA5 ? '2px' : '6px 4px 10px 4px'};
      font-size: ${isA4 ? '12px' : isA5 ? '10.5px' : is58mm ? '9.5px' : '11px'};
      line-height: 1.3;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Container */
    .thermal-receipt {
      position: relative;
      background: #ffffff;
      padding: ${isA4 ? '4px' : isA5 ? '2px' : '2px'};
    }
    .receipt-body-content {
      width: 100%;
    }
    .receipt-bottom-block {
      margin-top: 14px;
      page-break-inside: avoid;
    }

    /* Watermark Stamp Exact V1 Design */
    .receipt-watermark {
      position: absolute;
      top: 48%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-20deg);
      font-size: ${isA4 ? '3.5rem' : isA5 ? '2.2rem' : '1.8rem'};
      font-weight: 900;
      font-family: 'Arial Black', sans-serif;
      letter-spacing: 4px;
      padding: ${isA4 ? '8px 24px' : '3px 12px'};
      border: ${isA4 ? '4px' : '2.5px'} solid;
      border-radius: 8px;
      pointer-events: none;
      user-select: none;
      z-index: 1;
      text-transform: uppercase;
      opacity: 0.16;
      white-space: nowrap;
    }
    .receipt-watermark.paid {
      color: #10b981;
      border-color: #10b981;
    }
    .receipt-watermark.unpaid {
      color: #f43f5e;
      border-color: #f43f5e;
    }

    /* Header Two Columns */
    .receipt-header-two-columns {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: ${isA5 ? '4px' : '6px'};
      gap: ${isA5 ? '8px' : '12px'};
      ${isThermal ? 'flex-direction: column; text-align: center;' : ''}
    }
    .receipt-col-left {
      display: flex;
      align-items: center;
      gap: ${isA5 ? '8px' : '12px'};
      ${isThermal ? 'flex-direction: column; text-align: center;' : ''}
    }
    .receipt-logo {
      width: ${isA4 ? '64px' : isA5 ? '44px' : '40px'};
      height: ${isA4 ? '64px' : isA5 ? '44px' : '40px'};
      border-radius: 50%;
      border: 2px solid #0284c7;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0284c7, #6366f1);
      color: #fff;
      font-weight: 900;
      font-size: ${isA4 ? '24px' : isA5 ? '16px' : '16px'};
      flex-shrink: 0;
    }
    .receipt-header-text h2 {
      font-size: ${isA4 ? '22px' : isA5 ? '16px' : '15px'};
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1px;
      text-align: ${isThermal ? 'center' : 'left'};
    }
    .receipt-branch {
      font-size: ${isA4 ? '12px' : '10px'};
      color: #475569;
      font-weight: 500;
      text-align: ${isThermal ? 'center' : 'left'};
    }
    .receipt-phone {
      font-size: ${isA4 ? '12px' : '10px'};
      color: #0284c7;
      font-weight: 700;
      text-align: ${isThermal ? 'center' : 'left'};
    }

    /* Meta Box */
    .receipt-col-right {
      text-align: right;
      ${isThermal ? 'text-align: center; width: 100%;' : ''}
    }
    .receipt-meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: ${isA4 ? '6px 12px' : isA5 ? '4px 8px' : '4px 6px'};
      font-size: ${isA4 ? '12px' : isA5 ? '10px' : '10.5px'};
      text-align: ${isThermal ? 'center' : 'right'};
      line-height: 1.45;
    }
    .meta-item {
      margin: 0;
    }

    /* Dividers */
    .dashed {
      border: none;
      border-top: 1px dashed #64748b;
      margin: ${isA5 ? '4px 0' : '6px 0'};
    }

    /* Table */
    .receipt-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${isA4 ? '12.5px' : isA5 ? '10.5px' : is58mm ? '9.5px' : '10.5px'};
      margin: ${isA5 ? '4px 0' : '6px 0'};
    }
    .receipt-table th {
      background: ${isA4 || isA5 ? '#f1f5f9' : 'transparent'};
      color: #0f172a;
      font-weight: 700;
      padding: ${isA4 ? '6px 8px' : isA5 ? '4px 6px' : '3px 0'};
      border-bottom: ${isA4 || isA5 ? '1px solid #cbd5e1' : '1px dashed #000'};
      border-top: ${isA4 || isA5 ? '1px solid #cbd5e1' : 'none'};
      text-align: left;
    }
    .receipt-table td {
      padding: ${isA4 ? '6px 8px' : isA5 ? '3.5px 6px' : '3px 0'};
      border-bottom: ${isA4 || isA5 ? '1px solid #f1f5f9' : 'none'};
      vertical-align: top;
    }

    /* Summary & QR Box */
    .receipt-middle-summary-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin: ${isA5 ? '4px 0' : '6px 0'};
      ${isThermal ? 'flex-direction: column-reverse; align-items: stretch;' : ''}
    }
    .receipt-qrcode-box {
      padding: 3px 5px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      text-align: center;
      display: ${isThermal ? 'none' : 'inline-block'};
    }
    .receipt-summary {
      width: ${isA4 ? '260px' : isA5 ? '210px' : '100%'};
      background: ${isA4 || isA5 ? '#f8fafc' : 'transparent'};
      padding: ${isA4 ? '8px 12px' : isA5 ? '5px 8px' : '0'};
      border: ${isA4 || isA5 ? '1px solid #e2e8f0' : 'none'};
      border-radius: 6px;
      font-size: ${isA4 ? '12px' : isA5 ? '10.5px' : '11px'};
    }
    .receipt-summary .r-row {
      display: flex;
      justify-content: space-between;
      margin: 1.5px 0;
    }
    .receipt-summary .total {
      font-weight: 800;
      font-size: ${isA4 ? '14px' : isA5 ? '12px' : '12px'};
      color: #0284c7;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      padding: 3px 0;
      margin: 3px 0;
    }

    /* Warranty Box */
    .receipt-warranty-note {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 4px;
      padding: ${isA5 ? '3px 6px' : '4px 8px'};
      font-size: ${isA4 ? '11px' : isA5 ? '9.5px' : '9.5px'};
      color: #0369a1;
      margin: ${isA5 ? '4px 0' : '6px 0'};
      text-align: center;
    }

    /* Signatures with ample signing room */
    .a4-signatures {
      display: ${isA4 || isA5 ? 'flex' : 'none'};
      justify-content: space-between;
      margin-top: ${isA4 ? '58px' : isA5 ? '38px' : '0'};
      margin-bottom: ${isA4 ? '12px' : isA5 ? '8px' : '0'};
      padding-top: 2px;
    }
    .sig-box {
      width: ${isA4 ? '160px' : isA5 ? '125px' : '100px'};
      text-align: center;
      border-top: 1.2px dashed #475569;
      padding-top: 4px;
      font-weight: 600;
      color: #334155;
      font-size: ${isA4 ? '11px' : isA5 ? '9.5px' : '10px'};
    }

    .receipt-footer-msg {
      text-align: center;
      margin: 6px 0 2px 0;
      font-weight: 600;
      color: #475569;
      font-size: 11px;
    }
    .powered-by {
      display: block;
      margin-top: 4px;
      color: #64748b;
      font-size: 9px;
      text-align: center;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>
  <div class="thermal-receipt">
    <div class="receipt-watermark ${watermarkClass}">${watermarkText}</div>

    <div class="receipt-body-content">
      <!-- Header -->
      <div class="receipt-header-two-columns">
        <div class="receipt-col-left">
          <div class="receipt-logo">D</div>
          <div class="receipt-header-text">
            <h2>${data.shopName}</h2>
            <p class="receipt-branch">${data.shopBranch || data.shopAddress || 'ঢাকা, বাংলাদেশ'}</p>
            <p class="receipt-phone">হটলাইন: ${data.shopPhone || '01700-000000'}</p>
            ${data.vatRegNo ? `<p style="font-size:11px; color:#475569;">VAT/BIN: <strong>${data.vatRegNo}</strong></p>` : ''}
          </div>
        </div>

        <div class="receipt-col-right">
          <div class="receipt-meta-box">
            <div class="meta-item">ইনভয়েস #: <strong style="font-family:monospace; color:#0284c7;">${data.invoiceNo}</strong></div>
            <div class="meta-item">তারিখ ও সময়: <strong>${formattedDate}</strong></div>
            <div class="meta-item">কাস্টমার: <strong>${data.customerName || 'সাধারণ কাস্টমার (ক্যাশ)'}</strong></div>
            ${data.customerPhone ? `<div class="meta-item">মোবাইল: <strong>${data.customerPhone}</strong></div>` : ''}
            <div class="meta-item">বিলিং অফিসার: <strong>${data.cashierName || 'Admin'}</strong></div>
          </div>
        </div>
      </div>

      <hr class="dashed">

      <!-- Items Table -->
      <table class="receipt-table">
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">SL</th>
            <th style="text-align: left;">আইটেম ও বিবরণ</th>
            <th style="width: 12%; text-align: center;">পরিমাণ</th>
            <th style="width: 22%; text-align: right;">একক দর (৳)</th>
            <th style="width: 24%; text-align: right;">মোট মূল্য (৳)</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map((item, idx) => {
            const itemWarranty = item.warranty || (item.warrantyMonths ? `${item.warrantyMonths} মাস` : null);
            return `
            <tr>
              <td style="text-align: center; color: #64748b;">${idx + 1}</td>
              <td>
                <strong style="color: #0f172a;">${item.name}</strong>
                ${item.imei ? `<div style="font-size: 10px; color: #7c3aed; font-family: monospace; font-weight: bold; margin-top: 1px;">IMEI/SN: ${item.imei}</div>` : ''}
                ${itemWarranty ? `<div style="font-size: 10px; color: #0284c7; font-weight: 700; margin-top: 1px;">🛡️ ওয়ারেন্টি: ${itemWarranty}</div>` : ''}
                ${item.batchNumber ? `<div style="font-size: 10px; color: #059669; font-family: monospace; margin-top: 1px;">ব্যাচ: ${item.batchNumber}</div>` : ''}
              </td>
              <td style="text-align: center; font-weight: 600;">${item.quantity}</td>
              <td style="text-align: right; font-family: monospace;">৳${item.unitPrice.toFixed(2)}</td>
              <td style="text-align: right; font-weight: 700; font-family: monospace;">৳${item.total.toFixed(2)}</td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>

      <hr class="dashed">

      <!-- Summary & QR Box -->
      <div class="receipt-middle-summary-row">
        <div class="receipt-qrcode-box" style="padding: 4px; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center; display: inline-block;">
          ${generateQrCodeSvg(`Invoice: ${data.invoiceNo} | ${data.shopName} | Total: ৳${data.grandTotal.toFixed(2)} | ${watermarkText}`, isThermal ? 65 : 75)}
          <small style="display:block; font-size: 8.5px; color: #64748b; margin-top: 2px;">Scan to Verify</small>
        </div>

        <div class="receipt-summary">
          <div class="r-row"><span>সাবটোটাল:</span><span style="font-family: monospace;">৳${data.subtotal.toFixed(2)}</span></div>
          ${taxVal > 0 ? `<div class="r-row"><span>ভ্যাট / ট্যাক্স (${data.taxRate || 0}%):</span><span style="font-family: monospace;">+৳${taxVal.toFixed(2)}</span></div>` : ''}
          ${discountVal > 0 ? `<div class="r-row" style="color: #e11d48;"><span>ছাড় (Discount):</span><span style="font-family: monospace;">-৳${discountVal.toFixed(2)}</span></div>` : ''}
          ${adjustmentVal !== 0 ? `<div class="r-row" style="color: ${adjustmentVal > 0 ? '#0284c7' : '#e11d48'};"><span>এডজাস্টমেন্ট:</span><span style="font-family: monospace;">${adjustmentVal > 0 ? '+' : ''}৳${adjustmentVal.toFixed(2)}</span></div>` : ''}
          ${data.tradeInCredit && data.tradeInCredit > 0 ? `<div class="r-row" style="color: #059669;"><span>ট্রেড-ইন ভাউচার:</span><span style="font-family: monospace;">-৳${data.tradeInCredit.toFixed(2)}</span></div>` : ''}
          
          <div class="r-row total">
            <span>সর্বমোট প্রদেয় (BDT):</span>
            <span style="font-family: monospace;">৳${data.grandTotal.toFixed(2)}</span>
          </div>

          <div class="r-row"><span>পেমেন্ট মাধ্যম:</span><span><strong>${data.paymentMethod || 'ক্যাশ'}</strong></span></div>
          <div class="r-row"><span>পরিশোধিত:</span><span style="font-family: monospace;">৳${paidVal.toFixed(2)}</span></div>
          ${dueVal > 0 ? `<div class="r-row" style="color: #e11d48; font-weight: 700;"><span>বকেয়া / বাকি:</span><span style="font-family: monospace;">৳${dueVal.toFixed(2)}</span></div>` : ''}
        </div>
      </div>

      ${data.items.some(i => i.warrantyMonths || i.warranty) ? `
        <!-- Warranty Note Box -->
        <div class="receipt-warranty-note">
          <strong>ওয়ারেন্টি শর্তাবলী:</strong> পণ্য ক্রয়ের তারিখ হতে বর্ণিত সময়ের জন্য অফিসিয়াল ওয়ারেন্টি পলিসি প্রযোজ্য।
        </div>
      ` : ''}
    </div>

    <!-- Bottom Section: Signatures & Footer inside Margins -->
    <div class="receipt-bottom-block">
      <hr class="dashed">

      <!-- Dual Signatures with Ample Signing Room -->
      <div class="a4-signatures">
        <div class="sig-box"><span>গ্রাহকের স্বাক্ষর</span></div>
        <div class="sig-box"><span>কর্তৃপক্ষের স্বাক্ষর</span></div>
      </div>

      <!-- Footer with Admin Customizable Branding -->
      <div style="text-align: center; margin-top: 6px;">
        <p class="receipt-footer-msg">*** ধন্যবাদ আবার আসবেন ***</p>
        <small class="powered-by">${data.softwareBranding || data.systemSoftwareName || 'SmartERP Enterprise Platform V2.0'}</small>
      </div>
    </div>
  </div>
</body>
</html>
`;

  triggerPrint(html);
}

// =========================================================================
// 2. A4 CUSTOMER / SUPPLIER ACCOUNT LEDGER STATEMENT (Exact V1 Layout)
// =========================================================================

export interface StatementTransaction {
  date: string;
  refNo?: string;
  ref?: string;
  type: string;
  description?: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface StatementData {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  partnerName?: string;
  partyName?: string;
  partnerPhone?: string;
  partyPhone?: string;
  partnerAddress?: string;
  partyAddress?: string;
  partnerType?: 'Customer' | 'Supplier' | string;
  partyType?: string;
  partyId?: string;
  startDate?: string;
  endDate?: string;
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
  transactions: StatementTransaction[];
}

export function printLedgerStatement(data: StatementData) {
  const printDate = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const pName = data.partnerName || data.partyName || 'Customer';
  const pPhone = data.partnerPhone || data.partyPhone || '';
  const pAddr = data.partnerAddress || data.partyAddress || '';
  const pType = data.partnerType || data.partyType || 'Customer';

  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>${pType} Statement - ${pName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%;
      min-height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Hind Siliguri', 'Inter', system-ui, -apple-system, sans-serif;
      background: #fff;
      color: #0f172a;
      font-size: 11px;
      line-height: 1.35;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ledger-page-wrapper {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 262mm;
      box-sizing: border-box;
    }
    .ledger-body-content {
      width: 100%;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .company-col {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .company-logo-badge {
      width: 42px;
      height: 42px;
      border-radius: 8px;
      background: linear-gradient(135deg, #0f172a, #2563eb);
      color: #fff;
      font-weight: 900;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .title {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
    }
    .doc-type {
      font-size: 15px;
      font-weight: 800;
      color: #0284c7;
      text-transform: uppercase;
    }
    .kpi-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin: 10px 0;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
      text-align: center;
    }
    .kpi-label { font-size: 9.5px; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .kpi-val { font-size: 15px; font-weight: 800; font-family: monospace; margin-top: 1px; }
    .kpi-debit { color: #0284c7; }
    .kpi-credit { color: #10b981; }
    .kpi-due { color: #e11d48; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 10.5px;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      padding: 5px 6px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    .ledger-bottom-block {
      margin-top: auto;
      flex-shrink: 0;
      padding-top: 10px;
      page-break-inside: avoid;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 18px;
      padding-top: 6px;
    }
    .sig-line {
      width: 170px;
      border-top: 1.5px dashed #475569;
      text-align: center;
      font-size: 10.5px;
      color: #334155;
      font-weight: 600;
      padding-top: 3px;
    }
  </style>
</head>
<body>
  <div class="ledger-page-wrapper">
    <div class="ledger-body-content">
      <div class="header">
        <div class="company-col">
          <div class="company-logo-badge">S</div>
          <div>
            <div class="title">${data.shopName || 'SmartERP Enterprise'}</div>
            <div style="font-size: 10.5px; color: #475569;">📍 ${data.shopAddress || 'ঢাকা, বাংলাদেশ'} | 📞 <strong>${data.shopPhone || '01700-000000'}</strong></div>
          </div>
        </div>
        <div style="text-align: right;">
          <div class="doc-type">${pType} অ্যাকাউন্ট স্টেটমেন্ট</div>
          <div style="font-size: 10px; color: #64748b;">প্রিন্ট তারিখ: <strong>${printDate}</strong></div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; font-size: 10.5px;">
        <div>
          <div>${pType} নাম: <strong>${pName}</strong></div>
          <div>মোবাইল: <strong>${pPhone || 'N/A'}</strong></div>
        </div>
        <div style="text-align: right;">
          <div>ঠিকানা: ${pAddr || 'বাংলাদেশ'}</div>
          <div>পিরিয়ড: ${data.startDate || 'শুরু হতে'} - ${data.endDate || 'আজ পর্যন্ত'}</div>
        </div>
      </div>

      <div class="kpi-cards">
        <div class="kpi-card">
          <div class="kpi-label">মোট ডেবিট (বিক্রি/উত্তোলন)</div>
          <div class="kpi-val kpi-debit">৳${data.totalDebits.toFixed(2)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">মোট ক্রেডিট (আদায়/জমা)</div>
          <div class="kpi-val kpi-credit">৳${data.totalCredits.toFixed(2)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">বর্তমান বাকি ব্যালেন্স</div>
          <div class="kpi-val kpi-due">৳${data.netBalance.toFixed(2)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 14%;">তারিখ</th>
            <th style="width: 16%;">রেফারেন্স #</th>
            <th style="width: 14%;">লেনদেন টাইপ</th>
            <th>বিবরণ</th>
            <th style="width: 14%; text-align: right;">ডেবিট (৳)</th>
            <th style="width: 14%; text-align: right;">ক্রেডিট (৳)</th>
            <th style="width: 14%; text-align: right;">ব্যালেন্স (৳)</th>
          </tr>
        </thead>
        <tbody>
          ${data.transactions.length === 0 ? `
            <tr><td colspan="7" style="text-align: center; color: #64748b; padding: 15px;">কোনো লেনদেন রেকর্ড পাওয়া যায়নি।</td></tr>
          ` : data.transactions.map(t => `
            <tr>
              <td>${t.date}</td>
              <td style="font-family: monospace; font-weight: 600;">${t.refNo || t.ref || '-'}</td>
              <td>${t.type}</td>
              <td>${t.description || '-'}</td>
              <td style="text-align: right; font-family: monospace; color: #0284c7;">${t.debit > 0 ? `৳${t.debit.toFixed(2)}` : '-'}</td>
              <td style="text-align: right; font-family: monospace; color: #10b981;">${t.credit > 0 ? `৳${t.credit.toFixed(2)}` : '-'}</td>
              <td style="text-align: right; font-family: monospace; font-weight: bold; ${t.balance > 0 ? 'color: #e11d48;' : ''}">৳${t.balance.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Bottom Section: Signatures inside Margins -->
    <div class="ledger-bottom-block">
      <div class="signatures">
        <div class="sig-line">কাস্টমার / পার্টনার স্বাক্ষর</div>
        <div class="sig-line">কর্তৃপক্ষের স্বাক্ষর</div>
      </div>
    </div>
  </div>
</body>
</html>
`;

  triggerPrint(html);
}

export interface ReportData {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  shopEmail?: string;
  vatRegNo?: string;
  reportTitle: string;
  reportSubtitle?: string;
  dateRange?: string;
  periodText?: string;
  generatedBy?: string;
  orientation?: 'portrait' | 'landscape';
  kpis: { label: string; value: string | number; color?: string; subtext?: string }[];
  columns: string[];
  columnAlignments?: ('left' | 'center' | 'right')[];
  rows: (string | number)[][];
  summaryRow?: (string | number)[];
  notes?: string;
}

export function printReportDocument(data: ReportData) {
  const printTime = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const period = data.dateRange || data.periodText || 'সকল লেনদেন (All Time)';
  const officer = data.generatedBy || 'System Administrator (অ্যাডমিন)';
  const reportRef = `SERP-${Date.now().toString().slice(-6)}`;
  const orientation = data.orientation || 'portrait';
  const sName = data.shopName || 'SmartERP Enterprise';
  const sAddr = data.shopAddress || 'ঢাকা, বাংলাদেশ';
  const sPhone = data.shopPhone || '01700-000000';
  const sEmail = data.shopEmail || 'support@smarterp.com';
  const sVat = data.vatRegNo || 'BIN-9081293849';

  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>${data.reportTitle} - ${sName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    @page { 
      size: A4 ${orientation}; 
      margin: 10mm 12mm; 
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%;
      min-height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Hind Siliguri', 'Inter', -apple-system, system-ui, sans-serif;
      background: #fff;
      color: #0f172a;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .erp-page-wrapper {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: ${orientation === 'landscape' ? '182mm' : '262mm'};
      box-sizing: border-box;
    }
    .erp-body-content {
      width: 100%;
    }

    /* Corporate ERP Header */
    .erp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .company-col {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .company-logo-badge {
      width: 42px;
      height: 42px;
      border-radius: 8px;
      background: linear-gradient(135deg, #0f172a, #2563eb);
      color: #fff;
      font-weight: 900;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .company-name {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.4px;
      line-height: 1.1;
      text-transform: uppercase;
    }
    .company-details {
      font-size: 10.5px;
      color: #475569;
      margin-top: 2px;
      line-height: 1.3;
    }
    .erp-meta-box {
      text-align: right;
      font-size: 10px;
      color: #334155;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 5px 10px;
      border-radius: 6px;
      min-width: 190px;
    }
    .erp-meta-box .ref-num {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: #0284c7;
      font-size: 11px;
    }

    /* Report Title Banner */
    .report-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 5px;
      margin-bottom: 10px;
    }
    .report-title {
      font-size: 13.5px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }
    .report-badge {
      font-size: 9.5px;
      font-weight: 700;
      background: #2563eb;
      color: #fff;
      padding: 2px 8px;
      border-radius: 3px;
      text-transform: uppercase;
    }

    /* Executive KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
      margin-bottom: 10px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-top: 3px solid #0f172a;
      border-radius: 5px;
      padding: 5px 10px;
    }
    .kpi-card .lbl {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .kpi-card .val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    .kpi-card .sub {
      font-size: 9px;
      color: #94a3b8;
    }

    /* ERP Data Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 10.5px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th {
      background: #1e293b;
      color: #ffffff;
      font-weight: 700;
      padding: 6px 8px;
      border: 1px solid #334155;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
      color: #1e293b;
    }
    tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }
    tbody tr:hover {
      background-color: #f1f5f9;
    }
    .summary-row td {
      background-color: #f1f5f9;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #0f172a;
      border-bottom: 3.5px double #0f172a;
      font-size: 11px;
    }

    /* Bottom Section anchored at bottom inside margin */
    .erp-bottom-section {
      margin-top: auto;
      flex-shrink: 0;
      padding-top: 10px;
      page-break-inside: avoid;
    }

    /* Triple Signatures Block */
    .erp-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 20px;
      padding-top: 8px;
      page-break-inside: avoid;
    }
    .sig-box {
      width: 170px;
      text-align: center;
    }
    .sig-line {
      border-top: 1.5px dashed #64748b;
      padding-top: 4px;
      font-size: 10.5px;
      font-weight: 700;
      color: #1e293b;
    }
    .sig-sub {
      font-size: 9px;
      color: #64748b;
    }

    /* ERP Security Footer */
    .erp-footer {
      border-top: 1px solid #cbd5e1;
      margin-top: 14px;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #64748b;
    }
    .security-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="erp-page-wrapper">
    <div class="erp-body-content">
      <!-- Corporate Letterhead -->
      <div class="erp-header">
        <div class="company-col">
          <div class="company-logo-badge">S</div>
          <div>
            <div class="company-name">${sName}</div>
            <div class="company-details">
              <div>📍 ঠিকানা: ${sAddr} | 📞 হেল্পলাইন: <strong>${sPhone}</strong></div>
              <div>🏛️ ভ্যাট / ট্যাক্স ট্রেড লাইসেন্স নং: <strong>${sVat}</strong></div>
            </div>
          </div>
        </div>
        <div class="erp-meta-box">
          <div>ডকুমেন্ট ট্র্যাকিং: <span class="ref-num">${reportRef}</span></div>
          <div>রিপোর্ট সময়কাল: <strong>${period}</strong></div>
          <div>জেনারেটর: <strong>${officer}</strong></div>
          <div>প্রিন্ট সময়: <span style="font-family: monospace;">${printTime}</span></div>
        </div>
      </div>

      <!-- Report Title Banner -->
      <div class="report-banner">
        <div class="report-title">${data.reportTitle}</div>
        <div class="report-badge">SmartERP VERIFIED DOCUMENT</div>
      </div>

      <!-- Executive KPI Cards -->
      ${data.kpis && data.kpis.length > 0 ? `
        <div class="kpi-grid">
          ${data.kpis.map(kpi => `
            <div class="kpi-card" ${kpi.color ? `style="border-top-color: ${kpi.color};"` : ''}>
              <div class="lbl">${kpi.label}</div>
              <div class="val" ${kpi.color ? `style="color: ${kpi.color};"` : ''}>${kpi.value}</div>
              ${kpi.subtext ? `<div class="sub">${kpi.subtext}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Main Data Table -->
      <table>
        <thead>
          <tr>
            ${data.columns.map((col, idx) => {
              const align = data.columnAlignments ? data.columnAlignments[idx] : (idx === 0 ? 'left' : (idx === data.columns.length - 1 ? 'right' : 'left'));
              return `<th style="text-align: ${align};">${col}</th>`;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.rows.map(row => `
            <tr>
              ${row.map((cell, idx) => {
                const align = data.columnAlignments ? data.columnAlignments[idx] : (idx === 0 ? 'left' : (idx === row.length - 1 ? 'right' : 'left'));
                const isNumeric = typeof cell === 'string' && (cell.startsWith('৳') || cell.startsWith('-') || cell.startsWith('+'));
                return `
                  <td style="text-align: ${align}; ${isNumeric ? `font-family: 'JetBrains Mono', monospace; font-weight: 600; ${cell.startsWith('-') ? 'color: #dc2626;' : cell.startsWith('+') ? 'color: #059669;' : ''}` : ''}">
                    ${cell}
                  </td>
                `;
              }).join('')}
            </tr>
          `).join('')}
          ${data.summaryRow ? `
            <tr class="summary-row">
              ${data.summaryRow.map((cell, idx) => {
                const align = data.columnAlignments ? data.columnAlignments[idx] : (idx === 0 ? 'left' : (idx === data.summaryRow!.length - 1 ? 'right' : 'left'));
                return `<td style="text-align: ${align}; font-family: 'JetBrains Mono', monospace;">${cell}</td>`;
              }).join('')}
            </tr>
          ` : ''}
        </tbody>
      </table>
    </div>

    <!-- Bottom Section: Triple Signatures & Audit Footer inside Margins -->
    <div class="erp-bottom-section">
      <!-- Official ERP Triple Sign-off Block -->
      <div class="erp-signatures">
        <div class="sig-box">
          <div class="sig-line">প্রস্তুতকারক (Prepared By)</div>
          <div class="sig-sub">${officer}</div>
        </div>
        <div class="sig-box">
          <div class="sig-line">যাচাইকারী (Checked By)</div>
          <div class="sig-sub">প্রধান হিসাবরক্ষক</div>
        </div>
        <div class="sig-box">
          <div class="sig-line">অনুমোদনকারী (Approved By)</div>
          <div class="sig-sub">ব্যবস্থাপনা পরিচালক / স্বত্বাধিকারী</div>
        </div>
      </div>

      <!-- System Audit Watermark & Footer -->
      <div class="erp-footer">
        <div class="security-badge">
          🔒 SmartERP Enterprise Core • Document Security Hash: SERP-AUTH-${Date.now().toString().slice(-4)}
        </div>
        <div>গোপনীয় আর্থিক প্রতিবেদন • পাতা ১ এর ১</div>
      </div>
    </div>
  </div>
</body>
</html>
`;

  triggerPrint(html);
}

// =========================================================================
// 4. BARCODE & PRICE TAG STICKERS (38x25mm, 50x30mm)
// =========================================================================

export interface BarcodeStickerItem {
  shopName: string;
  productName: string;
  barcode: string;
  price?: number;
  sellingPrice?: number;
  sku?: string;
  copies?: number;
}

export function printBarcodeStickers(items: BarcodeStickerItem[], size: '38x25mm' | '50x30mm' = '38x25mm') {
  const is38x25 = size === '38x25mm';
  const width = is38x25 ? '38mm' : '50mm';
  const height = is38x25 ? '25mm' : '30mm';

  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>Barcode Stickers</title>
  <style>
    @page { size: ${width} ${height}; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Hind Siliguri', 'Inter', system-ui, sans-serif;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .sticker {
      width: ${width};
      height: ${height};
      padding: 2mm 2.5mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      page-break-after: always;
      overflow: hidden;
    }
    .shop-name {
      font-size: 8px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    .prod-name {
      font-size: 8.5px;
      font-weight: 700;
      color: #000;
      line-height: 1.1;
      margin: 1px 0;
      max-height: 18px;
      overflow: hidden;
    }
    .barcode-display {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      font-weight: bold;
      letter-spacing: 2px;
      line-height: 1;
    }
    .barcode-num {
      font-size: 7.5px;
      font-family: monospace;
      color: #334155;
    }
    .price-tag {
      font-size: 10px;
      font-weight: 900;
      color: #000;
      line-height: 1;
    }
  </style>
</head>
<body>
  ${items.flatMap(item => {
    const itemPrice = item.price ?? item.sellingPrice ?? 0;
    const numCopies = item.copies || 1;
    return Array.from({ length: numCopies }).map(() => `
      <div class="sticker">
        <div class="shop-name">${item.shopName}</div>
        <div class="prod-name">${item.productName}</div>
        <div>
          <div class="barcode-display">||| | |||| | |||</div>
          <div class="barcode-num">${item.barcode}</div>
        </div>
        <div class="price-tag">MRP: ৳${itemPrice.toFixed(2)}</div>
      </div>
    `);
  }).join('')}
</body>
</html>
`;

  triggerPrint(html);
}

// =========================================================================
// 5. 80mm SERVICE & REPAIR JOB TOKEN SLIP
// =========================================================================

export interface RepairTokenData {
  shopName: string;
  shopPhone: string;
  tokenNo: string;
  date?: string | Date;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  imei?: string;
  passcode?: string;
  problem?: string;
  problemDescription?: string;
  estimatedCost: number;
  advancePaid: number;
  dueAmount?: number;
  deliveryDate?: string | Date;
  expectedDeliveryDate?: string | Date;
}

export function printRepairToken(data: RepairTokenData) {
  const due = data.dueAmount ?? Math.max(0, data.estimatedCost - data.advancePaid);
  const prob = data.problem || data.problemDescription || 'হ্যান্ডসেট মেরামত ও সার্ভিসিং';
  const delivery = data.deliveryDate || data.expectedDeliveryDate;

  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>Repair Token - ${data.tokenNo}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Hind Siliguri', 'Inter', system-ui, sans-serif;
      width: 76mm;
      margin: 0 auto;
      padding: 8px 4px;
      background: #fff;
      color: #000;
      font-size: 11.5px;
      line-height: 1.4;
    }
    .text-center { text-align: center; }
    .title { font-size: 16px; font-weight: 800; }
    .token-badge {
      font-size: 20px;
      font-weight: 900;
      font-family: monospace;
      padding: 4px 8px;
      border: 2px dashed #000;
      margin: 6px 0;
      display: inline-block;
    }
    .dashed { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="title">${data.shopName}</div>
    <div style="font-size: 10px;">সার্ভিস ও মেরামত টোকেন</div>
    <div style="font-size: 11px; font-weight: bold;">হেল্পলাইন: ${data.shopPhone}</div>
    <div class="token-badge">${data.tokenNo}</div>
    <div>তারিখ: ${data.date}</div>
  </div>

  <div class="dashed"></div>

  <div class="row"><span>কাস্টমার:</span><strong>${data.customerName}</strong></div>
  <div class="row"><span>মোবাইল:</span><strong>${data.customerPhone}</strong></div>
  <div class="row"><span>হ্যান্ডসেট মডেল:</span><strong>${data.deviceModel}</strong></div>
  ${data.imei ? `<div class="row"><span>IMEI:</span><strong style="font-family:monospace;">${data.imei}</strong></div>` : ''}
  ${data.passcode ? `<div class="row"><span>পাসকোড/লক:</span><strong>${data.passcode}</strong></div>` : ''}
  
  <div class="dashed"></div>

  <div><strong>সমস্যার বিবরণ:</strong></div>
  <div style="padding: 4px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; margin: 2px 0;">
    ${prob}
  </div>

  <div class="dashed"></div>

  <div class="row"><span>আনুমানিক খরচ:</span><strong>৳${data.estimatedCost.toFixed(2)}</strong></div>
  <div class="row"><span>অগ্রিম জমা:</span><strong>৳${data.advancePaid.toFixed(2)}</strong></div>
  <div class="row" style="font-size: 13px; font-weight: bold;"><span>বকেয়া প্রদেয়:</span><strong>৳${due.toFixed(2)}</strong></div>
  ${data.deliveryDate ? `<div class="row"><span>সম্ভাব্য ডেলিভারি:</span><strong>${data.deliveryDate}</strong></div>` : ''}

  <div class="dashed"></div>

  <div style="font-size: 9.5px; color: #475569; text-align: center;">
    * ডেলিভারি নেওয়ার সময় অবশ্যই এই স্লিপ সাথে আনবেন। ৩০ দিনের মধ্যে হ্যান্ডসেট গ্রহণ না করিলে কর্তৃপক্ষ দায়ী থাকিবে না।
  </div>
</body>
</html>
`;

  triggerPrint(html);
}
