import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AirgapExportService, AIRGAP_CLASSIFICATION } from '../../services/airgapExportService';
import {
  Download,
  X,
  FileCode,
  FileSpreadsheet,
  Package,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Hash,
  AlertCircle,
  Copy,
  Lock,
} from 'lucide-react';

export const AirgapExportModal: React.FC = () => {
  const {
    isExportModalOpen,
    setIsExportModalOpen,
    exportModalConfig,
    entities,
    findings,
    rawAlerts,
    socCases,
    entityAnalyticsMap,
    auditLogs,
    priorityItems,
    addToast,
    logAuditEvent,
  } = useApp();

  const [targetType, setTargetType] = useState<'entities' | 'findings' | 'bundle'>('entities');
  const [format, setFormat] = useState<'csv' | 'json'>('json');
  const [filterLabel, setFilterLabel] = useState<string>('All Records');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [recentHash, setRecentHash] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  useEffect(() => {
    if (exportModalConfig) {
      setTargetType(exportModalConfig.type);
      if (exportModalConfig.filterLabel) {
        setFilterLabel(exportModalConfig.filterLabel);
      }
    }
  }, [exportModalConfig]);

  if (!isExportModalOpen) return null;

  const getRecordCount = () => {
    switch (targetType) {
      case 'entities':
        return entities.length;
      case 'findings':
        return findings.length;
      case 'bundle':
        return entities.length + findings.length + (rawAlerts?.length || 0);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let result;

      if (targetType === 'entities') {
        if (format === 'csv') {
          result = await AirgapExportService.exportEntitiesToCSV(entities, filterLabel);
        } else {
          result = await AirgapExportService.exportEntitiesToJSON(entities, filterLabel);
        }
      } else if (targetType === 'findings') {
        if (format === 'csv') {
          result = await AirgapExportService.exportFindingsToCSV(findings, filterLabel);
        } else {
          result = await AirgapExportService.exportFindingsToJSON(findings, filterLabel);
        }
      } else {
        result = await AirgapExportService.exportCompleteSupervisoryBundle({
          entities,
          findings,
          rawAlerts,
          cases: socCases,
          analyticsMap: entityAnalyticsMap,
          auditLogs,
          priorityQueue: priorityItems,
        });
      }

      setRecentHash(result.integrityHash);

      logAuditEvent({
        action: 'EVIDENCE_EXPORT',
        category: 'Reporting',
        targetType: targetType === 'entities' ? 'Entity' : targetType === 'findings' ? 'Finding' : 'Report',
        targetId: `exp-${Date.now()}`,
        targetName: result.fileName,
        details: `Air-gapped client-side export completed: ${result.fileName} (${result.recordCount} records, ${(result.fileSizeBytes / 1024).toFixed(1)} KB). SHA-256 Digest: ${result.integrityHash.slice(0, 16)}...`,
      });

      addToast(
        'success',
        'Air-Gapped Export Downloaded',
        `${result.fileName} generated locally with verified SHA-256 checksum (${result.recordCount} records).`
      );
    } catch (err: any) {
      addToast('warning', 'Export Interrupted', err.message || 'Client-side export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const copyHashToClipboard = () => {
    if (recentHash) {
      navigator.clipboard.writeText(recentHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
      addToast('info', 'Checksum Copied', 'SHA-256 integrity hash copied to clipboard.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Air-Gapped Client-Side Data Export
                </h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  OFFLINE 100%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                NCIIPC / NTRO Compliant · Zero Network Egress · SHA-256 Tamper-Evident
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Air-gap security attestation notice */}
          <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3 text-xs text-blue-800 dark:text-blue-300">
            <Lock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Air-Gap Integrity Standard:</span> Data is parsed, sanitized, and serialized in local browser memory via HTML5 Blob APIs. No telemetry or findings leave this sandbox.
            </div>
          </div>

          {/* 1. Target Data Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
              1. Select Supervisory Dataset
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTargetType('entities')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  targetType === 'entities'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs flex items-center justify-between">
                  <span>Entities</span>
                  <span className="font-mono text-[10px] text-slate-500">{entities.length}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  7 Critical Sector Entities & Risk Scores
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('findings')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  targetType === 'findings'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs flex items-center justify-between">
                  <span>Findings</span>
                  <span className="font-mono text-[10px] text-slate-500">{findings.length}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  Execution Gaps, Negative Space & Evidence
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetType('bundle');
                  setFormat('json');
                }}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  targetType === 'bundle'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs flex items-center justify-between">
                  <span>Master Bundle</span>
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  Complete Sovereign Audit Package
                </div>
              </button>
            </div>
          </div>

          {/* 2. Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
              2. Export Format Standard
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
                  format === 'json'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <FileCode className="w-5 h-5 text-blue-500 shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-xs">JSON (ECMA-404)</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Includes SHA-256 Envelope & Evidence
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={targetType === 'bundle'}
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
                  format === 'csv'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                    : targetType === 'bundle'
                    ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-xs">CSV (RFC 4180)</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Excel-Safe UTF-8 BOM Header
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Export Metadata & Checksum Preview */}
          <div className="p-3.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-1.5">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>RECORD COUNT:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {getRecordCount()} records
              </span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>CLASSIFICATION:</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[280px]">
                {AIRGAP_CLASSIFICATION}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>INTEGRITY DIGEST:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                SHA-256 (Native / In-Memory)
              </span>
            </div>
          </div>

          {/* Checksum display if just exported */}
          {recentHash && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/40 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-mono">
                  <Hash className="w-3.5 h-3.5 text-emerald-500" />
                  Calculated SHA-256 Digest:
                </span>
                <button
                  type="button"
                  onClick={copyHashToClipboard}
                  className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Copy className="w-3 h-3" />
                  {copiedHash ? 'Copied!' : 'Copy Hash'}
                </button>
              </div>
              <div className="font-mono text-[10px] break-all bg-emerald-100/60 dark:bg-emerald-900/40 p-2 rounded text-emerald-900 dark:text-emerald-200">
                {recentHash}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Air-Gapped Validated</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExport}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generating In-Memory...' : 'Download Air-Gapped File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
