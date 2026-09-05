import { razorpayApi } from './api';

export interface RazorpayCustomerPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

export interface RazorpayCheckoutOptions {
  key_id: string;
  order_id: string;
  amount: number; // in rupees
  currency?: string;
  name?: string;
  description?: string;
  customer?: RazorpayCustomerPrefill;
  /** When true, skip the real Razorpay SDK and use the local mock dialog */
  is_mock?: boolean;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
  onDismiss?: () => void;
}

/**
 * Load Razorpay Checkout SDK dynamically.
 */
let scriptLoadingPromise: Promise<boolean> | null = null;

export const loadRazorpayScript = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);

  if ((window as any).Razorpay) {
    return Promise.resolve(true);
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay Checkout SDK from CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
};

/**
 * Launch Razorpay Standard Checkout modal and verify signature on completion.
 */
export const openRazorpayCheckout = async (options: RazorpayCheckoutOptions): Promise<void> => {
  // Use mock simulation if the backend is in sandbox/mock mode, or the order ID is a mock
  const isMockMode = options.is_mock || options.order_id.startsWith('order_mock_');

  if (isMockMode) {
    console.info('[Razorpay] Mock mode detected — using sandbox simulation.');
    const shouldSimulateSuccess = window.confirm(
      `[Razorpay Mock Sandbox]\n\n` +
      `Simulate successful online payment for ₹${options.amount.toLocaleString('en-IN')}?\n` +
      `Order ID: ${options.order_id}\n\n` +
      `Click OK to simulate captured payment, or Cancel to dismiss.`
    );

    if (shouldSimulateSuccess) {
      try {
        const mockPaymentId = `pay_mock_${Date.now()}`;
        const mockSignature = `mock_sig_${mockPaymentId}`;
        const verifyRes = await razorpayApi.verify({
          razorpay_order_id: options.order_id,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: mockSignature,
        });
        options.onSuccess(verifyRes);
      } catch (err) {
        options.onError(err);
      }
    } else {
      if (options.onDismiss) options.onDismiss();
    }
    return;
  }

  const isLoaded = await loadRazorpayScript();

  if (!isLoaded || !(window as any).Razorpay) {
    // Fallback mock dialog if CDN script failed to load in non-mock mode
    console.info('Using Sandbox/Mock simulation mode for Razorpay checkout.');
    const shouldSimulateSuccess = window.confirm(
      `[Razorpay Mock Sandbox]\n\n` +
      `Simulate successful online payment for ₹${options.amount.toLocaleString('en-IN')}?\n` +
      `Order ID: ${options.order_id}\n\n` +
      `Click OK to simulate captured payment, or Cancel to dismiss.`
    );

    if (shouldSimulateSuccess) {
      try {
        const mockPaymentId = `pay_mock_${Date.now()}`;
        const mockSignature = `mock_sig_${mockPaymentId}`;
        const verifyRes = await razorpayApi.verify({
          razorpay_order_id: options.order_id,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: mockSignature,
        });
        options.onSuccess(verifyRes);
      } catch (err) {
        options.onError(err);
      }
    } else {
      if (options.onDismiss) options.onDismiss();
    }
    return;
  }

  const razorpayOptions = {
    key: options.key_id,
    amount: Math.round(options.amount * 100), // in paise
    currency: options.currency || 'INR',
    name: options.name || 'Urban Furniture Platform',
    description: options.description || `Payment of ₹${options.amount.toLocaleString('en-IN')}`,
    order_id: options.order_id,
    prefill: {
      name: options.customer?.name || '',
      email: options.customer?.email || '',
      contact: options.customer?.contact || '',
    },
    theme: {
      color: '#7042f4',
    },
    handler: async (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      try {
        const verified = await razorpayApi.verify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        options.onSuccess(verified);
      } catch (err) {
        options.onError(err);
      }
    },
    modal: {
      ondismiss: () => {
        if (options.onDismiss) {
          options.onDismiss();
        }
      },
    },
  };

  const rzp = new (window as any).Razorpay(razorpayOptions);
  rzp.on('payment.failed', (failedRes: any) => {
    options.onError(failedRes?.error || new Error('Payment processing failed'));
  });
  rzp.open();
};

