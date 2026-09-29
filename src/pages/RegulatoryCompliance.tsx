import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  RegulatoryFramework,
  ComplianceControl,
  SectorType,
} from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  PlusCircle,
  Download,
  Building2,
  RefreshCw,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
  X,
} from 'lucide-react';

const FRAMEWORKS: { id: RegulatoryFramework; title: string; subtitle: string; icon: string; standardBody: string }[] = [
  {
    id: 'NIST CSF 2.0',
    title: 'NIST CSF 2.0',
    subtitle: 'Cybersecurity Framework for Critical Infrastructure',
    icon: '🏛️',
    standardBody: 'National Institute of Standards and Technology',
  },
  {
    id: 'ISO/IEC 27001:2022',
    title: 'ISO/IEC 27001:2022',
    subtitle: 'Information Security Management System & Annex A Controls',
    icon: '🌐',
    standardBody: 'International Organization for Standardization',
  },
  {
    id: 'NIST SP 800-82 (OT/ICS)',
    title: 'NIST SP 800-82 Rev 3',
    subtitle: 'Industrial Control Systems & SCADA Security Standard',
    icon: '⚡',
    standardBody: 'NIST Computer Security Division',
  },
  {
    id: 'CISA CPGs 1.0',
    title: 'CISA Cross-Sector CPGs',
    subtitle: 'Cybersecurity Performance Goals for Sovereign Assets',
    icon: '🛡️',
    standardBody: 'Cybersecurity & Infrastructure Security Agency',
  },
];

