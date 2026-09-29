import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { THIRTY_DAY_HISTORICAL_RISK_TREND } from '../data/dummyData';
import { ComplianceScoreGauge } from '../components/charts/ComplianceScoreGauge';
import { GeographicalHeatMap } from '../components/charts/GeographicalHeatMap';
import {
  Building2,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
  ChevronRight,
  Activity,
  Zap,
  Calendar,
  Layers,
  SlidersHorizontal,
  Info,
  ChevronLeft,
  Bell,
  Sparkles,
  Server,
  Globe,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  FileCode,
  Calculator,
  Download,
  HardDrive,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export const Overview: React.FC = () => {
  const {
    entities,
    findings,
    priorityItems,
    complianceControls,
    remediationTasks,
    addRemediationTask,
    addToast,
    setSelectedEntity,
    setSelectedFinding,
    setActivePage,
    setIsAdvisorOpen,
    openExportModal,
    setIsAnalyticsInspectorOpen,
    entityAnalyticsMap,
    rawAlerts,
  } = useApp();

  const [trendView, setTrendView] = useState<'aggregate' | 'sectors' | 'volume'>('aggregate');
  const [timeRange, setTimeRange] = useState<'30d' | '14d' | '7d'>('30d');

  const totalEntities = entities.length;
  const highRiskEntities = entities.filter((e) => e.riskLevel === 'High');
  const mediumRiskEntities = entities.filter((e) => e.riskLevel === 'Medium');
  const lowRiskEntities = entities.filter((e) => e.riskLevel === 'Low');
  const needingAttention = priorityItems.filter((p) => p.status === 'Pending Review');
  const criticalFindings = findings.filter((f) => f.severity === 'Critical');

  // Regulatory & Remediation counts
  const nonCompliantControls = complianceControls.filter((c) =>
    c.entitiesAssessment.some((ea) => ea.status === 'NON_COMPLIANT')
  ).length;
  const pendingRemediations = remediationTasks.filter((t) => t.status !== 'Verified Closed').length;

  // Automated Remediation Proposals State
  const [proposalTypeFilter, setProposalTypeFilter] = useState<'ALL' | 'PATCH' | 'POLICY' | 'TELEMETRY'>('ALL');
  const [deployedProposals, setDeployedProposals] = useState<Record<string, boolean>>({});

  const remediationProposals = [
    {
      id: 'prop-01',
      type: 'PATCH' as const,
      urgency: 'CRITICAL' as const,
      entityId: 'ent-001',
      entityName: 'National Power Grid Corporation (SCADA/EMS)',
      sector: 'Power & Energy',
      title: 'Security Patch: Siemens/VxWorks Kernel Patch CVE-2026-38291 for SCADA RTUs',
      summary: '68-day telemetry suppression vulnerability identified on RTU Intertie Gateway (AST-SCADA-011). Vendor firmware 4.12.8 eliminates buffer overflow and re-establishes TLS 1.3 heartbeat forwarder to central SIEM.',
      patchId: 'KB-VIRT-2026-08',
      cveCode: 'CVE-2026-38291',
      controlCode: 'OT.NET-01',
      findingId: 'fnd-101',
      riskReduction: '-18 pts',
      statutoryDays: 7,
      requiredProof: 'Re-compiled firmware checksum, Syslog-ng connection receipts, and dual-homed firewall diff.',
    },
    {
      id: 'prop-02',
      type: 'POLICY' as const,
      urgency: 'HIGH' as const,
      entityId: 'ent-002',
      entityName: 'Apex National Bank',
      sector: 'Banking & Finance',
      title: 'Policy Update: Mandate PIM Multi-Approval for Entra ID Cloud Service Principals',
      summary: 'Absence of behavioral correlation for automated cloud service principals detected. Enforce Privileged Identity Management (PIM) with FIDO2 multi-party authorization on role elevations.',
      patchId: 'SEC-POL-AZ-04',
      cveCode: 'CWE-284',
      controlCode: 'ISO-A.5.15',
      findingId: 'fnd-102',
      riskReduction: '-15 pts',
      statutoryDays: 14,
      requiredProof: 'Conditional Access policy export, Azure PIM elevation logs, and CISO sign-off attestation.',
    },
    {
      id: 'prop-03',
      type: 'TELEMETRY' as const,
      urgency: 'CRITICAL' as const,
      entityId: 'ent-008',
      entityName: 'Eastern Port Trust (Maritime Logistics)',
      sector: 'Transportation',
      title: 'Telemetry Directive: Hardware Data Diode & 802.1X Encryption on Quay Cranes',
      summary: 'Unmonitored wireless link detected on automated quay container cranes. Deploy unidirectional optical data diode on PLC bridge and enforce WPA3-Enterprise telemetry forwarding.',
      patchId: 'HW-DIODE-PORT-02',
      cveCode: 'CWE-319',
      controlCode: 'CISA.CPG-1.A',
      findingId: 'fnd-104',
      riskReduction: '-14 pts',
      statutoryDays: 10,
      requiredProof: 'Diode optical alignment test report, certificate dump, and continuous packet stream log.',
    },
    {
      id: 'prop-04',
      type: 'PATCH' as const,
      urgency: 'HIGH' as const,
      entityId: 'ent-003',
      entityName: 'Bharat Telecom Ltd (Core 5G Backbone)',
      sector: 'Telecommunications',
      title: 'Security Patch: Roll out Kerberos PAC Elevation Patch (KB5020805) Across Domain Controllers',
      summary: 'Domain controller telemetry revealed unpatched Kerberos PAC validation flaw allowing privilege escalation across roaming signaling gateways.',
      patchId: 'MS-SEC-KB5020805',
      cveCode: 'CVE-2022-37967',
      controlCode: 'NIST-PR.AC-01',
      findingId: 'fnd-103',
      riskReduction: '-12 pts',
      statutoryDays: 14,
      requiredProof: 'Patch deployment status report across all 8 domain controllers and test Kerberos ticket validation log.',
    },
    {
      id: 'prop-05',
      type: 'POLICY' as const,
      urgency: 'MEDIUM' as const,
      entityId: 'ent-004',
      entityName: 'Metro Airport Authority',
      sector: 'Aviation & Transportation',
      title: 'Policy Update: Airside Baggage SCADA Network Micro-Segmentation & NTP Sync',
      summary: 'Flight information display systems shared VLAN with baggage conveyor PLCs. Enforce strict Layer-3 micro-segmentation and resynchronize with National Stratum-1 time source.',
      patchId: 'AIR-VLAN-SEG-01',
      cveCode: 'CWE-1021',
      controlCode: 'NIST-PR.IP-01',
      findingId: 'fnd-105',
      riskReduction: '-11 pts',
      statutoryDays: 21,
      requiredProof: 'VLAN routing table export, firewall rule configuration dump, and NTP stratum synchronization verification.',
    },
  ];

  const filteredProposals = React.useMemo(() => {
    if (proposalTypeFilter === 'ALL') return remediationProposals;
    return remediationProposals.filter((p) => p.type === proposalTypeFilter);
  }, [proposalTypeFilter]);

  const handleDeployProposal = (prop: typeof remediationProposals[0]) => {
    const today = new Date();
    today.setDate(today.getDate() + prop.statutoryDays);
    const deadlineStr = today.toISOString().split('T')[0];

    addRemediationTask({
      entityId: prop.entityId,
      entityName: prop.entityName,
      sector: prop.sector as any,
      controlCode: prop.controlCode,
      title: prop.title,
      description: prop.summary,
      priority: prop.urgency,
      status: 'Pending',
      assignedOperatorContact: `ciso-remediation@${prop.entityName.toLowerCase().replace(/[^a-z0-9]/g, '')}.gov.national`,
      assignedSupervisor: 'Dir. Samuel Vance',
      statutoryDeadline: deadlineStr,
      automatedRemindersEnabled: true,
      progressPercent: 0,
      requiredEvidence: prop.requiredProof,
    });

    setDeployedProposals((prev) => ({ ...prev, [prop.id]: true }));
    addToast('success', 'Remediation Proposal Deployed', `Directive issued to ${prop.entityName}. Statutory SLA deadline set to ${deadlineStr}.`);
  };

  // Filter 30-day data based on selected timeRange
  const trendData = React.useMemo(() => {
    if (timeRange === '7d') return THIRTY_DAY_HISTORICAL_RISK_TREND.slice(-7);
    if (timeRange === '14d') return THIRTY_DAY_HISTORICAL_RISK_TREND.slice(-14);
    return THIRTY_DAY_HISTORICAL_RISK_TREND;
  }, [timeRange]);

  // Donut chart data for risk distribution
  const riskDistributionData = [
    { name: 'High Risk (Score ≥ 70)', value: highRiskEntities.length, color: '#EF4444' },
    { name: 'Medium Risk (40 - 69)', value: mediumRiskEntities.length, color: '#F59E0B' },
    { name: 'Low Risk (< 40)', value: lowRiskEntities.length, color: '#10B981' },
  ];

  // Top 5 High Risk Entities sorted by riskScore descending
  const topHighRiskEntities = [...entities]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  // Recent Critical / High findings
  const recentFindings = [...findings]
    .sort((a, b) => (b.severity === 'Critical' ? 1 : -1))
    .slice(0, 4);

  // 30-day delta metrics
  const startPoint = trendData[0];
  const endPoint = trendData[trendData.length - 1];
  const riskDelta = +(endPoint.aggregateRisk - startPoint.aggregateRisk).toFixed(1);

  // Compute live offline supervisory analytics metrics across all entities
  const analyticsList = React.useMemo(() => Array.from(entityAnalyticsMap.values()), [entityAnalyticsMap]);
  const totalExecutionGaps = analyticsList.reduce((acc, a) => acc + a.executionGapsCount, 0);
  const totalSilentAssets = analyticsList.reduce((acc, a) => acc + a.silentAssetsCount, 0);
  const totalAnomalies = analyticsList.reduce((acc, a) => acc + a.anomaliesCount, 0);
  const avgEscalationRate = analyticsList.length
    ? Math.round(
        (analyticsList.reduce((acc, a) => acc + a.criticalEscalationRate, 0) / analyticsList.length) * 100
      )
    : 62;

  return (
    <div className="space-y-6">
      {/* Top Banner / Supervisory Context */}
      <div className="bg-slate-900 text-white rounded-xl p-5 md:p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              NATIONAL CYBER OVERSIGHT
            </span>
            <span className="text-xs text-slate-400">Quarterly Assessment Cycle 2026-Q3</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Critical Sector SOC Supervisory Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl">
            Real-time analytics evaluating SOC posture, telemetry gaps, and unmitigated exposure across banking, energy, telecommunications, and maritime transport.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAdvisorOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-blue-900/30 cursor-pointer"
            title="Launch AI Risk Advisor Chat"
          >
            <Sparkles size={14} className="text-amber-300 animate-pulse" />
            <span>Risk Advisor (AI)</span>
          </button>
          <button
            onClick={() => setIsAnalyticsInspectorOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white border border-indigo-500/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Inspect Mathematical Formulation & Outliers (PS 26157)"
          >
            <Calculator size={14} className="text-indigo-200" />
            Math Engine
          </button>
          <button
            onClick={() =>
              openExportModal({
                type: 'bundle',
                filterLabel: 'Overview Dashboard Full Air-Gapped Export',
              })
            }
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Export Air-Gapped Audit Bundle to JSON/CSV"
          >
            <Download size={14} />
            Air-Gap Export
          </button>
          <button
            onClick={() => setActivePage('priority-queue')}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Clock size={14} />
            Review Queue ({needingAttention.length})
          </button>
        </div>
      </div>

      {/* Supervisory Analytics Mathematical Formulation & Outlier Banner (PS 26157) */}
      <div className="p-4 sm:p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-blue-50/70 dark:from-indigo-950/40 dark:via-slate-900/80 dark:to-blue-950/40 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
              <Calculator className="w-3 h-3" />
              OFFLINE SUPERVISORY ANALYTICS ENGINE
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Problem Statement 26157 (NCIIPC/NTRO National Framework)
            </span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Operational Evidence Evaluation: Execution Gaps & Negative Space Detection
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl">
            Mathematical model identifies triage velocity manipulation, template investigation entropy, silent critical SCADA assets, and statistical anomalies without reliance on external cloud APIs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900/90 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">EXECUTION GAPS:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{totalExecutionGaps} alerts</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block">SILENT ASSETS:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{totalSilentAssets} blind</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block">ESCALATION AVG:</span>
              <span className={`font-bold ${avgEscalationRate < 40 ? 'text-orange-500' : 'text-emerald-500'}`}>{avgEscalationRate}%</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAnalyticsInspectorOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Calculator size={14} />
            <span>Inspect Math & Formulas</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Entities */}
        <div
          onClick={() => setActivePage('entity-risk')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Monitored Entities
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition-colors">
              <Building2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {totalEntities}
            </span>
            <span className="text-xs text-slate-500">Critical Sectors</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>7 Core Infrastructure Sectors</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium group-hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* Card 2: High Risk Entities */}
        <div
          onClick={() => setActivePage('entity-risk')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900/50 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
              High Risk Entities
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {highRiskEntities.length}
            </span>
            <span className="text-xs text-rose-600/80 font-medium">
              ({Math.round((highRiskEntities.length / totalEntities) * 100)}% of total)
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Composite Risk Score ≥ 70</span>
            <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-0.5">
              Urgent Oversight <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* Card 3: Total Findings */}
        <div
          onClick={() => setActivePage('findings')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Active Findings & Gaps
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {findings.length}
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {criticalFindings.length} Critical
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Execution gaps & negative space</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium group-hover:underline flex items-center gap-0.5">
              Explore <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* Card 4: Entities Needing Attention */}
        <div
          onClick={() => setActivePage('priority-queue')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900/50 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Priority Review Queue
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
              {needingAttention.length}
            </span>
            <span className="text-xs text-slate-500">Entities Awaiting Review</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>SLA breach triggers active</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium group-hover:underline flex items-center gap-0.5">
              Inspect Queue <ChevronRight size={12} />
            </span>
          </div>
        </div>
      </div>

      {/* Fleet Compliance Score Gauge with 30-Day Sparkline */}
      <ComplianceScoreGauge score={78.4} />

      {/* NEW: Supervisory Regulatory Compliance & Remediation Workflow Hub */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-5 md:p-6 rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <ShieldCheck size={12} />
                STATUTORY FRAMEWORK ENGINE
              </span>
              <span className="text-xs text-slate-400">NIST CSF 2.0 · ISO 27001 · NIST SP 800-82 · CISA CPGs</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight">
              Regulatory Compliance & Corrective Remediation Engine
            </h2>
            <p className="text-xs md:text-sm text-slate-400">
              Map monitored entity risks to mandatory cybersecurity controls, issue binding directives for identified gaps, and track automated deadline reminders across the fleet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActivePage('compliance')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <ShieldCheck size={15} />
              <span>Audit Controls ({nonCompliantControls} Gaps)</span>
            </button>
            <button
              onClick={() => setActivePage('remediation')}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Layers size={15} />
              <span>Remediation Pipeline ({pendingRemediations} Active)</span>
            </button>
          </div>
        </div>

        {/* 4 Quick Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="text-[11px] text-slate-400 font-medium">Active Frameworks</div>
            <div className="text-lg font-bold font-mono text-blue-400 mt-0.5">4 Standards</div>
            <div className="text-[10px] text-slate-400 mt-0.5">NIST CSF, ISO, OT, CISA</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="text-[11px] text-slate-400 font-medium">Controls Monitored</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">{complianceControls.length} Controls</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Across 12 Critical Entities</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="text-[11px] text-slate-400 font-medium">Identified Deficiencies</div>
            <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">{nonCompliantControls} Gaps</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Statutory Action Required</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="text-[11px] text-slate-400 font-medium">Active Remediation Tasks</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">{pendingRemediations} Directives</div>
            <div className="text-[10px] text-slate-400 mt-0.5">With Automated Reminders</div>
          </div>
        </div>
      </div>

      {/* NEW: 30-Day Longitudinal Risk Trajectory Across Critical Sectors */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                LONGITUDINAL TELEMETRY
              </span>
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
              <span className="text-xs text-slate-500">
                30-Day Historical Trend Analysis (Aug 30 – Sep 28, 2026)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Aggregate Risk Score Trajectory Across Critical Infrastructure Sectors
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl mt-0.5">
              Continuous monitoring showing the escalation from nominal baseline to heightened oversight state driven by recent SCADA DMZ packet drops and identity anomalies.
            </p>
          </div>

          {/* Interactive Mode & Timeline Switchers */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setTrendView('aggregate')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  trendView === 'aggregate'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Aggregate Risk
              </button>
              <button
                onClick={() => setTrendView('sectors')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  trendView === 'sectors'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sector Breakdown
              </button>
              <button
                onClick={() => setTrendView('volume')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  trendView === 'volume'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                High-Risk Volatility
              </button>
            </div>

            {/* Time Window Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
              {(['7d', '14d', '30d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    timeRange === r
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Longitudinal Diagnostic Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">30-Day Composite Drift</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                {endPoint.aggregateRisk}
              </span>
              <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-bold flex items-center">
                <TrendingUp size={12} className="mr-0.5" />
                +{riskDelta} pts
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">Baseline was {startPoint.aggregateRisk}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Highest Velocity Sector</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
                Power & Energy
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">
              66.2 / 100 (+8.2 pts in 30d)
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">High-Risk Entity Count</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                {endPoint.highRiskCount} Entities
              </span>
              <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-medium">
                (+2 new)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">MCP-01, ANB-04, TTC-02, PML-08, NHI-12</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Active Deficiencies</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                {endPoint.criticalFindingsActive} Findings
              </span>
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-medium">
                (Double vs 30d ago)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">12 open execution gaps unaddressed</span>
          </div>
        </div>

        {/* The Historical Recharts Canvas */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {trendView === 'aggregate' ? (
              <AreaChart data={trendData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="aggregateRiskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.15} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickMargin={8} />
                <YAxis domain={[45, 75]} stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-lg shadow-xl text-xs space-y-1.5 max-w-xs">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-mono text-slate-400 text-[11px]">
                            <span>{data.fullDate} ({data.date})</span>
                            <span className="text-blue-400 font-bold">N=12 Critical</span>
                          </div>
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-slate-300">Composite Risk Score:</span>
                            <span className="text-base font-bold text-blue-400">{data.aggregateRisk} / 100</span>
                          </div>
                          <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                            <div className="flex justify-between">
                              <span>Power & Energy:</span>
                              <span className="text-rose-400">{data.powerEnergyRisk}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Banking & Finance:</span>
                              <span className="text-blue-300">{data.bankingFinanceRisk}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Entities in High Risk:</span>
                              <span className="text-amber-300 font-semibold">{data.highRiskCount}</span>
                            </div>
                          </div>
                          {data.milestoneEvent && (
                            <div className="mt-1 pt-1.5 border-t border-slate-800/80 text-[11px] text-amber-300 font-sans flex items-start gap-1">
                              <Zap size={12} className="shrink-0 mt-0.5 text-amber-400" />
                              <span>{data.milestoneEvent}</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={70}
                  stroke="#EF4444"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{
                    value: 'Critical Oversight Threshold (70)',
                    fill: '#EF4444',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <ReferenceLine
                  y={60}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                  label={{
                    value: 'Medium Warning Zone (60)',
                    fill: '#F59E0B',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="aggregateRisk"
                  name="National Composite Risk Score"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#aggregateRiskGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : trendView === 'sectors' ? (
              <LineChart data={trendData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.15} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickMargin={8} />
                <YAxis domain={[40, 80]} stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="powerEnergyRisk"
                  name="Power & Energy"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="healthcareRisk"
                  name="Healthcare Spine"
                  stroke="#EC4899"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="transportRisk"
                  name="Transportation Logistics"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="bankingFinanceRisk"
                  name="Banking & Finance"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="telecomRisk"
                  name="Telecommunications"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            ) : (
              <BarChart data={trendData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.15} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickMargin={8} />
                <YAxis yAxisId="left" domain={[0, 8]} stroke="#94A3B8" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" domain={[40, 75]} stroke="#3B82F6" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="highRiskCount"
                  name="Entities in High Risk Tier"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="aggregateRisk"
                  name="Composite Risk Average"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Milestone Chronological Badges */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <Activity size={13} className="text-blue-500" />
            Key Supervisory Triggers Over 30-Day Assessment Window
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { date: 'Sep 08', tag: 'PML-08', desc: 'Port crane wireless bridge lost sensor tap', color: 'text-amber-600 dark:text-amber-400' },
              { date: 'Sep 12', tag: 'MCP-01', desc: 'SCADA DMZ syslog buffer overflows detected', color: 'text-rose-600 dark:text-rose-400' },
              { date: 'Sep 20', tag: 'ANB-04', desc: 'Weekend analyst staffing deficit (412 alerts)', color: 'text-amber-600 dark:text-amber-400' },
              { date: 'Sep 26', tag: 'MCP-01', desc: '840% rule suppression wave in Splunk ES', color: 'text-rose-600 dark:text-rose-400' },
            ].map((m, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px]"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-mono text-slate-400">{m.date}</span>
                  <span className="font-mono font-bold text-[10px] px-1 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {m.tag}
                  </span>
                </div>
                <p className={`font-medium ${m.color} line-clamp-1`}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Geographical Risk Heat Map */}
      <GeographicalHeatMap
        onSelectEntity={(ent) => {
          setSelectedEntity(ent);
          setActivePage('entity-risk');
        }}
      />

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Risk Distribution Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Risk Distribution Matrix
              </h2>
              <span className="text-[11px] font-mono text-slate-400">N=12</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Entity breakdown according to composite supervisory risk threshold
            </p>
          </div>

          <div className="h-56 relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {totalEntities}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Entities
              </span>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
            {riskDistributionData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span>{d.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {d.value} ({Math.round((d.value / totalEntities) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 cols: Top 5 High Risk Entities */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-600 dark:text-rose-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Top Critical Sector Entities Needing Attention
                </h2>
              </div>
              <button
                onClick={() => setActivePage('entity-risk')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                All Entities <ArrowUpRight size={13} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prioritized by risk score, telemetry blind spots, and open execution gaps
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 my-3">
            {topHighRiskEntities.map((entity, idx) => (
              <div
                key={entity.id}
                onClick={() => setSelectedEntity(entity)}
                className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-xs font-mono font-bold text-slate-400 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {entity.name}
                      </span>
                      {entity.otEnvironmentPresent && (
                        <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          OT/ICS
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{entity.sector}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{entity.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>MTTD: {entity.mttdMinutes}m</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {entity.totalFindings} findings
                    </span>
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 block font-mono">
                      {entity.criticalFindings} critical
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-sm md:text-base font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                        {entity.riskScore}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/100</span>
                    </div>
                    <RiskBadge level={entity.riskLevel} size="sm" showIcon={false} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Score formula combines MITRE gap, MTTD latency, and active CVE vectors</span>
            <span className="font-mono text-blue-600 dark:text-blue-400">Threshold: ≥ 70 High</span>
          </div>
        </div>
      </div>

      {/* NEW: Automated Remediation Proposals Cards */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Wrench size={16} />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                PRESCRIPTIVE OVERSIGHT
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-500">Algorithmic Remediation Engine</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Automated Remediation Proposals
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specific security patches, firmware updates, and mandatory policy covenants generated from high-risk telemetry gaps and vulnerabilities.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium shrink-0">
            {[
              { id: 'ALL', label: 'All Proposals' },
              { id: 'PATCH', label: 'Security Patches' },
              { id: 'POLICY', label: 'Policy Updates' },
              { id: 'TELEMETRY', label: 'Telemetry Directives' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setProposalTypeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  proposalTypeFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Proposals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProposals.map((prop) => {
            const isDeployed = !!deployedProposals[prop.id];

            return (
              <div
                key={prop.id}
                className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col justify-between space-y-4 ${
                  isDeployed
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50/60 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          prop.urgency === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            : prop.urgency === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {prop.urgency} REMEDIATION
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {prop.patchId}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Expected Impact: {prop.riskReduction}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {prop.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{prop.entityName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{prop.sector}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    {prop.summary}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-400">CVE / Vector:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{prop.cveCode}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-400">Control Target:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{prop.controlCode}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Clock size={12} />
                    <span>Statutory Deadline: {prop.statutoryDays} Days SLA</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const targetFinding = findings.find((f) => f.id === prop.findingId);
                        if (targetFinding) setSelectedFinding(targetFinding);
                        else setActivePage('findings');
                      }}
                      className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded font-medium transition-colors"
                    >
                      View Evidence →
                    </button>

                    {isDeployed ? (
                      <span className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 size={13} />
                        Directive Dispatched
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeployProposal(prop)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Wrench size={13} />
                        Deploy Directive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Recent Critical Findings & Quick Actions */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Critical Supervisory Findings
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Immediate inspection triggers detected across ingest pipeline feeds
            </p>
          </div>
          <button
            onClick={() => setActivePage('findings')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
          >
            Findings Explorer <ArrowUpRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentFindings.map((f) => (
            <div
              key={f.id}
              className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <RiskBadge level={f.severity} size="sm" />
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {f.category}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{f.detectionDate}</span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                  {f.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {f.entityName}
                </span>
                <button
                  onClick={() => setSelectedFinding(f)}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded transition-colors whitespace-nowrap"
                >
                  View Evidence →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
