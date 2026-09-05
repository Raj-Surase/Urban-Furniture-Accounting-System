<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RealtimeService
{
    /**
     * Broadcast an event and payload to the Socket.io realtime server.
     *
     * @param string $event Event name (e.g., 'item:created', 'notification')
     * @param array $data Data payload to broadcast
     * @param string|null $channel Optional room or channel
     * @return bool
     */
    public static function broadcast(string $event, array $data = [], ?string $channel = 'global'): bool
    {
        $url = config('services.realtime.url', env('REALTIME_SERVER_URL', 'http://127.0.0.1:3001')) . '/api/broadcast';

        try {
            $response = Http::connectTimeout(1)->timeout(2)->post($url, [
                'event' => $event,
                'data' => $data,
                'channel' => $channel,
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            // Graceful fallback: log warning, do not crash the primary API call
            Log::warning("[RealtimeService] Failed to broadcast event '{$event}': " . $e->getMessage());
            return false;
        }
    }
}

