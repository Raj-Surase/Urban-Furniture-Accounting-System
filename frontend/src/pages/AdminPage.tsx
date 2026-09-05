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

export const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const { toast } = useToast();

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
      role: 'Administrator',
      key: 'admin',
      badge: 'Level 3 Clearance',
      color: 'primary',
      description: 'Full administrative access across all endpoints, database operations, user role governance, and system telemetry.',
      permissions: [
        'Manage all Items CRUD (View, Create, Edit Any, Delete Any)',
        'Access /admin Telemetry & PostgreSQL Diagnostics',
        'Override & Emit Broadcast Channels',
        'Assign & Modify User Roles',
      ],
    },
    {
      role: 'Operations Manager',
      key: 'manager',
      badge: 'Level 2 Clearance',
      color: 'warning',
      description: 'Departmental operations access for supervising team tasks and auditing user directories.',
      permissions: [
        'Create and Edit Any Item (Team Operations)',
        'View User Accounts Directory (Read-Only)',
        'Emit Realtime Channel Broadcasts',
        'Protected from Deleting Items (Admin Only)',
      ],
    },
    {
      role: 'Standard User',
      key: 'user',
      badge: 'Level 1 Clearance',
      color: 'default',
      description: 'Standard authenticated access for individual workspace tasks and real-time socket events.',
      permissions: [
        'Create Items & Edit Own Personal Items',
        'Receive Live Socket.io Event Broadcasts',
        'Manage Personal Profile & Clearance View',
        'Strictly Restricted from /admin & User Governance (403)',
      ],
    },
  ];

  const permissionsMatrixTable = [
    { name: 'View Items Catalog', key: 'items:view_any', admin: true, manager: true, user: true },
    { name: 'Create New Items', key: 'items:create', admin: true, manager: true, user: true },
    { name: 'Update Own Items', key: 'items:update_own', admin: true, manager: true, user: true },
    { name: 'Update Any Item (Team Override)', key: 'items:update_any', admin: true, manager: true, user: false },
    { name: 'Delete Items (Strict Access)', key: 'items:delete_any', admin: true, manager: false, user: false },
    { name: 'View User Directory', key: 'users:view_any', admin: true, manager: true, user: false },
    { name: 'Assign User Roles (RBAC Governance)', key: 'users:manage_roles', admin: true, manager: false, user: false },
    { name: 'Access /admin Telemetry', key: 'system:telemetry', admin: true, manager: false, user: false },
    { name: 'Emit Socket.io Broadcasts', key: 'system:broadcast', admin: true, manager: true, user: false },
  ];

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Authenticating administrative clearance via Sanctum..." />
      </div>
    );
  }

  const adminUsersCount = users.filter((u) => u.role === 'admin').length;

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
              Guarded by PostgreSQL + Laravel Sanctum middleware <code>role:admin</code>. Enforcing strict RBAC policies and real-time governance.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white text-black font-semibold rounded-full px-5 py-2 hover:bg-white/90 active:scale-95 text-xs flex items-center gap-1.5 transition-all shadow-sm select-none self-start sm:self-auto disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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
                          {users.map((u) => {
                            const isSelf = currentUser?.id === u.id;
                            const isSoleAdmin = u.role === 'admin' && adminUsersCount <= 1;
                            const isUpdating = updatingUserId === u.id;

                            return (
                              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
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
                                      u.role === 'admin'
                                        ? 'bg-[#7042f4]/20 text-[#c084fc] border-[#7042f4]/30'
                                        : u.role === 'manager'
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
                                <td className="py-3.5 px-4 text-right">
                                  {isSoleAdmin ? (
                                    <span className="text-[10px] text-amber-400/80 font-mono bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                                      Sole Admin (Locked)
                                    </span>
                                  ) : (
                                    <div className="inline-flex items-center gap-1 bg-[#1c1c24] p-1 rounded-xl border border-white/[0.08]">
                                      {(['admin', 'manager', 'user'] as const).map((r) => {
                                        const isActive = u.role === r;
                                        return (
                                          <button
                                            key={r}
                                            disabled={isUpdating || isActive}
                                            onClick={() => handleRoleChange(u.id, r)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                              isActive
                                                ? r === 'admin'
                                                  ? 'bg-[#7042f4] text-white shadow-xs'
                                                  : r === 'manager'
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
                          })}
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
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">PostgreSQL Host & Database</span>
                        <div className="font-mono text-base font-bold text-foreground">
                          127.0.0.1:5432 &bull; odoo_hackathon_db
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
      </div>
    </PageTransition>
  );
};

export default AdminPage;
