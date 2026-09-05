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
import {
  Shield,
  User,
  ArrowRight,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      await login({ email, password });
      toast.success('Signed in successfully!');
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

  const fillAndLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      await login({ email: demoEmail, password: demoPass });
      toast.success(`Signed in as ${demoEmail}!`);
      navigate('/');
    } catch (err: unknown) {
      const formatted = formatApiError(err);
      setError(formatted.message);
      toast.error(formatted.message);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setFieldErrors({});
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
                  Welcome Back
                </h2>
                <p className="text-xs sm:text-sm text-[#8e8e9f] mt-1 font-sans">
                  Sign in with your enterprise credentials
                </p>
              </div>
            </CardHeader>

            <CardBody className="px-0 py-2 space-y-6">
              {/* Quick 1-Click Instant Demo Credentials */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#202029] border border-white/[0.04] space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8e8e9f] flex items-center gap-1.5 font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Instant Demo Login
                  </span>
                  <span className="text-[10px] text-muted-foreground">Click to fill</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@example.com', 'password')}
                    className="p-2.5 rounded-xl bg-card/60 hover:bg-card border border-border/50 dark:border-white/[0.08] text-left transition-all hover:border-primary/50 group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-foreground group-hover:text-primary">
                      <span>Admin</span>
                      <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5 truncate">admin@example.com</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('manager@example.com', 'password')}
                    className="p-2.5 rounded-xl bg-card/60 hover:bg-card border border-border/50 dark:border-white/[0.08] text-left transition-all hover:border-amber-400/50 group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-foreground group-hover:text-amber-400">
                      <span>Manager</span>
                      <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5 truncate">manager@example.com</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('user@example.com', 'password')}
                    className="p-2.5 rounded-xl bg-card/60 hover:bg-card border border-border/50 dark:border-white/[0.08] text-left transition-all hover:border-blue-400/50 group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-foreground group-hover:text-blue-400">
                      <span>Standard</span>
                      <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5 truncate">user@example.com</span>
                  </button>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold leading-relaxed">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label htmlFor="login-email" className="text-xs font-semibold text-[#8e8e9f] block">
                    Email Address
                  </label>
                  <Input
                    id="login-email"
                    aria-label="Email Address"
                    placeholder="admin@example.com"
                    type="email"
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
                    autoFocus
                    isInvalid={!!fieldErrors.email}
                    errorMessage={fieldErrors.email}
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="login-password" className="text-xs font-semibold text-[#8e8e9f] block">
                    Password
                  </label>
                  <Input
                    id="login-password"
                    aria-label="Password"
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    variant="bordered"
                    size="md"
                    startContent={<KeyRound className="w-4 h-4 text-[#8e8e9f] shrink-0" />}
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#8e8e9f] hover:text-white transition-colors focus:outline-none p-1"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                    isInvalid={!!fieldErrors.password}
                    errorMessage={fieldErrors.password}
                  />
                </div>

                <Button
                  type="submit"
                  size="md"
                  isLoading={loading}
                  endContent={!loading && <ArrowRight className="w-4 h-4" />}
                  className="w-full font-bold rounded-full !bg-white !text-black hover:!bg-white/90 shadow-sm active:scale-[0.98] transition-all h-11 text-sm mt-2"
                >
                  Sign In
                </Button>
              </form>
            </CardBody>

            <Divider className="my-3 border-border/40" />

            <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground pb-2 pt-2 px-0">
              <div>
                Don't have an account?{' '}
                <Link to="/register" className="text-primary font-bold hover:underline">
                  Register new user
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default LoginPage;
