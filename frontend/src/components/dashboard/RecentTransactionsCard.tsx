import React, { useState } from 'react';
import { Search, MoreVertical, Layers, CheckCircle2, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface TransactionItem {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  amount: string;
  isPositive?: boolean;
  timestamp: string;
}

interface RecentTransactionsCardProps {
  onSearchClick?: () => void;
  onItemClick?: (item: TransactionItem) => void;
}

export const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({
  onSearchClick,
  onItemClick,
}) => {
  // Default records aligned directly with the target screenshot
  const [transactions] = useState<TransactionItem[]>([
    {
      id: 'tx-1',
      name: 'Internet',
      category: 'Multimedia',
      categoryColor: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
      amount: '-$40.00',
      isPositive: false,
      timestamp: 'Today, 2:45 PM',
    },
    {
      id: 'tx-2',
      name: 'Isabelle Garcia',
      category: 'Transfer',
      categoryColor: 'bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.5)]',
      amount: '-$86.50',
      isPositive: false,
      timestamp: 'Today, 1:12 PM',
    },
    {
      id: 'tx-3',
      name: 'Sephora',
      category: 'Beauty',
      categoryColor: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]',
      amount: '-$140.80',
      isPositive: false,
      timestamp: 'Yesterday',
    },
    {
      id: 'tx-4',
      name: 'Netflix',
      category: 'Multimedia',
      categoryColor: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
      amount: '-$140.80',
      isPositive: false,
      timestamp: 'Yesterday',
    },
    {
      id: 'tx-5',
      name: 'Violet Green',
      category: 'Transfer',
      categoryColor: 'bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.5)]',
      amount: '+$600.00',
      isPositive: true,
      timestamp: 'Feb 24',
    },
  ]);

  return (
    <div className="bg-[#18181f] border border-white/[0.06] rounded-[24px] p-6 flex flex-col justify-between hover:border-white/[0.1] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-white/80" />
          <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight font-sans">
            Recent transactions
          </h2>
        </div>

        <button
          onClick={onSearchClick}
          className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#a0a0b0] hover:text-white flex items-center justify-center transition-colors"
          aria-label="Search transactions"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Transactions List */}
      <div className="mt-4 space-y-2 select-none">
        {transactions.map((tx) => (
          <motion.div
            key={tx.id}
            whileHover={{ x: 2 }}
            onClick={() => onItemClick?.(tx)}
            className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            {/* Left: Name */}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate font-sans group-hover:text-white/95">
                {tx.name}
              </div>
            </div>

            {/* Center: Category Pill with colored dot */}
            <div className="px-3 flex items-center gap-1.5 shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full ${tx.categoryColor}`} />
              <span className="text-xs text-[#8e8e9f] font-sans font-medium">
                {tx.category}
              </span>
            </div>

            {/* Right: Amount & Context Menu */}
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`text-xs sm:text-sm font-semibold font-mono ${
                  tx.isPositive ? 'text-[#c6f135]' : 'text-white/90'
                }`}
              >
                {tx.amount}
              </span>

              <button
                className="opacity-40 group-hover:opacity-100 text-[#a0a0b0] hover:text-white p-1 rounded transition-opacity"
                aria-label="Item options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer link to Items Directory */}
      <div className="pt-3 border-t border-white/[0.04] mt-2 flex items-center justify-between text-xs text-[#6d6d7e]">
        <span>5 displayed</span>
        <a
          href="/items"
          className="text-white hover:underline font-medium hover:text-[#c084fc] transition-colors"
        >
          View all in Directory &rarr;
        </a>
      </div>
    </div>
  );
};

export default RecentTransactionsCard;

