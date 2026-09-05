import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { dashboardApi } from '../lib/api';
import { PageTransition } from '../components/layout/PageTransition';
import { UserRole } from '../types';

// Redesigned Obsidian Visual Widgets matching Expected UI
import { HeroMetricsSection } from '../components/dashboard/HeroMetricsSection';
import { ExcalidrawDashboardCards } from '../components/dashboard/ExcalidrawDashboardCards';
import { DualWaveAnalyticsCard } from '../components/dashboard/DualWaveAnalyticsCard';
import { ActivityHeatmapCard } from '../components/dashboard/ActivityHeatmapCard';
import { RecentTransactionsCard } from '../components/dashboard/RecentTransactionsCard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [summaryData, setSummaryData] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const fetchStats = async (range: 'week' | 'month' | 'year' = timeRange) => {
    setLoadingSummary(true);
    try {
      const res = await dashboardApi.getSummary({ time_range: range });
      if (res?.kpis) {
        setSummaryData(res);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchStats(timeRange);
  }, [timeRange]);

  // Socket listener for realtime dashboard updates
  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchStats(timeRange);
    };

    socket.on('item:created', handleRefresh);
    socket.on('item:updated', handleRefresh);
    socket.on('item:deleted', handleRefresh);
    socket.on('invoice:created', handleRefresh);
    socket.on('invoice:posted', handleRefresh);
    socket.on('payment:created', handleRefresh);
    socket.on('payment:reconciled', handleRefresh);

    return () => {
      socket.off('item:created', handleRefresh);
      socket.off('item:updated', handleRefresh);
      socket.off('item:deleted', handleRefresh);
      socket.off('invoice:created', handleRefresh);
      socket.off('invoice:posted', handleRefresh);
      socket.off('payment:created', handleRefresh);
      socket.off('payment:reconciled', handleRefresh);
    };
  }, [socket, timeRange]);

  return (
    <PageTransition>
      <div className="space-y-8 pb-8">
        {/* 1. Top Greeting & 3-Column Hero Metrics Section */}
        <HeroMetricsSection
          onNewItem={() => navigate('/invoices')}
          onRecordPayment={() => navigate('/payments?new=true')}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          summaryData={summaryData}
          loading={loadingSummary}
        />

        {/* Excalidraw Operational Hub: Sales, Purchase, and Budget Reports Cards */}
        <ExcalidrawDashboardCards
          salesData={summaryData?.kpis?.sales_card}
          purchaseData={summaryData?.kpis?.purchase_card}
          budgetData={summaryData?.kpis?.budget_card}
          loading={loadingSummary}
        />

        {/* 2. Bottom 3-Card Visual Grid */}
        <div id="analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Dual Wave Analytics Curve */}
          <DualWaveAnalyticsCard />

          {/* Card 2: Activity by Time Heatmap Matrix */}
          <ActivityHeatmapCard />

          {/* Card 3: Recent Transactions / Real-Time Items */}
          <RecentTransactionsCard
            onSearchClick={() => navigate('/invoices')}
            onItemClick={(tx) => {
              const isElevated = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER || user?.role === UserRole.ACCOUNTANT;
              const isPayment = tx.id?.startsWith('pay-') || tx.category?.includes('Payment') || tx.category?.includes('Settlement');
              if (isPayment && isElevated) {
                const payId = tx.id?.replace('pay-', '');
                navigate(`/payments?id=${payId}&search=${encodeURIComponent(tx.reference_number || '')}`);
              } else {
                const invId = tx.id?.replace('inv-', '');
                navigate(`/invoices?id=${invId}&search=${encodeURIComponent(tx.reference_number || '')}`);
              }
            }}
          />
        </div>
      </div>
    </PageTransition>
  );
};

export default DashboardPage;