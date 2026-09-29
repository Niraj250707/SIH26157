import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { AVAILABLE_REPORTS, INITIAL_DEVICES } from '../../data/dummyData';
import {
  Sun,
  Moon,
  Search,
  Bell,
  Menu,
  FileDown,
  X,
  Building2,
  AlertTriangle,
  FileText,
  FileCheck2,
  ArrowRight,
  Command,
  Layers,
  ShieldAlert,
  Sparkles,
  Radio,
  Server,
  Activity,
  Calculator,
  Download,
  Database,
  Lock,
} from 'lucide-react';
import { PageId } from '../../types';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const {
    activePage,
    setActivePage,
    isDarkMode,
    toggleDarkMode,
    searchQuery,
    setSearchQuery,
    entities,
    findings,
    auditLogs,
    setSelectedEntity,
    setSelectedFinding,
    navigateToReport,
    isLiveStreamActive,
    toggleLiveStream,
    setIsAdvisorOpen,
    currentUser,
    setIsSearchModalOpen,
    setIsAnalyticsInspectorOpen,
    openExportModal,
    lockStation,
    exportSqliteDump,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      if (e.key === 'Escape') {
        setShowSearchDropdown(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchModalOpen]);

  const getPageTitle = (page: PageId) => {
    switch (page) {
      case 'overview':
        return 'Overview Dashboard';
      case 'entity-risk':
        return 'Entity Risk Matrix';
      case 'findings':
        return 'Findings & Evidence Explorer';
      case 'priority-queue':
        return 'Priority Review Queue';
      case 'peer-comparison':
        return 'Sector Peer Comparison';
      case 'devices':
        return 'Monitored Devices & Assets';
      case 'reports':
        return 'Supervisory Reports & Export';
      case 'upload':
        return 'Telemetry Data Upload & Ingest';
      case 'audit-logs':
        return 'Supervisory Audit Logs';
      case 'compliance':
        return 'Regulatory Compliance & Frameworks';
      case 'remediation':
        return 'Remediation Workflow Engine';
      case 'settings':
        return 'Alert Subscriptions & Profile';
      case 'auth':
        return 'Station Access & Authentication';
      default:
        return 'Supervisory Dashboard';
    }
  };

  const query = searchQuery.trim().toLowerCase();

  // Search Results across Entities, Findings, Devices, Reports, and Audit Logs
  const matchedEntities = query
    ? entities.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.sector.toLowerCase().includes(query) ||
          e.code.toLowerCase().includes(query)
      )
    : [];

  const matchedDevices = query
    ? INITIAL_DEVICES.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.assetTag.toLowerCase().includes(query) ||
          d.ipAddress.toLowerCase().includes(query) ||
          d.deviceType.toLowerCase().includes(query) ||
          d.entityName.toLowerCase().includes(query)
      )
    : [];

  const matchedFindings = query
    ? findings.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          f.entityName.toLowerCase().includes(query) ||
          f.category.toLowerCase().includes(query) ||
          f.mitreTechnique.toLowerCase().includes(query)
      )
    : [];

  const matchedReports = query
    ? AVAILABLE_REPORTS.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.category.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query)
      )
    : [];

  const matchedAuditLogs = query
    ? auditLogs.filter(
        (a) =>
          a.id.toLowerCase().includes(query) ||
          a.targetName.toLowerCase().includes(query) ||
          a.action.toLowerCase().includes(query) ||
          a.actor.toLowerCase().includes(query)
      )
    : [];

  const totalResultsCount =
    matchedEntities.length +
    matchedDevices.length +
    matchedFindings.length +
    matchedReports.length +
    matchedAuditLogs.length;

  return (
    <header className="h-16 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Zone 1: Mobile Toggle & Contextual Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
          <span className="text-slate-900 dark:text-white font-semibold">SAT-SA</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-slate-700 dark:text-slate-300 font-medium hidden sm:inline">Supervisory Cycle 2026-Q3</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            {getPageTitle(activePage)}
          </span>
        </nav>
      </div>

      {/* Zone 2: Global Search Bar (Desktop) */}
      <div className="relative hidden md:block max-w-md w-full mx-4">
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="w-full flex items-center justify-between pl-3.5 pr-2.5 py-2 text-xs bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 transition-all shadow-2xs cursor-pointer group text-left"
          title="Open Global Search (⌘K / Ctrl+K)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search size={15} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
            <span className="truncate text-slate-500 dark:text-slate-400">
              Quick find entities, findings, or audit logs...
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 group-hover:border-blue-400/50 transition-colors shrink-0">
            <Command size={10} />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Zone 3: Actions & Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Real-time Stream Toggle */}
        <button
          onClick={toggleLiveStream}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono border font-semibold transition-all cursor-pointer ${
            isLiveStreamActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 shadow-2xs'
              : 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
          }`}
          title={
            isLiveStreamActive
              ? 'Real-Time Telemetry Stream Active (Click to Pause)'
              : 'Real-Time Telemetry Stream Paused (Click to Resume)'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveStreamActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span className="hidden lg:inline">
            {isLiveStreamActive ? 'LIVE TELEMETRY' : 'STREAM PAUSED'}
          </span>
        </button>

        {/* AI Risk Advisor Widget Launcher */}
        <button
          onClick={() => setIsAdvisorOpen(true)}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
          title="Launch AI Risk Advisor Chat"
        >
          <Sparkles size={13} className="text-amber-300 animate-pulse" />
          <span>Advisor</span>
        </button>

        {/* Offline Analytics Engine & Mathematical Formulation Inspector */}
        <button
          onClick={() => setIsAnalyticsInspectorOpen(true)}
          className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-all cursor-pointer"
          title="Supervisory Analytics Math & Outlier Engine (PS 26157)"
        >
          <Calculator size={13} className="text-indigo-500" />
          <span>Math Engine</span>
        </button>

        {/* Air-Gapped Client-Side Data Export Button */}
        <button
          onClick={() =>
            openExportModal({
              type: 'bundle',
              filterLabel: 'Complete Air-Gapped Supervisory Audit Package',
            })
          }
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-all cursor-pointer"
          title="Export Entities & Findings to JSON/CSV (Air-Gapped)"
        >
          <Download size={13} className="text-emerald-500" />
          <span>Air-Gap Export</span>
        </button>

        {/* Mobile Search Button */}
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          aria-label="Open global search (⌘K)"
        >
          <Search size={18} />
        </button>

        {/* Audit Logs Quick Button */}
        <button
          onClick={() => setActivePage('audit-logs')}
          className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap"
          title="Regulatory Audit Trail"
        >
          <FileCheck2 size={14} className="text-emerald-500" />
          Audit Ledger
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition-colors cursor-pointer"
            aria-label="Supervisory Alerts"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Supervisory Watch Alerts
                  </span>
                  <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                    2 New Critical
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  <div
                    onClick={() => {
                      setActivePage('priority-queue');
                      setShowNotifications(false);
                    }}
                    className="p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-rose-600 dark:text-rose-400">
                      <span>Metro Continental Grid</span>
                      <span className="text-[10px] text-slate-400 font-mono">1h ago</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      DMZ OT log gap exceeding 68 days triggered automatic Rank 1 escalation.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setActivePage('priority-queue');
                      setShowNotifications(false);
                    }}
                    className="p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-amber-600 dark:text-amber-400">
                      <span>Apex National Bank</span>
                      <span className="text-[10px] text-slate-400 font-mono">3h ago</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      SLA breach: 412 unreviewed alerts accumulated over weekend shift.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActivePage('priority-queue');
                    setShowNotifications(false);
                  }}
                  className="w-full p-2.5 text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors block"
                >
                  View Full Priority Queue →
                </button>
              </div>
            </>
          )}
        </div>

        {/* IndexedDB SQLite Mirror Status & Export */}
        <button
          onClick={exportSqliteDump}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 hover:border-blue-500 cursor-pointer transition-colors"
          title="IndexedDB SQLite Mirror Active. Click to export full SQL dump"
        >
          <Database size={13} className="text-emerald-500" />
          <span className="font-mono text-[11px] font-semibold">IndexedDB SQLite</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>

        {/* Supervisor Profile Lockup */}
        <button
          onClick={() => setActivePage('settings')}
          className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800 hover:opacity-80 transition-opacity cursor-pointer group text-left"
          title="Supervisory Profile & Automated Alert Subscriptions"
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-blue-500 transition-all">
            {currentUser?.avatarInitials || 'SV'}
          </div>
          <div className="hidden xl:block text-left text-xs leading-tight">
            <span className="font-bold text-slate-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {currentUser?.name || 'Dir. Samuel Vance'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentUser?.clearanceLevel?.split(' - ')[0] || 'LEVEL 4'} · Station
            </span>
          </div>
        </button>

        {/* Lock Terminal / Sign Out Button */}
        <button
          onClick={lockStation}
          className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Lock Station Terminal / Return to Login"
        >
          <Lock size={17} />
        </button>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="absolute top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 px-4 flex items-center gap-2 z-50 border-b border-slate-200 dark:border-slate-800">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            ref={mobileInputRef}
            type="text"
            placeholder="Search entities, findings, reports..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            className="flex-1 text-xs bg-transparent text-slate-900 dark:text-white outline-hidden"
          />
          <button
            onClick={() => {
              setMobileSearchOpen(false);
              setSearchQuery('');
              setShowSearchDropdown(false);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </header>
  );
};
