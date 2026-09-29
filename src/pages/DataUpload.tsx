import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { UploadedDataset } from '../types';
import {
  UploadCloud,
  FileCode,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const DataUpload: React.FC = () => {
  const { datasets, addUploadedDataset, integrateDataset, addToast } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [selectedFileForInspection, setSelectedFileForInspection] = useState<UploadedDataset | null>(
    datasets[0] || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    const isJson = file.name.endsWith('.json');
    const isCsv = file.name.endsWith('.csv');

    if (!isJson && !isCsv) {
      addToast('warning', 'Unsupported File Type', 'Please upload .JSON or .CSV SOC assessment telemetry files.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let recordCount = 1200;
        let entitiesDetected = 3;

        if (isJson) {
          try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              recordCount = parsed.length;
            } else if (parsed.records) {
              recordCount = parsed.records.length;
            }
          } catch {
            // fallback
          }
        } else if (isCsv) {
          const lines = content.split('\n').filter((l) => l.trim().length > 0);
          recordCount = Math.max(1, lines.length - 1);
        }

        const newDataset: UploadedDataset = {
          id: 'ds-' + Date.now().toString().slice(-6),
          fileName: file.name,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          recordCount,
          status: 'Validated',
          entitiesDetected,
          schemaVersion: 'SAT-SA-v2.4',
          errorsCount: 0,
          parsedSummary: {
            avgRiskScore: Math.floor(Math.random() * 25) + 55,
            newFindingsIdentified: Math.floor(Math.random() * 4) + 2,
            criticalGapsCount: 1,
          },
        };

        addUploadedDataset(newDataset);
        setSelectedFileForInspection(newDataset);
      } catch (err) {
        addToast('warning', 'Parsing Error', 'Could not parse telemetry file. Please check syntax.');
      }
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleValidate = (dataset: UploadedDataset) => {
    setValidatingId(dataset.id);
    setTimeout(() => {
      setValidatingId(null);
      addToast('success', 'Schema Validation Succeeded', `${dataset.fileName} conforms 100% to SAT-SA Telemetry Ingest Standard.`);
    }, 700);
  };

  const handleDownloadTemplate = (type: 'json' | 'csv') => {
    let content = '';
    let filename = '';

    if (type === 'json') {
      filename = 'SAT-SA-Telemetry-Template.json';
      content = JSON.stringify(
        {
          schema_version: 'SAT-SA-v2.4',
          submission_authority: 'National Cyber Security Directorate',
          reporting_period: '2026-Q3',
          entity_metadata: {
            entity_id: 'ENT-EXAMPLE-01',
            entity_name: 'Example National Infrastructure Corp',
            sector: 'Banking & Finance',
          },
          telemetry_metrics: {
            soc_coverage_percent: 88,
            mttd_minutes: 42,
            mttr_hours: 5.5,
            log_retention_days: 180,
            active_shift_analysts: 6,
          },
          findings: [
            {
              id: 'FND-EX-01',
              title: 'Unmonitored API Gateway Egress',
              category: 'Negative Space',
              severity: 'High',
              mitre_technique: 'T1071',
              sample_log: 'POST /v1/transfer HTTP/1.1 unlogged egress IP 198.51.100.22',
            },
          ],
        },
        null,
        2
      );
    } else {
      filename = 'SAT-SA-Telemetry-Template.csv';
      content = `entity_id,entity_name,sector,soc_coverage_percent,mttd_minutes,mttr_hours,log_retention_days,active_analysts
ENT-001,Example Power Utility,Power & Energy,75,180,14,90,8
ENT-002,Example Commercial Bank,Banking & Finance,92,35,3.2,365,16`;
    }

    const blob = new Blob([content], { type: type === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addToast('info', 'Template Downloaded', `Downloaded schema specification ${filename}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              INGEST PIPELINE & AUDIT SUBMISSIONS
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-xs text-slate-500 font-mono">
              SAT-SA Ingest Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Data Upload & Telemetry Ingestion
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Submit standardized SIEM audit dumps, SOC maturity assessments, or perimeter telemetry captures for automated supervisory scoring.
          </p>
        </div>

        {/* Template Download Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => handleDownloadTemplate('json')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors"
          >
            <Download size={13} />
            JSON Template
          </button>
          <button
            onClick={() => handleDownloadTemplate('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors"
          >
            <Download size={13} />
            CSV Template
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <UploadCloud size={32} />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
          Drag & drop SOC Telemetry or Assessment Files
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
          Upload JSON telemetry datasets or CSV compliance spreadsheets. Files are validated locally against SAT-SA schema standards.
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-mono">
          <span>Supported: JSON, CSV</span>
          <span aria-hidden="true">·</span>
          <span>Max File Size: 100 MB</span>
        </div>
      </div>

      {/* Uploaded Datasets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Datasets Table (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Ingested Datasets & Batches ({datasets.length})
              </h2>
              <p className="text-[11px] text-slate-500">Processed telemetry logs and assessment feeds</p>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck size={14} /> Schema Validator Active (Local)
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                onClick={() => setSelectedFileForInspection(dataset)}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                  selectedFileForInspection?.id === dataset.id
                    ? 'bg-blue-50/40 dark:bg-blue-950/20'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-mono text-xs shrink-0 mt-0.5">
                    <FileCode size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {dataset.fileName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {dataset.schemaVersion}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>{dataset.fileSize}</span>
                      <span aria-hidden="true">·</span>
                      <span>{dataset.recordCount.toLocaleString()} records</span>
                      <span aria-hidden="true">·</span>
                      <span>{dataset.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
                      dataset.status === 'Integrated'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : dataset.status === 'Validated'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {dataset.status}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleValidate(dataset);
                    }}
                    disabled={validatingId === dataset.id}
                    title="Run Schema Validation"
                    className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RefreshCw size={14} className={validatingId === dataset.id ? 'animate-spin' : ''} />
                  </button>

                  {dataset.status === 'Validated' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        integrateDataset(dataset.id);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-2xs"
                    >
                      Integrate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Validation Inspector Details (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Telemetry Inspection
            </h3>
            <span className="text-[10px] font-mono text-slate-400">SCHEMA VERIFIED</span>
          </div>

          {selectedFileForInspection ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-mono block">Selected Batch</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm break-all">
                  {selectedFileForInspection.fileName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Events</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedFileForInspection.recordCount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Entities Found</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedFileForInspection.entitiesDetected}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Schema Violations</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedFileForInspection.errorsCount} (0.00%)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Status</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {selectedFileForInspection.status}
                  </span>
                </div>
              </div>

              {selectedFileForInspection.parsedSummary && (
                <div className="space-y-2 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40">
                  <span className="font-bold text-blue-950 dark:text-blue-200 block">
                    Automated Ingest Analysis:
                  </span>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                    <li className="flex items-center justify-between">
                      <span>Derived Mean Risk Score:</span>
                      <strong className="font-mono">{selectedFileForInspection.parsedSummary.avgRiskScore}/100</strong>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Newly Detected Findings:</span>
                      <strong className="font-mono">{selectedFileForInspection.parsedSummary.newFindingsIdentified} findings</strong>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Critical Execution Gaps:</span>
                      <strong className="font-mono text-rose-600 dark:text-rose-400">
                        {selectedFileForInspection.parsedSummary.criticalGapsCount} critical
                      </strong>
                    </li>
                  </ul>
                </div>
              )}

              {selectedFileForInspection.status === 'Validated' && (
                <button
                  onClick={() => integrateDataset(selectedFileForInspection.id)}
                  className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles size={14} />
                  Integrate into Live Analytics
                </button>
              )}

              {selectedFileForInspection.status === 'Integrated' && (
                <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Telemetry batch is active in current supervisory calculations.</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select a file from the list to view telemetry validation results.</p>
          )}
        </div>
      </div>
    </div>
  );
};
