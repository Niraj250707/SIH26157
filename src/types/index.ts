export type SectorType =
  | 'Banking & Finance'
  | 'Power & Energy'
  | 'Telecommunications'
  | 'Transportation'
  | 'Healthcare & Public Health'
  | 'Water & Dams'
  | 'Government Services';

export type RiskLevel = 'High' | 'Medium' | 'Low';

export type FindingCategory = 'Execution Gaps' | 'Negative Space' | 'Anomalies';

export type FindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type GeographicRegion =
  | 'Northern Energy & Grid Region'
  | 'Eastern Financial & Maritime Belt'
  | 'Central Federal & Sovereign Zone'
  | 'Southern Industrial & Telecom Corridor'
  | 'Western Continental Logistics Sector';

export interface Entity {
  id: string;
  name: string;
  code: string;
  sector: SectorType;
  region: GeographicRegion;
  coordinates: { x: number; y: number; label: string };
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  socCoveragePercent: number;
  mttdMinutes: number; // Mean time to detect
  mttrHours: number; // Mean time to respond
  logRetentionDays: number;
  activeAnalysts: number;
  mitreCoveragePercent: number;
  lastUpdated: string;
  supervisoryStatus: 'Under Enhanced Oversight' | 'Periodic Review' | 'Nominal' | 'Directive Issued';
  description: string;
  otEnvironmentPresent: boolean;
  scoreHistory: { date: string; score: number }[];
}

export interface Finding {
  id: string;
  entityId: string;
  entityName: string;
  sector: SectorType;
  title: string;
  category: FindingCategory;
  severity: FindingSeverity;
  description: string;
  detectionDate: string;
  status: 'Open' | 'Under Investigation' | 'Remediation Proposed' | 'Verified Closed';
  mitreTechnique: string;
  impactedSystems: string[];
  evidenceData: {
    logSource: string;
    sampleLog: string;
    observedTelemetryGap: string;
    supervisoryBenchmark: string;
    regulatoryClause: string;
    remediationDeadline: string;
  };
}

export interface PriorityItem {
  id: string;
  rank: number;
  entityId: string;
  entityName: string;
  sector: SectorType;
  reason: string;
  severity: FindingSeverity;
  daysInQueue: number;
  slaRemainingDays: number;
  status: 'Pending Review' | 'Reviewed' | 'Escalated to Directive';
  assignedSupervisor: string;
  notes?: string;
}

export interface PeerMetrics {
  dimension: string;
  entityValue: number;
  sectorAvg: number;
  topQuartile: number;
  unit: string;
  higherIsBetter: boolean;
}

export interface UploadedDataset {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  recordCount: number;
  status: 'Validated' | 'Validation Failed' | 'Integrated';
  entitiesDetected: number;
  schemaVersion: string;
  errorsCount: number;
  parsedSummary?: {
    avgRiskScore: number;
    newFindingsIdentified: number;
    criticalGapsCount: number;
  };
}

export type AuditActionType =
  | 'DATA_UPLOAD'
  | 'DATA_INTEGRATION'
  | 'REPORT_GENERATION'
  | 'STATUS_UPDATE'
  | 'SUPERVISORY_ESCALATION'
  | 'EVIDENCE_EXPORT'
  | 'INSPECTION_NOTE_ADDED'
  | 'PRIORITY_REVIEW';

export type AuditCategory =
  | 'Data Ingestion'
  | 'Reporting'
  | 'Supervisory Action'
  | 'Compliance & Security';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: AuditActionType;
  category: AuditCategory;
  targetType: 'Entity' | 'Finding' | 'Report' | 'Dataset' | 'PriorityQueue';
  targetId: string;
  targetName: string;
  details: string;
  ipAddress: string;
  integrityHash: string; // SHA-256 simulation
  complianceStatus: 'VERIFIED' | 'RECORDED';
}

export interface ThirtyDayTrendPoint {
  date: string;
  fullDate: string;
  aggregateRisk: number;
  powerEnergyRisk: number;
  bankingFinanceRisk: number;
  telecomRisk: number;
  transportRisk: number;
  healthcareRisk: number;
  highRiskCount: number;
  criticalFindingsActive: number;
  milestoneEvent?: string;
}

export interface SupervisorNotificationConfig {
  recipientEmail: string;
  secondaryEmail: string;
  enabled: boolean;
  deliveryMode: 'INSTANT' | 'DAILY_DIGEST' | 'HOURLY_BATCH';
  notifyOnCriticalFindings: boolean;
  notifyOnRiskScoreJump: boolean;
  riskScoreThreshold: number;
  notifyOnSlaBreach: boolean;
  notifyOnOtTampering: boolean;
  subscribedEntityIds: string[];
  entityOverrides: Record<string, {
    criticalFindings: boolean;
    highRiskTransition: boolean;
    slaBreaches: boolean;
  }>;
  recentDispatchedAlerts: {
    id: string;
    timestamp: string;
    entityName: string;
    triggerType: string;
    subject: string;
    status: 'SENT' | 'QUEUED';
  }[];
}

