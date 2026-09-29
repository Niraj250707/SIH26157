import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { FindingCategory, FindingSeverity, Finding } from '../types';
import {
  Search,
  Layers,
  Terminal,
  FileText,
  AlertTriangle,
  Building2,
  Calendar,
  ExternalLink,
  ChevronRight,
  Filter,
  Download,
} from 'lucide-react';

export const FindingsExplorer: React.FC = () => {
  const { findings, setSelectedFinding, navigateToEntity, openExportModal } = useApp();

  const [activeCategory, setActiveCategory] = useState<FindingCategory>('Execution Gaps');
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedSector, setSelectedSector] = useState<string>('All');

  const categories: { id: FindingCategory; label: string; desc: string }[] = [
    {
      id: 'Execution Gaps',
      label: 'Execution Gaps',
      desc: 'Controls present in policy but failing in real operational practice (e.g. unmonitored OT links, SLA backlogs).',
    },
    {
      id: 'Negative Space',
      label: 'Negative Space',
      desc: 'Complete blind spots where telemetry, behavioral rules, or sensor agents are entirely absent.',
    },
    {
      id: 'Anomalies',
      label: 'Anomalies',
      desc: 'Statistical deviations, unapproved alert suppressions, or suspicious off-hours bulk exfiltration.',
    },
  ];

  // Count per category
  const categoryCounts = useMemo(() => {
    return {
      'Execution Gaps': findings.filter((f) => f.category === 'Execution Gaps').length,
      'Negative Space': findings.filter((f) => f.category === 'Negative Space').length,
      'Anomalies': findings.filter((f) => f.category === 'Anomalies').length,
    };
  }, [findings]);

  // Unique sectors in findings
  const sectors = ['All', ...Array.from(new Set(findings.map((f) => f.sector)))];
  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchesCategory = f.category === activeCategory;
      const matchesSearch =
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.entityName.toLowerCase().includes(search.toLowerCase()) ||
        f.mitreTechnique.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase());
      const matchesSeverity = selectedSeverity === 'All' || f.severity === selectedSeverity;
      const matchesSector = selectedSector === 'All' || f.sector === selectedSector;
      return matchesCategory && matchesSearch && matchesSeverity && matchesSector;
    });
  }, [findings, activeCategory, search, selectedSeverity, selectedSector]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              FORENSIC & DETECTION GAP ANALYSIS
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-xs text-slate-500 font-mono">
              {findings.length} Total Identified Deficiencies
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Findings & SOC Deficiency Explorer
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Supervisory inspection framework categorizing structural SOC breakdowns: Execution Gaps, Telemetry Negative Space, and Operational Anomalies.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            openExportModal({
              type: 'findings',
              filterLabel: `Category: ${activeCategory} (${filteredFindings.length} findings)`,
            })
          }
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs hover:shadow-sm transition-all self-start md:self-auto cursor-pointer"
          title="Export Supervisory Findings to JSON / CSV"
        >
          <Download size={14} />
          Export Findings (Air-Gap)
        </button>
      </div>

      {/* Interactive Tabs Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = categoryCounts[cat.id];
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                isActive
                  ? 'bg-white dark:bg-slate-900 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-sm font-bold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {cat.label}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {cat.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search within this category by title, entity, MITRE ID, or CVE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {severities.map((sev) => (
              <option key={sev} value={sev}>
                {sev === 'All' ? 'All Severities' : sev}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Sector:</span>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {sectors.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Findings Cards Grid */}
      <div className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            <Layers size={36} className="mx-auto text-slate-400 mb-3" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              No findings in {activeCategory} match current filters
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting the severity or sector filter to see related entries.
            </p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs space-y-4"
            >
              {/* Finding Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">
                      {finding.id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <button
                      onClick={() => navigateToEntity(finding.entityId)}
                      className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
                    >
                      <Building2 size={13} />
                      {finding.entityName}
                    </button>
                    <span aria-hidden="true">·</span>
                    <span>{finding.sector}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono flex items-center gap-1 text-[11px]">
                      <Calendar size={12} />
                      {finding.detectionDate}
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {finding.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start">
                  <RiskBadge level={finding.severity} size="md" />
                  <span className="text-xs font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {finding.status}
                  </span>
                </div>
              </div>

              {/* Description Body */}
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {finding.description}
              </p>

              {/* Technical Metadata Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                    <Layers size={13} className="text-blue-500" />
                    {finding.mitreTechnique}
                  </span>
                  <span className="text-[11px]">
                    Impacted: <strong>{finding.impactedSystems.slice(0, 2).join(', ')}</strong>
                    {finding.impactedSystems.length > 2 && ` +${finding.impactedSystems.length - 2} more`}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedFinding(finding)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-2xs"
                >
                  <Terminal size={14} />
                  View Evidence
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
