import React from 'react';
import { useApp } from '../../context/AppContext';
import { PageId } from '../../types';
import {
  LayoutDashboard,
  Shield,
  Search,
  ListOrdered,
  GitCompare,
  FileText,
  UploadCloud,
  FileCheck2,
  ChevronRight,
  ShieldAlert,
  Bell,
  Server,
  X,
  ExternalLink,
  Sparkles,
  LogIn,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    activePage,
    setActivePage,
    priorityItems,
    findings,
    auditLogs,
    setIsAdvisorOpen,
    currentUser,
    complianceControls,
    remediationTasks,
  } = useApp();

  const pendingPriorityCount = priorityItems.filter((i) => i.status === 'Pending Review').length;
  const criticalFindingsCount = findings.filter((f) => f.severity === 'Critical').length;
  const nonCompliantControlsCount = complianceControls.filter((c) =>
    c.entitiesAssessment.some((ea) => ea.status === 'NON_COMPLIANT')
  ).length;
  const activeRemediationCount = remediationTasks.filter((t) => t.status !== 'Verified Closed').length;

  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'entity-risk',
      label: 'Entity Risk',
      icon: <Shield size={18} />,
    },
    {
      id: 'compliance',
      label: 'Regulatory Compliance',
      icon: <ShieldCheck size={18} />,
      badge: nonCompliantControlsCount,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'remediation',
      label: 'Remediation Workflow',
      icon: <Layers size={18} />,
      badge: activeRemediationCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'findings',
      label: 'Findings Explorer',
      icon: <Search size={18} />,
      badge: criticalFindingsCount,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'priority-queue',
      label: 'Priority Review Queue',
      icon: <ListOrdered size={18} />,
      badge: pendingPriorityCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'peer-comparison',
      label: 'Peer Comparison',
      icon: <GitCompare size={18} />,
    },
    {
      id: 'devices',
      label: 'Devices & Assets',
      icon: <Server size={18} />,
      badge: 14,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText size={18} />,
    },
    {
      id: 'upload',
      label: 'Data Upload',
      icon: <UploadCloud size={18} />,
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: <FileCheck2 size={18} />,
      badge: auditLogs.length,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'settings',
      label: 'Alert Subscriptions',
      icon: <Bell size={18} />,
    },
  ];

  const handleNavClick = (id: PageId) => {
    setActivePage(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-40 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-950 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Lockup */}
        <div>
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
                <ShieldAlert size={20} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-base tracking-tight text-white">
                    SAT-SA
                  </h1>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                    OVERSIGHT
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[145px]">
                  Supervisory SOC Analytics
                </p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 text-slate-400 hover:text-white"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Core Analytics
            </div>
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-900/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded border tabular-nums ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30'
                            : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      size={14}
                      className={`transition-transform opacity-40 group-hover:opacity-100 ${
                        isActive ? 'text-white opacity-80' : 'text-slate-500'
                      }`}
                    />
                  </div>
                </button>
              );
            })}

            {/* AI-Powered Risk Advisor Widget Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setIsAdvisorOpen(true);
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 hover:from-blue-900/90 hover:to-indigo-900/90 border border-blue-500/40 text-white transition-all group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/50 flex items-center justify-center text-amber-300">
                    <Sparkles size={15} className="animate-pulse" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs block leading-tight">Risk Advisor (AI)</span>
                    <span className="text-[10px] text-blue-300 font-mono">Supervisory Assistant</span>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            </div>
          </nav>
        </div>

        {/* Regulatory Authority Context, User Session & Status */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
          {/* Active Inspector Profile Bar */}
          <div
            onClick={() => handleNavClick('auth')}
            className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between cursor-pointer group"
            title="Switch User / Station Login"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                {currentUser?.avatarInitials || 'SV'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-200 block truncate group-hover:text-blue-400">
                  {currentUser?.name || 'Dir. Samuel Vance'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block truncate">
                  {currentUser?.clearanceLevel.split(' - ')[0] || 'LEVEL 4'}
                </span>
              </div>
            </div>
            <LogIn size={13} className="text-slate-500 group-hover:text-blue-400 shrink-0" />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Supervisory Engine
              </span>
              <span className="font-mono text-[10px] text-slate-400">SAT-SA v2.5</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              National Critical Infrastructure Cyber Watch
            </p>
          </div>

          <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>{currentUser?.terminalId || 'TER-SOV-04-AUTH'}</span>
            <span className="text-emerald-500 font-bold">STATION VERIFIED</span>
          </div>
        </div>
      </aside>
    </>
  );
};
