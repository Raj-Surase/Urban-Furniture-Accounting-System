import React from 'react';
import { ShieldCheck, UserCheck, Lock, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RolePortalBannerProps {
  entityName?: string;
  customMessage?: string;
  className?: string;
}

export const RolePortalBanner: React.FC<RolePortalBannerProps> = ({
  entityName = 'Records',
  customMessage,
  className = '',
}) => {
  const { user, isAdmin, isManager, isAccountant, isCustomer, isVendor } = useAuth();

  // Elevated users don't need the scoped indicator
  if (isAdmin || isManager || isAccountant) {
    return null;
  }

  const roleTitle = isCustomer
    ? 'Customer Portal'
    : isVendor
    ? 'Vendor Portal'
    : user?.role === UserRole.USER
    ? 'Staff Workspace'
    : 'Authorized Access';

  const defaultMessage = isCustomer
    ? `Strictly scoped to your customer profile. Organization accounts & other client records are isolated.`
    : isVendor
    ? `Strictly scoped to your vendor profile. Other vendor contracts and company records are isolated.`
    : `Strictly scoped to records created by or assigned to your user account.`;

  const partnerName = user?.customer_name || user?.vendor_name || user?.company_name || user?.name;

  return (
    <div
      className={`p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-foreground dark:text-white tracking-tight">{roleTitle}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              User-Scoped ({entityName})
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground dark:text-neutral-400 mt-0.5">
            {customMessage || defaultMessage}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground dark:text-neutral-300 sm:text-right shrink-0">
        <div className="p-1.5 rounded-lg bg-card/80 dark:bg-white/[0.04] border border-border dark:border-white/[0.06] flex items-center gap-1.5 shadow-xs">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold text-foreground dark:text-white">{partnerName}</span>
          <span className="text-[9.5px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-muted dark:bg-white/[0.08] text-muted-foreground dark:text-neutral-400">
            {user?.role}
          </span>
        </div>
      </div>
    </div>
  );
};