export interface DeviceAsset {
  id: string;
  assetTag: string;
  name: string;
  deviceType: string;
  entityId: string;
  entityName: string;
  sector: SectorType;
  region: GeographicRegion;
  ipAddress: string;
  macAddress: string;
  operatingSystem: string;
  firmwareVersion: string;
  telemetryStatus: 'HEALTHY' | 'DEGRADED' | 'BLIND' | 'OFFLINE';
  riskScore: number;
  openVulnerabilities: number;
  criticalCves: string[];
  lastTelemetryPing: string;
  complianceState: 'COMPLIANT' | 'NON_COMPLIANT' | 'EXEMPT';
  zone: 'IT Corporate' | 'OT Supervisory L2/L3' | 'DMZ Perimeter' | 'Cloud Edge';
}

export interface ComplianceTrendPoint {
  day: number;
  date: string;
  score: number;
  telemetryCompliance: number;
  slaCompliance: number;
  mitreCoverageCompliance: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  clearanceLevel: 'LEVEL 4 - DIRECTORATE' | 'LEVEL 3 - SENIOR INSPECTOR' | 'LEVEL 2 - AUDITOR';
  dutyStation: string;
  badgeNumber: string;
  terminalId: string;
  avatarInitials: string;
  lastLogin: string;
  isLoggedIn: boolean;
}

export type RegulatoryFramework =
  | 'NIST CSF 2.0'
  | 'ISO/IEC 27001:2022'
  | 'NIST SP 800-82 (OT/ICS)'
  | 'CISA CPGs 1.0';

export interface ComplianceControl {
  id: string;
  code: string;
  framework: RegulatoryFramework;
  functionDomain: string;
  title: string;
  description: string;
  mandatoryTier: 'CRITICAL_MANDATORY' | 'STATUTORY_REQUIRED' | 'RECOMMENDED_STANDARD';
  mappedFindingIds: string[];
  entitiesAssessment: {
    entityId: string;
    entityName: string;
    sector: SectorType;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'PENDING_AUDIT';
    telemetryScore: number;
    deficiencySummary?: string;
    lastAudited: string;
  }[];
}

export interface RemediationTask {
  id: string;
  findingId?: string;
  controlCode?: string;
  entityId: string;
  entityName: string;
  sector: SectorType;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'Pending' | 'In-Progress' | 'Verification Requested' | 'Verified Closed';
  assignedOperatorContact: string;
  assignedSupervisor: string;
  statutoryDeadline: string;
  daysRemaining: number;
  reminderCount: number;
  lastReminderSent?: string;
  automatedRemindersEnabled: boolean;
  progressPercent: number;
  requiredEvidence: string;
  submittedEvidence?: {
    id: string;
    fileName: string;
    submittedAt: string;
    hash: string;
    notes: string;
  }[];
  verificationNotes?: string;
  createdAt: string;
}

export type PageId =
  | 'overview'
  | 'entity-risk'
  | 'findings'
  | 'priority-queue'
  | 'peer-comparison'
  | 'compliance'
  | 'remediation'
  | 'devices'
  | 'reports'
  | 'upload'
  | 'audit-logs'
  | 'settings'
  | 'auth';

export interface RawSOCAlert {
  alert_id: string;
  entity_id: string;
  entity_name: string;
  sector: SectorType;
  timestamp: string;
  category: string;
  severity: FindingSeverity;
  asset_id: string;
  closure_time_minutes: number;
  escalated: 'Yes' | 'No';
  status: 'Closed' | 'Open' | 'Escalated';
  is_execution_gap: boolean;
  is_anomaly: boolean;
  anomaly_score?: number;
}

export interface SOCCaseRecord {
  case_id: string;
  alert_id: string;
  entity_id: string;
  entity_name: string;
  investigation_time_minutes: number;
  notes_template_flag: 'Template' | 'Custom Detailed';
  investigation_notes: string;
  outcome: 'Remediated' | 'Suppressed / False Positive' | 'Escalated to Tier-3' | 'Pending Review';
  analyst_id: string;
}

export interface SupervisoryWeightsConfig {
  baseline: number;
  executionGapWeight: number;
  executionGapMultiplier: number;
  negativeSpaceWeight: number;
  negativeSpaceMultiplier: number;
  lowEscalationPenalty: number;
  escalationThreshold: number;
  anomalyWeight: number;
  anomalyMultiplier: number;
  fastClosureThresholdMinutes: number;
}

export interface EntitySupervisoryAnalytics {
  entityId: string;
  entityName: string;
  sector: SectorType;
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  executionGapsCount: number;
  fastClosuresCount: number;
  templateNotesRatio: number;
  criticalEscalationRate: number;
  silentAssetsCount: number;
  silentAssetIds: string[];
  volumeDeficit: number;
  anomaliesCount: number;
  closureTimeStats: {
    mean: number;
    median: number;
    stdDev: number;
    iqr: number;
    q1: number;
    q3: number;
    min: number;
    max: number;
  };
  zScoreClosureVelocity: number;
  zScoreVolume: number;
  compositeRiskScore: number;
  riskLevel: RiskLevel;
  confidenceInterval: { lower: number; upper: number };
  scoreBreakdown: {
    baseline: number;
    executionGapPoints: number;
    negativeSpacePoints: number;
    escalationPenaltyPoints: number;
    anomalyPoints: number;
    total: number;
  };
  explainability: {
    what: string;
    why: string;
    evidence: string[];
  };
}

export interface AirgapExportResult {
  fileName: string;
  recordCount: number;
  fileSizeBytes: number;
  integrityHash: string;
  timestamp: string;
  classification: string;
  format: 'json' | 'csv' | 'zip';
}

