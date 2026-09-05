export interface IndianState {
  code: string;
  name: string;
}

export const INDIAN_STATES: IndianState[] = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh (Old)' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
];

export const FURNITURE_CATEGORIES = [
  'Chairs',
  'Tables',
  'Sofas',
  'Desks & Workstations',
  'Storage & Credenzas',
  'Street & Public Benches',
  'Planters & Urban Decor',
  'Turnkey Assembly & Services',
  'Combos & Sets',
  'Lighting & Fixtures',
  'Outdoor & Patio',
] as const;

export interface HsnOption {
  code: string;
  name: string;
  gstRate: number;
}

export const FURNITURE_HSN_CODES: HsnOption[] = [
  { code: '94018000', name: '94018000 — Ergonomic Swivel & Office Chairs (18% GST)', gstRate: 18 },
  { code: '94036000', name: '94036000 — Solid Teak & Hardwood Tables / Desks (18% GST)', gstRate: 18 },
  { code: '94014000', name: '94014000 — Contemporary Upholstered Sofas & Couches (18% GST)', gstRate: 18 },
  { code: '94016100', name: '94016100 — Wooden Framed Dining & Accent Chairs (18% GST)', gstRate: 18 },
  { code: '94033000', name: '94033000 — Wooden Executive Office Furniture (18% GST)', gstRate: 18 },
  { code: '94032000', name: '94032000 — Metal & Cast Iron Outdoor Street Furniture (18% GST)', gstRate: 18 },
  { code: '998713', name: '998713 — Furniture Assembly & Civil Site Services (18% GST)', gstRate: 18 },
  { code: '998719', name: '998719 — Repair & Maintenance Services (18% GST)', gstRate: 18 },
];

export const UNITS_OF_MEASURE = [
  { value: 'unit', label: 'Unit / Piece (pcs)' },
  { value: 'set', label: 'Set / Suite' },
  { value: 'sqft', label: 'Square Feet (sqft)' },
  { value: 'mtr', label: 'Linear Meter (mtr)' },
  { value: 'kg', label: 'Kilogram (kg)' },
];

export const PAYMENT_TERMS_OPTIONS = [
  { days: 0, label: 'Immediate / Due on Receipt' },
  { days: 15, label: 'Net 15 (15 Days)' },
  { days: 30, label: 'Net 30 (30 Days)' },
  { days: 45, label: 'Net 45 (45 Days)' },
  { days: 60, label: 'Net 60 (60 Days)' },
  { days: 90, label: 'Net 90 (90 Days)' },
];

import { AccountClassification, NormalBalance, AccountSubType } from '../types';

export interface AccountSubTypeOption {
  key: string;
  name: string;
  suggestedPrefix: string;
  description: string;
}

export interface AccountClassificationConfig {
  name: string;
  normalBalance: NormalBalance;
  codeRange: string;
  prefix: string;
  subTypes: AccountSubTypeOption[];
}

