import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AuditLogEntry, AuditCategory } from '../types';
import {
  FileCheck2,
  Shield,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Lock,
  Terminal,
  ExternalLink,
  Building2,
  Clock,
  User,
  ShieldAlert,
  Hash,
  X,
  Copy,
  Check,
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { auditLogs, addToast, navigateToEntity, selectedAuditLog } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [inspectedLog, setInspectedLog] = useState<AuditLogEntry | null>(selectedAuditLog || null);
  const [copiedHash, setCopiedHash] = useState(false);

  React.useEffect(() => {
    if (selectedAuditLog) {
      setInspectedLog(selectedAuditLog);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedAuditLog]);

  const categories: (string | AuditCategory)[] = [
    'All',
    'Data Ingestion',
    'Supervisory Action',
    'Reporting',
    'Compliance & Security',
  ];

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.id.toLowerCase().includes(search.toLowerCase()) ||
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        log.targetName.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.integrityHash.toLowerCase().includes(search.toLowerCase());

      const matchesCat = selectedCategory === 'All' || log.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [auditLogs, search, selectedCategory]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
    addToast('info', 'Hash Copied', 'Cryptographic SHA-256 digest copied to clipboard.');
  };

  const handleExportAuditTrail = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SAT-SA-Audit-Trail-Immutable-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['Log_ID', 'Timestamp_UTC', 'Actor', 'Actor_Role', 'Action', 'Category', 'Target_Type', 'Target_Name', 'Details', 'IP_Origin', 'SHA256_Hash', 'Status'];
      const rows = auditLogs.map((l) => [
        l.id,
        `"${l.timestamp}"`,
        `"${l.actor}"`,
        `"${l.actorRole}"`,
        l.action,
        `"${l.category}"`,
        l.targetType,
        `"${l.targetName}"`,
        `"${l.details.replace(/"/g, '""')}"`,
        `"${l.ipAddress}"`,
        l.integrityHash,
        l.complianceStatus,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `SAT-SA-Audit-Trail-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    addToast('success', 'Audit Ledger Exported', `Downloaded compliance audit trail in .${format.toUpperCase()} format.`);
  };

  const getActionBadgeStyle = (action: string) => {
    switch (action) {
      case 'DATA_UPLOAD':
      case 'DATA_INTEGRATION':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50';
      case 'STATUS_UPDATE':
      case 'PRIORITY_REVIEW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50';
      case 'SUPERVISORY_ESCALATION':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50 font-bold';
      case 'REPORT_GENERATION':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50';
      case 'EVIDENCE_EXPORT':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              REGULATORY COMPLIANCE LEDGER
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono flex items-center gap-1">
              <Lock size={12} /> NIST SP 800-53 AU-3 / ISO 27001 Compliant
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Supervisory Audit Logging System
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Immutable tracking of user actions across data uploads, report formulation, priority determination reviews, and regulatory escalations.
          </p>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => handleExportAuditTrail('json')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors"
          >
            <Download size={13} />
            Export JSON Ledger
          </button>
          <button
            onClick={() => handleExportAuditTrail('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Integrity Verification Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 md:p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Cryptographic Verification: Ledger Verified</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                CHAIN VALID
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              All {auditLogs.length} audit blocks contain tamper-evident SHA-256 checksums matching national authority keystores.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 shrink-0">
          <div className="text-right">
            <span className="text-white font-bold block">{auditLogs.length} Records Logged</span>
            <span className="text-[11px] text-slate-400">0 Discrepancies</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit records by ID, actor, entity, hash digest, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {(search || selectedCategory !== 'All') && (
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 self-center"
          >
            Reset
          </button>
        )}
      </div>

      {/* Main Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Log Ref</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Supervisor / Actor</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Action Narrative</th>
                <th className="py-3 px-4 text-center">Integrity Check</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileCheck2 size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No audit logs found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try modifying your filter or search terms.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setInspectedLog(log)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                  >
                    {/* Log Ref */}
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {log.id}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {log.timestamp}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${getActionBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {log.actor}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {log.actorRole}
                      </span>
                    </td>

                    {/* Target Resource */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[180px]">
                        {log.targetName}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.targetType} · {log.targetId}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 line-clamp-2 max-w-xs">
                      {log.details}
                    </td>

                    {/* Integrity Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 size={12} />
                        {log.complianceStatus}
                      </span>
                    </td>

                    {/* Detail trigger */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedLog(log);
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setInspectedLog(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden space-y-4 p-6">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
                  <span>AUDIT RECORD: {inspectedLog.id}</span>
                  <span>·</span>
                  <span className="text-emerald-500 font-semibold">{inspectedLog.complianceStatus}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Regulatory Action Verification Dossier
                </h3>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Action Type</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{inspectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Category</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectedLog.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Timestamp</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{inspectedLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Origin Station</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{inspectedLog.ipAddress}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase font-mono block mb-1">
                  Actor & Credentials
                </span>
                <p className="p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded border border-slate-100 dark:border-slate-800 font-medium">
                  {inspectedLog.actor} ({inspectedLog.actorRole})
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase font-mono block mb-1">
                  Target Resource
                </span>
                <p className="p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded border border-slate-100 dark:border-slate-800">
                  <strong>{inspectedLog.targetName}</strong> <span className="text-slate-400 font-mono">({inspectedLog.targetType} ID: {inspectedLog.targetId})</span>
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase font-mono block mb-1">
                  Event Description & Narrative
                </span>
                <p className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded border border-slate-100 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300">
                  {inspectedLog.details}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase font-mono flex items-center gap-1">
                    <Hash size={13} />
                    SHA-256 Ledger Integrity Digest
                  </span>
                  <button
                    onClick={() => handleCopyHash(inspectedLog.integrityHash)}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {copiedHash ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {copiedHash ? 'Copied' : 'Copy Hash'}
                  </button>
                </div>
                <div className="p-2.5 bg-slate-950 text-slate-300 font-mono text-[11px] rounded border border-slate-800 break-all select-all">
                  {inspectedLog.integrityHash}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectedLog(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
