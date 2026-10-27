import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight, TrendingUp, Package, Truck, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { LoginSchema, type LoginInput, type Role } from '@nexus/shared';
import { post } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AuthUser } from '@nexus/shared';
import { GoogleAuthModal, GoogleSignInButton } from './components/GoogleAuthModal';
import { ROLE_LABELS } from '@/lib/rbac';

const FIVE_ROLES: Role[] = [
  'admin',
  'procurement_manager',
  'warehouse_manager',
  'finance',
  'auditor',
];

const DEMO_ACCOUNTS = [
  { role: 'admin', label: 'Admin', email: 'admin@nexus.demo', icon: '👑' },
  { role: 'procurement_manager', label: 'Procurement', email: 'procure@nexus.demo', icon: '📦' },
  { role: 'warehouse_manager', label: 'Warehouse', email: 'warehouse@nexus.demo', icon: '🏭' },
  { role: 'finance', label: 'Finance', email: 'finance@nexus.demo', icon: '💰' },
  { role: 'auditor', label: 'Auditor', email: 'auditor@nexus.demo', icon: '📋' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [googleModalOpen, setGoogleModalOpen] = React.useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const fillDemoAccount = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'Demo@12345', { shouldValidate: true });
    toast.info('Demo Credentials Loaded', `Selected ${email}. Click Sign In to enter without any verification code.`);
  };

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const res = await post<{ accessToken: string; user: AuthUser }>('/auth/login', data);
      setAuth(res.user, res.accessToken);

      if (res.user.approvalStatus === 'PENDING') {
        toast.info(
          'Account Pending Approval',
          `Welcome, ${res.user.firstName}! Your account is awaiting administrator authorization.`
        );
        navigate('/pending-approval');
        return;
      }

      const roleTitle = ROLE_LABELS[res.user.role]?.title || res.user.role.toUpperCase();
      toast.success('Signed in successfully', `Welcome back, ${res.user.firstName}! (${roleTitle})`);
      navigate('/app');
    } catch (err: any) {
      const errCode = err?.response?.data?.code;
      const msg = err?.response?.data?.message ?? 'Invalid email or password.';

      if (errCode === 'EMAIL_NOT_VERIFIED') {
        toast.error('Email Not Verified', 'Please enter the 6-digit confirmation code sent to your email.');
        navigate(`/register?verify=${encodeURIComponent(data.email)}`);
        return;
      }

      toast.error('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex">
      {/* ── Left panel: editorial ── */}
      <div className="hidden lg:flex flex-col w-[440px] bg-ink flex-shrink-0 relative overflow-hidden select-none">
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-accent" />

        <div className="px-10 pt-12 pb-8 flex-1 flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-9 h-9 rounded bg-accent flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-xl font-display font-semibold text-ink-inverse tracking-tight">NEXUS</span>
                <p className="text-xs text-ink-muted -mt-0.5">Supply Chain & Inventory Intelligence</p>
              </div>
            </div>

            {/* Headline */}
            <div className="mb-8">
              <h1 className="font-display text-3xl font-semibold text-ink-inverse leading-tight mb-3">
                Enterprise Multi-Role Supply Chain Operations.
              </h1>
              <p className="text-sm text-ink-muted leading-relaxed">
                NEXUS isolates access across 5 organizational roles, maintaining strict authorization boundaries and admin-approved workflows.
              </p>
            </div>

            {/* 5 Enterprise Roles Showcase */}
            <div className="space-y-2 mb-8">
              <div className="text-2xs uppercase tracking-wider text-ink-muted font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span>Authorized System Roles</span>
              </div>
              <div className="space-y-2">
                {FIVE_ROLES.map((r) => {
                  const info = ROLE_LABELS[r];
                  return (
                    <div
                      key={r}
                      className="p-2.5 rounded bg-surface/10 border border-white/5 flex items-start gap-2.5"
                    >
                      <span className="text-base select-none mt-0.5">{info.icon}</span>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-ink-inverse flex items-center gap-2">
                          <span>{info.title}</span>
                        </div>
                        <p className="text-2xs text-ink-muted leading-tight mt-0.5">{info.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded bg-surface/10 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-accent font-semibold text-xs">
                <Lock className="w-3.5 h-3.5" />
                <span>Governance & Verification</span>
              </div>
              <p className="text-2xs text-ink-muted leading-relaxed">
                All team member accounts are protected by cryptographic tokens, argon2id hashing, and administrator sign-off.
              </p>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-2xs text-ink-muted">
            <span>Enterprise Edition</span>
            <span>Indian Rupee (₹) · Multi-Tenant</span>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-display font-semibold text-ink">NEXUS</span>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold text-ink mb-1">Sign in to your account</h2>
            <p className="text-sm text-ink-muted">
              Don't have an account or need to join a team?{' '}
              <Link to="/register" className="text-accent hover:underline font-medium">
                Register here
              </Link>
            </p>
          </div>

          {/* Quick Demo Accounts Selector (1-Click Fill) */}
          <div className="p-3 rounded-lg border border-border bg-surface-raised space-y-2 mb-5">
            <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-ink-muted">
              <span className="flex items-center gap-1.5 text-accent">
                <Zap className="w-3.5 h-3.5" />
                Quick Demo Accounts (No OTP)
              </span>
              <span className="text-3xs text-ink-faint">Password: Demo@12345</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => fillDemoAccount(demo.email)}
                  className="px-2 py-1 rounded text-2xs font-medium border border-border bg-surface hover:bg-accent/10 hover:border-accent/30 hover:text-accent transition-colors flex items-center gap-1 cursor-pointer"
                  title={`Click to fill ${demo.email}`}
                >
                  <span>{demo.icon}</span>
                  <span>{demo.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Continue with Google */}
          <div className="mb-6">
            <GoogleSignInButton
              onClick={() => setGoogleModalOpen(true)}
              text="Continue with Google"
              disabled={loading}
            />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-2xs uppercase">
                <span className="bg-surface px-2.5 text-ink-muted tracking-wider font-medium">
                  Or sign in with email
                </span>
              </div>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Corporate Email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              error={errors.email?.message}
              required
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              iconRight={showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              onIconRightClick={() => setShowPassword((v) => !v)}
              required
              {...register('password')}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-ink-muted text-2xs">Admin approval required for new members</span>
              <a href="#" className="text-accent hover:underline text-2xs font-medium">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              iconRight={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}
              className="mt-2"
            >
              Sign In to NEXUS
            </Button>
          </form>

          {/* Mobile Role Summary Pills */}
          <div className="mt-8 pt-6 border-t border-border lg:hidden">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-muted mb-2">5 Enterprise Roles</p>
            <div className="flex flex-wrap gap-1.5">
              {FIVE_ROLES.map((r) => {
                const info = ROLE_LABELS[r];
                return (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs border bg-surface-raised text-ink-muted"
                  >
                    <span>{info.icon}</span>
                    <span>{info.title}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Google Sign In Account Chooser Modal */}
      <GoogleAuthModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
      />
    </div>
  );
}
