import React, { useState } from 'react';
import {
  Shield,
  Key,
  LogOut,
  CheckCircle2,
  Copy,
  Check,
  Bell,
  Palette,
  User,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Avatar,
  Divider,
} from '@heroui/react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { PageTransition } from '../components/layout/PageTransition';

export const ProfilePage: React.FC = () => {
  const { user, token, logout, isAdmin } = useAuth();
  const { isConnected, socket } = useSocket();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedSocketId, setCopiedSocketId] = useState(false);

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      toast.info('Sanctum Bearer token copied to clipboard.');
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleCopySocketId = () => {
    if (socket?.id) {
      navigator.clipboard.writeText(socket.id);
      setCopiedSocketId(true);
      toast.info('Socket client ID copied.');
      setTimeout(() => setCopiedSocketId(false), 2000);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.info('Signed out successfully.');
    navigate('/login');
  };

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8 pb-10 max-w-5xl mx-auto">
        {/* Obsidian Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7042f4] to-[#c084fc] flex items-center justify-center text-white font-bold text-xl shrink-0 uppercase border border-white/10 shadow-sm">
              {user?.name ? user.name.charAt(0) : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
                  {user?.name || 'Account Profile'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#7042f4]/20 text-[#c084fc] border border-[#7042f4]/30">
                  {user?.role || 'user'} clearance
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#8e8e9f] mt-1 font-sans">
                {user?.email || 'Authenticated user account • PostgreSQL Sanctum session'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-[#24242e] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 font-semibold rounded-full px-5 py-2 text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Role & Clearance Specs (1 col) */}
          <div className="space-y-6">
            <div className="border border-white/[0.06] bg-[#18181f] shadow-obsidian-card rounded-[24px] p-6 space-y-4">
              <div className="flex items-center gap-3 pb-1">
                <Shield className="w-5 h-5 text-[#7042f4]" />
                <h3 className="font-bold text-base text-white font-sans">Security Clearance</h3>
              </div>
              <div className="space-y-4 text-xs font-sans">
                <div className="p-4 sm:p-5 rounded-2xl bg-[#202029] border border-white/[0.04] space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                      Access Tier
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        user?.role === 'admin'
                          ? 'bg-[#7042f4]/20 text-[#c084fc] border-[#7042f4]/30'
                          : user?.role === 'manager'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {user?.role === 'admin'
                        ? 'ADMINISTRATOR (TIER 3)'
                        : user?.role === 'manager'
                        ? 'MANAGER (TIER 2)'
                        : 'STANDARD USER (TIER 1)'}
                    </span>
                  </div>
                  <p className="text-[#8e8e9f] leading-relaxed text-xs">
                    {user?.role === 'admin'
                      ? 'Full superuser clearance across all items, user role governance, telemetry diagnostics, and system broadcast overrides.'
                      : user?.role === 'manager'
                      ? 'Operational management clearance. Can create, view, and edit any item across departments, and inspect user directories.'
                      : 'Standard authenticated access. Can create and edit personal items, view catalog, and receive realtime socket events.'}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-[#8e8e9f] font-medium">Create Items:</span>
                    <span className="font-bold text-emerald-400">Authorized</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-[#8e8e9f] font-medium">Edit Own Items:</span>
                    <span className="font-bold text-emerald-400">Authorized</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-[#8e8e9f] font-medium">Edit Team Items:</span>
                    <span className={`font-bold ${user?.role === 'admin' || user?.role === 'manager' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {user?.role === 'admin' || user?.role === 'manager' ? 'Authorized' : 'Restricted (403)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-[#8e8e9f] font-medium">Delete Items:</span>
                    <span className={`font-bold ${user?.role === 'admin' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {user?.role === 'admin' ? 'Authorized' : 'Restricted (Admin Only)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-[#8e8e9f] font-medium">User Directory:</span>
                    <span className={`font-bold ${user?.role === 'admin' || user?.role === 'manager' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {user?.role === 'admin' || user?.role === 'manager' ? 'Authorized' : 'Restricted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-[#8e8e9f] font-medium">Role Governance:</span>
                    <span className={`font-bold ${user?.role === 'admin' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {user?.role === 'admin' ? 'Authorized' : 'Restricted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[#8e8e9f] font-medium">Admin Telemetry:</span>
                    <span className={`font-bold ${user?.role === 'admin' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {user?.role === 'admin' ? 'Authorized' : 'Restricted (403)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences Card */}
            <div className="border border-white/[0.06] bg-[#18181f] shadow-obsidian-card rounded-[24px] p-6 space-y-4">
              <div className="flex items-center gap-3 pb-1">
                <Palette className="w-5 h-5 text-[#c084fc]" />
                <h3 className="font-bold text-base text-white font-sans">Appearance & Theme</h3>
              </div>
              <div className="space-y-4 text-xs font-sans">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">Theme Mode</div>
                    <div className="text-[#8e8e9f] text-[11px] capitalize mt-0.5">Active: {theme}</div>
                  </div>
                  <div className="flex items-center gap-1 bg-[#202029] p-1 rounded-full border border-white/[0.04]">
                    {(['light', 'dark', 'system'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTheme(mode)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all active:scale-95 ${
                          theme === mode
                            ? 'bg-white text-black shadow-xs font-bold'
                            : 'text-[#8e8e9f] hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.04]">
                  <Button
                    size="sm"
                    variant="flat"
                    className="w-full text-xs font-semibold rounded-full bg-[#7042f4]/20 text-[#c084fc] border border-[#7042f4]/30 hover:bg-[#7042f4]/30 active:scale-95 py-2"
                    startContent={<Bell className="w-3.5 h-3.5" />}
                    onPress={() => toast.success('Test notification emitted!')}
                  >
                    Trigger Sample Toast
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Telemetry & Active Tokens (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            <div className="border border-white/[0.06] bg-[#18181f] shadow-obsidian-card rounded-[24px] p-6 sm:p-7 space-y-5 text-xs font-sans">
              <div className="flex items-center gap-3 pb-1">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-white font-sans">
                  Active Session & Token Diagnostics
                </h3>
              </div>

              {/* Token Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm">
                    Sanctum Bearer Token
                  </span>
                  <Button
                    size="sm"
                    variant="light"
                    className="h-7 text-xs font-semibold text-[#8e8e9f] hover:text-white active:scale-95"
                    startContent={copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    onPress={handleCopyToken}
                  >
                    {copiedToken ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <div className="p-4 rounded-2xl bg-[#202029] font-mono text-[11px] text-[#8e8e9f] break-all border border-white/[0.04] shadow-xs">
                  {token ? `${token.substring(0, 36)}...` : 'No token active'}
                </div>
              </div>

              {/* Socket Telemetry */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm">
                    WebSocket Client ID
                  </span>
                  {socket?.id && (
                    <Button
                      size="sm"
                      variant="light"
                      className="h-7 text-xs font-semibold text-[#8e8e9f] hover:text-white active:scale-95"
                      startContent={copiedSocketId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      onPress={handleCopySocketId}
                    >
                      {copiedSocketId ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-[#202029] font-mono text-[11px] text-[#8e8e9f] border border-white/[0.04] shadow-xs flex items-center justify-between">
                  <span>{socket?.id || 'Reconnecting to Socket.io...'}</span>
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500'}`} />
                </div>
              </div>

              <Divider className="border-white/[0.06]" />

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-[#202029] border border-white/[0.04]">
                  <span className="text-[#8e8e9f] text-[10px] uppercase font-bold block">Backend</span>
                  <span className="font-bold text-white mt-1 block">Laravel 11</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#202029] border border-white/[0.04]">
                  <span className="text-[#8e8e9f] text-[10px] uppercase font-bold block">Database</span>
                  <span className="font-bold text-white mt-1 block">PostgreSQL</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#202029] border border-white/[0.04]">
                  <span className="text-[#8e8e9f] text-[10px] uppercase font-bold block">Realtime</span>
                  <span className="font-bold text-white mt-1 block">Socket.io 4</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#202029] border border-white/[0.04]">
                  <span className="text-[#8e8e9f] text-[10px] uppercase font-bold block">Security</span>
                  <span className="font-bold text-emerald-400 mt-1 block">Sanctum</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ProfilePage;
