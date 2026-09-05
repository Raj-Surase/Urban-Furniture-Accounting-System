import React, { useEffect, useState } from 'react';
import {
  Zap,
  Search,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Receipt,
  FileText,
  X,
  CreditCard,
  Building2,
} from 'lucide-react';
import { paymentTransactionsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  PaymentTransaction,
  TransactionStatus,
  TransactionFlowType,
} from '../../types';
import { PortalModal } from '../common/PortalModal';
import { TableSkeleton } from '../common/TableSkeleton';
import { EmptyState } from '../common/EmptyState';

export const TransactionLedgerTab: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const { addToast } = useToast();

  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [flowFilter, setFlowFilter] = useState('all');

  // Detail Modal
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransaction | null>(null);

  // Refund Modal
  const [refundTxn, setRefundTxn] = useState<PaymentTransaction | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  // Syncing state
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await paymentTransactionsApi.list({ per_page: 50 });
      setTransactions(res?.data || res || []);
    } catch (err) {
      console.error('Failed to load payment transactions:', err);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Could not fetch Razorpay transactions.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSync = async (txn: PaymentTransaction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setSyncingId(txn.id);
      const res = await paymentTransactionsApi.sync(txn.id);
      addToast({
        type: 'success',
        title: 'Gateway Synchronized',
        message: res.message || `Transaction ${txn.transaction_number} synced.`,
      });
      fetchTransactions();
      if (selectedTxn && selectedTxn.id === txn.id) {
        setSelectedTxn(res.data);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Sync Failed',
        message: err?.response?.data?.message || 'Failed to sync with Razorpay.',
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleOpenRefund = (txn: PaymentTransaction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRefundTxn(txn);
    setRefundAmount(String(txn.amount));
    setRefundReason('Customer return / order cancellation');
  };

  const handleExecuteRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTxn) return;

    const numAmount = parseFloat(refundAmount);
    if (isNaN(numAmount) || numAmount <= 0 || numAmount > Number(refundTxn.amount)) {
      addToast({
        type: 'warning',
        title: 'Validation Error',
        message: `Refund amount must be between ₹0.01 and ₹${Number(refundTxn.amount).toLocaleString('en-IN')}`,
      });
      return;
    }

    if (!refundReason.trim()) {
      addToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please provide an audit reason for the refund.',
      });
      return;
    }

    try {
      setRefundLoading(true);
      const res = await paymentTransactionsApi.refund(refundTxn.id, {
        amount: numAmount,
        reason: refundReason.trim(),
      });

      addToast({
        type: 'success',
        title: 'Refund Processed',
        message: res.message || 'Refund successfully issued via Razorpay.',
      });
      setRefundTxn(null);
      fetchTransactions();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Refund Failed',
        message: err?.response?.data?.message || 'Failed to execute refund with Razorpay.',
      });
    } finally {
      setRefundLoading(false);
    }
  };

  // Metrics
  const capturedTxns = transactions.filter((t) => t.status === TransactionStatus.CAPTURED);
  const totalCapturedAmount = capturedTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalFees = capturedTxns.reduce((sum, t) => sum + Number(t.gateway_fee || 0) + Number(t.gateway_tax || 0), 0);
  const successRate = transactions.length > 0 ? Math.round((capturedTxns.length / transactions.length) * 100) : 100;

  // Filtering
  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.transaction_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.razorpay_order_id && t.razorpay_order_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.razorpay_payment_id && t.razorpay_payment_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.party_name && t.party_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesFlow = flowFilter === 'all' || t.flow_type === flowFilter;

    return matchesSearch && matchesStatus && matchesFlow;
  });

  return (
    <div className="space-y-5">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#18181f] border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8a8a9a] font-medium">Online Collections</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-2">
            ₹{totalCapturedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">
            {capturedTxns.length} settlements settled
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#18181f] border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8a8a9a] font-medium">Success Rate</span>
            <div className="w-8 h-8 rounded-lg bg-[#7042f4]/10 border border-[#7042f4]/20 flex items-center justify-center text-[#c084fc]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-2">
            {successRate}%
          </div>
          <span className="text-[10px] text-[#8a8a9a] mt-1 block">
            Across {transactions.length} total attempts
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#18181f] border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8a8a9a] font-medium">Gateway Fees & Tax</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-2">
            ₹{totalFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#8a8a9a] mt-1 block">
            Deducted by Razorpay
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#18181f] border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8a8a9a] font-medium">Pending Reconciliation</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-2">
            {transactions.filter((t) => t.status === TransactionStatus.ORDER_CREATED).length}
          </div>
          <span className="text-[10px] text-indigo-400 mt-1 block">
            Orders awaiting client completion
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 bg-[#141418] border border-white/[0.08] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#707080]" />
            <input
              type="text"
              placeholder="Search TXN #, Order, Payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-xl text-xs text-white placeholder-[#707080] focus:outline-none focus:border-[#7042f4]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-xl text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value={TransactionStatus.CAPTURED}>Captured (Paid)</option>
            <option value={TransactionStatus.ORDER_CREATED}>Order Created (Pending)</option>
            <option value={TransactionStatus.FAILED}>Failed</option>
            <option value={TransactionStatus.REFUNDED}>Refunded</option>
          </select>

          <select
            value={flowFilter}
            onChange={(e) => setFlowFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#1a1a22] border border-white/10 rounded-xl text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">All Flow Types</option>
            <option value={TransactionFlowType.INVOICE_SETTLEMENT}>Invoice Settlement</option>
            <option value={TransactionFlowType.SALES_ORDER_ADVANCE}>Sales Order Advance</option>
            <option value={TransactionFlowType.REFUND}>Refund</option>
          </select>
        </div>

        <button
          onClick={fetchTransactions}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#a0a0b0] hover:text-white border border-white/10 transition-all self-end sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#141418] border border-white/[0.06] rounded-2xl overflow-hidden shadow-obsidian-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10.5px] font-semibold text-[#8a8a9a] uppercase tracking-wider">
                <th className="py-3 px-4">Txn #</th>
                <th className="py-3 px-4">Flow & Direction</th>
                <th className="py-3 px-4">Client / Party</th>
                <th className="py-3 px-4">Source Reference</th>
                <th className="py-3 px-4">Gateway IDs</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <TableSkeleton rows={5} cols={8} />
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={Zap}
                  colSpan={8}
                  title="No gateway transactions recorded"
                  description="Online customer collections and Razorpay transactions will appear here."
                />
              ) : (
                filtered.map((t) => {
                  const isCaptured = t.status === TransactionStatus.CAPTURED;
                  const isFailed = t.status === TransactionStatus.FAILED;
                  const isRefunded = t.status === TransactionStatus.REFUNDED;
                  const isPending = t.status === TransactionStatus.ORDER_CREATED || t.status === TransactionStatus.INITIATED;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTxn(t)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white group-hover:text-[#a855f7] transition-colors">
                        {t.transaction_number}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#7042f4]/15 text-[#c084fc] border border-[#7042f4]/30">
                          {t.flow_type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-200">
                        {t.party_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#a0a0b0]">
                        {t.source_label || 'Direct'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-neutral-400">
                        {t.razorpay_payment_id ? (
                          <div className="text-emerald-400 font-semibold">{t.razorpay_payment_id}</div>
                        ) : (
                          <div className="text-[#8a8a9a]">{t.razorpay_order_id || 'N/A'}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        ₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        {Number(t.gateway_fee) > 0 && (
                          <div className="text-[9.5px] text-[#707080] font-normal">
                            Fee: ₹{Number(t.gateway_fee).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            isCaptured
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : isRefunded
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : isFailed
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={(e) => handleSync(t, e)}
                              disabled={syncingId === t.id}
                              className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors"
                              title="Sync status with Razorpay"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${syncingId === t.id ? 'animate-spin' : ''}`} />
                            </button>
                          )}

                          {isCaptured && (isAdmin || isManager) && (
                            <button
                              onClick={(e) => handleOpenRefund(t, e)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[10.5px] font-semibold transition-colors"
                              title="Issue Razorpay Refund"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Refund</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <PortalModal
        isOpen={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        zIndex="z-[60]"
        containerClassName="max-w-xl"
      >
        {selectedTxn && (
          <div className="relative w-full bg-[#141418] border border-neutral-800 rounded-2xl shadow-2xl p-6 text-white space-y-5">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">
                    {selectedTxn.transaction_number}
                  </span>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      selectedTxn.status === TransactionStatus.CAPTURED
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : selectedTxn.status === TransactionStatus.REFUNDED
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : selectedTxn.status === TransactionStatus.FAILED
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {selectedTxn.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Razorpay Online Transaction
                </h3>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount Banner */}
            <div className="p-4 rounded-xl border border-[#7042f4]/30 bg-[#7042f4]/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#c084fc] tracking-wider">
                  Settled Volume
                </span>
                <div className="text-2xl font-mono font-extrabold text-white mt-0.5">
                  ₹{Number(selectedTxn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right font-mono text-xs text-[#a0a0b0]">
                <div>Gateway Fee: ₹{Number(selectedTxn.gateway_fee || 0).toFixed(2)}</div>
                <div>GST: ₹{Number(selectedTxn.gateway_tax || 0).toFixed(2)}</div>
              </div>
            </div>

            {/* Audit Grid */}
            <div className="grid grid-cols-2 gap-3 bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl text-xs">
              <div>
                <span className="text-[#707080]">Client / Party:</span>
                <div className="font-semibold text-white mt-0.5">{selectedTxn.party_name}</div>
              </div>
              <div>
                <span className="text-[#707080]">Source Document:</span>
                <div className="font-mono text-white mt-0.5">{selectedTxn.source_label || 'Direct'}</div>
              </div>
              <div>
                <span className="text-[#707080]">Razorpay Order ID:</span>
                <div className="font-mono text-[#c084fc] mt-0.5 select-all">
                  {selectedTxn.razorpay_order_id || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-[#707080]">Razorpay Payment ID:</span>
                <div className="font-mono text-emerald-400 mt-0.5 select-all">
                  {selectedTxn.razorpay_payment_id || 'Pending Completion'}
                </div>
              </div>
              <div>
                <span className="text-[#707080]">Date Initiated:</span>
                <div className="font-mono text-neutral-300 mt-0.5">
                  {selectedTxn.created_at ? new Date(selectedTxn.created_at).toLocaleString() : 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-[#707080]">General Ledger Voucher:</span>
                <div className="font-mono text-emerald-300 mt-0.5">
                  {selectedTxn.payment?.payment_number || 'Pending'}
                </div>
              </div>
            </div>

            {/* Metadata / Error message */}
            {selectedTxn.error_description && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                <span className="font-bold">Gateway Error:</span> {selectedTxn.error_description}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              {selectedTxn.status === TransactionStatus.ORDER_CREATED ? (
                <button
                  onClick={() => handleSync(selectedTxn)}
                  disabled={syncingId === selectedTxn.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingId === selectedTxn.id ? 'animate-spin' : ''}`} />
                  <span>Sync Status with Razorpay</span>
                </button>
              ) : selectedTxn.status === TransactionStatus.CAPTURED && (isAdmin || isManager) ? (
                <button
                  onClick={() => {
                    setSelectedTxn(null);
                    handleOpenRefund(selectedTxn);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Issue Refund</span>
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-xs font-medium text-neutral-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </PortalModal>

      {/* Refund Modal */}
      <PortalModal
        isOpen={!!refundTxn}
        onClose={() => setRefundTxn(null)}
        zIndex="z-[70]"
        containerClassName="max-w-md"
      >
        {refundTxn && (
          <form onSubmit={handleExecuteRefund} className="p-6 bg-[#18181f] border border-white/10 rounded-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Execute Gateway Refund</h3>
              </div>
              <button
                type="button"
                onClick={() => setRefundTxn(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8a8a9a]">
              Initiate a refund for <strong className="text-white">{refundTxn.transaction_number}</strong> back to the customer's original payment method via Razorpay.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1">
                Refund Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                max={Number(refundTxn.amount)}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full px-3 py-2 bg-[#121216] border border-white/10 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                required
              />
              <span className="text-[10px] text-[#707080] mt-1 block">
                Max refundable: ₹{Number(refundTxn.amount).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1">
                Audit Reason
              </label>
              <textarea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Reason for refund (customer requested return, etc.)"
                className="w-full px-3 py-2 bg-[#121216] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setRefundTxn(null)}
                disabled={refundLoading}
                className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={refundLoading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{refundLoading ? 'Processing Refund...' : 'Confirm Refund'}</span>
              </button>
            </div>
          </form>
        )}
      </PortalModal>
    </div>
  );
};

