import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, Scale, HelpCircle, ArrowRight, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface AccountingRuleItem {
  type: 'Debit' | 'Credit' | string;
  account: string;
  amountDesc: string;
}

export interface ExcalidrawGuideBannerProps {
  moduleName?: string;
  module?: string;
  concept: string;
  excalidrawRule?: string;
  description?: string;
  accountingRules?: AccountingRuleItem[];
  fieldExplanation?: { field: string; note: string }[];
  relatedLinks?: { label: string; path: string }[];
  badges?: string[];
  defaultOpen?: boolean;
}

export const ExcalidrawGuideBanner: React.FC<ExcalidrawGuideBannerProps> = ({
  moduleName,
  module,
  concept,
  excalidrawRule,
  description,
  accountingRules = [],
  fieldExplanation = [],
  relatedLinks = [],
  badges = [],
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const title = moduleName || module || 'Accounting Module';
  const effectiveRule = excalidrawRule || description;

  return (
    <div className="bg-[#181820]/90 border border-white/[0.08] rounded-2xl overflow-hidden shadow-sm transition-all mb-4">
      {/* Top Banner Clickable Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#7042f4]/15 border border-[#7042f4]/30 text-[#c084fc]">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
              <span>{title}</span>
              <span className="text-[10px] font-normal text-[#8a8a9a]">• Excalidraw & Accounting Guide</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {badges.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 mr-2">
              {badges.slice(0, 2).map((b, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] text-[#a0a0b0] border border-white/[0.06]"
                >
                  {b}
                </span>
              ))}
            </div>
          )}
          <span className="text-[11px] text-[#7042f4] font-semibold hidden sm:inline">
            {isOpen ? 'Collapse Guide' : 'Learn Workflow & Rules'}
          </span>
          <div className="text-[#8a8a9a]">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expandable Explanation Body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.06] px-4 py-4 space-y-4 text-xs"
          >
            {/* Concept & Excalidraw Rule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-[#121216] border border-white/[0.04] space-y-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  Documentation Concept
                </span>
                <p className="text-neutral-300 leading-relaxed">{concept}</p>
                {description && description !== effectiveRule && (
                  <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{description}</p>
                )}
              </div>

              {effectiveRule && (
                <div className="p-3.5 rounded-xl bg-[#121216] border border-white/[0.04] space-y-1.5">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <Scale className="w-3 h-3" />
                    Excalidraw Accounting Rule
                  </span>
                  <p className="text-neutral-300 leading-relaxed">{effectiveRule}</p>
                </div>
              )}
            </div>

            {/* Accounting Entry Breakdown Table if provided */}
            {accountingRules.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#a0a0b0] block flex items-center gap-1">
                  <Scale className="w-3 h-3 text-[#c084fc]" />
                  Double-Entry Ledger Impact (Debit = Credit)
                </span>
                <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-[#121216]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.02] text-[#8a8a9a] border-b border-white/[0.06] text-[10px] uppercase font-semibold">
                      <tr>
                        <th className="py-2 px-3 w-20">Type</th>
                        <th className="py-2 px-3">Account</th>
                        <th className="py-2 px-3 text-right">Impact Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {accountingRules.map((rule, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                rule.type.toLowerCase().includes('debit')
                                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {rule.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-white">{rule.account}</td>
                          <td className="py-2 px-3 text-right text-[#a0a0b0] font-mono text-[11px]">
                            {rule.amountDesc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Badges / Workflow tags */}
            {badges.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-mono text-[#8a8a9a] mr-1 flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" /> Features:
                </span>
                {badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#7042f4]/10 text-[#c084fc] border border-[#7042f4]/20"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Field Explanations if any */}
            {fieldExplanation.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8a8a9a] block">
                  Field Computation & Mapping
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {fieldExplanation.map((f, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="font-semibold text-white block">{f.field}</span>
                      <span className="text-[11px] text-[#8a8a9a] block mt-0.5">{f.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Navigation Links */}
            {relatedLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04]">
                <span className="text-[10px] uppercase font-mono text-[#8a8a9a]">Related:</span>
                {relatedLinks.map((link, idx) => (
                  <Link
                    key={idx}
                    to={link.path}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-medium text-[#c084fc] hover:text-white transition-colors"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExcalidrawGuideBanner;
