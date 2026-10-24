import * as React from 'react';
import { ExternalLink, Copy, Check, AlertCircle, Loader2, Sparkles, X, KeyRound } from 'lucide-react';
import { get, post } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import type { AuthUser } from '@nexus/shared';

// Google Multicolor SVG Icon
export function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export interface GoogleConfigResponse {
  configured: boolean;
  clientId: string | null;
  callbackUrl: string;
}

/**
 * Reusable "Continue with Google" / "Sign up with Google" button
 * Opens Google's authentic account selection & authorization flow
 */
export function GoogleSignInButton({
  onClick,
  text = 'Continue with Google',
  disabled = false,
  className = '',
}: {
  onClick: () => void;
  text?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-11 px-4 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium text-sm rounded-lg border border-gray-300 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      <GoogleIcon className="w-4 h-4 flex-shrink-0" />
      <span>{text}</span>
    </button>
  );
}

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Real Google OAuth Initiator & Configuration Guide
 * When opened:
 * 1. Checks backend Google OAuth status
 * 2. If configured: immediately launches Google's authentic OAuth account-selection popup
 * 3. If not yet configured: displays the Google Cloud Console guide with copyable URIs
 */
export function GoogleAuthModal({ isOpen, onClose, onSuccess }: GoogleAuthModalProps) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [checking, setChecking] = React.useState(true);
  const [config, setConfig] = React.useState<GoogleConfigResponse | null>(null);
  const [authenticating, setAuthenticating] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // Check config on mount or open
  React.useEffect(() => {
    if (!isOpen) {
      setAuthenticating(false);
      return;
    }

    let isMounted = true;
    setChecking(true);

    get<GoogleConfigResponse>('/auth/google/config')
      .then((data) => {
        if (!isMounted) return;
        setConfig(data);
        setChecking(false);

        // If configured, immediately launch Google's authentic account selection popup
        if (data.configured) {
          triggerGooglePopup(data);
        }
      })
      .catch((err) => {
        console.error('Failed to check Google OAuth configuration:', err);
        if (isMounted) {
          setChecking(false);
          toast.error('Google OAuth', 'Failed to reach authentication service.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Listen for Google Auth callback message from popup window
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const { user, accessToken } = event.data;
        if (user && accessToken) {
          setAuth(user, accessToken);
          setAuthenticating(false);
          onClose();
          if (onSuccess) onSuccess();

          if (user.approvalStatus === 'PENDING') {
            toast.info('Account Pending Approval', `Welcome to NEXUS, ${user.firstName}! Your access request is awaiting admin approval.`);
            navigate('/pending-approval');
          } else {
            toast.success('Signed in with Google', `Signed in as ${user.role.replace('_', ' ').toUpperCase()} — Welcome, ${user.firstName}!`);
            navigate('/app');
          }
        }
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        setAuthenticating(false);
        toast.error('Google Sign-In Cancelled', event.data.message || 'Authentication was not completed.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate, setAuth, onClose, onSuccess]);

  const triggerGooglePopup = (currentConfig?: GoogleConfigResponse | null) => {
    setAuthenticating(true);

    const popupWidth = 520;
    const popupHeight = 650;
    const left = Math.max(0, window.screenX + (window.outerWidth - popupWidth) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - popupHeight) / 2);

    // Open authentic Google account selection flow
    const popup = window.open(
      '/api/v1/auth/google/login',
      'nexus_google_oauth',
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},status=0,toolbar=0,menubar=0,location=0`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // Popup blocked by browser: fallback to full window redirect
      toast.info('Opening Google Sign-In', 'Redirecting to Google authentication...');
      window.location.href = '/api/v1/auth/google/login';
      return;
    }

    // Monitor popup closed by user before completing
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setAuthenticating(false);
      }
    }, 1000);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success('Copied to Clipboard', text);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  const originUrl = window.location.origin;
  const callbackUrl = config?.callbackUrl || 'http://localhost:4000/api/v1/auth/google/callback';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div
        className="w-full max-w-[580px] bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <GoogleIcon className="w-5 h-5" />
            <span className="text-sm font-semibold text-gray-800">Google OAuth 2.0 Authentication</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">
          {checking ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs text-gray-500">Checking Google OAuth configuration...</p>
            </div>
          ) : config?.configured ? (
            /* Configured State: Popup launching / ready */
            <div className="py-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                {authenticating ? (
                  <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                ) : (
                  <GoogleIcon className="w-7 h-7" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {authenticating ? 'Connecting to Google…' : 'Google Authentication Ready'}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mb-6">
                {authenticating
                  ? 'A genuine Google account-selection window was opened. Please pick your Google account to continue.'
                  : 'Click below if the Google authorization window was closed or blocked.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => triggerGooglePopup(config)}
                  className="flex-1 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <GoogleIcon className="w-4 h-4" />
                  <span>Launch Google Sign-In</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Setup Required State: Clear instructions for Google Cloud Console */
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold text-amber-900">Google Client ID Required:</span>
                  <p className="mt-0.5">
                    To enable Google OAuth account-selection in your environment, create an OAuth 2.0 Client ID in Google Cloud Console and paste it into your <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">.env</code> file.
                  </p>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Quick Setup Steps
                </div>

                <div className="space-y-2.5 text-xs text-gray-600">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center flex-shrink-0 text-2xs">
                      1
                    </span>
                    <div>
                      Open{' '}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        Google Cloud Console Credentials
                        <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      and click <strong>Create Credentials → OAuth Client ID</strong>.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center flex-shrink-0 text-2xs">
                      2
                    </span>
                    <div>
                      Choose Application type: <strong>Web application</strong>.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center flex-shrink-0 text-2xs">
                      3
                    </span>
                    <div className="w-full">
                      <span>Add to <strong>Authorized JavaScript origins</strong>:</span>
                      <div className="mt-1 flex items-center justify-between bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded font-mono text-2xs text-gray-800">
                        <span>{originUrl}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(originUrl, 'origin')}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Copy origin"
                        >
                          {copiedField === 'origin' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center flex-shrink-0 text-2xs">
                      4
                    </span>
                    <div className="w-full">
                      <span>Add to <strong>Authorized redirect URIs</strong>:</span>
                      <div className="mt-1 flex items-center justify-between bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded font-mono text-2xs text-gray-800">
                        <span>{callbackUrl}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(callbackUrl, 'callback')}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Copy redirect URI"
                        >
                          {copiedField === 'callback' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center flex-shrink-0 text-2xs">
                      5
                    </span>
                    <div>
                      Paste the generated <strong>Client ID</strong> & <strong>Client Secret</strong> into <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono">apps/api/.env</code>:
                      <pre className="mt-1.5 p-2 bg-gray-900 text-gray-200 rounded text-[11px] font-mono select-all">
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <span>Open Google Cloud Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
