import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  DEFAULT_SUPERVISORY_WEIGHTS,
  MathStats,
} from '../../services/supervisoryAnalyticsEngine';
import { SupervisoryWeightsConfig } from '../../types';
import {
  Calculator,
  X,
  Sliders,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Info,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Database,
  BarChart2,
} from 'lucide-react';

export const SupervisoryAnalyticsInspectorModal: React.FC = () => {
  const {
    isAnalyticsInspectorOpen,
    setIsAnalyticsInspectorOpen,
    entities,
    rawAlerts,
    socCases,
    supervisoryWeights,
    setSupervisoryWeights,
    recalculateAllEntityScores,
    entityAnalyticsMap,
    addToast,
    logAuditEvent,
    setSelectedEntity,
  } = useApp();

  const [localWeights, setLocalWeights] = useState<SupervisoryWeightsConfig>(
    supervisoryWeights || DEFAULT_SUPERVISORY_WEIGHTS
  );

  const [selectedEntityId, setSelectedEntityId] = useState<string>(
    entities[0]?.id || 'ent-001'
  );

  if (!isAnalyticsInspectorOpen) return null;

  const currentAnalytics = entityAnalyticsMap.get(selectedEntityId);
  const selectedEntityObj = entities.find((e) => e.id === selectedEntityId);

  // Compute sector aggregate statistics across all alerts
  const allClosureTimes = (rawAlerts || []).map((a) => a.closure_time_minutes);
  const sectorMean = Math.round(MathStats.mean(allClosureTimes) * 10) / 10;
  const sectorMedian = Math.round(MathStats.median(allClosureTimes) * 10) / 10;
  const sectorStdDev = Math.round(MathStats.stdDev(allClosureTimes) * 10) / 10;
  const sectorIqr = MathStats.iqr(allClosureTimes);

  const handleApplyWeights = () => {
    setSupervisoryWeights(localWeights);
    recalculateAllEntityScores(localWeights);

    logAuditEvent({
      action: 'STATUS_UPDATE',
      category: 'Supervisory Action',
      targetType: 'Entity',
      targetId: 'analytics-weights',
      targetName: 'Supervisory Analytics Formula Recalibration',
      details: `Supervisor adjusted offline formula weights: Baseline=${localWeights.baseline}, GapWeight=${localWeights.executionGapWeight}, NegSpaceWeight=${localWeights.negativeSpaceWeight}, EscalationThreshold=${localWeights.escalationThreshold * 100}%. Recalculated all ${entities.length} CSE risk profiles.`,
    });

    addToast(
      'success',
      'Supervisory Risk Scores Recalculated',
      `Applied revised mathematical weights across all ${entities.length} Critical Sector Entities.`
    );
  };

  const handleResetDefaults = () => {
    setLocalWeights(DEFAULT_SUPERVISORY_WEIGHTS);
    setSupervisoryWeights(DEFAULT_SUPERVISORY_WEIGHTS);
    recalculateAllEntityScores(DEFAULT_SUPERVISORY_WEIGHTS);

    addToast(
      'info',
      'Weights Reset',
      'Restored NCIIPC / NTRO official baseline supervisory weights.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Supervisory Analytics Engine & Mathematical Formulation
                </h3>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">
                  REF-26157 · NCIIPC/NTRO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pure Client-Side Math & Statistical Distribution (Tukey's Fences, Modified Z-Scores & Isolation Outliers)
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAnalyticsInspectorOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
          {/* Mathematical Formula Card */}
          <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                OFFICIAL SUPERVISORY RISK FORMULATION (PS 26157)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                100% Deterministic & Explainable
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs sm:text-sm text-indigo-200 overflow-x-auto">
              RiskScore = Baseline + min({localWeights.executionGapWeight}, N_Gaps × {localWeights.executionGapMultiplier}) + min({localWeights.negativeSpaceWeight}, N_Silent × {localWeights.negativeSpaceMultiplier}) + [EscRate &lt; {Math.round(localWeights.escalationThreshold * 100)}% ? {localWeights.lowEscalationPenalty} : 0] + min({localWeights.anomalyWeight}, N_Anom × {localWeights.anomalyMultiplier})
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Execution Gaps:</span>
                <span className="text-rose-400 font-mono font-semibold">Max {localWeights.executionGapWeight} pts (+{localWeights.executionGapMultiplier}/gap)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Negative Space:</span>
                <span className="text-amber-400 font-mono font-semibold">Max {localWeights.negativeSpaceWeight} pts (+{localWeights.negativeSpaceMultiplier}/silent)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Escalation Failure:</span>
                <span className="text-orange-400 font-mono font-semibold">+{localWeights.lowEscalationPenalty} pts (&lt;{Math.round(localWeights.escalationThreshold * 100)}%)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Statistical Anomalies:</span>
                <span className="text-purple-400 font-mono font-semibold">Max {localWeights.anomalyWeight} pts (+{localWeights.anomalyMultiplier}/anom)</span>
              </div>
            </div>
          </div>

          {/* Grid: Interactive Calibration Sliders + Statistical Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Weight Calibration Sliders (7 cols) */}
            <div className="lg:col-span-7 space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-500" />
                  Supervisory Calibration Controls
                </h4>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Defaults
                </button>
              </div>

              {/* Baseline Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Baseline Constant Score:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{localWeights.baseline} pts</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  value={localWeights.baseline}
                  onChange={(e) => setLocalWeights({ ...localWeights, baseline: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Execution Gap Weight */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Execution Gaps Cap (Rapid Closure &lt; {localWeights.fastClosureThresholdMinutes}m):</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{localWeights.executionGapWeight} pts</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="50"
                  value={localWeights.executionGapWeight}
                  onChange={(e) => setLocalWeights({ ...localWeights, executionGapWeight: Number(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Fast Closure Minutes Threshold */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Rapid Closure Cutoff (Minutes):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{localWeights.fastClosureThresholdMinutes} mins</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setLocalWeights({ ...localWeights, fastClosureThresholdMinutes: mins })}
                      className={`py-1 text-xs rounded border font-mono ${
                        localWeights.fastClosureThresholdMinutes === mins
                          ? 'bg-blue-600 text-white border-blue-600 font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      &lt; {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Negative Space Weight */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Negative Space Cap (Silent Critical Assets):</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{localWeights.negativeSpaceWeight} pts</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="50"
                  value={localWeights.negativeSpaceWeight}
                  onChange={(e) => setLocalWeights({ ...localWeights, negativeSpaceWeight: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Escalation Failure Threshold */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Critical Escalation Floor Rate:</span>
                  <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(localWeights.escalationThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.20"
                  max="0.60"
                  step="0.05"
                  value={localWeights.escalationThreshold}
                  onChange={(e) => setLocalWeights({ ...localWeights, escalationThreshold: Number(e.target.value) })}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleApplyWeights}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Apply & Recalculate All 7 CSE Risk Scores
                </button>
              </div>
            </div>

            {/* Statistical Outlier & Distribution Panel (5 cols) */}
            <div className="lg:col-span-5 space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                Sector Telemetry Distribution
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">Mean Closure:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{sectorMean} mins</span>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">Median Closure:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{sectorMedian} mins</span>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">Std Deviation:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">σ = {sectorStdDev}</span>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">Interquartile (IQR):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{Math.round(sectorIqr.iqr)} mins</span>
                </div>
              </div>

              {/* Tukey's Fences */}
              <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-xs space-y-1.5">
                <div className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1 font-mono text-[11px]">
                  <Info className="w-3 h-3" />
                  Tukey's Outlier Fences (Triage Velocity):
                </div>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                  <div>Q1 (25%): {Math.round(sectorIqr.q1)}m | Q3 (75%): {Math.round(sectorIqr.q3)}m</div>
                  <div>Upper Fence (Q3 + 1.5×IQR): {Math.round(sectorIqr.upperFence)}m</div>
                  <div className="text-rose-600 dark:text-rose-400 font-semibold">
                    Superficial Triage Cutoff: &lt; {localWeights.fastClosureThresholdMinutes}m
                  </div>
                </div>
              </div>

              {/* Selected Entity Live Explainability */}
              {currentAnalytics && selectedEntityObj && (
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                      {selectedEntityObj.code} · {selectedEntityObj.name}
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      Score: {currentAnalytics.compositeRiskScore} / 100
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-rose-500">What Detected:</span> {currentAnalytics.explainability.what}
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-amber-500">Why Problem:</span> {currentAnalytics.explainability.why}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Entity Comparative Formulation Table */}
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              Live Entity Calculation Matrix (7 Critical Sector Entities)
            </h4>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">Entity</th>
                    <th className="p-2.5">Sector</th>
                    <th className="p-2.5 text-center">Execution Gaps (&lt;{localWeights.fastClosureThresholdMinutes}m)</th>
                    <th className="p-2.5 text-center">Negative Space (Silent Assets)</th>
                    <th className="p-2.5 text-center">Crit. Escalation</th>
                    <th className="p-2.5 text-center">Closure Z-Score</th>
                    <th className="p-2.5 text-center">Computed Score</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {entities.map((entity) => {
                    const analytics = entityAnalyticsMap.get(entity.id);
                    const isSelected = entity.id === selectedEntityId;
                    const score = analytics ? analytics.compositeRiskScore : entity.riskScore;

                    return (
                      <tr
                        key={entity.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-500">{entity.code}</span>
                            <span className="truncate max-w-[200px]">{entity.name}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-slate-500 dark:text-slate-400">{entity.sector}</td>
                        <td className="p-2.5 text-center font-mono">
                          {analytics ? (
                            <span className={analytics.executionGapsCount > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400'}>
                              {analytics.executionGapsCount} instances
                            </span>
                          ) : (
                            '--'
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono">
                          {analytics ? (
                            <span className={analytics.silentAssetsCount > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400'}>
                              {analytics.silentAssetsCount} silent
                            </span>
                          ) : (
                            '--'
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono">
                          {analytics ? (
                            <span className={analytics.criticalEscalationRate < localWeights.escalationThreshold ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-emerald-600 dark:text-emerald-400'}>
                              {Math.round(analytics.criticalEscalationRate * 100)}%
                            </span>
                          ) : (
                            '--'
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono">
                          {analytics ? analytics.zScoreClosureVelocity : '--'}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                              score >= 70
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : score >= 45
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {score} / 100
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedEntityId(entity.id)}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white font-semibold'
                                : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                            }`}
                          >
                            {isSelected ? 'Viewing' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Formulation compliant with NCIIPC Problem Statement 26157</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAnalyticsInspectorOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
