import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RemediationTask } from '../types';
import {
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Send,
  Bell,
  BellOff,
  FileCheck,
  Upload,
  PlusCircle,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  Shield,
  Building2,
  ArrowUpRight,
  Check,
  X,
  FileText,
  FileCode,
  Hash,
  Sparkles,
} from 'lucide-react';

export const RemediationWorkflow: React.FC = () => {
  const {
    remediationTasks,
    addRemediationTask,
    updateRemediationTaskStatus,
    sendTaskReminder,
    toggleTaskAutomatedReminders,
    submitTaskEvidence,
    entities,
    navigateToEntity,
    navigateToCompliance,
    selectedRemediationTask,
    setSelectedRemediationTask,
    addToast,
    logAuditEvent,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | RemediationTask['status']>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string>('');

  // Form states
  const [newTaskForm, setNewTaskForm] = useState({
    entityId: '',
    controlCode: '',
    title: '',
    description: '',
    priority: 'HIGH' as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
    deadline: '',
    operatorContact: '',
    requiredEvidence: '',
    automatedRemindersEnabled: true,
  });

  const [evidenceForm, setEvidenceForm] = useState({
    fileName: '',
    notes: '',
  });

  const [verificationNotes, setVerificationNotes] = useState('');

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = remediationTasks.length;
    const pending = remediationTasks.filter((t) => t.status === 'Pending').length;
    const inProgress = remediationTasks.filter((t) => t.status === 'In-Progress').length;
    const verificationRequested = remediationTasks.filter((t) => t.status === 'Verification Requested').length;
    const verifiedClosed = remediationTasks.filter((t) => t.status === 'Verified Closed').length;
    const criticalCount = remediationTasks.filter(
      (t) => (t.priority === 'CRITICAL' || t.priority === 'HIGH') && t.status !== 'Verified Closed'
    ).length;

    return {
      total,
      pending,
      inProgress,
      verificationRequested,
      verifiedClosed,
      criticalCount,
    };
  }, [remediationTasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return remediationTasks.filter((task) => {
      if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
      if (sectorFilter !== 'ALL' && task.sector !== sectorFilter) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matches =
          task.id.toLowerCase().includes(q) ||
          task.title.toLowerCase().includes(q) ||
          task.entityName.toLowerCase().includes(q) ||
          (task.controlCode && task.controlCode.toLowerCase().includes(q)) ||
          task.assignedOperatorContact.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [remediationTasks, statusFilter, priorityFilter, sectorFilter, searchQuery]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const ent = entities.find((x) => x.id === newTaskForm.entityId) || entities[0];
    if (!ent) return;

    addRemediationTask({
      entityId: ent.id,
      entityName: ent.name,
      sector: ent.sector,
      controlCode: newTaskForm.controlCode || undefined,
      title: newTaskForm.title,
      description: newTaskForm.description,
      priority: newTaskForm.priority,
      status: 'Pending',
      assignedOperatorContact: newTaskForm.operatorContact,
      assignedSupervisor: 'Dir. Samuel Vance',
      statutoryDeadline: newTaskForm.deadline,
      automatedRemindersEnabled: newTaskForm.automatedRemindersEnabled,
      progressPercent: 0,
      requiredEvidence: newTaskForm.requiredEvidence,
    });

    setCreateModalOpen(false);
  };

  const handleOpenEvidenceModal = (taskId: string) => {
    setActiveTaskId(taskId);
    setEvidenceForm({
      fileName: 'telemetry_remediation_evidence.pdf',
      notes: 'Automated syslog proof and cryptographic configuration validation cert.',
    });
    setEvidenceModalOpen(true);
  };

  const handleSubmitEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskId) return;

    submitTaskEvidence(activeTaskId, {
      fileName: evidenceForm.fileName,
      notes: evidenceForm.notes,
    });

    setEvidenceModalOpen(false);
  };

  const handleOpenVerifyModal = (taskId: string) => {
    setActiveTaskId(taskId);
    setVerificationNotes(
      'Reviewed and confirmed evidence payload against statutory audit requirements. Technical deficiency closed.'
    );
    setVerifyModalOpen(true);
  };

  const handleConfirmVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskId) return;

    updateRemediationTaskStatus(activeTaskId, 'Verified Closed', verificationNotes);
    setVerifyModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-500/30">
              <Layers size={24} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Remediation Workflow Engine</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Assign corrective directives to monitored entities for identified gaps, track real-time remediation status, and verify evidence.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigateToCompliance()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors shadow-xs"
          >
            <Shield size={16} className="text-blue-400" />
            Regulatory Frameworks
          </button>
          <button
            onClick={() => {
              const defaultEntity = entities[0];
              const defaultDate = new Date();
              defaultDate.setDate(defaultDate.getDate() + 21);
              setNewTaskForm({
                entityId: defaultEntity?.id || '',
                controlCode: 'NIST-PR.AC-01',
                title: 'Enforce Dual-Factor Cryptographic Hardware Authentication',
                description: 'Deploy mandatory FIDO2 hardware tokens and disable legacy basic authentication on all administrative supervisory consoles.',
                priority: 'HIGH',
                deadline: defaultDate.toISOString().split('T')[0],
                operatorContact: `ciso-ops@${defaultEntity?.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.gov.national`,
                requiredEvidence: 'Group Policy dump, hardware token deployment receipts, and sample audit challenge logs.',
                automatedRemindersEnabled: true,
              });
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle size={16} />
            Assign Remediation Task
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Tasks */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Corrective Tasks
            </span>
            <span className="p-1.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <Clock size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {metrics.pending + metrics.inProgress + metrics.verificationRequested}
            </span>
            <span className="text-xs text-slate-500">of {metrics.total} total issued</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {metrics.pending} Pending · {metrics.inProgress} In-Progress
          </div>
        </div>

        {/* Verification Pending */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Awaiting Supervisor Sign-Off
            </span>
            <span className="p-1.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
              <FileCheck size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {metrics.verificationRequested}
            </span>
            <span className="text-xs text-slate-500">evidence filed</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Cryptographic proof uploaded by entity operators awaiting audit clearance.
          </p>
        </div>

        {/* Critical & High Priority Gaps */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Critical Priority Gaps
            </span>
            <span className="p-1.5 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg">
              <ShieldAlert size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {metrics.criticalCount}
            </span>
            <span className="text-xs text-slate-500">active SLA risks</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">High-severity gaps with statutory non-compliance penalties.</p>
        </div>

        {/* Verified Closed */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Verified & Closed
            </span>
            <span className="p-1.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {metrics.verifiedClosed}
            </span>
            <span className="text-xs text-slate-500">completed remediation cycles</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Validated by supervisory inspection with immutable audit trail.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          {[
            { id: 'ALL', label: 'All Tasks', count: metrics.total },
            { id: 'Pending', label: 'Pending', count: metrics.pending },
            { id: 'In-Progress', label: 'In-Progress', count: metrics.inProgress },
            { id: 'Verification Requested', label: 'Verification Requested', count: metrics.verificationRequested },
            { id: 'Verified Closed', label: 'Verified Closed', count: metrics.verifiedClosed },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Dropdowns */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Task ID (REM-001), directive title, entity, or operator contact..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="ALL">All Sectors</option>
              <option value="Power & Energy">Power & Energy</option>
              <option value="Banking & Finance">Banking & Finance</option>
              <option value="Water & Dams">Water & Dams</option>
              <option value="Healthcare & Public Health">Healthcare & Public Health</option>
              <option value="Transportation">Transportation</option>
              <option value="Government Services">Government Services</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800">
            <Layers size={40} className="mx-auto text-slate-400 mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">No Remediation Tasks Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              There are currently no tasks matching the selected filters.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCritical = task.priority === 'CRITICAL';
            const isHigh = task.priority === 'HIGH';

            return (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-shadow hover:shadow-md space-y-4"
              >
                {/* Header Row: Task ID, Priority, Entity, Control, Due Date */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-extrabold text-sm px-2.5 py-0.5 rounded bg-slate-900 text-white dark:bg-blue-600">
                      {task.id}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
                          : isHigh
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <button
                      onClick={() => navigateToEntity(task.entityId)}
                      className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 flex items-center gap-1.5"
                    >
                      <Building2 size={13} className="text-slate-400" />
                      {task.entityName}
                    </button>
                    <span className="text-xs text-slate-400 font-medium">({task.sector})</span>

                    {task.controlCode && (
                      <button
                        onClick={() => navigateToCompliance(undefined, task.controlCode)}
                        className="text-xs text-blue-600 dark:text-blue-400 font-mono hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900"
                      >
                        Control {task.controlCode} <ExternalLink size={10} />
                      </button>
                    )}
                  </div>

                  {/* Deadline & Days Remaining Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={13} />
                      Deadline: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{task.statutoryDeadline}</span>
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        task.status === 'Verified Closed'
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : task.daysRemaining <= 3
                          ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 animate-pulse'
                          : task.daysRemaining <= 10
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {task.status === 'Verified Closed'
                        ? 'Completed'
                        : task.daysRemaining === 0
                        ? 'Due Today!'
                        : `${task.daysRemaining} days left`}
                    </span>
                  </div>
                </div>

                {/* Directive Title & Technical Details */}
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{task.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {task.description}
                  </p>
                </div>

                {/* Workflow Stepper Status Bar */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-slate-500">
                      Remediation Pipeline State
                    </span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      Progress: {task.progressPercent}%
                    </span>
                  </div>

                  {/* 4-Step Visual Track */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'Pending', label: '1. Pending' },
                      { key: 'In-Progress', label: '2. In-Progress' },
                      { key: 'Verification Requested', label: '3. Evidence Filed' },
                      { key: 'Verified Closed', label: '4. Verified Closed' },
                    ].map((step, idx) => {
                      const stepOrder = ['Pending', 'In-Progress', 'Verification Requested', 'Verified Closed'];
                      const currentIdx = stepOrder.indexOf(task.status);
                      const isPast = idx < currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div
                          key={step.key}
                          className={`text-center py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all border ${
                            isCurrent
                              ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                              : isPast
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-200/60 dark:bg-slate-700 text-slate-500 border-transparent'
                          }`}
                        >
                          {step.label}
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        task.status === 'Verified Closed'
                          ? 'bg-emerald-500'
                          : task.progressPercent >= 70
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${task.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Evidence & Automated Reminders Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                  {/* Evidence Vault */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <FileCheck size={14} className="text-blue-500" />
                        Verification Proof Vault
                      </span>
                      <button
                        onClick={() => handleOpenEvidenceModal(task.id)}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-medium rounded flex items-center gap-1 transition-colors"
                      >
                        <Upload size={12} />
                        Upload Proof
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Mandatory Evidence:</span>{' '}
                      {task.requiredEvidence}
                    </div>

                    {task.submittedEvidence && task.submittedEvidence.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        {task.submittedEvidence.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-1"
                          >
                            <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-semibold">
                              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                <FileCode size={13} />
                                {ev.fileName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{ev.submittedAt}</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 truncate">
                              <Hash size={11} className="shrink-0" />
                              <span className="truncate">{ev.hash}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                              "{ev.notes}"
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded text-center text-slate-400 text-[11px]">
                        No evidence filed yet. Entity operator must upload proof to transition status.
                      </div>
                    )}

                    {task.verificationNotes && (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 rounded text-[11px] text-emerald-800 dark:text-emerald-300">
                        <span className="font-bold">Supervisor Sign-Off Note:</span> {task.verificationNotes}
                      </div>
                    )}
                  </div>

                  {/* Automated Reminder Pipeline & Operator Contact */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Bell size={14} className="text-amber-500" />
                        Statutory Reminders
                      </span>
                      <button
                        onClick={() => toggleTaskAutomatedReminders(task.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                          task.automatedRemindersEnabled
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        {task.automatedRemindersEnabled ? (
                          <>
                            <Bell size={12} /> Auto-Cadence ON
                          </>
                        ) : (
                          <>
                            <BellOff size={12} /> Paused
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Recipient Contact:</span>{' '}
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                        {task.assignedOperatorContact}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>
                        Reminders Transmitted:{' '}
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">
                          {task.reminderCount}
                        </strong>
                      </span>
                      {task.lastReminderSent && (
                        <span>Last Sent: {task.lastReminderSent}</span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <button
                        onClick={() => sendTaskReminder(task.id)}
                        disabled={task.status === 'Verified Closed'}
                        className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Send size={12} />
                        Transmit Instant Statutory Reminder
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Actions: Status Transition & Verification */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Manual Status Override:</span>
                    <select
                      value={task.status}
                      onChange={(e) => updateRemediationTaskStatus(task.id, e.target.value as any)}
                      className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Verification Requested">Verification Requested</option>
                      <option value="Verified Closed">Verified Closed</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status === 'Verification Requested' && (
                      <button
                        onClick={() => handleOpenVerifyModal(task.id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Check size={14} />
                        Approve & Mark Verified Closed
                      </button>
                    )}

                    {task.status === 'Pending' && (
                      <button
                        onClick={() => updateRemediationTaskStatus(task.id, 'In-Progress')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
                      >
                        Move to In-Progress
                      </button>
                    )}

                    <button
                      onClick={() => navigateToEntity(task.entityId)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                      View Entity Profile <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Create Remediation Task */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500 rounded-lg text-slate-900 font-bold">
                  <Layers size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-base">Issue Remediation Directive</h3>
                  <p className="text-xs text-slate-400">
                    Assign a structured gap-closure task with automated reminders
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Target Sovereign Entity
                </label>
                <select
                  value={newTaskForm.entityId}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, entityId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 font-medium"
                  required
                >
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.sector})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Regulatory Control Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={newTaskForm.controlCode}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, controlCode: e.target.value })}
                    placeholder="e.g. NIST PR.AC-01 or ISO-A.8.15"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Directive Priority
                  </label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Action)</option>
                    <option value="HIGH">HIGH (14–30 Day SLA)</option>
                    <option value="MEDIUM">MEDIUM (Standard Cycle)</option>
                    <option value="LOW">LOW (Informational)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Directive Title
                </label>
                <input
                  type="text"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Detailed Remediation Directive
                </label>
                <textarea
                  rows={3}
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Statutory Deadline
                  </label>
                  <input
                    type="date"
                    value={newTaskForm.deadline}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, deadline: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Operator Contact Email
                  </label>
                  <input
                    type="text"
                    value={newTaskForm.operatorContact}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, operatorContact: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Required Evidence Proof
                </label>
                <input
                  type="text"
                  value={newTaskForm.requiredEvidence}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, requiredEvidence: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoReminders"
                  checked={newTaskForm.automatedRemindersEnabled}
                  onChange={(e) =>
                    setNewTaskForm({ ...newTaskForm, automatedRemindersEnabled: e.target.checked })
                  }
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <label htmlFor="autoReminders" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Enable automated reminders leading up to statutory deadline
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg shadow-xs"
                >
                  Issue Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Submit Verification Evidence */}
      {evidenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Upload size={16} className="text-blue-400" />
                Upload Remediation Evidence Proof
              </h3>
              <button
                onClick={() => setEvidenceModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEvidence} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Proof File Name / Artifact
                </label>
                <input
                  type="text"
                  value={evidenceForm.fileName}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, fileName: e.target.value })}
                  placeholder="e.g. syslog_forwarding_audit_report.pdf"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Operator Attestation & Configuration Notes
                </label>
                <textarea
                  rows={3}
                  value={evidenceForm.notes}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, notes: e.target.value })}
                  placeholder="Describe test results, patch version, or configuration changes implemented..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="p-3 bg-blue-50/60 dark:bg-slate-800/60 rounded-lg border border-blue-100 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">
                A cryptographic SHA-256 fingerprint will be generated and signed into the immutable compliance ledger.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEvidenceModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Verify & Close Task */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-900 text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-300" />
                Supervisory Verification Sign-Off
              </h3>
              <button
                onClick={() => setVerifyModalOpen(false)}
                className="text-emerald-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmVerification} className="p-5 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                You are executing formal supervisory sign-off for directive <strong>{activeTaskId}</strong>. The gap will be certified closed and logged in the immutable audit ledger.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Supervisory Attestation Notes
                </label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg"
                >
                  Confirm & Certify Closed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