export const RegulatoryCompliance: React.FC = () => {
  const {
    complianceControls,
    selectedFramework,
    setSelectedFramework,
    selectedControl,
    setSelectedControl,
    updateControlEntityAssessment,
    addRemediationTask,
    entities,
    navigateToEntity,
    navigateToFinding,
    navigateToRemediation,
    addToast,
    logAuditEvent,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | ComplianceControl['mandatoryTier']>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DEFICIENCIES_ONLY' | 'COMPLIANT_ONLY'>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [expandedControlIds, setExpandedControlIds] = useState<Record<string, boolean>>({
    'ctrl-001': true,
    'ctrl-006': true,
  });

  // Modal for quick task assignment
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    controlCode: '',
    entityId: '',
    title: '',
    description: '',
    priority: 'HIGH' as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
    deadline: '',
    operatorContact: '',
    requiredEvidence: '',
  });

  // Modal for editing control entity assessment
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditForm, setAuditForm] = useState({
    controlId: '',
    entityId: '',
    status: 'COMPLIANT' as 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'PENDING_AUDIT',
    deficiencySummary: '',
  });

  // Controls for current selected framework
  const frameworkControls = useMemo(() => {
    return complianceControls.filter((c) => c.framework === selectedFramework);
  }, [complianceControls, selectedFramework]);

  // Framework metrics
  const metrics = useMemo(() => {
    const totalControls = frameworkControls.length;
    let totalAssessments = 0;
    let compliantCount = 0;
    let nonCompliantCount = 0;
    let partialCount = 0;
    let pendingCount = 0;
    let criticalMandatoryDeficiencies = 0;

    frameworkControls.forEach((ctrl) => {
      ctrl.entitiesAssessment.forEach((ea) => {
        totalAssessments++;
        if (ea.status === 'COMPLIANT') compliantCount++;
        else if (ea.status === 'NON_COMPLIANT') {
          nonCompliantCount++;
          if (ctrl.mandatoryTier === 'CRITICAL_MANDATORY') criticalMandatoryDeficiencies++;
        } else if (ea.status === 'PARTIAL') {
          partialCount++;
        } else if (ea.status === 'PENDING_AUDIT') {
          pendingCount++;
        }
      });
    });

    const fleetComplianceRate =
      totalAssessments > 0 ? Math.round(((compliantCount + partialCount * 0.5) / totalAssessments) * 100) : 0;

    return {
      totalControls,
      totalAssessments,
      compliantCount,
      nonCompliantCount,
      partialCount,
      pendingCount,
      criticalMandatoryDeficiencies,
      fleetComplianceRate,
    };
  }, [frameworkControls]);

  // Filtered controls list
  const filteredControls = useMemo(() => {
    return frameworkControls.filter((ctrl) => {
      // Search
      const matchesSearch =
        searchQuery === '' ||
        ctrl.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ctrl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ctrl.functionDomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ctrl.entitiesAssessment.some((ea) => ea.entityName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Tier filter
      if (tierFilter !== 'ALL' && ctrl.mandatoryTier !== tierFilter) return false;

      // Status filter
      if (statusFilter === 'DEFICIENCIES_ONLY') {
        const hasDeficiency = ctrl.entitiesAssessment.some(
          (ea) => ea.status === 'NON_COMPLIANT' || ea.status === 'PARTIAL'
        );
        if (!hasDeficiency) return false;
      } else if (statusFilter === 'COMPLIANT_ONLY') {
        const allCompliant = ctrl.entitiesAssessment.every((ea) => ea.status === 'COMPLIANT');
        if (!allCompliant) return false;
      }

      // Sector filter
      if (sectorFilter !== 'ALL') {
        const hasSector = ctrl.entitiesAssessment.some((ea) => ea.sector === sectorFilter);
        if (!hasSector) return false;
      }

      return true;
    });
  }, [frameworkControls, searchQuery, tierFilter, statusFilter, sectorFilter]);

  const toggleExpand = (id: string) => {
    setExpandedControlIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenAssignModal = (ctrl: ComplianceControl, entityId?: string) => {
    const defaultEntity = entityId ? entities.find((e) => e.id === entityId) : entities[0];
    const targetEntityId = defaultEntity?.id || entities[0]?.id || '';
    const targetEntityName = defaultEntity?.name || entities[0]?.name || '';

    // Set 30 days default deadline
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    const dateStr = defaultDate.toISOString().split('T')[0];

    setAssignForm({
      controlCode: ctrl.code,
      entityId: targetEntityId,
      title: `Remediate ${ctrl.code}: ${ctrl.title}`,
      description: `Mandatory regulatory remediation required to satisfy ${ctrl.framework} control ${ctrl.code} (${ctrl.functionDomain}). Operator must demonstrate adherence to: "${ctrl.description}".`,
      priority: ctrl.mandatoryTier === 'CRITICAL_MANDATORY' ? 'CRITICAL' : 'HIGH',
      deadline: dateStr,
      operatorContact: `security-operations@${targetEntityName.toLowerCase().replace(/[^a-z0-9]/g, '')}.gov.national`,
      requiredEvidence: 'System audit logs, configuration diffs, and verification signature from Entity CISO.',
    });
    setAssignModalOpen(true);
  };

  const handleSaveRemediationTask = (e: React.FormEvent) => {
    e.preventDefault();
    const ent = entities.find((x) => x.id === assignForm.entityId);
    if (!ent) return;

    addRemediationTask({
      controlCode: assignForm.controlCode,
      entityId: ent.id,
      entityName: ent.name,
      sector: ent.sector,
      title: assignForm.title,
      description: assignForm.description,
      priority: assignForm.priority,
      status: 'Pending',
      assignedOperatorContact: assignForm.operatorContact,
      assignedSupervisor: 'Dir. Samuel Vance',
      statutoryDeadline: assignForm.deadline,
      automatedRemindersEnabled: true,
      progressPercent: 0,
      requiredEvidence: assignForm.requiredEvidence,
    });

    setAssignModalOpen(false);
  };

  const handleOpenAuditModal = (
    controlId: string,
    entityId: string,
    currentStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'PENDING_AUDIT',
    currentDeficiency?: string
  ) => {
    setAuditForm({
      controlId,
      entityId,
      status: currentStatus,
      deficiencySummary: currentDeficiency || '',
    });
    setAuditModalOpen(true);
  };

  const handleSaveAudit = (e: React.FormEvent) => {
    e.preventDefault();
    updateControlEntityAssessment(
      auditForm.controlId,
      auditForm.entityId,
      auditForm.status,
      auditForm.deficiencySummary
    );
    setAuditModalOpen(false);
  };

  const exportFrameworkAuditReport = () => {
    const lines = [
      `REGULATORY COMPLIANCE AUDIT DOSSIER - SAT-SA SUPERVISORY ENGINE`,
      `Framework: ${selectedFramework}`,
      `Generated: ${new Date().toISOString()}`,
      `Fleet Compliance Rate: ${metrics.fleetComplianceRate}%`,
      `Total Controls Audited: ${metrics.totalControls}`,
      `Critical Mandatory Deficiencies: ${metrics.criticalMandatoryDeficiencies}`,
      ``,
      `========================================================================`,
      `CONTROL AUDIT DETAILS`,
      `========================================================================`,
    ];

    frameworkControls.forEach((ctrl) => {
      lines.push(`\n[${ctrl.code}] ${ctrl.title} (${ctrl.mandatoryTier})`);
      lines.push(`Domain: ${ctrl.functionDomain}`);
      lines.push(`Description: ${ctrl.description}`);
      lines.push(`Entity Evaluations:`);
      ctrl.entitiesAssessment.forEach((ea) => {
        lines.push(
          `  - ${ea.entityName} [${ea.sector}]: ${ea.status} (Telemetry: ${ea.telemetryScore}/100) | Deficiencies: ${ea.deficiencySummary || 'None'}`
        );
      });
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SAT-SA_Regulatory_Audit_${selectedFramework.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logAuditEvent({
      action: 'REPORT_GENERATION',
      category: 'Reporting',
      targetType: 'Report',
      targetId: 'rpt-compliance-audit',
      targetName: `Regulatory Audit Dossier: ${selectedFramework}`,
      details: `Generated and exported compliance audit ledger for ${selectedFramework}.`,
    });

    addToast('success', 'Compliance Dossier Exported', `Audit record for ${selectedFramework} generated and downloaded.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-600/30 rounded-lg text-blue-400 border border-blue-500/30">
              <ShieldCheck size={24} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Regulatory Compliance & Frameworks</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Map entity telemetry and operational risks against mandatory statutory standards (NIST CSF 2.0, ISO 27001, OT/ICS SP 800-82, CISA CPGs).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigateToRemediation()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors shadow-xs"
          >
            <Layers size={16} className="text-amber-400" />
            Remediation Workflow
          </button>
          <button
            onClick={exportFrameworkAuditReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Download size={16} />
            Export Audit Dossier
          </button>
        </div>
      </div>

      {/* Framework Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {FRAMEWORKS.map((fw) => {
          const isSelected = selectedFramework === fw.id;
          const fwCount = complianceControls.filter((c) => c.framework === fw.id).length;
          return (
            <button
              key={fw.id}
              onClick={() => setSelectedFramework(fw.id)}
              className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-blue-500 text-white shadow-md ring-2 ring-blue-500/20 dark:bg-slate-800'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-blue-400/50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                  <div className="bg-blue-500 text-[10px] text-white font-bold py-0.5 text-center transform rotate-45 translate-x-4 translate-y-2 w-20 shadow-xs">
                    ACTIVE
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{fw.icon}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                      isSelected
                        ? 'bg-blue-500/30 text-blue-300 border border-blue-400/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {fwCount} Controls
                  </span>
                </div>
                <h3 className="font-bold text-base tracking-tight">{fw.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{fw.subtitle}</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate">{fw.standardBody}</span>
                <span className="font-semibold text-blue-400 flex items-center gap-1">
                  Select <ArrowRight size={12} />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* KPI Overview Cards for Active Framework */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Fleet Compliance Rate
            </span>
            <span
              className={`p-1.5 rounded-lg text-xs font-bold ${
                metrics.fleetComplianceRate >= 80
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : metrics.fleetComplianceRate >= 60
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}
            >
              {metrics.fleetComplianceRate}%
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {metrics.fleetComplianceRate}%
            </span>
            <span className="text-xs text-slate-500">of statutory benchmarks</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.fleetComplianceRate >= 80
                  ? 'bg-emerald-500'
                  : metrics.fleetComplianceRate >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${metrics.fleetComplianceRate}%` }}
            />
          </div>
        </div>

        {/* Critical Non-Compliances */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Critical Mandatory Gaps
            </span>
            <span className="p-1.5 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg">
              <ShieldAlert size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {metrics.criticalMandatoryDeficiencies}
            </span>
            <span className="text-xs text-slate-500">urgent directives pending</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Non-compliant assessments on Tier-1 statutory mandatory controls.
          </p>
        </div>

        {/* Compliant Assessments */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Fully Compliant Controls
            </span>
            <span className="p-1.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {metrics.compliantCount}
            </span>
            <span className="text-xs text-slate-500">of {metrics.totalAssessments} entity evaluations</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Validated via telemetry proof and cryptographic evidence.</p>
        </div>

        {/* Partial & In-Remediation */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Partial / In Remediation
            </span>
            <span className="p-1.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
              <Clock size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {metrics.partialCount}
            </span>
            <span className="text-xs text-slate-500">transitional states</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Active remediation milestones tracked in supervisory pipeline.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by control code (e.g., PR.AC-01, OT.NET-01), domain, title, or entity..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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

          {/* Tier Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Mandatory Tiers</option>
              <option value="CRITICAL_MANDATORY">Critical Mandatory</option>
              <option value="STATUTORY_REQUIRED">Statutory Required</option>
              <option value="RECOMMENDED_STANDARD">Recommended Standard</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Compliance States</option>
              <option value="DEFICIENCIES_ONLY">Has Gaps / Deficiencies Only</option>
              <option value="COMPLIANT_ONLY">Fully Compliant Only</option>
            </select>

            {/* Sector Filter */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Critical Sectors</option>
              <option value="Power & Energy">Power & Energy</option>
              <option value="Banking & Finance">Banking & Finance</option>
              <option value="Water & Dams">Water & Dams</option>
              <option value="Healthcare & Public Health">Healthcare & Public Health</option>
              <option value="Transportation">Transportation</option>
              <option value="Government Services">Government Services</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div>
            Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredControls.length}</span>{' '}
            of {frameworkControls.length} controls for standard{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedFramework}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Partial Gap
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Non-Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Controls List Accordion */}
      <div className="space-y-4">
        {filteredControls.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800">
            <ShieldCheck size={40} className="mx-auto text-slate-400 mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">No Controls Matching Filters</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Try clearing your search query or adjusting the tier and sector filter options.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setTierFilter('ALL');
                setStatusFilter('ALL');
                setSectorFilter('ALL');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredControls.map((ctrl) => {
            const isExpanded = !!expandedControlIds[ctrl.id];
            const nonCompliantEntities = ctrl.entitiesAssessment.filter((ea) => ea.status === 'NON_COMPLIANT');
            const partialEntities = ctrl.entitiesAssessment.filter((ea) => ea.status === 'PARTIAL');
            const compliantEntities = ctrl.entitiesAssessment.filter((ea) => ea.status === 'COMPLIANT');
            const totalAssessed = ctrl.entitiesAssessment.length;

            return (
              <div
                key={ctrl.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-shadow hover:shadow-md"
              >
                {/* Control Header Card */}
                <div
                  onClick={() => toggleExpand(ctrl.id)}
                  className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5">
                      {nonCompliantEntities.length > 0 ? (
                        <span className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg inline-block border border-rose-500/20">
                          <ShieldAlert size={20} />
                        </span>
                      ) : partialEntities.length > 0 ? (
                        <span className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg inline-block border border-amber-500/20">
                          <AlertTriangle size={20} />
                        </span>
                      ) : (
                        <span className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg inline-block border border-emerald-500/20">
                          <CheckCircle2 size={20} />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-sm bg-slate-200 dark:bg-slate-700 px-2.5 py-0.5 rounded text-slate-800 dark:text-slate-100">
                          {ctrl.code}
                        </span>
                        <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          {ctrl.functionDomain}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            ctrl.mandatoryTier === 'CRITICAL_MANDATORY'
                              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
                              : ctrl.mandatoryTier === 'STATUTORY_REQUIRED'
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {ctrl.mandatoryTier === 'CRITICAL_MANDATORY'
                            ? 'CRITICAL MANDATORY'
                            : ctrl.mandatoryTier === 'STATUTORY_REQUIRED'
                            ? 'STATUTORY REQUIRED'
                            : 'RECOMMENDED STANDARD'}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">{ctrl.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {ctrl.description}
                      </p>
                    </div>
                  </div>

                  {/* Summary Pills & Expand Indicator */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {compliantEntities.length} OK
                        </span>
                        {partialEntities.length > 0 && (
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {partialEntities.length} Partial
                          </span>
                        )}
                        {nonCompliantEntities.length > 0 && (
                          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20">
                            {nonCompliantEntities.length} Gaps
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {totalAssessed} Critical Entities Mapped
                      </span>
                    </div>

                    <button
                      type="button"
                      className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-200 dark:border-slate-800 space-y-5 bg-white dark:bg-slate-900">
                    {/* Control Context Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-blue-50/50 dark:bg-slate-800/60 rounded-lg border border-blue-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="font-semibold text-blue-700 dark:text-blue-400">
                          Full Statutory Standard Requirement:
                        </span>{' '}
                        {ctrl.description}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ctrl.mappedFindingIds && ctrl.mappedFindingIds.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Linked Findings:</span>
                            {ctrl.mappedFindingIds.map((fId) => (
                              <button
                                key={fId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToFinding(fId);
                                }}
                                className="font-mono text-[11px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-blue-600 dark:text-blue-300 rounded hover:underline flex items-center gap-1"
                              >
                                {fId} <ExternalLink size={10} />
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => handleOpenAssignModal(ctrl)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <PlusCircle size={14} />
                          Assign Remediation Task
                        </button>
                      </div>
                    </div>

                    {/* Entity Assessment Table */}
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                        Monitored Entity Assessments ({ctrl.entitiesAssessment.length} Critical Sovereign Operators)
                      </h5>
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">Entity Name</th>
                              <th className="py-2.5 px-3">Sector</th>
                              <th className="py-2.5 px-3">Compliance Status</th>
                              <th className="py-2.5 px-3">Telemetry Score</th>
                              <th className="py-2.5 px-3">Deficiency Summary & Evidence</th>
                              <th className="py-2.5 px-3">Last Audited</th>
                              <th className="py-2.5 px-3 text-right">Supervisory Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {ctrl.entitiesAssessment.map((ea) => {
                              return (
                                <tr
                                  key={ea.entityId}
                                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                  {/* Entity Name */}
                                  <td className="py-3 px-3 font-medium">
                                    <button
                                      onClick={() => navigateToEntity(ea.entityId)}
                                      className="text-slate-900 dark:text-white font-semibold hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5"
                                    >
                                      <Building2 size={14} className="text-slate-400" />
                                      {ea.entityName}
                                    </button>
                                  </td>

                                  {/* Sector */}
                                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                                    {ea.sector}
                                  </td>

                                  {/* Status */}
                                  <td className="py-3 px-3">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                                        ea.status === 'COMPLIANT'
                                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                          : ea.status === 'NON_COMPLIANT'
                                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                                          : ea.status === 'PARTIAL'
                                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      {ea.status === 'COMPLIANT' && <CheckCircle2 size={12} />}
                                      {ea.status === 'NON_COMPLIANT' && <ShieldAlert size={12} />}
                                      {ea.status === 'PARTIAL' && <Clock size={12} />}
                                      {ea.status === 'PENDING_AUDIT' && <HelpCircle size={12} />}
                                      {ea.status.replace('_', ' ')}
                                    </span>
                                  </td>

                                  {/* Telemetry Score */}
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`font-mono font-bold ${
                                          ea.telemetryScore >= 80
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : ea.telemetryScore >= 60
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-rose-600 dark:text-rose-400'
                                        }`}
                                      >
                                        {ea.telemetryScore}%
                                      </span>
                                      <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full ${
                                            ea.telemetryScore >= 80
                                              ? 'bg-emerald-500'
                                              : ea.telemetryScore >= 60
                                              ? 'bg-amber-500'
                                              : 'bg-rose-500'
                                          }`}
                                          style={{ width: `${ea.telemetryScore}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>

                                  {/* Deficiency Summary */}
                                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs">
                                    {ea.deficiencySummary ? (
                                      <span
                                        className={
                                          ea.status === 'NON_COMPLIANT'
                                            ? 'text-rose-700 dark:text-rose-300 font-medium'
                                            : ''
                                        }
                                      >
                                        {ea.deficiencySummary}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic">No deficiencies recorded</span>
                                    )}
                                  </td>

                                  {/* Last Audited */}
                                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                                    {ea.lastAudited}
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {ea.status !== 'COMPLIANT' && (
                                        <button
                                          onClick={() => handleOpenAssignModal(ctrl, ea.entityId)}
                                          title="Assign Remediation Task"
                                          className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded border border-amber-300/40"
                                        >
                                          <PlusCircle size={14} />
                                        </button>
                                      )}
                                      <button
                                        onClick={() =>
                                          handleOpenAuditModal(
                                            ctrl.id,
                                            ea.entityId,
                                            ea.status,
                                            ea.deficiencySummary
                                          )
                                        }
                                        title="Update Assessment"
                                        className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded border border-slate-300/40"
                                      >
                                        <RefreshCw size={14} />
                                      </button>
                                      <button
                                        onClick={() => navigateToEntity(ea.entityId)}
                                        title="View Entity Dossier"
                                        className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 rounded border border-blue-300/40"
                                      >
                                        <ExternalLink size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Assign Remediation Task */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-600 rounded-lg text-white">
                  <ShieldAlert size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-base">Assign Remediation Task</h3>
                  <p className="text-xs text-slate-400">
                    Issue formal statutory directive to resolve control gap ({assignForm.controlCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRemediationTask} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Target Critical Entity
                </label>
                <select
                  value={assignForm.entityId}
                  onChange={(e) => setAssignForm({ ...assignForm, entityId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                >
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.sector})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={assignForm.title}
                  onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Directive Priority
                  </label>
                  <select
                    value={assignForm.priority}
                    onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Action)</option>
                    <option value="HIGH">HIGH (14–30 Day SLA)</option>
                    <option value="MEDIUM">MEDIUM (Standard Cycle)</option>
                    <option value="LOW">LOW (Informational)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Statutory Deadline
                  </label>
                  <input
                    type="date"
                    value={assignForm.deadline}
                    onChange={(e) => setAssignForm({ ...assignForm, deadline: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Assigned Operator Contact (Entity Point-of-Contact)
                </label>
                <input
                  type="text"
                  value={assignForm.operatorContact}
                  onChange={(e) => setAssignForm({ ...assignForm, operatorContact: e.target.value })}
                  placeholder="e.g., security-team@entity.gov.national"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Detailed Directive / Remediation Instructions
                </label>
                <textarea
                  rows={3}
                  value={assignForm.description}
                  onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Required Proof / Verification Evidence Specifications
                </label>
                <input
                  type="text"
                  value={assignForm.requiredEvidence}
                  onChange={(e) => setAssignForm({ ...assignForm, requiredEvidence: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-xs"
                >
                  Dispatch Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Update Control Assessment */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <RefreshCw size={16} className="text-blue-400" />
                Update Entity Control Assessment
              </h3>
              <button
                onClick={() => setAuditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAudit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Compliance Assessment State
                </label>
                <select
                  value={auditForm.status}
                  onChange={(e) => setAuditForm({ ...auditForm, status: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="COMPLIANT">COMPLIANT (Full standard adherence)</option>
                  <option value="PARTIAL">PARTIAL (Transitional / Mitigated)</option>
                  <option value="NON_COMPLIANT">NON_COMPLIANT (Deficiency identified)</option>
                  <option value="PENDING_AUDIT">PENDING_AUDIT (Audit in progress)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Deficiency Summary / Supervisory Notes
                </label>
                <textarea
                  rows={3}
                  value={auditForm.deficiencySummary}
                  onChange={(e) => setAuditForm({ ...auditForm, deficiencySummary: e.target.value })}
                  placeholder="Detail telemetry findings, non-conformity reasons, or verification sign-off notes..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAuditModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg"
                >
                  Update Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
