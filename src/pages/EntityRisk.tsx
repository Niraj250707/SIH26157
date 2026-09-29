import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { SectorType, RiskLevel, Entity } from '../types';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Building2,
  ExternalLink,
  GitCompare,
  Shield,
  Layers,
  Clock,
  Radio,
  FileSpreadsheet,
  Download,
  Filter,
  Calculator,
  FileCode,
} from 'lucide-react';
import { AirgapExportService } from '../services/airgapExportService';

export const EntityRisk: React.FC = () => {
  const {
    entities,
    setSelectedEntity,
    setActivePage,
    addToast,
    logAuditEvent,
    openExportModal,
    setIsAnalyticsInspectorOpen,
    entityAnalyticsMap,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('All');
  const [sortField, setSortField] = useState<'riskScore' | 'name' | 'totalFindings' | 'mttdMinutes'>('riskScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Unique sectors
  const sectors = ['All', ...Array.from(new Set(entities.map((e) => e.sector)))];
  const riskLevels = ['All', 'High', 'Medium', 'Low'];

  const filteredEntities = useMemo(() => {
    return entities
      .filter((e) => {
        const matchesSearch =
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.code.toLowerCase().includes(search.toLowerCase()) ||
          e.sector.toLowerCase().includes(search.toLowerCase());
        const matchesSector = selectedSector === 'All' || e.sector === selectedSector;
        const matchesRisk = selectedRiskLevel === 'All' || e.riskLevel === selectedRiskLevel;
        return matchesSearch && matchesSector && matchesRisk;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') {
          return sortAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }

        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [entities, search, selectedSector, selectedRiskLevel, sortField, sortAsc]);

  const handleSort = (field: 'riskScore' | 'name' | 'totalFindings' | 'mttdMinutes') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCurrentViewCSV = async () => {
    try {
      const result = await AirgapExportService.exportEntitiesToCSV(
        filteredEntities,
        `Current View (${filteredEntities.length} entities)`
      );

      logAuditEvent({
        action: 'EVIDENCE_EXPORT',
        category: 'Reporting',
        targetType: 'Entity',
        targetId: 'entity-risk-view',
        targetName: `Entity Risk Table (${filteredEntities.length} entities)`,
        details: `Supervisor exported current view of Entity Risk Table as RFC-4180 CSV (${filteredEntities.length} entities). Filter: Sector="${selectedSector}", Risk="${selectedRiskLevel}", Search="${search}". SHA-256 Digest: ${result.integrityHash.slice(0, 16)}...`,
      });

      addToast(
        'success',
        'CSV Export Complete (Air-Gapped)',
        `Downloaded ${result.fileName} (${(result.fileSizeBytes / 1024).toFixed(1)} KB) with SHA-256 validation.`
      );
    } catch (err: any) {
      addToast('warning', 'Export Failed', err.message || 'Error exporting entities view');
    }
  };

  const handleExportCurrentViewJSON = async () => {
    try {
      const result = await AirgapExportService.exportEntitiesToJSON(
        filteredEntities,
        `Current View (${filteredEntities.length} entities)`
      );

      logAuditEvent({
        action: 'EVIDENCE_EXPORT',
        category: 'Reporting',
        targetType: 'Entity',
        targetId: 'entity-risk-view',
        targetName: `Entity Risk Table (${filteredEntities.length} entities)`,
        details: `Supervisor exported current view of Entity Risk Table as Structured JSON (${filteredEntities.length} entities). SHA-256 Digest: ${result.integrityHash.slice(0, 16)}...`,
      });

      addToast(
        'success',
        'JSON Export Complete (Air-Gapped)',
        `Downloaded ${result.fileName} with cryptographic integrity envelope.`
      );
    } catch (err: any) {
      addToast('warning', 'Export Failed', err.message || 'Error exporting entities view');
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 70) return 'text-rose-600 dark:text-rose-400 font-bold';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400 font-semibold';
    return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              SUPERVISORY DIRECTORY
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-xs text-slate-500 font-mono">
              {filteredEntities.length} of {entities.length} entities displayed
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Critical Sector Entity Risk Matrix
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Systematic posture scoring across banking, power, telecom, and essential service operators. Click any row for in-depth supervisory telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsAnalyticsInspectorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-all cursor-pointer shadow-2xs"
            title="Inspect Mathematical Formulation & Outlier Detection Parameters"
          >
            <Calculator size={14} className="text-indigo-500" />
            Inspect Math & Formula
          </button>

          <button
            onClick={handleExportCurrentViewCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-all cursor-pointer shadow-2xs"
            title="Export Current Filtered View to RFC-4180 CSV"
          >
            <FileSpreadsheet size={14} className="text-emerald-500" />
            Export View (CSV)
          </button>

          <button
            onClick={handleExportCurrentViewJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg transition-all cursor-pointer shadow-2xs"
            title="Export Current Filtered View to Structured JSON with Integrity Digest"
          >
            <FileCode size={14} className="text-blue-500" />
            Export View (JSON)
          </button>

          <button
            onClick={() =>
              openExportModal({
                type: 'entities',
                filterLabel: `Filtered Entity View (${filteredEntities.length} entities)`,
              })
            }
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
            title="Air-Gapped Export to JSON / CSV with SHA-256 Checksum"
          >
            <Download size={14} />
            Air-Gap Export
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by entity name, code (e.g. MCP-01), or sector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          {/* Sector Filter Dropdown */}
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

          {/* Risk Level Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Risk:</span>
            <select
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {riskLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl === 'All' ? 'All Risk Levels' : `${lvl} Risk`}
                </option>
              ))}
            </select>
          </div>

          {(search || selectedSector !== 'All' || selectedRiskLevel !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedSector('All');
                setSelectedRiskLevel('All');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 self-center"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-3.5 px-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Live Entity Ledger View
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              ({filteredEntities.length} {filteredEntities.length === 1 ? 'entity' : 'entities'} active)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportTableCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md shadow-2xs transition-colors cursor-pointer"
              title="Export current view as CSV"
            >
              <FileSpreadsheet size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Export as CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3.5 px-4">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    Entity & Identifier
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3.5 px-4">Sector</th>
                <th className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => handleSort('riskScore')}
                    className="flex items-center gap-1.5 mx-auto hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    Risk Score
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-center">Risk Tier</th>
                <th className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => handleSort('totalFindings')}
                    className="flex items-center gap-1.5 mx-auto hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    Active Findings
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-center">SOC Telemetry</th>
                <th className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => handleSort('mttdMinutes')}
                    className="flex items-center gap-1.5 mx-auto hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    MTTD
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">Last Assessment</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredEntities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Building2 size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No entities match your criteria</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try modifying your search or clearing active filters.</p>
                  </td>
                </tr>
              ) : (
                filteredEntities.map((entity) => (
                  <tr
                    key={entity.id}
                    onClick={() => setSelectedEntity(entity)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                  >
                    {/* Entity Name & Code */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {entity.code.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {entity.name}
                            </span>
                            {entity.otEnvironmentPresent && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                OT/ICS
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {entity.code} · {entity.supervisoryStatus}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {entity.sector}
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`text-base font-mono tabular-nums ${getScoreColorClass(entity.riskScore)}`}>
                          {entity.riskScore}
                        </span>
                        <div className="w-12 bg-slate-200 dark:bg-slate-700 h-1 rounded-full mt-0.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              entity.riskScore >= 70
                                ? 'bg-rose-500'
                                : entity.riskScore >= 40
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${entity.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Risk Level Badge */}
                    <td className="py-3 px-4 text-center">
                      <RiskBadge level={entity.riskLevel} size="sm" />
                    </td>

                    {/* Total Findings */}
                    <td className="py-3 px-4 text-center">
                      <div className="font-mono">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {entity.totalFindings}
                        </span>
                        {entity.criticalFindings > 0 && (
                          <span className="text-[11px] text-rose-600 dark:text-rose-400 block">
                            ({entity.criticalFindings} critical)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* SOC Telemetry Coverage */}
                    <td className="py-3 px-4 text-center font-mono text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{entity.socCoveragePercent}%</span>
                    </td>

                    {/* MTTD */}
                    <td className="py-3 px-4 text-center font-mono text-slate-700 dark:text-slate-300">
                      {entity.mttdMinutes}m
                    </td>

                    {/* Last Assessment */}
                    <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px]">
                      {entity.lastUpdated}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedEntity(entity)}
                          title="Supervisory Inspection"
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <ExternalLink size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEntity(entity);
                            setActivePage('peer-comparison');
                          }}
                          title="Peer Comparison"
                          className="p-1.5 text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <GitCompare size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary with secondary Export as CSV trigger */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            National supervisory scoring model: weighted across MTTD, MTTR, MITRE coverage, and CVE severity.
          </span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
              High Threshold: ≥ 70 | Medium: 40–69 | Low: &lt; 40
            </span>
            <button
              onClick={exportTableCSV}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Download size={13} />
              Export as CSV ({filteredEntities.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
