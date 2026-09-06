import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { NetworkStatusBanner } from '../common/NetworkStatusBanner';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { forceResetBodyScroll } from '../common/PortalModal';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Scroll to top on route change & force reset any stuck scroll locks
  useEffect(() => {
    forceResetBodyScroll();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans flex flex-col">
      {/* Offline network status banner */}
      <NetworkStatusBanner />

      <div className="flex-1 flex min-w-0 relative">
        {/* Proper Sidebar Navigation */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Website Content View */}
        <div className="flex-1 flex flex-col md:pl-64 min-w-0 min-h-screen">
          {/* Sticky Header with Breadcrumbs, Search, Live Socket & User Menu */}
          <Header
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            onSearchClick={() => setSearchOpen(true)}
          />

          {/* Dynamic page content */}
          <main ref={mainRef} className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 min-w-0">
            <ErrorBoundary componentName={`Route (${location.pathname})`}>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Global Command Palette / Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
};

export default AppLayout;
