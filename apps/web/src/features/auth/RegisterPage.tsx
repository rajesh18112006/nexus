import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Check,
  Building2,
  Eye,
  EyeOff,
  Mail,
  RotateCcw,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
  Users,
  Search,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { RegisterSchema, type RegisterInput, type Role } from '@nexus/shared';
import { get, post } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AuthUser } from '@nexus/shared';
import { GoogleAuthModal, GoogleSignInButton } from './components/GoogleAuthModal';
import { ROLE_LABELS } from '@/lib/rbac';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const FIVE_ROLES: Role[] = [
  'admin',
  'procurement_manager',
  'warehouse_manager',
  'finance',
  'auditor',
];

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  // Mode: Create Workspace vs Join Workspace
  const [mode, setMode] = React.useState<'create_org' | 'join_org'>('create_org');
  const [selectedRole, setSelectedRole] = React.useState<Role>('warehouse_manager');

  // Step state: Step 1 (Register) vs Step 2 (Verify Email)
  const [step, setStep] = React.useState<'form' | 'verify'>('form');
  const [registeredEmail, setRegisteredEmail] = React.useState<string>('');
  const [verificationCode, setVerificationCode] = React.useState<string>('');
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Slug lookup state for join_org
  const [lookupLoading, setLookupLoading] = React.useState(false);
  const [orgLookupResult, setOrgLookupResult] = React.useState<{ exists: boolean; name?: string } | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState<number>(0);
  const [showPassword, setShowPassword] = React.useState(false);
  const [autoSlug, setAutoSlug] = React.useState(true);
  const [googleModalOpen, setGoogleModalOpen] = React.useState(false);

  // If redirected with ?verify=email
  React.useEffect(() => {
    const emailParam = searchParams.get('verify');
    if (emailParam) {
      setRegisteredEmail(emailParam);
      setStep('verify');
    }
  }, [searchParams]);

  // Resend cooldown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      mode: 'create_org',
      organizationName: '',
      organizationSlug: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'admin',
    },
  });

  const orgNameValue = watch('organizationName');
  const orgSlugValue = watch('organizationSlug') || '';
  const passwordValue = watch('password') || '';

  // Synchronize mode and role changes into react-hook-form
  React.useEffect(() => {
    setValue('mode', mode);
    if (mode === 'create_org') {
      setValue('role', 'admin');
    } else {
      setValue('role', selectedRole);
    }
  }, [mode, selectedRole, setValue]);

  // Auto-slug update for create_org
  React.useEffect(() => {
    if (mode === 'create_org' && autoSlug && orgNameValue) {
      setValue('organizationSlug', slugify(orgNameValue), { shouldValidate: true });
    }
  }, [mode, orgNameValue, autoSlug, setValue]);

  // Debounced lookup of organization slug in join_org mode
  React.useEffect(() => {
    if (mode !== 'join_org' || !orgSlugValue || orgSlugValue.length < 2) {
      setOrgLookupResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const res = await get<{ exists: boolean; name?: string }>(`/users/organization-lookup/${encodeURIComponent(orgSlugValue)}`);
        setOrgLookupResult(res);
      } catch {
        setOrgLookupResult({ exists: false });
      } finally {
        setLookupLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [mode, orgSlugValue]);

  // Password criteria indicators
  const hasMinLen = passwordValue.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);

  // Step 1: Submit initial registration
  const onRegisterSubmit = async (data: RegisterInput) => {
    if (mode === 'join_org' && orgLookupResult && !orgLookupResult.exists) {
      toast.error('Organization Not Found', 'Please enter a valid workspace slug for the organization you want to join.');
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterInput = {
        ...data,
        mode,
        role: mode === 'create_org' ? 'admin' : selectedRole,
        organizationName: mode === 'create_org' ? data.organizationName : orgLookupResult?.name || data.organizationSlug,
      };

      const res = await post<{
        requiresVerification: boolean;
        email?: string;
        accessToken?: string;
        user?: AuthUser;
        previewUrl?: string;
      }>('/auth/register', payload);

      if (!res.requiresVerification && res.accessToken && res.user) {
        setAuth(res.user, res.accessToken);
        toast.success(
          'Workspace Created Successfully',
          `Welcome to NEXUS, ${res.user.firstName}! Instant workspace access active.`
        );
        navigate('/app');
        return;
      }

      setRegisteredEmail(res.email || data.email);
      if (res.previewUrl) setPreviewUrl(res.previewUrl);
      setStep('verify');
      setCooldown(60);
      toast.success('Confirmation email dispatched', `We have sent a 6-digit code to ${res.email}.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Registration failed. Please check the details and try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm 6-digit OTP code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      toast.error('Invalid Code', 'Please enter all 6 digits of your verification code.');
      return;
    }

    setVerifying(true);
    try {
      const res = await post<{ accessToken: string; user: AuthUser }>('/auth/verify-email', {
        email: registeredEmail,
        code: verificationCode.trim(),
      });
      setAuth(res.user, res.accessToken);

      if (res.user.approvalStatus === 'PENDING') {
        toast.info(
          'Email Verified — Awaiting Admin Approval',
          `Welcome to NEXUS, ${res.user.firstName}! Your request to join as ${res.user.role.replace('_', ' ').toUpperCase()} is pending administrator authorization.`
        );
        navigate('/pending-approval');
      } else {
        toast.success('Email Verified Successfully', `Welcome to NEXUS, ${res.user.firstName}! Your workspace is active.`);
        navigate('/app');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Verification failed. Please check the code and try again.';
      toast.error('Verification Error', msg);
    } finally {
      setVerifying(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      const res = await post<{ success: boolean; message: string; previewUrl?: string }>('/auth/resend-code', {
        email: registeredEmail,
      });
      if (res.previewUrl) setPreviewUrl(res.previewUrl);
      setCooldown(60);
      toast.success('New Code Dispatched', res.message || 'A fresh confirmation code was sent.');
    } catch (err: any) {
      toast.error('Failed to resend code', err?.response?.data?.message || 'Please try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-dvh flex">
      {/* ── Left editorial panel ── */}
      <div className="hidden lg:flex flex-col w-[440px] bg-ink flex-shrink-0 relative overflow-hidden select-none">
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-accent" />

        <div className="px-10 pt-12 pb-8 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-9 h-9 rounded bg-accent flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-xl font-display font-semibold text-ink-inverse tracking-tight">NEXUS</span>
                <p className="text-xs text-ink-muted -mt-0.5">Enterprise Supply Chain Platform</p>
              </div>
            </div>

            <h1 className="font-display text-3xl font-semibold text-ink-inverse leading-tight mb-4">
              Enterprise Role Governance & Multi-Tenant Workspaces.
            </h1>
            <p className="text-sm text-ink-muted leading-relaxed mb-6">
              Create a fresh workspace for your company or join an existing organization with role-based permissions and admin approvals.
            </p>

            {/* 5 Roles Showcase */}
            <div className="space-y-2 mb-6">
              <div className="text-2xs uppercase tracking-wider text-ink-muted font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span>5 Enterprise Roles in NEXUS</span>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {FIVE_ROLES.map((r) => {
                  const info = ROLE_LABELS[r];
                  return (
                    <div
                      key={r}
                      className="p-2.5 rounded bg-surface/10 border border-white/5 flex items-start gap-2.5"
                    >
                      <span className="text-base select-none mt-0.5">{info.icon}</span>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink-inverse flex items-center gap-1.5">
                          <span>{info.title}</span>
                        </div>
                        <p className="text-2xs text-ink-muted leading-tight mt-0.5">{info.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-surface/10 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-2 text-accent font-semibold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Approval Security</span>
              </div>
              <p className="text-2xs text-ink-muted leading-relaxed">
                Joining members require administrator review and approval before accessing confidential stock levels, financial matrices, and supply records.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-2xs text-ink-muted">
            <span>SOC2 Type II Compliant</span>
            <span>Argon2id · Real OAuth 2.0</span>
          </div>
        </div>
      </div>

      {/* ── Right panel: dynamic step view ── */}
      <div className="flex-1 flex items-center justify-center bg-surface px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-display font-semibold text-ink">NEXUS</span>
          </div>

          {step === 'form' ? (
            /* ── STEP 1: Registration Form ── */
            <div>
              <div className="mb-6">
                <h2 className="font-display text-2xl font-semibold text-ink mb-1">
                  {mode === 'create_org' ? 'Create a New Organization' : 'Join an Existing Workspace'}
                </h2>
                <p className="text-sm text-ink-muted">
                  Already have an account?{' '}
                  <Link to="/login" className="text-accent hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Mode Switch Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-surface-raised border border-border rounded-lg mb-6">
                <button
                  type="button"
                  onClick={() => setMode('create_org')}
                  className={`py-2 px-3 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    mode === 'create_org'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Create Workspace</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('join_org')}
                  className={`py-2 px-3 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    mode === 'join_org'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Join as Team Member</span>
                </button>
              </div>

              {/* Continue with Google */}
              <div className="mb-6">
                <GoogleSignInButton
                  onClick={() => setGoogleModalOpen(true)}
                  text="Sign up with Google"
                  disabled={loading}
                />

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-2xs uppercase">
                    <span className="bg-surface px-2.5 text-ink-muted tracking-wider font-medium">
                      Or continue with corporate credentials
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-4" noValidate>
                {/* ── Mode A: Create Workspace ── */}
                {mode === 'create_org' ? (
                  <div className="p-4 border border-border rounded-lg bg-surface-raised space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
                      <Building2 className="w-4 h-4 text-accent" />
                      <span>New Organization Identity</span>
                    </div>
                    <Input
                      label="Company / Enterprise Name"
                      placeholder="e.g. Acme Industrial Technologies"
                      error={errors.organizationName?.message}
                      required
                      {...register('organizationName')}
                    />
                    <div>
                      <Input
                        label="Workspace URL Slug"
                        placeholder="acme-industrial"
                        hint="Unique identifier for team members to join"
                        error={errors.organizationSlug?.message}
                        required
                        {...register('organizationSlug', {
                          onChange: () => setAutoSlug(false),
                        })}
                      />
                    </div>
                    <div className="p-2.5 rounded bg-healthy/10 border border-healthy/20 text-healthy flex items-center gap-2 text-2xs">
                      <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                      <span><strong>Instant Administrator Activation:</strong> No email confirmation code required for workspace creators.</span>
                    </div>
                  </div>
                ) : (
                  /* ── Mode B: Join Existing Workspace ── */
                  <div className="p-4 border border-border rounded-lg bg-surface-raised space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
                      <Building2 className="w-4 h-4 text-accent" />
                      <span>Existing Organization Workspace</span>
                    </div>

                    <div>
                      <Input
                        label="Workspace Slug / Identifier"
                        placeholder="e.g. acme-industrial"
                        hint="Obtain this workspace slug from your organization's Administrator"
                        error={errors.organizationSlug?.message}
                        required
                        {...register('organizationSlug')}
                      />

                      {/* Live Org Lookup Feedback */}
                      {lookupLoading && (
                        <div className="flex items-center gap-2 text-2xs text-ink-muted mt-2">
                          <Search className="w-3 h-3 animate-spin text-accent" />
                          <span>Verifying workspace slug...</span>
                        </div>
                      )}
                      {!lookupLoading && orgLookupResult && (
                        <div
                          className={`flex items-center gap-2 text-xs font-medium p-2.5 rounded mt-2 border ${
                            orgLookupResult.exists
                              ? 'bg-success-bg/30 text-success border-success/30'
                              : 'bg-critical-bg/30 text-critical border-critical/30'
                          }`}
                        >
                          {orgLookupResult.exists ? (
                            <>
                              <CheckCircle className="w-4 h-4 flex-shrink-0" />
                              <span>Verified: <strong>{orgLookupResult.name}</strong></span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span>Workspace not found. Please double-check the slug with your admin.</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                        Select Your Requested Role:
                      </label>
                      <p className="text-2xs text-ink-muted">
                        Your organization administrator will review and confirm this role upon approval.
                      </p>

                      <div className="grid grid-cols-1 gap-2 pt-1">
                        {FIVE_ROLES.map((r) => {
                          const info = ROLE_LABELS[r];
                          const isSelected = selectedRole === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setSelectedRole(r)}
                              className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-accent bg-accent/5 ring-1 ring-accent'
                                  : 'border-border bg-surface hover:bg-surface-raised'
                              }`}
                            >
                              <span className="text-lg select-none">{info.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-xs text-ink">{info.title}</span>
                                  {isSelected && (
                                    <span className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center text-3xs">
                                      ✓
                                    </span>
                                  )}
                                </div>
                                <p className="text-2xs text-ink-muted mt-0.5 leading-snug">{info.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-3 rounded bg-warning-bg/30 border border-warning/30 flex items-start gap-2 text-2xs text-warning">
                      <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Admin Approval Required:</strong> You will be registered in pending status. Access to workspace data requires administrator approval.
                      </span>
                    </div>
                  </div>
                )}

                {/* Account Details */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                    <span>Your Credentials</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First name" placeholder="Rajesh" error={errors.firstName?.message} required {...register('firstName')} />
                    <Input label="Last name" placeholder="Kumar" error={errors.lastName?.message} required {...register('lastName')} />
                  </div>

                  <Input
                    label="Corporate Email"
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    error={errors.email?.message}
                    required
                    {...register('email')}
                  />

                  <div>
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      error={errors.password?.message}
                      iconRight={showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      onIconRightClick={() => setShowPassword((v) => !v)}
                      required
                      {...register('password')}
                    />

                    {/* Password requirements */}
                    <div className="flex items-center gap-4 mt-2 text-2xs text-ink-muted">
                      <span className={`flex items-center gap-1 ${hasMinLen ? 'text-healthy font-semibold' : ''}`}>
                        <Check className={`w-3 h-3 ${hasMinLen ? 'text-healthy' : 'opacity-40'}`} /> 8+ chars
                      </span>
                      <span className={`flex items-center gap-1 ${hasUpper ? 'text-healthy font-semibold' : ''}`}>
                        <Check className={`w-3 h-3 ${hasUpper ? 'text-healthy' : 'opacity-40'}`} /> 1 uppercase
                      </span>
                      <span className={`flex items-center gap-1 ${hasNumber ? 'text-healthy font-semibold' : ''}`}>
                        <Check className={`w-3 h-3 ${hasNumber ? 'text-healthy' : 'opacity-40'}`} /> 1 number
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  iconRight={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}
                  className="mt-4"
                >
                  {mode === 'create_org' ? 'Create Organization & Launch Workspace' : 'Submit Membership Request'}
                </Button>
              </form>

              <p className="text-2xs text-ink-muted text-center mt-6">
                By continuing, you agree to NEXUS Enterprise Terms of Service and Privacy Policy.
              </p>
            </div>
          ) : (
            /* ── STEP 2: Email Verification Code Entry ── */
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors mb-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to registration details</span>
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-ink">Check your email</h2>
                <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto">
                  We've sent a 6-digit confirmation code to{' '}
                  <span className="font-semibold text-ink">{registeredEmail}</span>.<br />
                  Please enter the code below to verify your corporate email.
                </p>
              </div>

              {/* Dev Test Link if Ethereal preview is available */}
              {previewUrl && (
                <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between text-xs">
                  <span className="text-ink-muted text-2xs">Testing locally? View incoming test email:</span>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline font-semibold flex items-center gap-1 text-2xs"
                  >
                    <span>View Inbox Preview</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted text-center mb-2">
                    6-Digit Confirmation Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-14 text-center font-mono text-3xl font-bold tracking-[0.5em] border-2 border-border focus:border-accent rounded-lg bg-surface-raised text-ink focus:outline-none transition-all"
                  />
                  <p className="text-3xs text-ink-faint text-center mt-2">
                    Code expires in 15 minutes
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={verifying}
                  disabled={verificationCode.length !== 6}
                  iconRight={!verifying ? <CheckCircle className="w-4 h-4" /> : undefined}
                >
                  Verify Email & Continue
                </Button>
              </form>

              {/* Resend Code Section */}
              <div className="text-center pt-2 border-t border-border">
                <p className="text-xs text-ink-muted mb-2">Didn't receive the email? Check spam or resend:</p>
                <button
                  type="button"
                  disabled={cooldown > 0 || resending}
                  onClick={handleResendCode}
                  className={`text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                    cooldown > 0 || resending
                      ? 'text-ink-faint cursor-not-allowed'
                      : 'text-accent hover:underline cursor-pointer'
                  }`}
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}
                </button>
              </div>
            </div>
          )}
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
