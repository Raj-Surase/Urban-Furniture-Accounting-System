/**
 * Centralized Domain Enums for Urban Furniture Accounting System.
 *
 * All enums use string values to maintain 100% interoperability with Laravel REST APIs
 * while providing strict compile-time type safety across all React components and modules.
 */

/**
 * User system and portal clearance roles.
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  USER = 'user',
}

/**
 * Account classification types in General Ledger / Chart of Accounts.
 */
export enum AccountClassification {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

/**
 * Normal balance indicator for accounts and journal entries.
 */
export enum NormalBalance {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

/**
 * Sub-types for asset, liability, and expense classifications.
 */
export enum AccountSubType {
  CASH_BANK = 'cash_bank',
  RECEIVABLES = 'receivables',
  INVENTORY = 'inventory',
  CLEARING = 'clearing',
  PREPAID = 'prepaid',
  FIXED_ASSET = 'fixed_asset',
  DEPRECIATION = 'depreciation',
  GST_INPUT = 'gst_input',
  PAYABLES = 'payables',
  GST_OUTPUT = 'gst_output',
  ACCRUED = 'accrued',
  ADVANCES = 'advances',
  LOANS = 'loans',
  CAPITAL = 'capital',
  RETAINED = 'retained',
  DRAWINGS = 'drawings',
  OPERATING_REVENUE = 'operating_revenue',
  SERVICES_REVENUE = 'services_revenue',
  DISCOUNTS = 'discounts',
  OTHER_INCOME = 'other_income',
  COGS = 'cogs',
  LOGISTICS = 'logistics',
  SHRINKAGE = 'shrinkage',
  OPERATING_EXPENSE = 'operating_expense',
  DEPRECIATION_EXP = 'depreciation_exp',
  SALES_MARKETING = 'sales_marketing',
}

/**
 * Lifecycle status of Tax Invoices and Vendor Bills.
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  PAID = 'paid',
  VOID = 'void',
  CANCELLED = 'cancelled',
}

/**
 * Directional type or category of an invoice/bill.
 */
export enum InvoiceType {
  RECEIVABLE = 'receivable',
  PAYABLE = 'payable',
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  BILL = 'bill',
  INVOICE = 'invoice',
}

/**
 * Lifecycle status of Purchase Orders.
 */
export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

/**
 * Lifecycle status of Sales Orders.
 */
export enum SalesOrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  APPROVED = 'approved',
  PARTIALLY_DELIVERED = 'partially_delivered',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

/**
 * Lifecycle status of Bank / Cash Payment Vouchers.
 */
export enum PaymentStatus {
  DRAFT = 'draft',
  CLEARED = 'cleared',
  RECONCILED = 'reconciled',
  CANCELLED = 'cancelled',
}

/**
 * Direction / Category of a Payment transaction.
 */
export enum PaymentType {
  CUSTOMER_RECEIPT = 'customer_receipt',
  VENDOR_PAYMENT = 'vendor_payment',
  RECEIVED = 'received',
  SENT = 'sent',
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  SEND = 'send',
  RECEIVE = 'receive',
}

/**
 * Payment method channels.
 */
export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHEQUE = 'cheque',
  UPI = 'upi',
  CREDIT_CARD = 'credit_card',
  BANK = 'bank',
}

/**
 * Operational lifecycle status for financial Budgets.
 */
export enum BudgetStatus {
  DRAFT = 'draft',
  CONFIRM = 'confirm',
  REVISED = 'revised',
  CANCELLED = 'cancelled',
}

/**
 * Budget line and Analytic Account cost center classification.
 */
export enum BudgetLineType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

/**
 * Contact party classification.
 */
export enum ContactType {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  BOTH = 'both',
}

/**
 * Status of workshop/manufacturing items or tasks.
 */
export enum ItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Priority levels for workshop items.
 */
export enum ItemPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Journal book categories.
 */
export enum JournalType {
  SALES = 'sales',
  PURCHASE = 'purchase',
  BANK = 'bank',
  CASH = 'cash',
  GENERAL = 'general',
}
