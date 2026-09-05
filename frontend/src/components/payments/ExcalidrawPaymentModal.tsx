import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, DollarSign, Calendar, CreditCard, Building2, FileText } from 'lucide-react';
import { paymentsApi } from '../../lib/api';

export interface ExcalidrawPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: any) => void;
  invoiceId?: number;
  partnerName: string;
  partnerId?: number;
  partnerType?: 'customer' | 'vendor';
  amountDue: number;
  mode: 'bill' | 'invoice'; // 'bill' = Send, 'invoice' = Receive
}

export const ExcalidrawPaymentModal: React.FC<ExcalidrawPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  invoiceId,
  partnerName,
  amountDue,
  mode,
}) => {
  const [paymentType, setPaymentType] = useState<'send' | 'receive'>(mode === 'bill' ? 'send' : 'receive');
  const [amount, setAmount] = useState<string>(amountDue > 0 ? amountDue.toString() : '0');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentVia, setPaymentVia] = useState<'bank' | 'cash'>('bank');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please specify a valid payment amount.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        invoice_id: invoiceId,
        payment_type: paymentType,
        amount: parsedAmount,
        payment_date: paymentDate,
        payment_method: paymentVia,
        payment_method_type: paymentVia,
        notes: note || `${mode === 'bill' ? 'Vendor Bill Payment' : 'Customer Invoice Receipt'} for ${partnerName}`,
      };

      const res = await paymentsApi.create(payload);
      onSuccess(res);
      onClose();
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err?.response?.data?.message || 'Failed to record payment transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-[#18181f] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#141418]">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {mode === 'bill' ? 'Bill Payment' : 'Invoice Payment'}
              </h2>
              <p className="text-xs text-[#8a8a9a]">
                {mode === 'bill' ? 'Send funds to vendor' : 'Receive settlement from customer'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#707080] hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Payment Type */}
            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-2">
                Payment Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('send')}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    paymentType === 'send'
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm'
                      : 'bg-[#121216] border-white/[0.06] text-[#707080] hover:text-white'
                  }`}
                >
                  Send (Vendor)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('receive')}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    paymentType === 'receive'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-[#121216] border-white/[0.06] text-[#707080] hover:text-white'
                  }`}
                >
                  Receive (Customer)
                </button>
              </div>
            </div>

            {/* Partner Field */}
            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Partner
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707080]" />
                <input
                  type="text"
                  readOnly
                  value={partnerName}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-[#606070] mt-1 block">
                Autofill Partner Name from Invoice/Bill
              </span>
            </div>

            {/* Amount & Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                  Amount (₹)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707080]" />
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4] transition-all"
                    required
                  />
                </div>
                <span className="text-[10px] text-[#606070] mt-1 block">
                  Autofill Amount Due from Invoice/Bill
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707080]" />
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4] transition-all"
                    required
                  />
                </div>
                <span className="text-[10px] text-[#606070] mt-1 block">
                  Default: Today's Date
                </span>
              </div>
            </div>

            {/* Payment Via */}
            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Payment Via
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  paymentVia === 'bank'
                    ? 'bg-[#7042f4]/15 border-[#7042f4]/50 text-white'
                    : 'bg-[#121216] border-white/[0.06] text-[#808090]'
                }`}>
                  <input
                    type="radio"
                    name="paymentVia"
                    value="bank"
                    checked={paymentVia === 'bank'}
                    onChange={() => setPaymentVia('bank')}
                    className="hidden"
                  />
                  <CreditCard className="w-4 h-4 text-[#7042f4]" />
                  <span className="text-xs font-semibold">Bank Account</span>
                </label>

                <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  paymentVia === 'cash'
                    ? 'bg-[#7042f4]/15 border-[#7042f4]/50 text-white'
                    : 'bg-[#121216] border-white/[0.06] text-[#808090]'
                }`}>
                  <input
                    type="radio"
                    name="paymentVia"
                    value="cash"
                    checked={paymentVia === 'cash'}
                    onChange={() => setPaymentVia('cash')}
                    className="hidden"
                  />
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold">Cash</span>
                </label>
              </div>
              <span className="text-[10px] text-[#606070] mt-1 block">
                Default set to Bank, can be selected to Cash
              </span>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Note (Alpha Numeric)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3.5 top-3 text-[#707080]" />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional internal remark or reference"
                  rows={2}
                  className="w-full pl-10 pr-4 py-2 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#606070] focus:outline-none focus:border-[#7042f4] transition-all"
                />
              </div>
            </div>

            {/* Modal Actions matching Excalidraw */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-xs font-semibold text-[#a0a0b0] hover:text-white hover:bg-white/[0.05] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7042f4] hover:bg-[#5f32e6] text-white text-xs font-semibold shadow-lg shadow-[#7042f4]/30 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Processing...' : 'Confirm'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
