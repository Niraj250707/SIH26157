import React from 'react';
import { useApp } from '../../context/AppContext';
import { RiskBadge } from './RiskBadge';
import {
  X,
  Building2,
  Activity,
  Clock,
  Shield,
  Layers,
  Users,
  Database,
  ArrowUpRight,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const EntityDetailModal: React.FC = () => {
  const { selectedEntity, setSelectedEntity, findings, setSelectedFinding, setActivePage, addToast } = useApp();

  if (!selectedEntity) return null;

  const entityFindings = findings.filter((f) => f.entityId === selectedEntity.id);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-rose-600 dark:text-rose-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-rose-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={() => setSelectedEntity(null)} />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {selectedEntity.code}
                </span>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedEntity.sector}
                </span>
                {selectedEntity.otEnvironmentPresent && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono">
                    OT / SCADA
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedEntity.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RiskBadge level={selectedEntity.riskLevel} size="lg" />
            <button
              onClick={() => setSelectedEntity(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mission description */}
          <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
            {selectedEntity.description}
          </p>

          {/* Top Metric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                Composite Risk Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold font-mono ${getScoreColor(selectedEntity.riskScore)}`}>
                  {selectedEntity.riskScore}
                </span>
                <span className="text-xs text-slate-400 font-mono">/100</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${getScoreBg(selectedEntity.riskScore)}`}
                  style={{ width: `${selectedEntity.riskScore}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>SOC Telemetry</span>
                <Radio size={14} className="text-blue-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
                  {selectedEntity.socCoveragePercent}%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Active sensors coverage
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Mean Time to Detect</span>
                <Clock size={14} className="text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
                  {selectedEntity.mttdMinutes}
                </span>
                <span className="text-xs text-slate-500 font-mono">min</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Benchmark: &lt; 60m
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Total Active Findings</span>
                <AlertTriangle size={14} className="text-rose-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
                  {selectedEntity.totalFindings}
                </span>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  ({selectedEntity.criticalFindings} critical)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Supervisory gaps
              </p>
            </div>
          </div>

          {/* Operational Parameters & Score History Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operational Specs */}
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                SOC Governance & Operational Parameters
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Activity size={13} /> Mean Time to Respond (MTTR)
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {selectedEntity.mttrHours} hours
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Layers size={13} /> MITRE ATT&CK Matrix Coverage
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {selectedEntity.mitreCoveragePercent}%
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Database size={13} /> Forensic Log Retention
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {selectedEntity.logRetentionDays} days (Statutory: 180d)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Users size={13} /> Active Watch Floor Analysts
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {selectedEntity.activeAnalysts} FTE
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Shield size={13} /> Supervisory Oversight Status
                  </span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {selectedEntity.supervisoryStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Score History Chart */}
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  5-Month Risk Score Trajectory
                </h3>
                <span className="text-xs font-mono text-slate-500">2026 Trend</span>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedEntity.scoreHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '6px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#2563EB"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#scoreGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Active Findings for this Entity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Identified Findings ({entityFindings.length})
              </h3>
              <button
                onClick={() => {
                  setSelectedEntity(null);
                  setActivePage('findings');
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View all in Findings Explorer <ArrowUpRight size={13} />
              </button>
            </div>

            {entityFindings.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 border border-dashed rounded-lg text-center">
                No active critical findings recorded for this entity during current cycle.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                {entityFindings.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={f.severity} size="sm" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {f.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {f.description}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedFinding(f);
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 whitespace-nowrap transition-colors"
                    >
                      View Evidence
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedEntity(null);
              setActivePage('peer-comparison');
            }}
            className="text-xs text-slate-700 dark:text-slate-300 font-medium hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5"
          >
            Compare with Sector Peers <ArrowUpRight size={14} />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedEntity(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                addToast('success', 'Dossier Downloaded', `Exported regulatory profile for ${selectedEntity.name}`);
              }}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md transition-colors shadow-xs"
            >
              Export Regulatory Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
