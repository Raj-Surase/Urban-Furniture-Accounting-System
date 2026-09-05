import React, { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import { formatApiError } from '../lib/errorHandler';
import {
  Card,
  CardBody,
  Progress,
  Button,
  Tabs,
  Tab,
  Divider,
  Select,
  SelectItem,
  Badge,
} from '@heroui/react';
import { Spinner } from '../components/ui/Spinner';
import { PageTransition } from '../components/layout/PageTransition';
import { PortalModal } from '../components/common/PortalModal';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  ShieldCheck,
  Users,
  Layers,
  RefreshCw,
  Cpu,
  Server,
  CheckCircle2,
  Lock,
  AlertTriangle,
  UserCheck,
  Shield,
  Clock,
  XCircle,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);

  // Manager Onboarding State
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    temporary_password?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { toast } = useToast();

  const handleOnboardManager = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsOnboarding(true);
      const res = await api.post('/admin/onboard-manager', {
        name: managerName,
        email: managerEmail,
        phone: managerPhone,
      });
      toast.success('Manager onboarded! Random password generated and dispatched.');
      setGeneratedCredentials({
        email: managerEmail,
        temporary_password: res.data.temporary_password,
      });
      setManagerName('');
      setManagerEmail('');
      setManagerPhone('');
      fetchAdminData();
    } catch (err: unknown) {
      const formatted = formatApiError(err);
      toast.error(formatted.message);
    } finally {
      setIsOnboarding(false);
    }
  };

  const fetchAdminData = useCallback(async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/users'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.data || []);
      setError(null);
    } catch (err: unknown) {
      const formatted = formatApiError(err);
      setError(formatted.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
    toast.info('Refreshing admin telemetry & user directory...');
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const res = await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(res.data.message || `Role updated to ${newRole}`);
      window.dispatchEvent(new CustomEvent('auth:role-updated'));
    } catch (err: unknown) {
      const formatted = formatApiError(err);
      toast.error(formatted.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const rolesMatrix = [
    {
      role: 'Admin (Business Owner)',
      key: UserRole.ADMIN,
      badge: 'Level 3 Clearance',
      color: 'primary',
      description: 'Full business owner access across financial master data, transaction approvals, tax governance, and user role clearance.',
      permissions: [
        'Full Master Data & Transaction Controls',
        'Approve Sales Orders, Purchase Orders & Invoices',
        'Manage Chart of Accounts, Journal Entries & Tax Policies',
        'Assign & Modify User Roles (Accountant / Contact)',
      ],
    },
    {
      role: 'Invoicing User (Accountant)',
      key: UserRole.MANAGER,
      badge: 'Level 2 Clearance',
      color: 'warning',
      description: 'Accountant access for recording orders, creating invoices & bills, posting ledger adjustments, and generating financial reports.',
      permissions: [
        'Create & Manage Invoices, Bills & Receipts',
        'Issue Sales Orders & Purchase Orders',
        'View Chart of Accounts, Ledgers & Balance Sheet',
        'Protected from User Role Reassignments',
      ],
    },
    {
      role: 'Contact (Customer / Vendor)',
      key: UserRole.USER,
      badge: 'Level 1 Clearance',
      color: 'default',
      description: 'Portal access for buyers and vendors to view their own tax invoices/bills and record payments.',
      permissions: [
        'View Own Invoices & Billing History',
        'Settle Outstanding Balances via Bank/Card',
        'Track Delivery & Dispatch Status',
        'Strictly Restricted from Core General Ledger & Master Data',
      ],
    },
  ];

  const permissionsMatrixTable = [
    { name: 'Invoices & Billing (AR / AP)', key: 'invoices:manage', admin: true, manager: true, user: false },
    { name: 'View Own Portal Invoices & Pay', key: 'portal:invoices', admin: true, manager: true, user: true },
    { name: 'Products & Inventory Catalog', key: 'products:manage', admin: true, manager: true, user: false },
    { name: 'Sales Orders & Procurement POs', key: 'orders:manage', admin: true, manager: true, user: false },
    { name: 'Chart of Accounts & General Ledger', key: 'gl:accounts', admin: true, manager: true, user: false },
    { name: 'Financial Statements (P&L, Balance Sheet)', key: 'reports:financial', admin: true, manager: true, user: false },
    { name: 'Manual Journal Entry Posting', key: 'journal:post', admin: true, manager: true, user: false },
    { name: 'User Role Governance (RBAC)', key: 'users:manage_roles', admin: true, manager: false, user: false },
    { name: 'System Telemetry & Database Health', key: 'system:telemetry', admin: true, manager: false, user: false },
  ];

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Authenticating administrative clearance via Sanctum..." />
      </div>
    );
  }

  const adminUsersCount = users.filter((u) => u.role === UserRole.ADMIN).length;

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8 pb-10">
        {/* Obsidian Header matching UI Design System */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
                Admin Clearance Console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#7042f4]/20 text-[#c084fc] border border-[#7042f4]/30">
                Level 3 Admin
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8e8e9f] mt-1 font-sans">
              Guarded by MySQL + Laravel Sanctum middleware <code>role:admin</code>. Enforcing strict RBAC policies and real-time governance.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsOnboardModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-full px-5 py-2 active:scale-95 text-xs flex items-center gap-1.5 transition-all shadow-md select-none cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Onboard Accountant
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white text-black font-semibold rounded-full px-5 py-2 hover:bg-white/90 active:scale-95 text-xs flex items-center gap-1.5 transition-all shadow-sm select-none disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="border border-rose-500/20 bg-rose-500/10 text-rose-500 p-6 rounded-[24px]">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
              <div>
                <h4 className="font-bold">Authorization Error</h4>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 3 Obsidian Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-[#18181f] border border-white/[0.06] rounded-[24px] p-6 shadow-obsidian-card hover:border-white/12 transition-all">
                <div className="text-xs text-[#8e8e9f] font-medium font-sans uppercase">Registered Users</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-3xl font-bold text-white tracking-tight font-sans">
                    {stats?.total_users ?? users.length}
                  </span>
                  <span className="text-[11px] font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full">
                    Active Directory
                  </span>
                </div>
              </div>

              <div className="bg-[#18181f] border border-white/[0.06] rounded-[24px] p-6 shadow-obsidian-card hover:border-white/12 transition-all">
                <div className="text-xs text-[#8e8e9f] font-medium font-sans uppercase">Database Items</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-3xl font-bold text-white tracking-tight font-sans">
                    {stats?.total_items ?? 5}
                  </span>
                  <span className="text-[11px] font-bold text-[#c084fc] bg-[#7042f4]/15 border border-[#7042f4]/25 px-2 py-0.5 rounded-full">
                    Policy Protected
                  </span>
                </div>
              </div>

              <div className="bg-[#18181f] border border-white/[0.06] rounded-[24px] p-6 shadow-obsidian-card hover:border-white/12 transition-all">
                <div className="text-xs text-[#8e8e9f] font-medium font-sans uppercase">RBAC Security Guard</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-3xl font-bold text-emerald-400 tracking-tight font-sans">STRICT</span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                    3 Clearance Tiers
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Console Navigation Tabs */}
            <div className="border border-white/[0.06] bg-[#18181f] shadow-obsidian-card rounded-[24px] p-6 sm:p-8 overflow-hidden">
              <Tabs aria-label="Admin console navigation" color="primary" variant="underlined">
                {/* Tab 1: User & Role Governance */}
                <Tab
                  key="users"
                  title={
                    <div className="flex items-center gap-2 font-semibold">
                      <Users className="w-4 h-4 text-primary" />
                      <span>User Role Governance</span>
                    </div>
                  }
                >
                  <div className="py-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-white">Personnel Access Control Directory</h3>
                        <p className="text-xs text-[#8e8e9f]">
                          Manage clearance roles across registered users. Role modifications are enforced immediately via Laravel Policies and synchronized live.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground bg-card/60 px-3 py-1 rounded-full border border-border/50 self-start sm:self-auto">
                        Total Users: {users.length}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#141418]">
                      <table className="w-full text-left text-xs text-foreground">
                        <thead className="bg-[#1c1c24] text-[#8e8e9f] font-mono uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
                          <tr>
                            <th className="py-3 px-4">User</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Current Clearance</th>
                            <th className="py-3 px-4">Authored Items</th>
                            <th className="py-3 px-4 text-right">Assign Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {loading ? (
                            <TableSkeleton columns={5} rows={5} />
                          ) : users.length === 0 ? (
                            <EmptyState
                              colSpan={5}
                              icon={Users}
                              title="No users found"
                              description="No personnel accounts currently registered in the directory."
                            />
                          ) : (
                            users.map((u) => {
                              const isSelf = currentUser?.id === u.id;
                              const isSoleAdmin = u.role === UserRole.ADMIN && adminUsersCount <= 1;
                              const isUpdating = updatingUserId === u.id;

                            return (
                              <tr
                                key={u.id}
                                onClick={() => setSelectedUserDetail(u)}
                                className="hover:bg-white/[0.04] transition-colors cursor-pointer"
                              >
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#7042f4] to-[#c084fc] flex items-center justify-center text-white font-bold text-xs uppercase shrink-0">
                                      {u.name.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-white flex items-center gap-1.5">
                                        {u.name}
                                        {isSelf && (
                                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30 font-semibold">
                                            YOU
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-mono text-[#8e8e9f]">
                                  {u.email}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wide border ${
                                      u.role === UserRole.ADMIN
                                        ? 'bg-[#7042f4]/20 text-[#c084fc] border-[#7042f4]/30'
                                        : u.role === UserRole.MANAGER
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                                        : 'bg-white/[0.06] text-[#a0a0b0] border-white/10'
                                    }`}
                                  >
                                    <Shield className="w-3 h-3 shrink-0" />
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-mono text-[#a0a0b0]">
                                  {u.items_count ?? 0} items
                                </td>
                                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  {isSoleAdmin ? (
                                    <span className="text-[10px] text-amber-400/80 font-mono bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                                      Sole Admin (Locked)
                                    </span>
                                  ) : (
                                    <div className="inline-flex items-center gap-1 bg-[#1c1c24] p-1 rounded-xl border border-white/[0.08]">
                                      {([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER] as const).map((r) => {
                                        const isActive = u.role === r;
                                        return (
                                          <button
                                            key={r}
                                            disabled={isUpdating || isActive}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRoleChange(u.id, r);
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                              isActive
                                                ? r === UserRole.ADMIN
                                                  ? 'bg-[#7042f4] text-white shadow-xs'
                                                  : r === UserRole.MANAGER
                                                  ? 'bg-amber-500 text-black shadow-xs'
                                                  : 'bg-white/20 text-white shadow-xs'
                                                : 'text-[#8e8e9f] hover:text-white hover:bg-white/[0.05] disabled:opacity-40'
                                            }`}
                                          >
                                            {r}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      </table>
                    </div>
                  </div>
                </Tab>

                {/* Tab 2: Security & RBAC Matrix */}
                <Tab
                  key="roles"
                  title={
                    <div className="flex items-center gap-2 font-semibold">
                      <Lock className="w-4 h-4 text-primary" />
                      <span>Security & RBAC Matrix</span>
                    </div>
                  }
                >
                  <div className="py-5 space-y-6">
                    <p className="text-xs sm:text-sm text-muted-foreground font-sans">
                      Clearance policy matrix enforced by Laravel Sanctum token guards, <code>ItemPolicy</code>, <code>UserPolicy</code>, and <code>RoleMiddleware</code>.
                    </p>

                    {/* Role Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {rolesMatrix.map((item) => {
                        const isCurrentRole = currentUser?.role === item.key;

                        return (
                          <Card
                            key={item.key}
                            className={`border bg-card/60 p-6 rounded-2xl shadow-hero-card transition-all duration-300 flex flex-col justify-between ${
                              isCurrentRole
                                ? 'border-primary/60 ring-1 ring-primary/30 shadow-[0_0_25px_rgba(112,66,244,0.15)]'
                                : 'border-border/50 dark:border-white/[0.08]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-base text-foreground font-sans flex items-center gap-2">
                                  {item.role}
                                  {isCurrentRole && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30 font-bold uppercase">
                                      Active
                                    </span>
                                  )}
                                </h4>
                                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-2.5 mb-4 leading-relaxed font-sans">
                                {item.description}
                              </p>
                            </div>
                            <div>
                              <Divider className="my-3 border-border/40" />
                              <div className="space-y-2 pt-1">
                                {item.permissions.map((perm, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs text-foreground/90 font-sans">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>{perm}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Granular Permission Matrix Table */}
                    <div className="space-y-3 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                          Granular Authorization Matrix
                        </h4>
                        <span className="text-[11px] text-[#8e8e9f]">Enforced across API controllers & frontend UI</span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#141418]">
                        <table className="w-full text-left text-xs text-foreground">
                          <thead className="bg-[#1c1c24] text-[#8e8e9f] font-mono uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
                            <tr>
                              <th className="py-3 px-4">Capability / Permission</th>
                              <th className="py-3 px-4">Identifier</th>
                              <th className="py-3 px-4 text-center">Administrator</th>
                              <th className="py-3 px-4 text-center">Operations Manager</th>
                              <th className="py-3 px-4 text-center">Standard User</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04]">
                            {permissionsMatrixTable.map((perm) => (
                              <tr key={perm.key} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4 font-semibold text-white">
                                  {perm.name}
                                </td>
                                <td className="py-3 px-4 font-mono text-[11px] text-[#8e8e9f]">
                                  <code>{perm.key}</code>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {perm.admin ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Granted
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-rose-400/80">
                                      <XCircle className="w-3.5 h-3.5" /> Denied
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {perm.manager ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Granted
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-rose-400/80">
                                      <XCircle className="w-3.5 h-3.5" /> Denied
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {perm.user ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Granted
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-rose-400/80">
                                      <XCircle className="w-3.5 h-3.5" /> Denied
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </Tab>

                {/* Tab 3: System Telemetry */}
                <Tab
                  key="telemetry"
                  title={
                    <div className="flex items-center gap-2 font-semibold">
                      <Cpu className="w-4 h-4 text-primary" />
                      <span>System Telemetry</span>
                    </div>
                  }
                >
                  <div className="py-5 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2 p-5 sm:p-6 rounded-2xl border border-border/50 dark:border-white/[0.08] bg-card/50 shadow-xs">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">MySQL Host & Database</span>
                        <div className="font-mono text-base font-bold text-foreground">
                          127.0.0.1:3306 &bull; urban_furniture_accounting
                        </div>
                        <Progress size="sm" value={100} color="secondary" className="mt-2" />
                      </div>

                      <div className="space-y-2 p-5 sm:p-6 rounded-2xl border border-border/50 dark:border-white/[0.08] bg-card/50 shadow-xs">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Laravel API Synchronization Time</span>
                        <div className="font-mono text-base font-bold text-foreground">
                          {stats?.system_time ? new Date(stats.system_time).toLocaleString() : 'Live Sync'}
                        </div>
                        <Progress size="sm" value={100} color="primary" className="mt-2" />
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-sidebar-accent/30 border border-border/40 text-xs sm:text-sm text-foreground flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Sanctum Authentication Token active with <code className="font-mono bg-sidebar-accent px-1.5 py-0.5 rounded text-primary font-bold">role:admin</code> scope.</span>
                      </div>
                      <span className="font-mono font-bold text-[10.5px] uppercase px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        STATUS 200 OK
                      </span>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </div>
          </>
        )}

        {/* Onboard Manager / Accountant Modal */}
        <PortalModal
          isOpen={isOnboardModalOpen}
          onClose={() => {
            setIsOnboardModalOpen(false);
            setGeneratedCredentials(null);
          }}
          zIndex="z-[60]"
          containerClassName="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Provision Accountant / Manager</h3>
                  <p className="text-xs text-neutral-400">
                    Internal role clearance and cryptographic credential provisioning
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOnboardModalOpen(false);
                  setGeneratedCredentials(null);
                }}
                className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                ✕
              </button>
            </div>

            {generatedCredentials ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" /> Accountant Provisioned & Dispatched
                  </div>
                  <p className="text-xs text-neutral-300">
                    A formal invitation with temporary login credentials has been queued for: <strong className="text-white">{generatedCredentials.email}</strong>.
                  </p>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/10 font-mono text-xs flex justify-between items-center">
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-sans">Temporary Password</span>
                      <span className="font-bold text-purple-300 text-sm tracking-wider">{generatedCredentials.temporary_password}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (generatedCredentials.temporary_password) {
                          navigator.clipboard.writeText(generatedCredentials.temporary_password);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      }}
                      className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white font-sans font-medium transition-colors"
                    >
                      {copied ? 'Copied to Clipboard!' : 'Copy Password'}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400 italic">
                    The user will be prompted to update their master password immediately upon their first login.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setIsOnboardModalOpen(false);
                      setGeneratedCredentials(null);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOnboardManager} className="space-y-4">
                {/* Role Clearance Briefing Card */}
                <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      Assigned Clearance: Level 2 (Manager / Accountant)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Standard
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Granted authority to approve Purchase Orders, book Sales Orders, create manual Journal Entries, and execute treasury disbursements.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Sharma"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Corporate Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. accountant@urbanfurniture.in"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Direct Contact Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a22] border border-neutral-700 rounded-lg text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsOnboardModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-neutral-700 text-neutral-300 text-xs hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isOnboarding}
                    className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isOnboarding ? 'Provisioning Credentials...' : 'Provision Accountant'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </PortalModal>

        {/* User Detail Modal */}
        <PortalModal
          isOpen={Boolean(selectedUserDetail)}
          onClose={() => setSelectedUserDetail(null)}
          zIndex="z-[60]"
          maxWidth="max-w-lg"
        >
          {selectedUserDetail && (
            <div className="w-full bg-[#141418] border border-neutral-800 rounded-2xl p-6 text-white space-y-5 shadow-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7042f4] to-[#c084fc] flex items-center justify-center text-white font-bold text-base uppercase">
                    {selectedUserDetail.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {selectedUserDetail.name}
                      {currentUser?.id === selectedUserDetail.id && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 font-semibold">
                          Current Session
                        </span>
                      )}
                    </h3>
                    <p className="text-xs font-mono text-[#8e8e9f]">{selectedUserDetail.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05]"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#1a1a22] border border-white/[0.06] text-xs">
                <div>
                  <span className="text-[#8e8e9f] block text-[11px]">Clearance Role</span>
                  <span className="font-bold text-white capitalize mt-0.5 inline-flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#c084fc]" />
                    {selectedUserDetail.role}
                  </span>
                </div>
                <div>
                  <span className="text-[#8e8e9f] block text-[11px]">Authored Items</span>
                  <span className="font-mono font-bold text-white mt-0.5 block">
                    {selectedUserDetail.items_count ?? 0} records
                  </span>
                </div>
                <div>
                  <span className="text-[#8e8e9f] block text-[11px]">Account ID</span>
                  <span className="font-mono text-neutral-300 mt-0.5 block">#{selectedUserDetail.id}</span>
                </div>
                <div>
                  <span className="text-[#8e8e9f] block text-[11px]">System Status</span>
                  <span className="text-emerald-400 font-semibold mt-0.5 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active & Guarded
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8e8e9f] font-mono">
                  Clearance Level Details
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed bg-[#18181f] p-3 rounded-xl border border-white/[0.04]">
                  {selectedUserDetail.role === UserRole.ADMIN
                    ? 'Tier 3 Superuser clearance. Complete authority across General Ledger, transaction voiding, role assignments, and server telemetry.'
                    : selectedUserDetail.role === UserRole.MANAGER
                    ? 'Tier 2 Management clearance. Operational authority to post invoices, issue orders, adjust inventory, and review financial statements.'
                    : 'Tier 1 Standard clearance. Standard contact access to view personal invoices/bills and settle outstanding dues.'}
                </p>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-400">Clearance:</span>
                  {([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER] as const).map((r) => {
                    const isActive = selectedUserDetail.role === r;
                    const isSoleAdmin = selectedUserDetail.role === UserRole.ADMIN && adminUsersCount <= 1;
                    return (
                      <button
                        key={r}
                        disabled={isSoleAdmin || isActive || updatingUserId === selectedUserDetail.id}
                        onClick={async () => {
                          await handleRoleChange(selectedUserDetail.id, r);
                          setSelectedUserDetail((prev: any) => ({ ...prev, role: r }));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#7042f4] text-white shadow-xs'
                            : 'text-[#8e8e9f] hover:text-white hover:bg-white/[0.05] disabled:opacity-40'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </PortalModal>
      </div>
    </PageTransition>
  );
};

export default AdminPage;
