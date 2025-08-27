/*
  AppShell.tsx
  -------------
  Unified application layout. Provides:
  - Persistent Sidebar on the left
  - Top header bar (brand + quick actions slot-ready)
  - Main content area for routed pages
  - SettingsModal mounted at root for global access

  Keep this file small, documented, and semantically named.
*/

import React from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import SettingsModal from '@/components/settings/SettingsModal';

interface AppShellProps {
  /** Routed content goes here */
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="relative flex h-screen bg-background text-foreground overflow-hidden">
      {/* Background gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-shell-gradient z-0" aria-hidden />
      {/* Sidebar */}
      <div className="relative z-20 h-full"><Sidebar /></div>

      {/* Main region: header + content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Top header bar */}
        <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/5 bg-white/0 border-b border-border text-foreground px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-intellisync-blue shadow-[0_0_16px_rgba(74,74,255,0.6)]" />
            <h1 className="text-sm sm:text-base font-semibold tracking-tight">IntelliSync</h1>
            <div className="ml-auto flex items-center gap-2">
              {/* Slot for future actions: theme toggle, account, etc. */}
            </div>
          </div>
        </header>

        {/* Routed content */}
        <main className="flex-1 min-h-0 text-foreground">
          {children}
        </main>
      </div>

      {/* Global settings modal */}
      <SettingsModal />
    </div>
  );
};

export default AppShell;
