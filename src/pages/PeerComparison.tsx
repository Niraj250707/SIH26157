import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Entity } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  GitCompare,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Layers,
  Clock,
  Radio,
  Users,
  Database,
  CheckCircle2,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

export const PeerComparison: React.FC = () => {
  const { entities, selectedEntity, setSelectedEntity } = useApp();

  const [primaryEntityId, setPrimaryEntityId] = useState<string>(
    selectedEntity ? selectedEntity.id : entities[0].id
  );
  const [comparisonTarget, setComparisonTarget] = useState<string>('sector_average'); // or entity ID

  const primaryEntity = entities.find((e) => e.id === primaryEntityId) || entities[0];

  // Sector peer entities
  const sectorPeers = useMemo(() => {
    return entities.filter((e) => e.sector === primaryEntity.sector && e.id !== primaryEntity.id);
  }, [entities, primaryEntity]);

  // Secondary entity if selected
  const secondaryEntity = comparisonTarget !== 'sector_average'
    ? entities.find((e) => e.id === comparisonTarget)
    : null;

  // Sector averages for this entity's sector
  const sectorAverages = useMemo(() => {
    const peersInSector = entities.filter((e) => e.sector === primaryEntity.sector);
    const count = peersInSector.length || 1;

    const avgRisk = Math.round(peersInSector.reduce((sum, e) => sum + e.riskScore, 0) / count);
    const avgCoverage = Math.round(peersInSector.reduce((sum, e) => sum + e.socCoveragePercent, 0) / count);
    const avgMttd = Math.round(peersInSector.reduce((sum, e) => sum + e.mttdMinutes, 0) / count);
    const avgMttr = +(peersInSector.reduce((sum, e) => sum + e.mttrHours, 0) / count).toFixed(1);
    const avgMitre = Math.round(peersInSector.reduce((sum, e) => sum + e.mitreCoveragePercent, 0) / count);
    const avgRetention = Math.round(peersInSector.reduce((sum, e) => sum + e.logRetentionDays, 0) / count);
    const avgAnalysts = Math.round(peersInSector.reduce((sum, e) => sum + e.activeAnalysts, 0) / count);

    return {
      name: `${primaryEntity.sector} Average`,
      riskScore: avgRisk,
      socCoveragePercent: avgCoverage,
      mttdMinutes: avgMttd,
      mttrHours: avgMttr,
      mitreCoveragePercent: avgMitre,
      logRetentionDays: avgRetention,
      activeAnalysts: avgAnalysts,
    };
  }, [entities, primaryEntity]);

  // Normalization for radar chart (all scaled 0 - 100 where 100 is best)
  // For MTTD: lower is better -> score = Math.max(0, 100 - (mttd / 4))
  // For MTTR: lower is better -> score = Math.max(0, 100 - (mttr * 2.5))
  // For Retention: score = Math.min(100, (retention / 365) * 100)
  const calcMttdScore = (min: number) => Math.max(10, Math.min(100, Math.round(100 - (min / 4))));
  const calcMttrScore = (hrs: number) => Math.max(10, Math.min(100, Math.round(100 - (hrs * 2.5))));
  const calcRetentionScore = (days: number) => Math.max(10, Math.min(100, Math.round((days / 365) * 100)));

  const baselineObj = secondaryEntity || sectorAverages;
  const baselineLabel = secondaryEntity ? secondaryEntity.name : `${primaryEntity.sector} Avg`;

  const radarData = [
    {
      subject: 'Telemetry Coverage',
      entity: primaryEntity.socCoveragePercent,
      peer: baselineObj.socCoveragePercent,
      fullMark: 100,
    },
    {
      subject: 'MITRE ATT&CK Matrix',
      entity: primaryEntity.mitreCoveragePercent,
      peer: baselineObj.mitreCoveragePercent,
      fullMark: 100,
    },
    {
      subject: 'Detection Speed (MTTD)',
      entity: calcMttdScore(primaryEntity.mttdMinutes),
      peer: calcMttdScore(baselineObj.mttdMinutes),
      fullMark: 100,
    },
    {
      subject: 'Containment Speed (MTTR)',
      entity: calcMttrScore(primaryEntity.mttrHours),
      peer: calcMttrScore(baselineObj.mttrHours),
      fullMark: 100,
    },
    {
      subject: 'Forensic Retention',
      entity: calcRetentionScore(primaryEntity.logRetentionDays),
      peer: calcRetentionScore(baselineObj.logRetentionDays),
      fullMark: 100,
    },
    {
      subject: 'Posture Health (100-Risk)',
      entity: 100 - primaryEntity.riskScore,
      peer: 100 - baselineObj.riskScore,
      fullMark: 100,
    },
  ];

  // Metrics comparison cards
  const metricsComparison = [
    {
      label: 'Composite Risk Score',
      entityVal: primaryEntity.riskScore,
      peerVal: baselineObj.riskScore,
      unit: '/100',
      lowerIsBetter: true,
      delta: primaryEntity.riskScore - baselineObj.riskScore,
    },
    {
      label: 'SOC Telemetry Coverage',
      entityVal: `${primaryEntity.socCoveragePercent}%`,
      peerVal: `${baselineObj.socCoveragePercent}%`,
      unit: '',
      lowerIsBetter: false,
      delta: primaryEntity.socCoveragePercent - baselineObj.socCoveragePercent,
    },
    {
      label: 'Mean Time to Detect (MTTD)',
      entityVal: `${primaryEntity.mttdMinutes} min`,
      peerVal: `${baselineObj.mttdMinutes} min`,
      unit: '',
      lowerIsBetter: true,
      delta: primaryEntity.mttdMinutes - baselineObj.mttdMinutes,
    },
    {
      label: 'Mean Time to Respond (MTTR)',
      entityVal: `${primaryEntity.mttrHours} hrs`,
      peerVal: `${baselineObj.mttrHours} hrs`,
      unit: '',
      lowerIsBetter: true,
      delta: +(primaryEntity.mttrHours - baselineObj.mttrHours).toFixed(1),
    },
    {
      label: 'MITRE ATT&CK Coverage',
      entityVal: `${primaryEntity.mitreCoveragePercent}%`,
      peerVal: `${baselineObj.mitreCoveragePercent}%`,
      unit: '',
      lowerIsBetter: false,
      delta: primaryEntity.mitreCoveragePercent - baselineObj.mitreCoveragePercent,
    },
    {
      label: 'Forensic Log Retention',
      entityVal: `${primaryEntity.logRetentionDays} days`,
      peerVal: `${baselineObj.logRetentionDays} days`,
      unit: '',
      lowerIsBetter: false,
      delta: primaryEntity.logRetentionDays - baselineObj.logRetentionDays,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
            BENCHMARKING & RELATIVE MATURITY
          </span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
          <span className="text-xs text-slate-500 font-mono">
            Sector-Normed Analytics
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Sector Peer Comparison Engine
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          Compare individual entity operational metrics against sector peers or statutory benchmarks to isolate entity-specific deficiencies versus systemic risks.
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Primary Entity Selector */}
        <div className="w-full md:w-1/2 space-y-1.5">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
            Target Entity to Inspect:
          </label>
          <select
            value={primaryEntityId}
            onChange={(e) => {
              setPrimaryEntityId(e.target.value);
              setComparisonTarget('sector_average');
            }}
            className="w-full text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.code}) — {e.sector}
              </option>
            ))}
          </select>
        </div>

        {/* Comparison Baseline Selector */}
        <div className="w-full md:w-1/2 space-y-1.5">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <GitCompare size={14} className="text-purple-600 dark:text-purple-400" />
            Comparison Baseline:
          </label>
          <select
            value={comparisonTarget}
            onChange={(e) => setComparisonTarget(e.target.value)}
            className="w-full text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="sector_average">
              Sector Average ({primaryEntity.sector})
            </option>
            <optgroup label="Sector Peers">
              {sectorPeers.map((peer) => (
                <option key={peer.id} value={peer.id}>
                  Peer: {peer.name} ({peer.code})
                </option>
              ))}
            </optgroup>
            <optgroup label="All Critical Entities">
              {entities
                .filter((e) => e.id !== primaryEntity.id && e.sector !== primaryEntity.sector)
                .map((other) => (
                  <option key={other.id} value={other.id}>
                    Cross-Sector: {other.name} ({other.sector})
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Main Radar & Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                6-Dimension SOC Maturity Radar
              </h2>
              <span className="text-xs font-mono text-slate-400">Normalized 0-100</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Outer perimeter indicates superior security capability & lower latency
            </p>
          </div>

          <div className="h-80 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="#94A3B8" strokeOpacity={0.3} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94A3B8" strokeOpacity={0.2} />
                <Radar
                  name={primaryEntity.name}
                  dataKey="entity"
                  stroke="#2563EB"
                  fill="#3B82F6"
                  fillOpacity={0.35}
                />
                <Radar
                  name={baselineLabel}
                  dataKey="peer"
                  stroke="#9333EA"
                  fill="#A855F7"
                  fillOpacity={0.2}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '16px',
                    fontSize: '12px',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong>Supervisory Diagnostic:</strong>{' '}
            {primaryEntity.riskScore > baselineObj.riskScore ? (
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {primaryEntity.name} demonstrates a higher composite vulnerability profile (+{primaryEntity.riskScore - baselineObj.riskScore} pts) than the benchmark, primarily driven by detection latency (MTTD {primaryEntity.mttdMinutes}m) and log retention deficits.
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {primaryEntity.name} outperforms benchmark thresholds by {baselineObj.riskScore - primaryEntity.riskScore} points with above-average MITRE ATT&CK coverage ({primaryEntity.mitreCoveragePercent}%).
              </span>
            )}
          </div>
        </div>

        {/* Side-by-Side Key Metrics Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Side-by-Side Key Performance Deltas
            </h3>

            <div className="space-y-3">
              {metricsComparison.map((m, idx) => {
                const isFavorable = m.lowerIsBetter ? m.delta < 0 : m.delta > 0;
                const isNeutral = m.delta === 0;

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                        {m.label}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          {m.entityVal}
                        </span>
                        <span>vs</span>
                        <span className="text-purple-600 dark:text-purple-400">
                          {m.peerVal}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`inline-flex items-center gap-1 font-mono font-bold text-xs ${
                          isNeutral
                            ? 'text-slate-400'
                            : isFavorable
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {!isNeutral && (isFavorable ? <TrendingUp size={13} /> : <TrendingDown size={13} />)}
                        {isNeutral ? (
                          <span>Par</span>
                        ) : (
                          <span>
                            {m.delta > 0 ? `+${m.delta}` : m.delta}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {isNeutral ? 'identical' : isFavorable ? 'favorable' : 'lagging'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
