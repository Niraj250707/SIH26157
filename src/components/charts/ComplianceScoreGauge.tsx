import React, { useState } from 'react';
import { INITIAL_COMPLIANCE_TREND } from '../../data/dummyData';
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from 'recharts';

interface ComplianceScoreGaugeProps {
  score?: number;
}

export const ComplianceScoreGauge: React.FC<ComplianceScoreGaugeProps> = ({ score = 78.4 }) => {
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const trendData = INITIAL_COMPLIANCE_TREND;
  const startScore = trendData[0].score;
  const currentScore = trendData[trendData.length - 1].score;
  const delta = +(currentScore - startScore).toFixed(1);

  // Gauge angle calculation (180 degree semi-circle)
  // Range: 0 to 100
  const normalizedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = 251.2 - (251.2 * normalizedScore) / 100;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Fleet Compliance Score Gauge
            </h3>
            <span className="text-[11px] text-slate-400">
              National Critical Infrastructure Baseline (NIST CSF 2.0)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono text-[11px] font-semibold">
          <TrendingUp size={12} />
          <span>+{delta}% (30d)</span>
        </div>
      </div>

      {/* Main Gauge & Sparkline Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center my-4">
        {/* Semi-circular Radial Gauge (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative pt-2">
          <svg className="w-44 h-24 overflow-visible" viewBox="0 0 100 55">
            {/* Background semi-circle track */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              className="text-slate-100 dark:text-slate-800"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="complianceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            {/* Value fill semi-circle */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="url(#complianceGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="125.6"
              strokeDashoffset={125.6 - (125.6 * normalizedScore) / 100}
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Centered Score Readout */}
          <div className="text-center -mt-6">
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                {score.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-mono">%</span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold block">
              NOMINAL FLEET COMPLIANCE
            </span>
          </div>

          <div className="w-full flex justify-between text-[9px] font-mono text-slate-400 px-4 mt-2">
            <span>0% NON-COMPLIANT</span>
            <span>THRESHOLD 70%</span>
            <span>100% AUDITED</span>
          </div>
        </div>

        {/* 30-Day Sparkline Chart (7 cols) */}
        <div className="md:col-span-7 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px]">
              <Activity size={13} className="text-blue-500" />
              30-Day Fleet Compliance Trend
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {hoveredPoint ? `${hoveredPoint.date}: ${hoveredPoint.score}%` : 'Daily Assessment Cycle'}
            </span>
          </div>

          {/* Sparkline Graphic */}
          <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                onMouseMove={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    setHoveredPoint(e.activePayload[0].payload);
                  }
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <YAxis domain={[70, 82]} hide />
                <XAxis dataKey="date" hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2 rounded-lg shadow-xl border border-slate-700 text-[10px] font-mono space-y-0.5">
                          <p className="font-bold text-slate-300">{data.date}, 2026</p>
                          <p className="text-emerald-400 font-bold">Compliance: {data.score}%</p>
                          <p className="text-slate-400">Telemetry: {data.telemetryCompliance}%</p>
                          <p className="text-slate-400">SLA Timeliness: {data.slaCompliance}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#sparklineGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#10B981', stroke: '#ffffff', strokeWidth: 1.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5 border-t border-slate-200/60 dark:border-slate-700/60">
            <span>Aug 30 ({startScore}%)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Current: {currentScore}% (+{delta}%)
            </span>
            <span>Sep 28</span>
          </div>
        </div>
      </div>

      {/* 4 Compliance Pillars Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {[
          { label: 'Telemetry Forwarding', val: '83.0%', target: '≥ 80%', ok: true },
          { label: 'Incident SLA Adherence', val: '76.8%', target: '≥ 75%', ok: true },
          { label: 'MITRE ATT&CK Matrix', val: '70.0%', target: '≥ 70%', ok: true },
          { label: 'Forensic Retention', val: '89.2%', target: '≥ 90 days', ok: true },
        ].map((pillar) => (
          <div
            key={pillar.label}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
          >
            <span className="text-[10px] text-slate-500 truncate block">{pillar.label}</span>
            <div className="flex items-baseline justify-between mt-1">
              <strong className="text-xs font-mono text-slate-900 dark:text-white font-bold">
                {pillar.val}
              </strong>
              <span className="text-[9px] font-mono text-slate-400">{pillar.target}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
