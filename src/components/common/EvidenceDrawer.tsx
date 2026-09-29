import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RiskBadge } from './RiskBadge';
import {
  X,
  FileText,
  AlertOctagon,
  Terminal,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Copy,
  Check,
  Download,
  Send,
  ExternalLink,
} from 'lucide-react';

export const EvidenceDrawer: React.FC = () => {
  const { selectedFinding, setSelectedFinding, addToast, navigateToEntity, logAuditEvent } = useApp();
  const [copied, setCopied] = useState(false);

  if (!selectedFinding) return null;

  const handleCopyLog = () => {
    if (selectedFinding?.evidenceData?.sampleLog) {
      navigator.clipboard.writeText(selectedFinding.evidenceData.sampleLog);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast('info', 'Copied to Clipboard', 'Log payload copied to system clipboard.');
    }
  };

  const handleExportEvidence = () => {
    const payload = JSON.stringify(selectedFinding, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAT-SA-Evidence-${selectedFinding.id}.json`;
    a.click();
    URL.revokeObjectURL(url);

    logAuditEvent({
      action: 'EVIDENCE_EXPORT',
      category: 'Compliance & Security',
      targetType: 'Finding',
      targetId: selectedFinding.id,
      targetName: selectedFinding.title,
      details: `Exported technical sensor evidence dossier (.JSON) for ${selectedFinding.entityName}. Log source: ${selectedFinding.evidenceData.logSource}.`,
    });

    addToast('success', 'Evidence Dossier Exported', `Downloaded evidence file for ${selectedFinding.id} & logged to compliance ledger.`);
  };

  const handleDispatchDirective = () => {
    logAuditEvent({
      action: 'SUPERVISORY_ESCALATION',
      category: 'Supervisory Action',
      targetType: 'Finding',
      targetId: selectedFinding.id,
      targetName: selectedFinding.entityName,
      details: `Dispatched formal supervisory inquiry notice for finding "${selectedFinding.title}" (${selectedFinding.severity}). Regulatory benchmark: ${selectedFinding.evidenceData.regulatoryClause}.`,
    });

    addToast('warning', 'Supervisory Directive Drafted', `Formal inquiry notice prepared for ${selectedFinding.entityName} & logged.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={() => setSelectedFinding(null)} />

      {/* Drawer content */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-900/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">
                {selectedFinding.id}
              </span>
              <span aria-hidden="true">·</span>
              <span>{selectedFinding.category}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {selectedFinding.detectionDate}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {selectedFinding.title}
            </h2>
          </div>
          <button
            onClick={() => setSelectedFinding(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors ml-4"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Entity Summary Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                <Building2 size={20} />
              </div>
              <div>
                <button
                  onClick={() => {
                    setSelectedFinding(null);
                    navigateToEntity(selectedFinding.entityId);
                  }}
                  className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 text-left transition-colors"
                >
                  {selectedFinding.entityName}
                  <ExternalLink size={13} className="text-slate-400" />
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sector: {selectedFinding.sector}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RiskBadge level={selectedFinding.severity} />
              <span className="text-xs font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {selectedFinding.status}
              </span>
            </div>
          </div>

          {/* Finding Narrative */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Supervisory Description
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800">
              {selectedFinding.description}
            </p>
          </div>

          {/* MITRE ATT&CK & Impacted Systems */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                <Layers size={14} className="text-blue-600 dark:text-blue-400" />
                MITRE ATT&CK Technique
              </div>
              <p className="font-mono text-xs text-slate-800 dark:text-slate-200 font-medium">
                {selectedFinding.mitreTechnique}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                <AlertOctagon size={14} className="text-amber-600 dark:text-amber-400" />
                Impacted Assets
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedFinding.impactedSystems.map((sys, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300"
                  >
                    {sys}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Technical Evidence / Log Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Terminal size={14} className="text-slate-600 dark:text-slate-400" />
                Technical Evidence & Sensor Log Sample
              </div>
              <button
                onClick={handleCopyLog}
                className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy Payload'}
              </button>
            </div>
            
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Source telemetry probe:{' '}
              <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                {selectedFinding.evidenceData.logSource}
              </span>
            </div>

            <div className="bg-slate-950 text-slate-200 p-4 rounded-lg font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 shadow-inner">
              <pre className="whitespace-pre-wrap break-all">
                {selectedFinding.evidenceData.sampleLog}
              </pre>
            </div>
          </div>

          {/* Telemetry Gap & Supervisory Analysis */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Identified Telemetry Gap
            </h3>
            <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-lg text-rose-950 dark:text-rose-200 text-xs leading-relaxed">
              {selectedFinding.evidenceData.observedTelemetryGap}
            </div>
          </div>

          {/* Regulatory Citation & Supervisory Benchmark */}
          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-950 dark:text-blue-200">
                  Supervisory Benchmark Requirement
                </p>
                <p className="text-xs text-blue-900/80 dark:text-blue-300/80 mt-0.5">
                  {selectedFinding.evidenceData.supervisoryBenchmark}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40 text-xs flex items-center justify-between text-blue-900 dark:text-blue-300">
              <span>
                <strong>Statutory Reference:</strong> {selectedFinding.evidenceData.regulatoryClause}
              </span>
              <span className="font-semibold text-rose-700 dark:text-rose-400">
                Remediation: {selectedFinding.evidenceData.remediationDeadline}
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3">
          <button
            onClick={handleExportEvidence}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
          >
            <Download size={14} />
            Export Dossier (.JSON)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedFinding(null)}
              className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleDispatchDirective}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs"
            >
              <Send size={14} />
              Issue Supervisory Notice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
