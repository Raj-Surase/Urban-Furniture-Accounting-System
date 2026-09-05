import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardApi } from '../../lib/api';

export interface TransactionItem {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  amount: string;
  raw_amount?: number;
  isPositive?: boolean;
  timestamp: string;
  created_at?: string;
  status?: string;
  reference_number?: string;
  type?: string;
}

interface RecentTransactionsCardProps {
  onSearchClick?: () => void;
  onItemClick?: (item: TransactionItem) => void;
}

export const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({
  onSearchClick,
  onItemClick,
}) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    dashboardApi.getTransactions()
      .then((res) => {
        if (isMounted) {
          if (Array.isArray(res?.data)) {
            setTransactions(res.data);
          } else {
            setTransactions([]);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch recent transactions:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleItemClick = (tx: TransactionItem) => {
    if (onItemClick) {
      onItemClick(tx);
    } else {
      navigate('/invoices');
    }
  };

  return (
    <div className="bg-[#18181f] border border-white/[0.06] rounded-[24px] p-6 flex flex-col justify-between hover:border-white/[0.1] transition-all duration-300 min-h-[340px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-white/80" />
          <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight font-sans">
            Recent transactions
          </h2>
        </div>

        <button
          onClick={onSearchClick || (() => navigate('/invoices'))}
          className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#a0a0b0] hover:text-white flex items-center justify-center transition-colors"
          aria-label="Search transactions"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Transactions List */}
      <div className="mt-4 space-y-2 select-none flex-1">
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] animate-pulse">
                <div className="h-4 w-28 bg-white/10 rounded" />
                <div className="h-4 w-20 bg-white/10 rounded-full" />
                <div className="h-4 w-16 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#757588]">
            No recent transactions found. Create an invoice or bill to get started.
          </div>
        ) : (
          transactions.map((tx) => (
            <motion.div
              key={tx.id}
              whileHover={{ x: 2 }}
              onClick={() => handleItemClick(tx)}
              className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              {/* Left: Name & reference */}
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-sm font-semibold text-white truncate font-sans group-hover:text-white/95">
                  {tx.name}
                </div>
                <div className="text-[10px] text-[#6d6d7e] truncate font-mono">
                  {tx.timestamp} {tx.reference_number ? `• ${tx.reference_number}` : ''}
                </div>
              </div>

              {/* Center: Category Pill with colored dot */}
              <div className="px-2 flex items-center gap-1.5 shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${tx.categoryColor}`} />
                <span className="text-xs text-[#8e8e9f] font-sans font-medium">
                  {tx.category}
                </span>
              </div>

              {/* Right: Amount & Context Menu */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs sm:text-sm font-semibold font-mono ${
                    tx.isPositive ? 'text-[#c6f135]' : 'text-rose-400'
                  }`}
                >
                  {tx.amount}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/invoices');
                  }}
                  className="opacity-40 group-hover:opacity-100 text-[#a0a0b0] hover:text-white p-1 rounded transition-opacity"
                  aria-label="Item options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer link to Invoices & Bills */}
      <div className="pt-3 border-t border-white/[0.04] mt-2 flex items-center justify-between text-xs text-[#6d6d7e]">
        <span>{transactions.length} displayed</span>
        <button
          onClick={() => navigate('/invoices')}
          className="text-white hover:underline font-medium hover:text-[#c084fc] transition-colors"
        >
          View all in Invoices & Bills &rarr;
        </button>
      </div>
    </div>
  );
};

export default RecentTransactionsCard;
