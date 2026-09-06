import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Divider,
} from '@heroui/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatApiError } from '../lib/errorHandler';
import { PageTransition } from '../components/layout/PageTransition';
import { Logo } from '../components/common/Logo';
import { UserRole } from '../types';
import {
  ArrowRight,
  User,
  Mail,
  Lock,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reEnterPassword, setReEnterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!loginId.trim() || loginId.length < 6 || loginId.length > 12) {
      setError('Login Id must be between 6 and 12 characters.');
      return;
    }

    if (password !== reEnterPassword) {
      setError('Passwords do not match. Please re-enter identical password.');
      return;
    }

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasSpecial = /[@$!%*?&#^()_+={}\[\]:;"'<>,.\/\\|~`-]/.test(password);

    if (password.length < 8 || !hasLower || !hasUpper || !hasSpecial) {
      setError('Password must be at least 8 characters and contain lowercase, uppercase, and a special character.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: name || loginId,
        login_id: loginId.trim(),
        email: email.trim(),
        password,
        role: UserRole.USER,
      });
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err: unknown) {
      const formatted = formatApiError(err);
      setError(formatted.message);
      if (formatted.fieldErrors) {
        setFieldErrors(formatted.fieldErrors);
      }
      toast.error(formatted.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="border border-white/[0.08] bg-[#15151a] shadow-[0_20px_80px_rgba(0,0,0,0.85)] rounded-[28px] p-6 sm:p-8 md:p-10">
            <CardHeader className="flex flex-col gap-2 items-center text-center pt-2 pb-4">
              <Logo className="justify-center mb-1" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
                  Join Urban Furniture
                </h2>
                <p className="text-xs sm:text-sm text-[#8e8e9f] mt-1 font-sans">
                  Register customer or vendor portal access
                </p>
              </div>
            </CardHeader>

            <CardBody className="px-0 py-2 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-login-id" className="text-xs font-semibold text-[#8e8e9f] flex items-center justify-between">
                    <span>Login Id (6–12 characters) *</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Unique handle</span>
                  </label>
                  <Input
                    id="reg-login-id"
                    aria-label="Login Id"
                    placeholder="e.g. raj_surase"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    variant="bordered"
                    size="md"
                    startContent={<User className="w-4 h-4 text-[#8e8e9f] shrink-0" />}
                    classNames={{
                      base: "w-full",
                      inputWrapper: "!bg-[#1c1c24] border border-white/[0.12] hover:border-white/30 focus-within:!border-primary rounded-xl h-11 transition-all shadow-none",
                      input: "text-white text-sm placeholder:text-zinc-500 !outline-none border-none shadow-none ring-0",
                      innerWrapper: "gap-2.5",
                    }}
                    required
                    autoFocus
                    minLength={6}
                    maxLength={12}
                    isInvalid={!!fieldErrors.login_id}
                    errorMessage={fieldErrors.login_id}
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-email" className="text-xs font-semibold text-[#8e8e9f] block">
                    Email Id *
                  </label>
                  <Input
                    id="reg-email"
                    aria-label="Email Address"
                    type="email"
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="bordered"
                    size="md"
                    startContent={<Mail className="w-4 h-4 text-[#8e8e9f] shrink-0" />}
                    classNames={{
                      base: "w-full",
                      inputWrapper: "!bg-[#1c1c24] border border-white/[0.12] hover:border-white/30 focus-within:!border-primary rounded-xl h-11 transition-all shadow-none",
                      input: "text-white text-sm placeholder:text-zinc-500 !outline-none border-none shadow-none ring-0",
                      innerWrapper: "gap-2.5",
                    }}
                    required
                    isInvalid={!!fieldErrors.email}
                    errorMessage={fieldErrors.email}
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-name" className="text-xs font-semibold text-[#8e8e9f] block">
                    Full Name (Optional)
                  </label>
                  <Input
                    id="reg-name"
                    aria-label="Full Name"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    variant="bordered"
                    size="md"
                    startContent={<User className="w-4 h-4 text-[#8e8e9f] shrink-0" />}
                    classNames={{
                      base: "w-full",
                      inputWrapper: "!bg-[#1c1c24] border border-white/[0.12] hover:border-white/30 focus-within:!border-primary rounded-xl h-11 transition-all shadow-none",
                      input: "text-white text-sm placeholder:text-zinc-500 !outline-none border-none shadow-none ring-0",
                      innerWrapper: "gap-2.5",
                    }}
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-password" className="text-xs font-semibold text-[#8e8e9f] flex items-center justify-between">
                    <span>Password *</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Upper, lower & special (&gt;8 chars)</span>
                  </label>
                  <Input
                    id="reg-password"
                    aria-label="Password (min 8 characters)"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    variant="bordered"
                    size="md"
                    startContent={<Lock className="w-4 h-4 text-[#8e8e9f] shrink-0" />}
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#8e8e9f] hover:text-white transition-colors focus:outline-none p-1"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    classNames={{
                      base: "w-full",
                      inputWrapper: "!bg-[#1c1c24] border border-white/[0.12] hover:border-white/30 focus-within:!border-primary rounded-xl h-11 transition-all shadow-none",
                      input: "text-white text-sm placeholder:text-zinc-500 !outline-none border-none shadow-none ring-0",
                      innerWrapper: "gap-2.5",
                    }}
                    required
                    minLength={8}
                    isInvalid={!!fieldErrors.password}
                    errorMessage={fieldErrors.password}
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-re-password" className="text-xs font-semibold text-[#8e8e9f] block">
                    Re-Enter Password *
                  </label>
                  <Input
                    id="reg-re-password"
                    aria-label="Re-Enter Password"
                    type={showRePassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={reEnterPassword}
                    onChange={(e) => setReEnterPassword(e.target.value)}
                    variant="bordered"
                    size="md"
                    startContent={<Lock className="w-4 h-4 text-[#8e8e9f] shrink-0" />}
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowRePassword(!showRePassword)}
                        className="text-[#8e8e9f] hover:text-white transition-colors focus:outline-none p-1"
                        aria-label="Toggle password visibility"
                      >
                        {showRePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    classNames={{
                      base: "w-full",
                      inputWrapper: "!bg-[#1c1c24] border border-white/[0.12] hover:border-white/30 focus-within:!border-primary rounded-xl h-11 transition-all shadow-none",
                      input: "text-white text-sm placeholder:text-zinc-500 !outline-none border-none shadow-none ring-0",
                      innerWrapper: "gap-2.5",
                    }}
                    required
                    minLength={8}
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white">Customer & Vendor Portal Access</p>
                    <p className="text-[11px] text-zinc-400">Registered users can inspect invoices, bills, track orders, and execute instant Razorpay settlements.</p>
                  </div>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold leading-relaxed">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  size="md"
                  className="w-full font-bold rounded-full !bg-white !text-black hover:!bg-white/90 shadow-sm active:scale-[0.98] transition-all h-11 text-sm mt-2 uppercase tracking-wide"
                  isLoading={loading}
                  endContent={!loading && <ArrowRight className="w-4 h-4" />}
                >
                  Sign Up
                </Button>
              </form>
            </CardBody>

            <Divider className="my-3 border-border/40" />

            <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground pb-2 pt-2 px-0">
              <div className="flex items-center justify-center gap-3 font-medium">
                <Link to="/login?forgot=1" className="text-zinc-400 hover:text-white transition-colors">
                  Forgot Password?
                </Link>
                <span className="text-zinc-600">|</span>
                <Link to="/login" className="text-primary font-bold hover:underline">
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default RegisterPage;
