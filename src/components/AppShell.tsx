'use client';

import React, { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { AppProfileGuard } from '@/components/profiles/AppProfileGuard';
import { ChildProfileProvider } from '@/components/profiles/ChildProfileProvider';
import { MobileMenuButton } from '@/components/ui/MobileMenuButton';

const SIDEBAR_COLLAPSED_KEY = 'pequenos-discipulos-sidebar-collapsed';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === 'true') setSidebarCollapsed(true);
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <ChildProfileProvider>
      <AppProfileGuard>
        <div className="bg-pergaminho textura-pergaminho text-tinta min-h-screen">
          <div className="flex h-screen overflow-hidden">
            <AppSidebar
              open={sidebarOpen}
              collapsed={sidebarCollapsed}
              onClose={() => setSidebarOpen(false)}
              onToggleCollapse={toggleSidebarCollapsed}
            />

            <main className="flex-1 min-w-0 w-full overflow-y-auto p-4 md:p-8">
              <div className="max-w-6xl mx-auto">
                <MobileMenuButton
                  expanded={sidebarOpen}
                  onClick={() => setSidebarOpen(true)}
                />

                {children}
              </div>
            </main>
          </div>
        </div>
      </AppProfileGuard>
    </ChildProfileProvider>
  );
}
