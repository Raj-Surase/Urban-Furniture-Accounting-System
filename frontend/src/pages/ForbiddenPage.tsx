import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Home, UserCheck, KeyRound } from 'lucide-react';
import { Button, Card, CardBody } from '@heroui/react';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/layout/PageTransition';
import { UserRole } from '../types';

export const ForbiddenPage: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const requiredRole = (location.state as any)?.requiredRole || (location.state as any)?.requiredPermission ? null : UserRole.ADMIN;
  const requiredPermission = (location.state as any)?.requiredPermission;

  return (
    <PageTransition>
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg"
        >
          <Card className="border border-white/[0.08] bg-[#15151a] shadow-[0_20px_80px_rgba(0,0,0,0.85)] rounded-[28px] overflow-hidden text-center p-6 sm:p-8 md:p-10">
            <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-5 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  HTTP 403 Forbidden
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
                Clearance Required
              </h1>
              <p className="text-sm text-[#8e8e9f] max-w-sm mx-auto font-sans leading-relaxed">
                This endpoint is protected by role-based authorization. Your current account lacks the required privileges.
              </p>
            </div>

            <CardBody className="px-0 py-6">
              <div className="p-5 rounded-2xl bg-[#202029] border border-white/[0.04] space-y-3.5 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8e8e9f] font-semibold">Current User:</span>
                  <span className="font-bold text-white">{user?.name || 'Anonymous'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8e8e9f] font-semibold">Your Clearance Role:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-white/[0.05] border border-white/10 text-[#8e8e9f]">
                    {user?.role || 'Guest'}
                  </span>
                </div>
                {requiredRole && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8e8e9f] font-semibold">Required Role:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-[#7042f4]/20 text-[#c084fc] border border-[#7042f4]/30">
                      {requiredRole}
                    </span>
                  </div>
                )}
                {requiredPermission && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8e8e9f] font-semibold">Required Permission:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {requiredPermission}
                    </span>
                  </div>
                )}
              </div>
            </CardBody>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/" className="w-full sm:w-auto">
                <Button
                  startContent={<Home className="w-4 h-4" />}
                  className="w-full font-bold rounded-full bg-white text-black hover:bg-white/90 shadow-sm active:scale-[0.98] transition-all px-5 text-xs"
                >
                  Dashboard
                </Button>
              </Link>

              <Link to="/profile" className="w-full sm:w-auto">
                <Button
                  variant="bordered"
                  startContent={<UserCheck className="w-4 h-4" />}
                  className="w-full font-bold rounded-full border border-white/[0.08] bg-[#22222b] text-white hover:bg-[#2a2a35] active:scale-[0.98] transition-all px-5 text-xs"
                >
                  View Clearance
                </Button>
              </Link>

              <Button
                variant="light"
                color="danger"
                startContent={<KeyRound className="w-4 h-4" />}
                className="w-full sm:w-auto font-bold rounded-full text-rose-400 hover:bg-rose-500/10 active:scale-[0.98] transition-all px-5 text-xs"
                onPress={async () => {
                  await logout();
                  window.location.href = '/login';
                }}
              >
                Switch Account
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default ForbiddenPage;