export const ACCOUNT_CLASSIFICATIONS: Record<AccountClassification, AccountClassificationConfig> = {
  [AccountClassification.ASSET]: {
    name: 'Asset (1xxx)',
    normalBalance: NormalBalance.DEBIT,
    codeRange: '1000 - 1999',
    prefix: '1',
    subTypes: [
      { key: AccountSubType.CASH_BANK, name: 'Cash, Petty Cash & Bank Accounts', suggestedPrefix: '111', description: 'Checking accounts, treasury, liquid cash' },
      { key: AccountSubType.RECEIVABLES, name: 'Accounts Receivable (Debtors)', suggestedPrefix: '112', description: 'Customer receivables, trade dues' },
      { key: AccountSubType.INVENTORY, name: 'Inventory & Stock Valuation', suggestedPrefix: '113', description: 'Raw materials, WIP, finished street furniture' },
      { key: AccountSubType.CLEARING, name: 'GRNI & Clearing Accounts', suggestedPrefix: '114', description: 'Goods received clearing, transit' },
      { key: AccountSubType.PREPAID, name: 'Prepaid Expenses & Security Deposits', suggestedPrefix: '115', description: 'Advance payments, rental deposits' },
      { key: AccountSubType.FIXED_ASSET, name: 'Fixed Assets & Fabrication Plant', suggestedPrefix: '121', description: 'Machinery, tooling molds, showroom equipment' },
      { key: AccountSubType.DEPRECIATION, name: 'Accumulated Depreciation', suggestedPrefix: '122', description: 'Contra-asset reserve for wear and tear' },
      { key: AccountSubType.GST_INPUT, name: 'GST Input Tax Credits', suggestedPrefix: '213', description: 'Statutory input credits (CGST, SGST, IGST)' },
    ],
  },
  [AccountClassification.LIABILITY]: {
    name: 'Liability (2xxx)',
    normalBalance: NormalBalance.CREDIT,
    codeRange: '2000 - 2999',
    prefix: '2',
    subTypes: [
      { key: AccountSubType.PAYABLES, name: 'Accounts Payable (Creditors)', suggestedPrefix: '211', description: 'Vendor payables, timber suppliers' },
      { key: AccountSubType.GST_OUTPUT, name: 'GST Output Tax Payables', suggestedPrefix: '212', description: 'CGST, SGST, IGST collected from customers' },
      { key: AccountSubType.ACCRUED, name: 'Accrued Operational Liabilities', suggestedPrefix: '214', description: 'Outstanding contractor dues, electricity accruals' },
      { key: AccountSubType.ADVANCES, name: 'Customer Advances & Retainers', suggestedPrefix: '215', description: 'Unearned revenue, client project advance payments' },
      { key: AccountSubType.LOANS, name: 'Commercial Borrowings & Debt', suggestedPrefix: '221', description: 'Bank term loans, credit lines' },
    ],
  },
  [AccountClassification.EQUITY]: {
    name: 'Equity & Capital (3xxx)',
    normalBalance: NormalBalance.CREDIT,
    codeRange: '3000 - 3999',
    prefix: '3',
    subTypes: [
      { key: AccountSubType.CAPITAL, name: "Owner's / Paid-in Capital", suggestedPrefix: '310', description: 'Partner/founder investment into the enterprise' },
      { key: AccountSubType.RETAINED, name: 'Retained Earnings', suggestedPrefix: '320', description: 'Cumulative operational profit retained in business' },
      { key: AccountSubType.DRAWINGS, name: 'Owner Drawings & Distributions', suggestedPrefix: '330', description: 'Contra-equity partner distributions' },
    ],
  },
  [AccountClassification.REVENUE]: {
    name: 'Revenue & Income (4xxx)',
    normalBalance: NormalBalance.CREDIT,
    codeRange: '4000 - 4999',
    prefix: '4',
    subTypes: [
      { key: AccountSubType.OPERATING_REVENUE, name: 'Sales Revenue - Products', suggestedPrefix: '410', description: 'Benches, chairs, tables, planters sales' },
      { key: AccountSubType.SERVICES_REVENUE, name: 'Installation & Turnkey Services', suggestedPrefix: '420', description: 'Site setup, fabrication, design consulting' },
      { key: AccountSubType.DISCOUNTS, name: 'Discounts Allowed', suggestedPrefix: '430', description: 'Contra-revenue volume rebates given to clients' },
      { key: AccountSubType.OTHER_INCOME, name: 'Scrap & Other Income', suggestedPrefix: '440', description: 'Timber scrap sales, interest income' },
    ],
  },
  [AccountClassification.EXPENSE]: {
    name: 'Expense & COGS (5xxx)',
    normalBalance: NormalBalance.DEBIT,
    codeRange: '5000 - 5999',
    prefix: '5',
    subTypes: [
      { key: AccountSubType.COGS, name: 'Cost of Goods Sold (COGS)', suggestedPrefix: '510', description: 'Direct timber, steel, upholstery manufacturing cost' },
      { key: AccountSubType.LOGISTICS, name: 'Freight & Logistics Inward/Outward', suggestedPrefix: '520', description: 'Heavy transport, crane loading, transit fees' },
      { key: AccountSubType.SHRINKAGE, name: 'Inventory Shrinkage & Scrap Loss', suggestedPrefix: '530', description: 'Damaged materials write-off, count variances' },
      { key: AccountSubType.OPERATING_EXPENSE, name: 'Facility, Rent & Workshop Utilities', suggestedPrefix: '540', description: 'Factory rent, showroom power, maintenance' },
      { key: AccountSubType.DEPRECIATION_EXP, name: 'Depreciation Expense', suggestedPrefix: '550', description: 'Amortization of fabrication equipment' },
      { key: AccountSubType.SALES_MARKETING, name: 'Marketing, Commissions & Promotion', suggestedPrefix: '560', description: 'Exhibition booths, sales agent commissions' },
    ],
  },
};

