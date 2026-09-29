import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { EvidenceDrawer } from '../common/EvidenceDrawer';
import { EntityDetailModal } from '../common/EntityDetailModal';
import { RiskAdvisorWidget } from '../common/RiskAdvisorWidget';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { AirgapExportModal } from '../common/AirgapExportModal';
import { SupervisoryAnalyticsInspectorModal } from '../common/SupervisoryAnalyticsInspectorModal';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { toasts, removeToast, isAdvisorOpen, setIsAdvisorOpen } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Fixed Left Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Slide-out Evidence Drawer */}
      <EvidenceDrawer />

      {/* Entity Drilldown Modal */}
      <EntityDetailModal />

      {/* Global Command Palette & Unified Search Modal */}
      <GlobalSearchModal />

      {/* Air-Gapped Client-Side Data Export Modal */}
      <AirgapExportModal />

      {/* Supervisory Analytics Engine & Mathematical Inspector Modal */}
      <SupervisoryAnalyticsInspectorModal />

      {/* AI-Powered Risk Advisor Chat Widget */}
      <RiskAdvisorWidget
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
      />

      {/* Toast Notification Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-lg shadow-xl border flex items-start gap-3 transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-white dark:bg-slate-900 border-emerald-500/50 text-slate-800 dark:text-slate-100'
                : toast.type === 'warning'
                ? 'bg-white dark:bg-slate-900 border-amber-500/50 text-slate-800 dark:text-slate-100'
                : 'bg-white dark:bg-slate-900 border-blue-500/50 text-slate-800 dark:text-slate-100'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            )}
            {toast.type === 'warning' && (
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            )}
            {toast.type === 'info' && (
              <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">
                {toast.title}
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
