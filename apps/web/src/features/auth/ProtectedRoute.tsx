import * as React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { api, get } from '@/lib/api';
import type { AuthUser } from '@nexus/shared';

export function ProtectedRoute() {
  const { isAuthenticated, accessToken, setAuth, logout, user } = useAuthStore();
  const [checking, setChecking] = React.useState(!isAuthenticated);

  React.useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      if (isAuthenticated) {
        setChecking(false);
        return;
      }

      // 1. Check if OAuth redirect saved a direct token in localStorage
      const directToken = localStorage.getItem('nexus_direct_token');
      if (directToken) {
        localStorage.removeItem('nexus_direct_token');
        try {
          useAuthStore.getState().setAccessToken(directToken);
          const user = await get<AuthUser>('/auth/me');
          if (mounted) {
            setAuth(user, directToken);
            setChecking(false);
            return;
          }
        } catch {
          // fall through to refresh
        }
      }

      // 2. Check if HTTP-only refresh token cookie is present
      try {
        const { data } = await api.post('/auth/refresh');
        const token = data.data.accessToken;
        useAuthStore.getState().setAccessToken(token);
        const meRes = await api.get('/auth/me');
        const user = meRes.data.data;
        if (mounted) {
          setAuth(user, token);
          setChecking(false);
        }
      } catch {
        if (mounted) {
          logout();
          setChecking(false);
        }
      }
    }

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, setAuth, logout]);

  React.useEffect(() => {
    if (isAuthenticated && accessToken) {
      try {
        connectSocket();
      } catch {
        /* silent */
      }
    }
    return () => disconnectSocket();
  }, [isAuthenticated, accessToken]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-ink-muted">Authenticating workspace...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Pending administrator approval gate
  if (user?.approvalStatus === 'PENDING') {
    return <Navigate to="/pending-approval" replace />;
  }

  return <Outlet />;
}
