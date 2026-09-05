import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Select,
  SelectItem,
  Button,
  Divider,
} from '@heroui/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatApiError } from '../lib/errorHandler';
import { PageTransition } from '../components/layout/PageTransition';
import { Logo } from '../components/common/Logo';
import {
  UserPlus,
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('user');
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
    setLoading(true);

    try {
      await register({ name, email, password, role });
      toast.success('Account created and saved to PostgreSQL!');
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
                  Create Account
                </h2>
                <p className="text-xs sm:text-sm text-[#8e8e9f] mt-1 font-sans">
                  Register a new account with role clearance
                </p>
              </div>
            </CardHeader>

            <CardBody className="px-0 py-2 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-name" className="text-xs font-semibold text-[#8e8e9f] block">
                    Full Name
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
                    required
                    autoFocus
                    isInvalid={!!fieldErrors.name}
                    errorMessage={fieldErrors.name}
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-email" className="text-xs font-semibold text-[#8e8e9f] block">
                    Email Address
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
                  <label htmlFor="reg-password" className="text-xs font-semibold text-[#8e8e9f] block">
                    Password (min 8 characters)
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
                  <label htmlFor="reg-role" className="text-xs font-semibold text-[#8e8e9f] block">
                    Assigned Clearance Role
                  </label>
                  <Select
                    id="reg-role"
                    aria-label="Assigned Clearance Role"
                    selectedKeys={[role]}
                    onChange={(e) => setRole(e.target.value)}
                    variant="bordered"
                    size="md"
                    startContent={<Shield className="w-4 h-4 text-[#8e8e9f] shrink-0" />}
                    classNames={{
                      base: "w-full",
                      trigger: "!bg-[#1c1c24] border border-white/[0.12] hover:border-white/30 focus:!border-primary rounded-xl h-11 transition-all shadow-none text-white",
                      value: "text-white text-sm",
                      popoverContent: "bg-[#1c1c24] border border-white/[0.1] text-white",
                    }}
                  >
                    <SelectItem key="user" description="Standard CRUD & live WebSocket events">
                      Standard User
                    </SelectItem>
                    <SelectItem key="manager" description="Team review & channel broadcasts">
                      Manager
                    </SelectItem>
                    <SelectItem key="admin" description="Full access including /admin console">
                      Administrator
                    </SelectItem>
                  </Select>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold leading-relaxed">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  size="md"
                  className="w-full font-bold rounded-full !bg-white !text-black hover:!bg-white/90 shadow-sm active:scale-[0.98] transition-all h-11 text-sm mt-2"
                  isLoading={loading}
                  endContent={!loading && <ArrowRight className="w-4 h-4" />}
                >
                  Sign Up
                </Button>
              </form>
            </CardBody>

            <Divider className="my-3 border-border/40" />

            <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground pb-2 pt-2 px-0">
              <div>
                Already registered?{' '}
                <Link to="/login" className="text-primary font-bold hover:underline">
                  Sign in
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
