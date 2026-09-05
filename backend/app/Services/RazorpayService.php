<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RazorpayService
{
    protected string $keyId;
    protected string $keySecret;
    protected string $webhookSecret;
    protected bool $isMock;

    public function __construct()
    {
        $this->keyId = config('services.razorpay.key_id', 'rzp_test_mockKey99999');
        $this->keySecret = config('services.razorpay.key_secret', 'mockSecret88888');
        $this->webhookSecret = config('services.razorpay.webhook_secret', 'mockWebhookSecret77777');
        $sandboxMock = config('services.razorpay.sandbox_mock', true);

        // Auto-enable mock if explicitly set or if key has mock prefix
        $this->isMock = (bool) $sandboxMock || str_contains($this->keyId, 'mock');
    }

    public function getKeyId(): string
    {
        return $this->keyId;
    }

    public function isMockMode(): bool
    {
        return $this->isMock;
    }

    /**
     * Create a Razorpay Order.
     *
     * @param  float   $amountInRupees
     * @param  string  $currency
     * @param  string  $receipt
     * @param  array   $notes
     * @return array
     */
    public function createOrder(float $amountInRupees, string $currency = 'INR', string $receipt = '', array $notes = []): array
    {
        $amountInPaise = (int) round($amountInRupees * 100);

        if ($this->isMock) {
            $orderId = 'order_mock_' . bin2hex(random_bytes(7));
            return [
                'id' => $orderId,
                'entity' => 'order',
                'amount' => $amountInPaise,
                'amount_paid' => 0,
                'amount_due' => $amountInPaise,
                'currency' => strtoupper($currency),
                'receipt' => $receipt ?: ('REC-' . time()),
                'status' => 'created',
                'attempts' => 0,
                'notes' => $notes,
                'created_at' => time(),
            ];
        }

        $response = Http::withBasicAuth($this->keyId, $this->keySecret)
            ->baseUrl('https://api.razorpay.com/v1')
            ->timeout(15)
            ->post('/orders', [
                'amount' => $amountInPaise,
                'currency' => strtoupper($currency),
                'receipt' => $receipt,
                'notes' => $notes,
            ]);

        if ($response->failed()) {
            Log::error('Razorpay order creation failed', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
            throw new \RuntimeException($response->json('error.description') ?? 'Failed to initiate Razorpay order.');
        }

        return $response->json();
    }

    /**
     * Verify payment signature from checkout completion.
     *
     * @param  string  $orderId
     * @param  string  $paymentId
     * @param  string  $signature
     * @return bool
     */
    public function verifyPaymentSignature(string $orderId, string $paymentId, string $signature): bool
    {
        if (empty($orderId) || empty($paymentId) || empty($signature)) {
            return false;
        }

        $expectedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $this->keySecret);

        if (hash_equals($expectedSignature, $signature)) {
            return true;
        }

        // Mock fallback check
        if ($this->isMock && ($signature === 'mock_sig_' . $paymentId || $signature === 'mock_signature_valid')) {
            return true;
        }

        return false;
    }

    /**
     * Verify webhook signature from Razorpay header.
     *
     * @param  string  $rawPayload
     * @param  string  $signatureHeader
     * @return bool
     */
    public function verifyWebhookSignature(string $rawPayload, string $signatureHeader): bool
    {
        if (empty($rawPayload) || empty($signatureHeader)) {
            return false;
        }

        $expectedSignature = hash_hmac('sha256', $rawPayload, $this->webhookSecret);

        if (hash_equals($expectedSignature, $signatureHeader)) {
            return true;
        }

        if ($this->isMock && $signatureHeader === 'mock_webhook_signature') {
            return true;
        }

        return false;
    }

    /**
     * Fetch payment details by payment ID.
     *
     * @param  string  $paymentId
     * @return array
     */
    public function fetchPayment(string $paymentId): array
    {
        if ($this->isMock) {
            return [
                'id' => $paymentId,
                'entity' => 'payment',
                'amount' => 100000,
                'currency' => 'INR',
                'status' => 'captured',
                'order_id' => 'order_mock_' . bin2hex(random_bytes(7)),
                'method' => 'card',
                'card' => [
                    'network' => 'Visa',
                    'last4' => '4242',
                    'type' => 'credit',
                ],
                'fee' => 236, // 2% + 18% GST in paise
                'tax' => 36,
                'created_at' => time(),
            ];
        }

        $response = Http::withBasicAuth($this->keyId, $this->keySecret)
            ->baseUrl('https://api.razorpay.com/v1')
            ->timeout(15)
            ->get("/payments/{$paymentId}");

        if ($response->failed()) {
            throw new \RuntimeException($response->json('error.description') ?? 'Failed to fetch Razorpay payment.');
        }

        return $response->json();
    }

    /**
     * Fetch order details by order ID.
     *
     * @param  string  $orderId
     * @return array
     */
    public function fetchOrder(string $orderId): array
    {
        if ($this->isMock) {
            return [
                'id' => $orderId,
                'entity' => 'order',
                'amount' => 100000,
                'amount_paid' => 100000,
                'amount_due' => 0,
                'currency' => 'INR',
                'status' => 'paid',
                'attempts' => 1,
            ];
        }

        $response = Http::withBasicAuth($this->keyId, $this->keySecret)
            ->baseUrl('https://api.razorpay.com/v1')
            ->timeout(15)
            ->get("/orders/{$orderId}");

        if ($response->failed()) {
            throw new \RuntimeException($response->json('error.description') ?? 'Failed to fetch Razorpay order.');
        }

        return $response->json();
    }

    /**
     * Refund a captured payment.
     *
     * @param  string      $paymentId
     * @param  float|null  $amountInRupees
     * @param  array       $notes
     * @return array
     */
    public function refundPayment(string $paymentId, ?float $amountInRupees = null, array $notes = []): array
    {
        $payload = ['notes' => $notes];
        if ($amountInRupees !== null && $amountInRupees > 0) {
            $payload['amount'] = (int) round($amountInRupees * 100);
        }

        if ($this->isMock) {
            $refundId = 'rfnd_mock_' . bin2hex(random_bytes(7));
            return [
                'id' => $refundId,
                'entity' => 'refund',
                'amount' => isset($payload['amount']) ? $payload['amount'] : 100000,
                'currency' => 'INR',
                'payment_id' => $paymentId,
                'status' => 'processed',
                'notes' => $notes,
                'created_at' => time(),
            ];
        }

        $response = Http::withBasicAuth($this->keyId, $this->keySecret)
            ->baseUrl('https://api.razorpay.com/v1')
            ->timeout(15)
            ->post("/payments/{$paymentId}/refund", $payload);

        if ($response->failed()) {
            throw new \RuntimeException($response->json('error.description') ?? 'Failed to process Razorpay refund.');
        }

        return $response->json();
    }
}

