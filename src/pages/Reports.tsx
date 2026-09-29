import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  FileText,
  Download,
  Printer,
  ShieldAlert,
  Building2,
  Calendar,
  CheckCircle2,
  Sparkles,
  Layers,
  Clock,
  Send,
  HardDrive,
  FileCode,
  FileSpreadsheet,
  Package,
  ShieldCheck,
} from 'lucide-react';

export const Reports: React.FC = () => {
  const {
    entities,
    findings,
    addToast,
    selectedReportType,
    setSelectedReportType,
    logAuditEvent,
    openExportModal,
  } = useApp();

  const [selectedEntityId, setSelectedEntityId] = useState<string>('all');
  const [reportType, setReportType] = useState<string>(selectedReportType || 'supervisory-audit');
  const [reportingPeriod, setReportingPeriod] = useState<string>('2026-Q3');
  const [includeGaps, setIncludeGaps] = useState<boolean>(true);
  const [includeLogs, setIncludeLogs] = useState<boolean>(true);
  const [includeRecommendations, setIncludeRecommendations] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Sync state if selectedReportType changed from global search
  React.useEffect(() => {
    if (selectedReportType) {
      setReportType(selectedReportType);
    }
  }, [selectedReportType]);

  const targetEntity = selectedEntityId === 'all'
    ? null
    : entities.find((e) => e.id === selectedEntityId);

  const reportFindings = targetEntity
    ? findings.filter((f) => f.entityId === targetEntity.id)
    : findings;

  const handleDownloadPDF = () => {
    setIsExporting(true);
    addToast('info', 'Rendering PDF Dossier', 'Compiling supervisory charts, telemetry logs, and regulatory findings...');

    const entityLabel = targetEntity ? targetEntity.name : 'All Monitored Critical Entities';

    logAuditEvent({
      action: 'REPORT_GENERATION',
      category: 'Reporting',
      targetType: 'Report',
      targetId: `rep-${reportType}`,
      targetName: `${reportType.toUpperCase()} - ${entityLabel}`,
      details: `Generated official compliance PDF dossier (${reportType}) for ${entityLabel} covering ${reportingPeriod}. Included ${reportFindings.length} deficiency records.`,
    });

    setTimeout(() => {
      setIsExporting(false);
      addToast('success', 'PDF Ready for Download', `SAT-SA-${reportType}-${reportingPeriod}.pdf has been generated & logged to compliance ledger.`);
      window.print();
    }, 1200);
  };

  const handlePrint = () => {
    const entityLabel = targetEntity ? targetEntity.name : 'All Monitored Critical Entities';
    logAuditEvent({
      action: 'REPORT_GENERATION',
      category: 'Reporting',
      targetType: 'Report',
      targetId: `rep-${reportType}`,
      targetName: `${reportType.toUpperCase()} - ${entityLabel}`,
      details: `Printed/exported official supervisory dossier for ${entityLabel} (${reportingPeriod}).`,
    });
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header (No print) */}
      <div className="no-print">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
            OFFICIAL SUPERVISORY ATTESTATION
          </span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
          <span className="text-xs text-slate-500 font-mono">
            Document Generation Engine
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Supervisory Reports & Official Dossier
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          Formulate official SOC assessment reports for National Cyber Authority oversight, sector regulators, and entity board hearings.
        </p>
      </div>

      {/* Configuration Grid & Live Preview (2 columns on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (4 cols, no-print) */}
        <div className="no-print lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Report Parameters
            </h2>
            <p className="text-xs text-slate-500">Configure target entity and supervisory scope</p>
          </div>

          {/* Scope Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Entity Target Scope:
            </label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Comprehensive (All 12 Monitored Entities)</option>
              <optgroup label="Individual Critical Sector Entities">
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.code})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Report Template Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Report Template Type:
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="supervisory-audit">
                SOC Capability & Deficiencies Audit (Full Technical)
              </option>
              <option value="executive-brief">
                Executive Supervisory Risk Briefing (High-Level Board)
              </option>
              <option value="regulatory-summons">
                Statutory Non-Compliance Directive & Mandate
              </option>
            </select>
          </div>

          {/* Reporting Period */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assessment Cycle:
            </label>
            <select
              value={reportingPeriod}
              onChange={(e) => setReportingPeriod(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="2026-Q3">2026-Q3 (July – September 2026)</option>
              <option value="2026-Q2">2026-Q2 (April – June 2026)</option>
              <option value="2026-YTD">2026 Full Annual Cycle</option>
            </select>
          </div>

          {/* Section Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Included Dossier Sections:
            </span>

            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={includeGaps}
                onChange={(e) => setIncludeGaps(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Execution Gaps & Negative Space Matrix</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={includeLogs}
                onChange={(e) => setIncludeLogs(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Forensic Sensor Log Samples</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={includeRecommendations}
                onChange={(e) => setIncludeRecommendations(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Supervisory Directives & Mandates</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Download size={15} />
              {isExporting ? 'Generating Official PDF...' : 'Download Official PDF'}
            </button>

            <button
              onClick={handlePrint}
              className="w-full py-2 px-4 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer size={15} />
              Print / Save As PDF
            </button>
          </div>

          {/* Air-Gapped Client-Side Data Export Card */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                Air-Gap Data Export
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                OFFLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Download sanitized JSON/CSV datasets with cryptographic SHA-256 integrity checksums. 100% in-browser generation.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  openExportModal({
                    type: 'entities',
                    filterLabel: targetEntity ? targetEntity.name : 'All Monitored Critical Entities',
                  })
                }
                className="py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                Entities (CSV/JSON)
              </button>

              <button
                type="button"
                onClick={() =>
                  openExportModal({
                    type: 'findings',
                    filterLabel: targetEntity ? targetEntity.name : 'All Supervisory Findings',
                  })
                }
                className="py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                Findings (CSV/JSON)
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                openExportModal({
                  type: 'bundle',
                  filterLabel: 'Complete Air-Gapped Supervisory Audit Package',
                })
              }
              className="w-full py-2 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-emerald-500" />
              Master Supervisory Bundle (JSON)
            </button>
          </div>
        </div>

        {/* Right Column: Live Document Preview (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
          {/* Document Preview Bar */}
          <div className="no-print bg-slate-100 dark:bg-slate-800/80 px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="font-mono text-slate-500">PREVIEW: SAT-SA OFFICIAL REPORT FORMAT</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              SUPERVISORY CONFIDENTIAL // LEVEL 3
            </span>
          </div>

          {/* Actual Printable Document Body */}
          <div className="p-8 sm:p-12 space-y-8 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-sans print:p-0 print:text-black">
            
            {/* National Authority Header */}
            <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5 flex items-start justify-between">
              <div>
                <div className="text-[11px] font-mono tracking-widest text-slate-500 uppercase font-bold">
                  NATIONAL CYBER SUPERVISORY COMMISSION · DIRECTORATE OF CRITICAL INFRASTRUCTURE
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                  SOC SUPERVISORY AUDIT & COMPLIANCE DOSSIER
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                  Reference: SAT-SA-AUDIT-{reportingPeriod}-{targetEntity ? targetEntity.code : 'ALL'}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block border border-rose-600 text-rose-700 dark:text-rose-400 text-[10px] font-mono font-bold px-2 py-1 uppercase tracking-wider rounded">
                  RESTRICTED
                </span>
                <span className="block text-[11px] text-slate-500 font-mono mt-1">
                  Date: Sep 28, 2026
                </span>
              </div>
            </div>

            {/* Target Scope Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Target Entity</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {targetEntity ? targetEntity.name : 'All 12 Monitored Entities'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Primary Sector</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {targetEntity ? targetEntity.sector : 'Cross-Sector Critical'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Composite Risk Tier</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {targetEntity ? `${targetEntity.riskScore}/100 (${targetEntity.riskLevel})` : '5 High / 4 Medium / 3 Low'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Identified Findings</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {reportFindings.length} Active Records
                </span>
              </div>
            </div>

            {/* Executive Summary Statement */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                1. Executive Supervisory Summary
              </h3>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                Pursuant to the National Cyber Security Protection Act (NCSPA), this supervisory review details the operational posture of Security Operations Centres across designated Critical Sector Entities. In this assessment cycle, analysis identified recurring telemetry blindness across operational technology boundaries, coupled with unapproved alert suppression modifications that impair timely threat detection.
              </p>
            </div>

            {/* Findings Table */}
            {includeGaps && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                  2. Identified Deficiencies & Evidence Log ({reportFindings.length})
                </h3>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-500">
                        <th className="py-2.5 px-3">Ref ID</th>
                        <th className="py-2.5 px-3">Entity</th>
                        <th className="py-2.5 px-3">Deficiency Title</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reportFindings.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400 font-semibold">
                            {f.id}
                          </td>
                          <td className="py-2.5 px-3 font-medium">{f.entityName}</td>
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">{f.title}</td>
                          <td className="py-2.5 px-3 text-slate-500">{f.category}</td>
                          <td className="py-2.5 px-3">
                            <RiskBadge level={f.severity} size="sm" showIcon={false} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Forensic Logs Sample */}
            {includeLogs && reportFindings.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                  3. Key Forensic Telemetry Trace
                </h3>
                <div className="bg-slate-950 text-slate-200 p-4 rounded-lg font-mono text-[11px] leading-relaxed border border-slate-800">
                  <span className="text-slate-500 block mb-1">
                    # Evidence Sample from {reportFindings[0].evidenceData.logSource}:
                  </span>
                  {reportFindings[0].evidenceData.sampleLog}
                </div>
              </div>
            )}

            {/* Supervisory Directives */}
            {includeRecommendations && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                  4. Statutory Supervisory Directives & Corrective Actions
                </h3>
                <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-xs space-y-2 text-slate-800 dark:text-slate-200">
                  <p className="font-semibold text-blue-900 dark:text-blue-200">
                    Mandatory Compliance Instructions:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                    <li>
                      Remediate all Critical Severity execution gaps within 5 business days of this notice.
                    </li>
                    <li>
                      Redirect boundary gateway syslog streams directly to government sovereign oversight nodes.
                    </li>
                    <li>
                      Submit dual-custody authorization records for all alert suppression changes dating back 90 days.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Signature Block */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Dr. Evelyn Vance
                </span>
                <span>Chief Supervisory Cyber Inspector</span>
              </div>
              <div className="text-right font-mono text-[10px]">
                <span>OFFICIAL VERIFICATION CODE: SAT-SA-7824-OK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
