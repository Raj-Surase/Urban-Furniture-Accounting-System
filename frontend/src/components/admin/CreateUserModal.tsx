import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Key, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { usersApi } from '../../lib/api';
import { UserRole } from '../../types';

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [password, setPassword] = useState('');
  const [reEnterPassword, setReEnterPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Frontend validation rules matching Excalidraw sticky note:
    if (loginId.length < 6 || loginId.length > 12) {
      setError('Login Id should be unique and must be between 6-12 characters.');
      setLoading(false);
      return;
    }

    if (password !== reEnterPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[@$!%*?&#^()_+={}\[\]:;"'<>,.\/\\|~`-]/.test(password)) {
      setError('Password must contain a small case, a large case, a special character, and have more than 8 characters.');
      setLoading(false);
      return;
    }

    try {
      const res = await usersApi.createUser({
        name,
        login_id: loginId,
        email,
        role,
        password,
        re_enter_password: reEnterPassword,
      });

      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err: any) {
      console.error('Failed to create user:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : 'Failed to create user.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-[#18181f] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#141418]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#7042f4]/15 border border-[#7042f4]/30 text-[#c084fc]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Create User</h2>
                <p className="text-xs text-[#8a8a9a]">System user credentials & role assignment</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#707080] hover:text-white hover:bg-white/[0.05]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
              />
            </div>

            {/* Login ID & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                  Login id *
                </label>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="6-12 characters"
                  className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
                />
                <span className="text-[10px] text-[#707080] mt-0.5 block">Unique 6-12 characters</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                  E-mail id *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
                />
                <span className="text-[10px] text-[#707080] mt-0.5 block">Unique in database</span>
              </div>
            </div>

            {/* Role Selection matching wireframe: User, Administrator, Accountant */}
            <div>
              <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                Role *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([UserRole.USER, UserRole.ACCOUNTANT, UserRole.ADMIN] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border capitalize transition-all ${
                      role === r
                        ? 'bg-[#7042f4]/20 border-[#7042f4] text-white shadow-sm'
                        : 'bg-[#121216] border-white/[0.08] text-[#8a8a9a] hover:text-white'
                    }`}
                  >
                    {r === UserRole.ADMIN ? 'Administrator' : r === UserRole.ACCOUNTANT ? 'Accountant' : 'User'}
                  </button>
                ))}
              </div>
              <div className="mt-2 p-2.5 rounded-xl bg-[#121216] border border-white/[0.04] text-[11px] text-[#8a8a9a]">
                {role === UserRole.ADMIN && 'Admin: Full access rights across all modules.'}
                {role === UserRole.ACCOUNTANT && 'Accountant: Master data, record transactions, journals, and reports.'}
                {role === UserRole.USER && 'User (Portal): Restricted view to view paid/unpaid dues and pay directly.'}
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, Aa1@..."
                  className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a0a0b0] uppercase tracking-wider mb-1.5">
                  Re-Enter Password *
                </label>
                <input
                  type="password"
                  required
                  value={reEnterPassword}
                  onChange={(e) => setReEnterPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#7042f4]"
                />
              </div>
            </div>

            {/* Modal Actions matching Excalidraw: Create, Cancel */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-xs font-semibold text-[#a0a0b0] hover:text-white hover:bg-white/[0.05]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7042f4] hover:bg-[#5f32e6] text-white text-xs font-semibold shadow-lg shadow-[#7042f4]/30 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Creating...' : 'Create'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
