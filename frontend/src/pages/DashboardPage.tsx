import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  Button,
  Input,
  Tooltip,
} from '@heroui/react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import api, { dashboardApi } from '../lib/api';
import { formatApiError } from '../lib/errorHandler';
import { PageTransition } from '../components/layout/PageTransition';

// Redesigned Obsidian Visual Widgets matching Expected UI
import { HeroMetricsSection } from '../components/dashboard/HeroMetricsSection';
import { DualWaveAnalyticsCard } from '../components/dashboard/DualWaveAnalyticsCard';
import { ActivityHeatmapCard } from '../components/dashboard/ActivityHeatmapCard';
import { RecentTransactionsCard } from '../components/dashboard/RecentTransactionsCard';

import {
  Radio,
  Send,
  Server,
  Zap,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SocketEventItem {
  id: string;
  event: string;
  title: string;
  time: string;
  channel: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isConnected, socket } = useSocket();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [itemsCount, setItemsCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [inProgressCount, setInProgressCount] = useState<number>(0);
  const [apiLatency, setApiLatency] = useState<number>(12);
  const [apiHealth, setApiHealth] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Realtime stream state
  const [showDeveloperStudio, setShowDeveloperStudio] = useState<boolean>(false);

  useEffect(() => {
    if (searchParams.get('broadcast') === 'true') {
      setShowDeveloperStudio(true);
    }
  }, [searchParams]);
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [recentEvents, setRecentEvents] = useState<SocketEventItem[]>([]);

  // Broadcast test states
  const [customEvent, setCustomEvent] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customChannel, setCustomChannel] = useState('items');
  const [broadcasting, setBroadcasting] = useState(false);

  const checkApiHealth = async () => {
    const start = performance.now();
    try {
      const res = await api.get('/health');
      const lat = Math.round(performance.now() - start);
      setApiLatency(lat);
      setApiHealth(res.data);
    } catch {
      setApiHealth(null);
    }
  };

  const fetchStats = async (range: 'week' | 'month' | 'year' = timeRange) => {
    setLoadingSummary(true);
    try {
      const res = await dashboardApi.getSummary({ time_range: range });
      if (res?.kpis) {
        setSummaryData(res);
        setItemsCount(res.kpis.total_items_count ?? 0);
        setCompletedCount(res.kpis.completed_count ?? 0);
        setInProgressCount(res.kpis.in_progress_count ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  useEffect(() => {
    fetchStats(timeRange);
  }, [timeRange]);

  // Socket listener for realtime stream
  useEffect(() => {
    if (!socket) return;

    const onAnyEvent = (event: string, payload: any, channel: string = 'items') => {
      if (!isStreamPaused) {
        const newEv: SocketEventItem = {
          id: Math.random().toString(36).substring(2, 9),
          event,
          title: payload?.data?.title || payload?.data?.message || payload?.message || `Event: ${event}`,
          time: new Date().toLocaleTimeString(),
          channel: payload?.channel || channel,
        };
        setRecentEvents((prev) => [newEv, ...prev.slice(0, 14)]);
      }
    };

    socket.on('item:created', (data) => {
      onAnyEvent('item:created', data, 'items');
      setItemsCount((c) => c + 1);
    });
    socket.on('item:updated', (data) => onAnyEvent('item:updated', data, 'items'));
    socket.on('item:deleted', (data) => {
      onAnyEvent('item:deleted', data, 'items');
      setItemsCount((c) => Math.max(0, c - 1));
    });
    socket.on('system:ping', (data) => onAnyEvent('system:ping', data, 'global'));

    const handleBroadcast = (data: any) => {
      if (data?.event) {
        onAnyEvent(data.event, data, data.channel || 'items');
      }
    };
    socket.on('broadcast', handleBroadcast);

    return () => {
      socket.off('item:created');
      socket.off('item:updated');
      socket.off('item:deleted');
      socket.off('system:ping');
      socket.off('broadcast');
    };
  }, [socket, isStreamPaused]);

  const sendBroadcastMessage = async (event: string, message: string, channel: string) => {
    setBroadcasting(true);
    try {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
      const res = await fetch(`${socketUrl}/api/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          channel,
          data: {
            sender: user?.name || 'Urban Furniture User',
            message,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Broadcast server returned status ${res.status}`);
      }

      const data = await res.json();
      toast.success(`Broadcast dispatched to ${data.recipients ?? 1} socket client(s).`);
    } catch (err: any) {
      toast.error('Failed to emit broadcast: ' + err.message);
    } finally {
      setBroadcasting(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEvent.trim()) return;
    await sendBroadcastMessage(customEvent, customMessage || 'Manual telemetry trigger', customChannel);
    setCustomEvent('');
    setCustomMessage('');
  };

  const filteredEvents = useMemo(() => {
    if (selectedChannelFilter === 'all') return recentEvents;
    return recentEvents.filter((ev) => ev.channel === selectedChannelFilter);
  }, [recentEvents, selectedChannelFilter]);

  const presets = [
    { label: 'Invoice Posted', event: 'invoice:posted', msg: 'Tax Invoice auto-posted to General Ledger with GST', channel: 'invoices' },
    { label: 'Payment Reconciled', event: 'payment:reconciled', msg: 'Bank receipt reconciled against AR 1120', channel: 'payments' },
    { label: 'Stock Intake (GRNI)', event: 'inventory:received', msg: 'Goods received from Azure Furniture: Dr Inventory Cr GRNI', channel: 'inventory' },
    { label: 'COGS Relieved', event: 'sales:delivered', msg: 'Delivery completed: Dr COGS 5010 Cr Inventory 1130', channel: 'sales' },
  ];

  return (
    <PageTransition>
      <div className="space-y-8 pb-8">
        {/* 1. Top Greeting & 3-Column Hero Metrics Section (Exact match to target design) */}
        <HeroMetricsSection
          onNewItem={() => navigate('/invoices')}
          onRecordPayment={() => navigate('/payments?new=true')}
          onBroadcast={() => setShowDeveloperStudio(true)}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          summaryData={summaryData}
          loading={loadingSummary}
        />

        {/* 2. Bottom 3-Card Visual Grid (Exact match to target design) */}
        <div id="analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Dual Wave Analytics Curve */}
          <DualWaveAnalyticsCard />

          {/* Card 2: Activity by Time Heatmap Matrix */}
          <ActivityHeatmapCard />

          {/* Card 3: Recent Transactions / Real-Time Items */}
          <RecentTransactionsCard
            onSearchClick={() => navigate('/invoices')}
            onItemClick={(tx) => {
              const isPayment = tx.id?.startsWith('pay-') || tx.category?.includes('Payment') || tx.category?.includes('Settlement');
              if (isPayment) {
                const payId = tx.id?.replace('pay-', '');
                navigate(`/payments?id=${payId}&search=${encodeURIComponent(tx.reference_number || '')}`);
              } else {
                const invId = tx.id?.replace('inv-', '');
                navigate(`/invoices?id=${invId}&search=${encodeURIComponent(tx.reference_number || '')}`);
              }
            }}
          />
        </div>

        {/* 3. Developer & Real-Time Socket Broadcast Console (Collapsible Obsidian Panel) */}
        <div className="pt-2">
          <button
            onClick={() => setShowDeveloperStudio(!showDeveloperStudio)}
            className="w-full py-3 px-6 rounded-2xl bg-[#18181f] border border-white/[0.06] hover:border-white/10 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#a0a0b0] hover:text-white transition-all shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-[#7042f4] animate-pulse" />
              <span>Real-Time Broadcast Studio & Telemetry Console</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.05] text-[#9090a0]">
                {recentEvents.length} events buffered &bull; {apiLatency}ms ping
              </span>
            </div>
            {showDeveloperStudio ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {showDeveloperStudio && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-4"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-[24px] bg-[#18181f] border border-white/[0.06]">
                  {/* Left: Socket Emitter Presets */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#c084fc]" />
                        Dispatch WebSocket Event
                      </h3>
                      <span className="text-xs text-[#757588]">Multi-client propagation</span>
                    </div>

                    {/* Presets Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {presets.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => sendBroadcastMessage(preset.event, preset.msg, preset.channel)}
                          disabled={broadcasting}
                          className="p-3 rounded-xl bg-[#202029] hover:bg-[#282833] border border-white/[0.04] text-left transition-all group disabled:opacity-50"
                        >
                          <div className="text-xs font-semibold text-white group-hover:text-[#c084fc] transition-colors">
                            {preset.label}
                          </div>
                          <div className="text-[10px] text-[#757588] truncate mt-0.5">
                            {preset.channel} &bull; {preset.event}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Custom event form */}
                    <form onSubmit={handleCustomSubmit} className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Event: item:updated"
                          value={customEvent}
                          onChange={(e) => setCustomEvent(e.target.value)}
                          size="sm"
                          variant="bordered"
                          className="text-xs"
                        />
                        <Input
                          placeholder="Channel: items"
                          value={customChannel}
                          onChange={(e) => setCustomChannel(e.target.value)}
                          size="sm"
                          variant="bordered"
                          className="text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Message payload (optional)"
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          size="sm"
                          variant="bordered"
                          className="flex-1 text-xs"
                        />
                        <Button
                          type="submit"
                          isLoading={broadcasting}
                          size="sm"
                          className="bg-white text-black font-bold rounded-xl px-4 text-xs hover:bg-white/90"
                          startContent={<Send className="w-3.5 h-3.5" />}
                        >
                          Emit
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Right: Live Stream Feed */}
                  <div className="lg:col-span-6 flex flex-col justify-between space-y-3 border-t lg:border-t-0 lg:border-l border-white/[0.06] lg:pl-6 pt-4 lg:pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                        Live Event Log
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setIsStreamPaused(!isStreamPaused)}
                          className="p-1.5 rounded-lg bg-white/[0.04] text-[#a0a0b0] hover:text-white"
                          title={isStreamPaused ? 'Resume' : 'Pause'}
                        >
                          {isStreamPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setRecentEvents([])}
                          className="p-1.5 rounded-lg bg-white/[0.04] text-[#a0a0b0] hover:text-white"
                          title="Clear Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {filteredEvents.length === 0 ? (
                        <div className="text-center py-6 text-xs text-[#757588]">
                          No events captured yet. Real-time events will stream here live as operations occur.
                        </div>
                      ) : (
                        filteredEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-2.5 rounded-xl bg-[#202029] border border-white/[0.03] flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-mono text-[#c084fc] font-semibold">{ev.event}</span>
                              <span className="text-[#8e8e9f] ml-2 truncate">{ev.title}</span>
                            </div>
                            <span className="text-[10px] text-[#6d6d7e] shrink-0">{ev.time}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="text-[11px] text-[#6d6d7e] flex items-center justify-between pt-2 border-t border-white/[0.04]">
                      <span>
                        {apiHealth?.database ? `${apiHealth.database.toUpperCase()} • ${apiHealth.framework || 'Laravel 11'}` : 'Real-time WebSocket'} &bull; Urban Furniture Accounting
                      </span>
                      <span className="text-emerald-400 font-mono font-semibold">{apiLatency}ms latency</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
};

export default DashboardPage;