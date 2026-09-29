import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  X,
  Building2,
  AlertTriangle,
  FileCheck2,
  Server,
  ShieldCheck,
  Layers,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
  Command,
  Hash,
  ExternalLink,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  Activity,
  User,
  Globe,
} from 'lucide-react';
import { INITIAL_DEVICES } from '../../data/dummyData';
import { Entity, Finding, AuditLogEntry, DeviceAsset, ComplianceControl, RemediationTask } from '../../types';

export type SearchCategory =
  | 'ALL'
  | 'ENTITIES'
  | 'FINDINGS'
  | 'AUDIT_LOGS'
  | 'DEVICES'
  | 'COMPLIANCE'
  | 'REMEDIATION';

type SearchResultItem =
  | { type: 'entity'; data: Entity }
  | { type: 'finding'; data: Finding }
  | { type: 'audit'; data: AuditLogEntry }
  | { type: 'device'; data: DeviceAsset }
  | { type: 'compliance'; data: ComplianceControl }
  | { type: 'remediation'; data: RemediationTask };

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    entities,
    findings,
    auditLogs,
    complianceControls,
    remediationTasks,
    navigateToEntity,
    navigateToFinding,
    navigateToAuditLog,
    navigateToDevice,
    navigateToCompliance,
    navigateToRemediation,
    setIsAdvisorOpen,
    addToast,
  } = useApp();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [copiedHash, setCopiedHash] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global Keyboard listener for Cmd+K / Ctrl+K & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(!isSearchModalOpen);
      }
      if (e.key === 'Escape' && isSearchModalOpen) {
        e.preventDefault();
        setIsSearchModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setIsSearchModalOpen]);

  // Focus input whenever modal opens
  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isSearchModalOpen]);

  // Reset selected index when query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  const cleanQuery = query.trim().toLowerCase();

  // Matched items computation
  const searchResults = useMemo(() => {
    if (!cleanQuery) return [];

    const results: SearchResultItem[] = [];

    // Entities
    if (activeCategory === 'ALL' || activeCategory === 'ENTITIES') {
      entities.forEach((ent) => {
        if (
          ent.name.toLowerCase().includes(cleanQuery) ||
          ent.code.toLowerCase().includes(cleanQuery) ||
          ent.sector.toLowerCase().includes(cleanQuery) ||
          (ent.region && ent.region.toLowerCase().includes(cleanQuery)) ||
          ent.description.toLowerCase().includes(cleanQuery) ||
          ent.supervisoryStatus.toLowerCase().includes(cleanQuery)
        ) {
          results.push({ type: 'entity', data: ent });
        }
      });
    }

    // Findings
    if (activeCategory === 'ALL' || activeCategory === 'FINDINGS') {
      findings.forEach((fnd) => {
        if (
          fnd.title.toLowerCase().includes(cleanQuery) ||
          fnd.id.toLowerCase().includes(cleanQuery) ||
          fnd.entityName.toLowerCase().includes(cleanQuery) ||
          fnd.category.toLowerCase().includes(cleanQuery) ||
          fnd.mitreTechnique.toLowerCase().includes(cleanQuery) ||
          fnd.description.toLowerCase().includes(cleanQuery) ||
          (fnd.evidenceData?.regulatoryClause &&
            fnd.evidenceData.regulatoryClause.toLowerCase().includes(cleanQuery))
        ) {
          results.push({ type: 'finding', data: fnd });
        }
      });
    }

    // Audit Logs
    if (activeCategory === 'ALL' || activeCategory === 'AUDIT_LOGS') {
      auditLogs.forEach((log) => {
        if (
          log.id.toLowerCase().includes(cleanQuery) ||
          log.action.toLowerCase().includes(cleanQuery) ||
          log.actor.toLowerCase().includes(cleanQuery) ||
          log.actorRole.toLowerCase().includes(cleanQuery) ||
          log.targetName.toLowerCase().includes(cleanQuery) ||
          log.details.toLowerCase().includes(cleanQuery) ||
          log.category.toLowerCase().includes(cleanQuery) ||
          log.integrityHash.toLowerCase().includes(cleanQuery) ||
          log.ipAddress.toLowerCase().includes(cleanQuery)
        ) {
          results.push({ type: 'audit', data: log });
        }
      });
    }

    // Devices & Assets
    if (activeCategory === 'ALL' || activeCategory === 'DEVICES') {
      INITIAL_DEVICES.forEach((dev) => {
        if (
          dev.name.toLowerCase().includes(cleanQuery) ||
          dev.assetTag.toLowerCase().includes(cleanQuery) ||
          dev.ipAddress.toLowerCase().includes(cleanQuery) ||
          dev.deviceType.toLowerCase().includes(cleanQuery) ||
          dev.entityName.toLowerCase().includes(cleanQuery) ||
          dev.zone.toLowerCase().includes(cleanQuery)
        ) {
          results.push({ type: 'device', data: dev });
        }
      });
    }

    // Compliance Controls
    if (activeCategory === 'ALL' || activeCategory === 'COMPLIANCE') {
      complianceControls.forEach((ctrl) => {
        if (
          ctrl.code.toLowerCase().includes(cleanQuery) ||
          ctrl.title.toLowerCase().includes(cleanQuery) ||
          ctrl.framework.toLowerCase().includes(cleanQuery) ||
          ctrl.functionDomain.toLowerCase().includes(cleanQuery) ||
          ctrl.description.toLowerCase().includes(cleanQuery)
        ) {
          results.push({ type: 'compliance', data: ctrl });
        }
      });
    }

    // Remediation Tasks
    if (activeCategory === 'ALL' || activeCategory === 'REMEDIATION') {
      remediationTasks.forEach((task) => {
        if (
          task.id.toLowerCase().includes(cleanQuery) ||
          task.title.toLowerCase().includes(cleanQuery) ||
          task.entityName.toLowerCase().includes(cleanQuery) ||
          (task.controlCode && task.controlCode.toLowerCase().includes(cleanQuery)) ||
          task.assignedOperatorContact.toLowerCase().includes(cleanQuery) ||
          task.description.toLowerCase().includes(cleanQuery)
        ) {
          results.push({ type: 'remediation', data: task });
        }
      });
    }

    return results;
  }, [cleanQuery, activeCategory, entities, findings, auditLogs, complianceControls, remediationTasks]);

  const activeItem: SearchResultItem | undefined = searchResults[selectedIndex];

  // Navigate to item
  const handleSelectResult = (item: SearchResultItem) => {
    setIsSearchModalOpen(false);

    switch (item.type) {
      case 'entity':
        navigateToEntity(item.data.id);
        break;
      case 'finding':
        navigateToFinding(item.data.id);
        break;
      case 'audit':
        navigateToAuditLog(item.data.id);
        break;
      case 'device':
        navigateToDevice(item.data.id);
        break;
      case 'compliance':
        navigateToCompliance(item.data.framework, item.data.code);
        break;
      case 'remediation':
        navigateToRemediation(item.data.id);
        break;
    }
  };

  // Keyboard navigation within list
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeItem) {
        handleSelectResult(activeItem);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const categories: SearchCategory[] = [
        'ALL',
        'ENTITIES',
        'FINDINGS',
        'AUDIT_LOGS',
        'DEVICES',
        'COMPLIANCE',
        'REMEDIATION',
      ];
      const nextIdx = (categories.indexOf(activeCategory) + 1) % categories.length;
      setActiveCategory(categories[nextIdx]);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
    addToast('info', 'Hash Copied', 'SHA-256 cryptographic digest copied.');
  };

  // Quick preset keywords for prompt exploration
  const suggestedKeywords = [
    { label: 'Metro Continental Power', query: 'Metro Continental', icon: <Building2 size={13} /> },
    { label: 'SCADA Intertie RTU', query: 'SCADA RTU', icon: <Server size={13} /> },
    { label: 'Critical Severity Findings', query: 'Critical', icon: <ShieldAlert size={13} /> },
    { label: 'Syslog Ingestion Gap', query: 'syslog', icon: <Terminal size={13} /> },
    { label: 'Supervisory Escalations', query: 'SUPERVISORY_ESCALATION', icon: <FileCheck2 size={13} /> },
    { label: 'NIST CSF Controls', query: 'NIST', icon: <ShieldCheck size={13} /> },
  ];

  if (!isSearchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Click outside backdrop */}
      <div className="fixed inset-0 -z-10" onClick={() => setIsSearchModalOpen(false)} />

      {/* Main Command Palette Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3.5 bg-white dark:bg-slate-900 sticky top-0 z-20">
          <Search size={22} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search entities, findings, audit logs, devices, or statutory controls..."
            className="flex-1 bg-transparent text-base sm:text-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden font-medium"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Clear search"
            >
              <X size={18} />
            </button>
          )}

          <button
            onClick={() => setIsSearchModalOpen(false)}
            className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700"
          >
            <span>ESC</span>
          </button>
        </div>

        {/* Filter Category Chips Bar */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          {[
            { id: 'ALL', label: 'All Results' },
            { id: 'ENTITIES', label: 'Entities', count: entities.length },
            { id: 'FINDINGS', label: 'Findings', count: findings.length },
            { id: 'AUDIT_LOGS', label: 'Audit Logs', count: auditLogs.length },
            { id: 'DEVICES', label: 'Devices', count: INITIAL_DEVICES.length },
            { id: 'COMPLIANCE', label: 'Compliance Controls', count: complianceControls.length },
            { id: 'REMEDIATION', label: 'Remediation', count: remediationTasks.length },
          ].map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as SearchCategory)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body: Two-Pane Split Layout (Results List + Live Detail Inspector) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[360px]">
          
          {/* Left Pane: Result List or Empty Suggestions */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70 p-2 sm:p-3 border-r border-slate-100 dark:border-slate-800/80 max-h-[60vh]"
          >
            {cleanQuery === '' ? (
              // Empty State: Prompt suggestions & Quick jumps
              <div className="p-4 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" />
                    Quick Keyword Suggestions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestedKeywords.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuery(item.query);
                          inputRef.current?.focus();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Supervisory Quick Actions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => {
                        setIsSearchModalOpen(false);
                        setIsAdvisorOpen(true);
                      }}
                      className="p-3 text-left bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-900/50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-400" />
                          Launch AI Risk Advisor
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Query natural language insights across fleet
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => {
                        setIsSearchModalOpen(false);
                        navigateToCompliance();
                      }}
                      className="p-3 text-left bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-emerald-500" />
                          Regulatory Compliance
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          NIST CSF, ISO 27001, OT/ICS SP 800-82
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => {
                        setIsSearchModalOpen(false);
                        navigateToRemediation();
                      }}
                      className="p-3 text-left bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Layers size={14} className="text-amber-500" />
                          Remediation Pipeline
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Assign & track directives with reminders
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => {
                        setIsSearchModalOpen(false);
                        navigateToAuditLog('');
                      }}
                      className="p-3 text-left bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <FileCheck2 size={14} className="text-blue-500" />
                          Audit Log Ledger
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Cryptographic SHA-256 supervisory trail
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              // Empty search state
              <div className="p-12 text-center">
                <Search size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                  No matching items found for "{query}"
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Try searching for entity names, CVE identifiers, asset tags, or supervisory actions.
                </p>
              </div>
            ) : (
              // Filtered Results List
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>FOUND {searchResults.length} RECORDS</span>
                  <span className="hidden sm:inline">Use ↑↓ keys to preview</span>
                </div>

                {searchResults.map((item, idx) => {
                  const isSelected = selectedIndex === idx;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Type Icon Badge */}
                        <div className="mt-0.5 shrink-0">
                          {item.type === 'entity' && (
                            <span className="p-2 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-lg inline-block">
                              <Building2 size={16} />
                            </span>
                          )}
                          {item.type === 'finding' && (
                            <span
                              className={`p-2 rounded-lg inline-block ${
                                item.data.severity === 'Critical'
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              <AlertTriangle size={16} />
                            </span>
                          )}
                          {item.type === 'audit' && (
                            <span className="p-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-lg inline-block">
                              <FileCheck2 size={16} />
                            </span>
                          )}
                          {item.type === 'device' && (
                            <span className="p-2 bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-lg inline-block">
                              <Server size={16} />
                            </span>
                          )}
                          {item.type === 'compliance' && (
                            <span className="p-2 bg-teal-500/15 text-teal-600 dark:text-teal-400 rounded-lg inline-block">
                              <ShieldCheck size={16} />
                            </span>
                          )}
                          {item.type === 'remediation' && (
                            <span className="p-2 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-lg inline-block">
                              <Layers size={16} />
                            </span>
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                              {item.type.replace('_', ' ')}
                            </span>
                            {item.type === 'entity' && (
                              <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded text-slate-700 dark:text-slate-300 font-bold">
                                {item.data.code}
                              </span>
                            )}
                            {item.type === 'finding' && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                  item.data.severity === 'Critical'
                                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                }`}
                              >
                                {item.data.severity}
                              </span>
                            )}
                            {item.type === 'audit' && (
                              <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                                {item.data.id}
                              </span>
                            )}
                          </div>

                          <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {item.type === 'entity' && item.data.name}
                            {item.type === 'finding' && item.data.title}
                            {item.type === 'audit' && `${item.data.action}: ${item.data.targetName}`}
                            {item.type === 'device' && `${item.data.name} (${item.data.assetTag})`}
                            {item.type === 'compliance' && `[${item.data.code}] ${item.data.title}`}
                            {item.type === 'remediation' && `[${item.data.id}] ${item.data.title}`}
                          </div>

                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.type === 'entity' && `${item.data.sector} · Risk Score: ${item.data.riskScore}/100`}
                            {item.type === 'finding' && `${item.data.entityName} · ${item.data.category}`}
                            {item.type === 'audit' && `Actor: ${item.data.actor} · ${item.data.timestamp}`}
                            {item.type === 'device' && `${item.data.entityName} · IP: ${item.data.ipAddress}`}
                            {item.type === 'compliance' && `${item.data.framework} · ${item.data.functionDomain}`}
                            {item.type === 'remediation' && `${item.data.entityName} · Status: ${item.data.status}`}
                          </div>
                        </div>
                      </div>

                      {/* Right Indicator */}
                      <div className="shrink-0 flex items-center gap-1.5 text-xs text-slate-400">
                        {isSelected && (
                          <span className="hidden sm:inline-block font-mono text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                            ↵ Enter
                          </span>
                        )}
                        <ArrowRight size={14} className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300'} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Pane: Live Rich Detail Inspector Drawer */}
          <div className="hidden md:block w-80 lg:w-96 bg-slate-50/50 dark:bg-slate-950/40 p-5 overflow-y-auto max-h-[60vh]">
            {activeItem ? (
              <div className="space-y-4 animate-in fade-in duration-100">
                {/* Header Lockup */}
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Live Record Inspector
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                    {activeItem.type === 'entity' && activeItem.data.name}
                    {activeItem.type === 'finding' && activeItem.data.title}
                    {activeItem.type === 'audit' && activeItem.data.action}
                    {activeItem.type === 'device' && activeItem.data.name}
                    {activeItem.type === 'compliance' && activeItem.data.title}
                    {activeItem.type === 'remediation' && activeItem.data.title}
                  </h3>
                </div>

                {/* ENTITY PREVIEW */}
                {activeItem.type === 'entity' && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500">Risk Score</span>
                      <span className="font-bold font-mono text-sm text-rose-600 dark:text-rose-400">
                        {activeItem.data.riskScore}/100 ({activeItem.data.riskLevel})
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-500">
                        <span>Sector:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.sector}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Region:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.region || 'National'}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Oversight Status:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.supervisoryStatus}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>SOC Coverage:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.socCoveragePercent}%</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                      {activeItem.data.description}
                    </div>

                    <button
                      onClick={() => handleSelectResult(activeItem)}
                      className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Open Entity Matrix & Dossier</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                )}

                {/* FINDING PREVIEW */}
                {activeItem.type === 'finding' && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500">Severity</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          activeItem.data.severity === 'Critical'
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {activeItem.data.severity}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-500">
                        <span>Entity:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.entityName}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Category:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.category}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>MITRE ATT&CK:</span>
                        <strong className="font-mono text-blue-600 dark:text-blue-400">{activeItem.data.mitreTechnique}</strong>
                      </div>
                      {activeItem.data.evidenceData?.regulatoryClause && (
                        <div className="flex justify-between text-slate-500">
                          <span>Statutory Clause:</span>
                          <strong className="font-mono text-slate-800 dark:text-slate-200">{activeItem.data.evidenceData.regulatoryClause}</strong>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                      {activeItem.data.description}
                    </div>

                    <button
                      onClick={() => handleSelectResult(activeItem)}
                      className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Open Evidence & Mitigation Drawer</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                )}

                {/* AUDIT LOG PREVIEW */}
                {activeItem.type === 'audit' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Audit ID:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{activeItem.data.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Timestamp:</span>
                        <span className="text-slate-800 dark:text-slate-200">{activeItem.data.timestamp}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-500">
                        <span>Actor:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.actor}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Role:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.actorRole}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Origin IP:</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200">{activeItem.data.ipAddress}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Target:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.targetName}</strong>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                      {activeItem.data.details}
                    </div>

                    {/* SHA-256 Digest */}
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        <span className="flex items-center gap-1">
                          <Hash size={11} /> SHA-256 Digest
                        </span>
                        <button
                          onClick={() => handleCopyHash(activeItem.data.integrityHash)}
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                        >
                          {copiedHash ? <Check size={11} /> : <Copy size={11} />}
                          <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all bg-white dark:bg-slate-950 p-1.5 rounded">
                        {activeItem.data.integrityHash}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectResult(activeItem)}
                      className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Inspect in Immutable Ledger</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                )}

                {/* DEVICE PREVIEW */}
                {activeItem.type === 'device' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Asset Tag:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{activeItem.data.assetTag}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">IP Address:</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{activeItem.data.ipAddress}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-500">
                        <span>Entity:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.entityName}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Zone:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.zone}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>OS / Firmware:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.operatingSystem} ({activeItem.data.firmwareVersion})</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Risk Score:</span>
                        <strong className="text-rose-600 dark:text-rose-400 font-mono">{activeItem.data.riskScore}/100</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectResult(activeItem)}
                      className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>View in Monitored Devices Inventory</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                )}

                {/* COMPLIANCE CONTROL PREVIEW */}
                {activeItem.type === 'compliance' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Framework</span>
                      <span className="font-bold text-slate-900 dark:text-white">{activeItem.data.framework}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-500">
                        <span>Control Code:</span>
                        <strong className="font-mono text-blue-600 dark:text-blue-400">{activeItem.data.code}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Domain:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.functionDomain}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Mandatory Tier:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.mandatoryTier}</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                      {activeItem.data.description}
                    </div>

                    <button
                      onClick={() => handleSelectResult(activeItem)}
                      className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Audit Control in Regulatory Framework</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                )}

                {/* REMEDIATION TASK PREVIEW */}
                {activeItem.type === 'remediation' && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500">Pipeline Status</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{activeItem.data.status}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-500">
                        <span>Target Entity:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{activeItem.data.entityName}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Priority:</span>
                        <strong className="text-rose-600 dark:text-rose-400">{activeItem.data.priority}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Deadline:</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200">{activeItem.data.statutoryDeadline} ({activeItem.data.daysRemaining}d left)</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Contact:</span>
                        <strong className="text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{activeItem.data.assignedOperatorContact}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectResult(activeItem)}
                      className="w-full mt-2 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Open in Remediation Workflow</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                <Terminal size={32} className="mb-2 text-slate-300 dark:text-slate-700" />
                <span className="text-xs font-medium">Select or hover an item to preview details</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Keyboard Shortcuts Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px] text-slate-700 dark:text-slate-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px] text-slate-700 dark:text-slate-300">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px] text-slate-700 dark:text-slate-300">↵</kbd>
              <span>select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px] text-slate-700 dark:text-slate-300">TAB</kbd>
              <span>filter category</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px] text-slate-700 dark:text-slate-300">ESC</kbd>
              <span>close</span>
            </span>
          </div>

          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <span>SAT-SA Sovereign Global Directory</span>
          </div>
        </div>
      </div>
    </div>
  );
};
