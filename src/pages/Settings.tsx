import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Mail,
  Shield,
  Building2,
  CheckCircle2,
  Sliders,
  Send,
  Save,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Filter,
  Radio,
  FileCheck2,
  Lock,
  Layers,
  ChevronRight,
  Check,
  RotateCcw,
  Database,
  Download,
  Calculator,
} from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';

export const Settings: React.FC = () => {
  const {
    entities,
    notificationConfig,
    updateNotificationConfig,
    toggleEntitySubscription,
    updateEntityOverride,
    sendTestNotification,
    addToast,
    currentUser,
    setActivePage,
    dbStats,
    exportSqliteDump,
    resetDatabaseToDefaults,
    recalculateAllEntityScores,
    lockStation,
  } = useApp();

  // Local form state
  const [enabled, setEnabled] = useState(notificationConfig.enabled);
  const [recipientEmail, setRecipientEmail] = useState(notificationConfig.recipientEmail);
  const [secondaryEmail, setSecondaryEmail] = useState(notificationConfig.secondaryEmail);
  const [deliveryMode, setDeliveryMode] = useState(notificationConfig.deliveryMode);
  const [notifyOnCriticalFindings, setNotifyOnCriticalFindings] = useState(
    notificationConfig.notifyOnCriticalFindings
  );
  const [notifyOnRiskScoreJump, setNotifyOnRiskScoreJump] = useState(
    notificationConfig.notifyOnRiskScoreJump
  );
  const [riskScoreThreshold, setRiskScoreThreshold] = useState(
    notificationConfig.riskScoreThreshold
  );
  const [notifyOnSlaBreach, setNotifyOnSlaBreach] = useState(
    notificationConfig.notifyOnSlaBreach
  );
  const [notifyOnOtTampering, setNotifyOnOtTampering] = useState(
    notificationConfig.notifyOnOtTampering
  );

  const [entityFilter, setEntityFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');

  const sectors = ['All', ...Array.from(new Set(entities.map((e) => e.sector)))];

  const filteredEntities = entities.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(entityFilter.toLowerCase()) ||
      e.code.toLowerCase().includes(entityFilter.toLowerCase());
    const matchesSector = sectorFilter === 'All' || e.sector === sectorFilter;
    return matchesSearch && matchesSector;
  });

  const handleSaveAll = () => {
    updateNotificationConfig({
      enabled,
      recipientEmail,
      secondaryEmail,
      deliveryMode,
      notifyOnCriticalFindings,
      notifyOnRiskScoreJump,
      riskScoreThreshold,
      notifyOnSlaBreach,
      notifyOnOtTampering,
    });
  };

  const handleSelectAllEntities = () => {
    updateNotificationConfig({
      subscribedEntityIds: entities.map((e) => e.id),
    });
    addToast('info', 'Subscribed to All Entities', 'You will receive notifications for all 12 critical sector entities.');
  };

  const handleClearAllEntities = () => {
    updateNotificationConfig({
      subscribedEntityIds: [],
    });
    addToast('info', 'All Subscriptions Cleared', 'Entity-specific notification subscriptions removed.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              SUPERVISORY PROFILE & NOTIFICATIONS
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold font-mono flex items-center gap-1">
              <Lock size={12} /> Station Verified
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Notification & Alert Subscriptions
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Configure automated regulatory email notifications for critical telemetry gaps, emergency SLA escalations, and high-risk status transitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={sendTestNotification}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Send size={13} />
            Send Test Alert
          </button>
          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Save size={14} />
            Save Preferences
          </button>
        </div>
      </div>

      {/* Supervisor Credentials & Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-bold text-xl ring-4 ring-slate-100 dark:ring-slate-800 shrink-0">
            {currentUser?.avatarInitials || 'SV'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentUser?.name || 'Dir. Samuel Vance'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-semibold uppercase">
                {currentUser?.clearanceLevel || 'LEVEL 4'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentUser?.role || 'National Cyber Security Directorate Lead'} · {currentUser?.dutyStation}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500 font-mono">
              <span>Terminal: {currentUser?.terminalId || '#04'}</span>
              <span aria-hidden="true">·</span>
              <span>Badge: {currentUser?.badgeNumber || 'NCSC-4091'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Audit Logging: Enforced
              </span>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => setActivePage('auth')}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Switch Account / Login →
              </button>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1 self-stretch md:self-auto min-w-[220px]">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">
            Active Subscriptions
          </span>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-slate-700 dark:text-slate-300">Entities Monitored:</span>
            <strong className="text-blue-600 dark:text-blue-400 text-sm">
              {notificationConfig.subscribedEntityIds.length} of {entities.length}
            </strong>
          </div>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-slate-700 dark:text-slate-300">Notification Engine:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {enabled ? 'ACTIVE' : 'MUTED'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Email Configuration & Triggers (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Email Delivery Options */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Automated Delivery Setup
                </h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Primary Supervisory Email:
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="name@cyber.gov.national"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Secondary Watch Desk Email (Optional):
                </label>
                <input
                  type="email"
                  value={secondaryEmail}
                  onChange={(e) => setSecondaryEmail(e.target.value)}
                  placeholder="watchdesk@ncsc.gov.internal"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1 pt-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Dispatch Cadence:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'INSTANT', label: 'Instant Dispatch', desc: 'Real-time alert per critical trigger event' },
                    { id: 'HOURLY_BATCH', label: 'Hourly Triage Digest', desc: 'Batched summary of all triggers per hour' },
                    { id: 'DAILY_DIGEST', label: 'Daily Briefing (08:00 UTC)', desc: 'Consolidated report with risk shifts' },
                  ].map((cad) => (
                    <label
                      key={cad.id}
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                        deliveryMode === cad.id
                          ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryCadence"
                        value={cad.id}
                        checked={deliveryMode === cad.id}
                        onChange={() => setDeliveryMode(cad.id as any)}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-semibold block">{cad.label}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{cad.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Global Alert Triggers */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  National Threshold Triggers
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">POLICY AU-4</span>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyOnCriticalFindings}
                  onChange={(e) => setNotifyOnCriticalFindings(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Critical Severity Findings Detected
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Immediately notify on unapproved alert suppressions, unlogged SCADA gateways, or credential escalations.
                  </span>
                </div>
              </label>

              <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnRiskScoreJump}
                    onChange={(e) => setNotifyOnRiskScoreJump(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Entity Risk Score Exceeds Threshold
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Trigger alert when composite score crosses designated high-risk boundary.
                    </span>
                  </div>
                </label>

                {notifyOnRiskScoreJump && (
                  <div className="pl-6 pt-1 flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Alert Threshold: <strong className="font-mono text-rose-600 dark:text-rose-400 font-bold">{riskScoreThreshold} / 100</strong>
                    </span>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      step="5"
                      value={riskScoreThreshold}
                      onChange={(e) => setRiskScoreThreshold(Number(e.target.value))}
                      className="w-36 accent-blue-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyOnSlaBreach}
                  onChange={(e) => setNotifyOnSlaBreach(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    SLA Escalation Queue Overdue (&gt; 72 Hours)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Notify when triage queue items remain unreviewed within statutory response windows.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyOnOtTampering}
                  onChange={(e) => setNotifyOnOtTampering(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    OT/SCADA Boundary Telemetry Blindness
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Immediate notification if any Level 2/3 industrial control system perimeter drops log forwarding.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Air-Gapped IndexedDB SQLite Mirror Management Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  IndexedDB SQLite Mirror Storage
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                AIR-GAPPED
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              All entities, supervisory findings, remediation workflows, and raw SOC telemetry persist locally in browser IndexedDB, mirroring a production SQLite database without cloud egress.
            </p>

            {dbStats && (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 block">ENTITIES:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{dbStats.entitiesCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">FINDINGS:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{dbStats.findingsCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">REMEDIATIONS:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{dbStats.remediationTasksCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">SOC ALERTS:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{dbStats.rawAlertsCount}</span>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={exportSqliteDump}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} />
                <span>Export SQLite Schema & Data (.sql)</span>
              </button>

              <button
                type="button"
                onClick={() => recalculateAllEntityScores()}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calculator size={14} className="text-indigo-500" />
                <span>Recalculate Scores via Math.js</span>
              </button>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetDatabaseToDefaults}
                  className="flex-1 py-2 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg font-semibold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Reset all IndexedDB tables back to initial baseline data"
                >
                  <RotateCcw size={12} />
                  <span>Reset DB to Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={lockStation}
                  className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Lock current station session"
                >
                  <Lock size={12} />
                  <span>Lock Station</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Per-Entity Subscriptions & Dispatched Alerts (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Entity Subscriptions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={15} className="text-blue-600 dark:text-blue-400" />
                  Entity-Specific Alert Subscriptions
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select specific critical sector operators to receive targeted email updates
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllEntities}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                >
                  Subscribe All
                </button>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                <button
                  onClick={handleClearAllEntities}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Filter toolbar */}
            <div className="p-3 bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter entities by name or code..."
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-700 dark:text-slate-200"
              >
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Entities List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto">
              {filteredEntities.map((entity) => {
                const isSubscribed = notificationConfig.subscribedEntityIds.includes(entity.id);
                const overrides = notificationConfig.entityOverrides[entity.id] || {
                  criticalFindings: true,
                  highRiskTransition: true,
                  slaBreaches: true,
                };

                return (
                  <div
                    key={entity.id}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isSubscribed
                        ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/50'
                        : 'bg-slate-50/50 dark:bg-slate-950/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSubscribed}
                        onChange={() => toggleEntitySubscription(entity.id)}
                        className="mt-1 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Toggle email alerts for this entity"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {entity.name}
                          </span>
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {entity.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{entity.sector}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">Risk {entity.riskScore}</span>
                          <span aria-hidden="true">·</span>
                          <RiskBadge level={entity.riskLevel} size="sm" showIcon={false} />
                        </div>
                      </div>
                    </div>

                    {/* Fine-grained Trigger Badges for this entity */}
                    {isSubscribed ? (
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          onClick={() =>
                            updateEntityOverride(entity.id, {
                              criticalFindings: !overrides.criticalFindings,
                            })
                          }
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            overrides.criticalFindings
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
                              : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 line-through'
                          }`}
                          title="Alert on Critical Findings"
                        >
                          Critical
                        </button>

                        <button
                          onClick={() =>
                            updateEntityOverride(entity.id, {
                              highRiskTransition: !overrides.highRiskTransition,
                            })
                          }
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            overrides.highRiskTransition
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900'
                              : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 line-through'
                          }`}
                          title="Alert on High-Risk Status Change"
                        >
                          Risk &gt; 70
                        </button>

                        <button
                          onClick={() =>
                            updateEntityOverride(entity.id, {
                              slaBreaches: !overrides.slaBreaches,
                            })
                          }
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            overrides.slaBreaches
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900'
                              : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 line-through'
                          }`}
                          title="Alert on SLA Escalation Breaches"
                        >
                          SLA
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400 self-end sm:self-center">
                        Muted
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Dispatched Alerts Ledger */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Recent Dispatched Email Notifications
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                SMTP RELAY ACTIVE
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {notificationConfig.recentDispatchedAlerts.map((alert) => (
                <div key={alert.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {alert.subject}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold shrink-0">
                        {alert.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Entity: <strong className="text-slate-700 dark:text-slate-300">{alert.entityName}</strong> · Trigger: <span className="font-mono text-rose-600 dark:text-rose-400">{alert.triggerType}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">
                    {alert.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
