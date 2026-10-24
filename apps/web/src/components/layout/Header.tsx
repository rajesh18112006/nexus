import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Bell, LogOut, Keyboard, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { ROLE_LABELS } from '@/lib/rbac';

export function Header() {
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const toggleDark = useUIStore((s) => s.toggleDarkMode);
  const darkMode = useUIStore((s) => s.darkMode);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const currentRoleInfo = user ? ROLE_LABELS[user.role] || ROLE_LABELS.admin : ROLE_LABELS.admin;
  const [pendingCount, setPendingCount] = React.useState<number>(0);

  // Poll pending count if user is admin
  React.useEffect(() => {
    if (user?.role !== 'admin') {
      setPendingCount(0);
      return;
    }

    const checkPending = async () => {
      try {
        const res = await api.get<{ count: number }>('/users/pending');
        setPendingCount(res.data?.count || 0);
      } catch {
        /* ignore */
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 30000);
    return () => clearInterval(interval);
  }, [user?.role]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    logout();
    navigate('/login');
    toast.info('Logged out successfully');
  };

  return (
    <header className="shell-header">
      {/* Search / Command Palette trigger */}
      <button
        onClick={openCommandPalette}
        className={cn(
          'flex items-center gap-2 h-7 px-3 flex-1 max-w-xs',
          'bg-surface-raised border border-border rounded text-xs text-ink-faint',
          'hover:border-border-strong hover:text-ink-muted transition-colors',
          'text-left cursor-pointer'
        )}
        aria-label="Open command palette"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search or jump to…</span>
        <kbd className="ml-auto text-2xs bg-surface-overlay border border-border rounded px-1 py-0.5 font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Authenticated User Role Badge */}
      <div className="flex items-center gap-2 ml-3">
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border font-medium select-none shadow-2xs',
            currentRoleInfo.badgeClass
          )}
          title={currentRoleInfo.description}
        >
          <span>{currentRoleInfo.icon}</span>
          <span className="font-semibold">{currentRoleInfo.title}</span>
        </div>
        {user && (
          <span className="text-xs text-ink-muted hidden md:inline-block font-medium">
            {user.firstName} {user.lastName}
          </span>
        )}

        {/* Admin Pending Approvals Quick Alert Pill */}
        {user?.role === 'admin' && pendingCount > 0 && (
          <button
            onClick={() => navigate('/app/settings?tab=team')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-warning-bg text-warning border border-warning/40 hover:bg-warning-bg/80 transition-all cursor-pointer shadow-xs animate-pulse"
            title={`${pendingCount} pending member request${pendingCount > 1 ? 's' : ''} awaiting review`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            <span>{pendingCount} Pending</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Dark mode */}
        <button
          onClick={toggleDark}
          className="w-8 h-8 flex items-center justify-center text-ink-faint hover:text-ink rounded hover:bg-surface-raised transition-colors cursor-pointer"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Keyboard shortcut cheat sheet */}
        <button
          className="w-8 h-8 flex items-center justify-center text-ink-faint hover:text-ink rounded hover:bg-surface-raised transition-colors cursor-pointer"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/app/alerts')}
          className="w-8 h-8 flex items-center justify-center text-ink-faint hover:text-ink rounded hover:bg-surface-raised transition-colors relative cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-critical" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 h-7 text-xs text-ink-muted hover:text-critical rounded hover:bg-critical-bg transition-colors cursor-pointer"
          aria-label="Sign out"
          title="Sign out of current account"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
