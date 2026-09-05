import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  Home,
  FileText,
  Package,
  Shield,
  ArrowLeft,
  Search,
  ShoppingCart,
  Receipt,
  BookOpen,
  PieChart,
  Box,
  Layers,
  Sparkles,
  TrendingUp,
  CreditCard,
  Building2,
  Users
} from 'lucide-react';
import { Button, Card, Input } from '@heroui/react';
import { PageTransition } from '../components/layout/PageTransition';

interface ModuleItem {
  name: string;
  category: 'Sales' | 'Purchase' | 'Account (Master Data)' | 'Report' | 'Overview & Studio';
  path: string;
  description: string;
  aliases: string[];
  icon: React.ReactNode;
  color: string;
}

const MODULE_DIRECTORY: ModuleItem[] = [
  // Overview & Studio
  {
    name: 'Dashboard',
    category: 'Overview & Studio',
    path: '/',
    description: 'Executive KPI metrics, revenue charts, recent transactions',
    aliases: ['home', 'metrics', 'overview'],
    icon: <Home className="w-4 h-4 text-[#c084fc]" />,
    color: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  },
  {
    name: '3D Workshop Studio',
    category: 'Overview & Studio',
    path: '/workshop',
    description: 'Isometric furniture design customizer, finishes, and live quotation generator',
    aliases: ['studio', 'furniture', 'customizer', 'design', 'cad'],
    icon: <Box className="w-4 h-4 text-pink-400" />,
    color: 'border-pink-500/30 bg-pink-500/10 text-pink-300',
  },
  {
    name: 'Customer Portal',
    category: 'Overview & Studio',
    path: '/portal/invoices',
    description: 'Client invoice viewing and online Razorpay payment portal',
    aliases: ['portal', 'client-portal', 'pay-online'],
    icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
    color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },

  // Sales
  {
    name: 'Sales Orders',
    category: 'Sales',
    path: '/sales-orders',
    description: 'Quotations, order confirmations, and delivery orders',
    aliases: ['so', 'sales', 'quotes', 'orders'],
    icon: <ShoppingCart className="w-4 h-4 text-emerald-400" />,
    color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
  {
    name: 'Customer Invoices',
    category: 'Sales',
    path: '/invoices',
    description: 'Accounts Receivable (AR), GST invoice generation & payment tracking',
    aliases: ['sale-invoice', 'billing', 'customer-invoices'],
    icon: <FileText className="w-4 h-4 text-cyan-400" />,
    color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  },
  {
    name: 'Customer Receipts',
    category: 'Sales',
    path: '/payments?type=receive',
    description: 'Record inbound customer receipts and invoice reconciliations',
    aliases: ['receipts', 'incoming-payments', 'collections'],
    icon: <Receipt className="w-4 h-4 text-teal-400" />,
    color: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
  },

  // Purchase
  {
    name: 'Purchase Orders',
    category: 'Purchase',
    path: '/purchase-orders',
    description: 'Raw material procurement, RFQs, and vendor confirmation',
    aliases: ['po', 'purchases', 'rfq', 'procurement'],
    icon: <Package className="w-4 h-4 text-amber-400" />,
    color: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  {
    name: 'Vendor Bills',
    category: 'Purchase',
    path: '/bills',
    description: 'Accounts Payable (AP), vendor invoice matching and approvals',
    aliases: ['purchase-bills', 'vendor-bills', 'ap'],
    icon: <FileText className="w-4 h-4 text-orange-400" />,
    color: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  },
  {
    name: 'Vendor Payments',
    category: 'Purchase',
    path: '/payments?type=send',
    description: 'Outbound supplier disbursements, bank checks, and reconciliations',
    aliases: ['disbursements', 'outgoing-payments', 'supplier-payments'],
    icon: <CreditCard className="w-4 h-4 text-red-400" />,
    color: 'border-red-500/30 bg-red-500/10 text-red-300',
  },

  // Account (Master Data)
  {
    name: 'Contacts Master',
    category: 'Account (Master Data)',
    path: '/contacts',
    description: 'Unified customer, supplier, and partner registry with GSTIN',
    aliases: ['customers', 'vendors', 'partners', 'directory'],
    icon: <Users className="w-4 h-4 text-blue-400" />,
    color: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  },
  {
    name: 'Product Master',
    category: 'Account (Master Data)',
    path: '/products',
    description: 'Finished furniture catalog, timber inventory & valuation',
    aliases: ['catalog', 'inventory', 'items', 'materials'],
    icon: <Package className="w-4 h-4 text-indigo-400" />,
    color: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
  },
  {
    name: 'Chart of Accounts (COA)',
    category: 'Account (Master Data)',
    path: '/chart-of-accounts',
    description: 'Assets, Liabilities, Equity, Revenue, and Expense account tree',
    aliases: ['coa', 'ledger-accounts', 'nominal-accounts'],
    icon: <Layers className="w-4 h-4 text-violet-400" />,
    color: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  },
  {
    name: 'Journals Master',
    category: 'Account (Master Data)',
    path: '/journals',
    description: 'Sales, Purchase, Bank, Cash, and General Journal definitions',
    aliases: ['journal-master', 'registers'],
    icon: <BookOpen className="w-4 h-4 text-purple-400" />,
    color: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  },
  {
    name: 'Journal Entries',
    category: 'Account (Master Data)',
    path: '/journal',
    description: 'General ledger double-entry voucher audit records & reversals',
    aliases: ['journal-entries', 'vouchers', 'gl'],
    icon: <FileText className="w-4 h-4 text-fuchsia-400" />,
    color: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300',
  },
  {
    name: 'Analytic Accounts',
    category: 'Account (Master Data)',
    path: '/analytic-accounts',
    description: 'Cost centers, project dimensions, and furniture job costing',
    aliases: ['cost-centers', 'projects', 'analytical'],
    icon: <PieChart className="w-4 h-4 text-sky-400" />,
    color: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  },
  {
    name: 'Budget Master',
    category: 'Account (Master Data)',
    path: '/budgets',
    description: 'Financial budgets, analytic revisions, and practical limit enforcement',
    aliases: ['budget', 'analytical-budget', 'spending-limits'],
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    color: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },

  // Report
  {
    name: 'Balance Sheet',
    category: 'Report',
    path: '/reports/balance-sheet',
    description: 'Statement of financial position (Assets = Liabilities + Equity)',
    aliases: ['balancesheet', 'financial-position', 'statement-of-assets'],
    icon: <Building2 className="w-4 h-4 text-blue-400" />,
    color: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  },
  {
    name: 'Profit & Loss (P&L)',
    category: 'Report',
    path: '/reports/profit-loss',
    description: 'Income statement: Revenue minus Cost of Goods Sold and Operating Expenses',
    aliases: ['profit-loss', 'pnl', 'income-statement'],
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
];

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return MODULE_DIRECTORY;
    const q = searchQuery.toLowerCase();
    return MODULE_DIRECTORY.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.aliases.some((a) => a.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const categories = ['Overview & Studio', 'Sales', 'Purchase', 'Account (Master Data)', 'Report'] as const;

  return (
    <PageTransition>
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl"
        >
          <Card className="border border-white/[0.08] bg-[#121217]/95 backdrop-blur-xl shadow-[0_24px_90px_rgba(0,0,0,0.85)] rounded-[28px] p-6 sm:p-8 md:p-10 overflow-hidden">
            <div className="space-y-6">
              {/* Header banner */}
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-[#7042f4]/15 border border-[#7042f4]/30 text-[#c084fc] flex items-center justify-center shadow-lg shadow-[#7042f4]/15">
                  <Compass className="w-8 h-8 animate-spin-slow" />
                </div>

                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 mb-2">
                    HTTP 404 &bull; Route Not Found
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Looking for a module?
                  </h1>
                  <p className="text-sm text-white/50 mt-1.5 max-w-xl mx-auto leading-relaxed">
                    The requested path <code className="px-2 py-0.5 rounded bg-white/10 text-[#c084fc] text-xs font-mono">{location.pathname}</code> does not correspond to an active endpoint.
                  </p>
                </div>
              </div>

              {/* Quick Search */}
              <div className="max-w-md mx-auto">
                <Input
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  placeholder="Search modules (e.g. workshop, bills, coa, pnl, budget)..."
                  startContent={<Search className="w-4 h-4 text-white/40" />}
                  isClearable
                  variant="bordered"
                  classNames={{
                    input: 'text-sm text-white',
                    inputWrapper: 'border-white/15 bg-white/[0.03] hover:border-[#7042f4]/60 focus-within:border-[#7042f4] rounded-2xl h-11',
                  }}
                />
              </div>

              {/* Categorized Excalidraw Directory */}
              <div className="space-y-5 max-h-[380px] overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const items = filteredModules.filter((m) => m.category === cat);
                  if (items.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#c084fc]">
                          {cat}
                        </span>
                        <div className="h-px flex-1 bg-white/[0.06]" />
                        <span className="text-[10px] text-white/30 font-medium">
                          {items.length} destination{items.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {items.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-[#7042f4]/40 transition-all flex flex-col justify-between"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`p-2 rounded-xl border ${item.color} shrink-0 mt-0.5`}>
                                {item.icon}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white group-hover:text-[#c084fc] transition-colors truncate">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-white/40 line-clamp-2 leading-relaxed mt-0.5">
                                  {item.description}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-[10px] font-mono text-white/30 truncate pl-9">
                              {item.path}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {filteredModules.length === 0 && (
                  <div className="text-center py-8 text-white/40 text-xs">
                    No modules match &quot;{searchQuery}&quot;. Try searching for &quot;Sales&quot;, &quot;Workshop&quot;, &quot;Budget&quot;, or &quot;COA&quot;.
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.06]">
                <Button
                  variant="flat"
                  size="sm"
                  className="font-bold rounded-full bg-white/[0.05] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.1] active:scale-[0.98] transition-all px-4"
                  startContent={<ArrowLeft className="w-3.5 h-3.5" />}
                  onPress={() => navigate(-1)}
                >
                  Go Back
                </Button>

                <div className="flex items-center gap-2">
                  <Link to="/workshop">
                    <Button
                      size="sm"
                      variant="flat"
                      className="font-bold rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/25 hover:bg-pink-500/20 active:scale-[0.98] transition-all px-4 text-xs"
                      startContent={<Box className="w-3.5 h-3.5" />}
                    >
                      3D Workshop Studio
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button
                      size="sm"
                      className="font-bold rounded-full bg-white text-black hover:bg-white/90 shadow-md active:scale-[0.98] transition-all px-5 text-xs"
                      startContent={<Home className="w-3.5 h-3.5" />}
                    >
                      Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default NotFoundPage;