export interface PresetAccountTemplate {
  code: string;
  name: string;
  type: AccountClassification;
  subType: AccountSubType;
  normalBalance: NormalBalance;
  description: string;
}

export const PRESET_ACCOUNT_TEMPLATES: PresetAccountTemplate[] = [
  { code: '1111', name: 'HDFC Bank - Current Operations Account', type: AccountClassification.ASSET, subType: AccountSubType.CASH_BANK, normalBalance: NormalBalance.DEBIT, description: 'Primary commercial checking account for electronic transfers' },
  { code: '1115', name: 'Petty Cash - Factory & Showroom', type: AccountClassification.ASSET, subType: AccountSubType.CASH_BANK, normalBalance: NormalBalance.DEBIT, description: 'Immediate cash register on-site for day-to-day purchases' },
  { code: '1125', name: 'Unbilled Receivables (Work in Progress)', type: AccountClassification.ASSET, subType: AccountSubType.RECEIVABLES, normalBalance: NormalBalance.DEBIT, description: 'Milestone work completed awaiting tax invoice issuance' },
  { code: '1150', name: 'Prepaid Factory Rent & Security Deposits', type: AccountClassification.ASSET, subType: AccountSubType.PREPAID, normalBalance: NormalBalance.DEBIT, description: 'Commercial premises lease security deposits' },
  { code: '2145', name: 'Electricity & Municipal Utilities Accrued', type: AccountClassification.LIABILITY, subType: AccountSubType.ACCRUED, normalBalance: NormalBalance.CREDIT, description: 'Monthly estimated power and water dues' },
  { code: '2150', name: 'Customer Advances & Turnkey Project Deposits', type: AccountClassification.LIABILITY, subType: AccountSubType.ADVANCES, normalBalance: NormalBalance.CREDIT, description: 'Upfront payments received prior to invoice issuance' },
  { code: '4410', name: 'Timber Offcuts & Sawdust Scrap Income', type: AccountClassification.REVENUE, subType: AccountSubType.OTHER_INCOME, normalBalance: NormalBalance.CREDIT, description: 'Sale of carpentry residue and metal shavings' },
  { code: '5210', name: 'Inbound Raw Material Freight', type: AccountClassification.EXPENSE, subType: AccountSubType.LOGISTICS, normalBalance: NormalBalance.DEBIT, description: 'Haulage charges for timber logs and hardware delivery' },
  { code: '5420', name: 'Showroom Interior Maintenance & Cleaning', type: AccountClassification.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, description: 'Routine cleaning, sanitation, and display repairs' },
  { code: '5610', name: 'Design Catalog & Digital Marketing', type: AccountClassification.EXPENSE, subType: AccountSubType.SALES_MARKETING, normalBalance: NormalBalance.DEBIT, description: 'Social media, architectural brochures, and trade ads' },
];

/**
 * Extracts 10-digit PAN from a standard 15-character Indian GSTIN
 * Example: 27AAACS1234H1Z5 -> AAACS1234H
 */
export function extractPanFromGstin(gstin: string): string {
  const clean = gstin.trim().toUpperCase();
  if (clean.length === 15) {
    return clean.substring(2, 12);
  }
  return '';
}

/**
 * Extracts state code (first 2 digits) from GSTIN and matches state name
 * Example: 27AAACS1234H1Z5 -> Maharashtra
 */
export function getStateFromGstin(gstin: string): IndianState | null {
  const clean = gstin.trim().toUpperCase();
  if (clean.length >= 2) {
    const code = clean.substring(0, 2);
    const found = INDIAN_STATES.find((s) => s.code === code);
    return found || null;
  }
  return null;
}

/**
 * Calculates due date string (YYYY-MM-DD) from invoice date and credit terms in days
 */
export function calculateDueDate(invoiceDate: string, days: number): string {
  try {
    const base = new Date(invoiceDate);
    if (isNaN(base.getTime())) return invoiceDate;
    base.setDate(base.getDate() + days);
    return base.toISOString().split('T')[0];
  } catch {
    return invoiceDate;
  }
}

/**
 * Generates the next available account code given existing accounts and prefix
 */
export function suggestNextAccountCode(existingCodes: string[], prefix: string, fallback: string): string {
  const matching = existingCodes
    .filter((c) => c.startsWith(prefix) && /^\d+$/.test(c))
    .map((c) => parseInt(c, 10))
    .sort((a, b) => a - b);

  if (matching.length === 0) {
    return fallback;
  }

  const highest = matching[matching.length - 1];
  const next = highest + 1;
  return String(next);
}
