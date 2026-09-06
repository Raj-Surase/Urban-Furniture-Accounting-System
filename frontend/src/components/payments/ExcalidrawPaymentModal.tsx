import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, DollarSign, Calendar, CreditCard, Building2, FileText, Zap, Printer, Mail } from 'lucide-react';
import { paymentsApi, razorpayApi } from '../../lib/api';
import { openRazorpayCheckout } from '../../lib/razorpay';
import { ContactType, PaymentType, PaymentMethod, InvoiceType } from '../../types';

export interface ExcalidrawPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: any) => void;
  invoiceId?: number;
  partnerName: string;
  partnerId?: number;
  partnerType?: ContactType;
  amountDue: number;
  mode: InvoiceType; // InvoiceType.BILL = Send, InvoiceType.INVOICE = Receive
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
  const isReceivable = mode !== InvoiceType.BILL;
  const [paymentType, setPaymentType] = useState<PaymentType.SEND | PaymentType.RECEIVE>(mode === InvoiceType.BILL ? PaymentType.SEND : PaymentType.RECEIVE);
  const [amount, setAmount] = useState<string>(amountDue > 0 ? amountDue.toString() : '0');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentVia, setPaymentVia] = useState<PaymentMethod>(isReceivable ? PaymentMethod.RAZORPAY : PaymentMethod.BANK);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Voucher - ${partnerName}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111; }
              .header { border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px; }
              .title { font-size: 22px; font-weight: bold; margin: 0; }
              .meta { font-size: 13px; color: #666; margin-top: 4px; }
              .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .details-table td { padding: 8px 0; border-bottom: 1px solid #eee; }
              .label { font-weight: 600; width: 40%; }
              .amount { font-size: 18px; font-weight: bold; color: #16a34a; }
              .footer { margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">Urban Furniture — Official Payment Voucher</h1>
              <div class="meta">Receipt Date: ${paymentDate}</div>
            </div>
            <table class="details-table">
              <tr><td class="label">Partner / Party:</td><td>${partnerName}</td></tr>
              <tr><td class="label">Payment Type:</td><td>${paymentType === PaymentType.RECEIVE ? 'Receipt (Inward Payment)' : 'Disbursement (Outward Payment)'}</td></tr>
              <tr><td class="label">Payment Method:</td><td>${paymentVia.toUpperCase()}</td></tr>
              <tr><td class="label">Amount Settled:</td><td class="amount">₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
              <tr><td class="label">Reference / Note:</td><td>${note || 'N/A'}</td></tr>
              ${invoiceId ? `<tr><td class="label">Associated Document ID:</td><td>#${invoiceId}</td></tr>` : ''}
            </table>
            <div class="footer">
              Generated automatically by Urban Furniture Accounting ERP Platform. This is an authentic computer-generated voucher.
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleSendMail = () => {
    const subject = encodeURIComponent(`Payment Voucher: ${partnerName} - ₹${Number(amount || 0).toLocaleString('en-IN')}`);
    const body = encodeURIComponent(
      `Hello ${partnerName},\n\nPlease find the payment details below:\n\n` +
      `Amount: ₹${Number(amount || 0).toLocaleString('en-IN')}\n` +
      `Date: ${paymentDate}\n` +
      `Method: ${paymentVia.toUpperCase()}\n` +
      `Type: ${paymentType === PaymentType.RECEIVE ? 'Receipt (Inward)' : 'Payment (Outward)'}\n` +
      (invoiceId ? `Document Reference: #${invoiceId}\n` : '') +
      (note ? `Notes: ${note}\n` : '') +
      `\nThank you,\nUrban Furniture Accounting Team`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

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

    if (paymentVia === PaymentMethod.RAZORPAY) {
      if (!invoiceId) {
        setError('An invoice is required for Razorpay online settlement.');
        setLoading(false);
        return;
      }

      try {
        const orderRes = await razorpayApi.createOrder({
          invoice_id: invoiceId,
          amount: parsedAmount,
        });

        const { order, key_id, customer, is_mock } = orderRes.data;

        await openRazorpayCheckout({
          key_id: key_id,
          order_id: order.id,
          amount: parsedAmount,
          currency: 'INR',
          is_mock: is_mock,
          name: 'Urban Furniture Platform',
          description: `Settlement for ${partnerName}`,
          customer: customer,
          onSuccess: (verifiedRes) => {
            onSuccess(verifiedRes);
            onClose();
          },
          onError: (checkoutErr) => {
            console.error('Razorpay checkout error:', checkoutErr);
            setError(checkoutErr?.description || checkoutErr?.message || 'Razorpay payment was cancelled or failed.');
            setLoading(false);
          },
          onDismiss: () => {
            setLoading(false);
          },
        });
      } catch (err: any) {
        console.error('Razorpay order initiation failed:', err);
        setError(err?.response?.data?.message || 'Failed to initiate Razorpay payment.');
        setLoading(false);
      }
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
        notes: note || `${mode === InvoiceType.BILL ? 'Vendor Bill Payment' : 'Customer Invoice Receipt'} for ${partnerName}`,
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
                {mode === InvoiceType.BILL ? 'Bill Payment' : 'Invoice Payment'}
              </h2>
              <p className="text-xs text-[#8a8a9a]">
                {mode === InvoiceType.BILL ? 'Send funds to vendor' : 'Receive settlement from customer'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#8a8a9a] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
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
                  onClick={() => setPaymentType(PaymentType.SEND)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    paymentType === PaymentType.SEND
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm'
                      : 'bg-[#121216] border-white/[0.06] text-[#707080] hover:text-white'
                  }`}
                >
                  Send (Vendor)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType(PaymentType.RECEIVE)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    paymentType === PaymentType.RECEIVE
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
                Payment Method
              </label>
              <div className={`grid ${isReceivable ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'} gap-2.5`}>
                {isReceivable && (
                  <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    paymentVia === PaymentMethod.RAZORPAY
                      ? 'bg-gradient-to-r from-[#7042f4]/20 to-[#9333ea]/20 border-[#7042f4] text-white shadow-sm ring-1 ring-[#7042f4]/30'
                      : 'bg-[#121216] border-white/[0.06] text-[#808090] hover:text-white'
                  }`}>
                    <input
                      type="radio"
                      name="paymentVia"
                      value={PaymentMethod.RAZORPAY}
                      checked={paymentVia === PaymentMethod.RAZORPAY}
                      onChange={() => setPaymentVia(PaymentMethod.RAZORPAY)}
                      className="hidden"
                    />
                    <Zap className="w-4 h-4 text-[#a855f7] shrink-0" />
                    <div>
                      <div className="text-xs font-bold leading-none">Razorpay</div>
                      <span className="text-[9.5px] text-[#8a8a9a]">UPI / Cards / Netbanking</span>
                    </div>
                  </label>
                )}

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  paymentVia === PaymentMethod.BANK
                    ? 'bg-[#7042f4]/15 border-[#7042f4]/50 text-white'
                    : 'bg-[#121216] border-white/[0.06] text-[#808090] hover:text-white'
                }`}>
                  <input
                    type="radio"
                    name="paymentVia"
                    value={PaymentMethod.BANK}
                    checked={paymentVia === PaymentMethod.BANK}
                    onChange={() => setPaymentVia(PaymentMethod.BANK)}
                    className="hidden"
                  />
                  <CreditCard className="w-4 h-4 text-[#7042f4] shrink-0" />
                  <div>
                    <div className="text-xs font-semibold leading-none">Bank Account</div>
                    <span className="text-[9.5px] text-[#8a8a9a]">Direct transfer / NEFT</span>
                  </div>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  paymentVia === PaymentMethod.CASH
                    ? 'bg-[#7042f4]/15 border-[#7042f4]/50 text-white'
                    : 'bg-[#121216] border-white/[0.06] text-[#808090] hover:text-white'
                }`}>
                  <input
                    type="radio"
                    name="paymentVia"
                    value={PaymentMethod.CASH}
                    checked={paymentVia === PaymentMethod.CASH}
                    onChange={() => setPaymentVia(PaymentMethod.CASH)}
                    className="hidden"
                  />
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold leading-none">Cash</div>
                    <span className="text-[9.5px] text-[#8a8a9a]">Counter voucher</span>
                  </div>
                </label>
              </div>
              <span className="text-[10px] text-[#606070] mt-1 block">
                {isReceivable
                  ? 'Select Razorpay for instant online checkout via UPI, Cards, and Netbanking.'
                  : 'Select disbursement account channel for vendor settlement.'}
              </span>

              {paymentVia === PaymentMethod.RAZORPAY && parseFloat(amount || '0') > 100000 && (
                <div className="mt-2.5 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] leading-relaxed flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span>⚠️ Razorpay Test Mode Limit</span>
                  </div>
                  <div>
                    Razorpay sandbox caps single test transactions at ₹1,00,000. Transactions above ₹1,00,000 (such as ₹{Number(amount || 0).toLocaleString('en-IN')}) will fail with <em>"Amount exceeds maximum amount allowed"</em>.
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAmount('50000')}
                      className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-medium rounded-md transition-colors"
                    >
                      Set to ₹50,000 (Partial Test)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmount('100000')}
                      className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-medium rounded-md transition-colors"
                    >
                      Set to ₹1,00,000 (Max Test)
                    </button>
                  </div>
                </div>
              )}
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

            {/* Modal Actions matching Excalidraw (Option: 1. Print, 2. Send from Mail) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-[#a0a0b0] hover:text-white transition-all"
                  title="Print Official Payment Voucher"
                >
                  <Printer className="w-3.5 h-3.5 text-purple-400" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleSendMail}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-[#a0a0b0] hover:text-white transition-all"
                  title="Send Voucher Details via Email"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  Send (Mail)
                </button>
              </div>

              <div className="flex items-center gap-3">
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
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-semibold shadow-lg transition-all disabled:opacity-50 ${
                    paymentVia === PaymentMethod.RAZORPAY
                      ? 'bg-gradient-to-r from-[#7042f4] to-[#9333ea] hover:from-[#5f32e6] hover:to-[#7e22ce] shadow-[#7042f4]/30'
                      : 'bg-[#7042f4] hover:bg-[#5f32e6] shadow-[#7042f4]/30'
                  }`}
                >
                  {paymentVia === PaymentMethod.RAZORPAY ? (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>{loading ? 'Opening Checkout...' : `Pay ₹${Number(amount || 0).toLocaleString('en-IN')} with Razorpay`}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{loading ? 'Processing...' : 'Confirm'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
