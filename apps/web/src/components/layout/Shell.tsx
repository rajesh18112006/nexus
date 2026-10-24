import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';
import { ToastProvider } from '@/components/ui/Toast';

export function Shell() {
  return (
    <div className="flex min-h-dvh bg-surface">
      <Sidebar />
      <div className="shell-main">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <ToastProvider />
    </div>
  );
}
