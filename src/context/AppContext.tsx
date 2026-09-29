import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Entity,
  Finding,
  PriorityItem,
  UploadedDataset,
  PageId,
  AuditLogEntry,
  AuditActionType,
  AuditCategory,
  SupervisorNotificationConfig,
  UserAccount,
  RegulatoryFramework,
  ComplianceControl,
  RemediationTask,
  RawSOCAlert,
  SOCCaseRecord,
  SupervisoryWeightsConfig,
  EntitySupervisoryAnalytics,
} from '../types';
import {
  INITIAL_ENTITIES,
  INITIAL_FINDINGS,
  INITIAL_PRIORITY_QUEUE,
  INITIAL_DATASETS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SUPERVISOR_NOTIFICATIONS,
  PRESET_USERS,
  INITIAL_COMPLIANCE_CONTROLS,
  INITIAL_REMEDIATION_TASKS,
} from '../data/dummyData';
import { STATIC_ALERTS, STATIC_CASES } from '../data/socTelemetryDataset';
import {
  DEFAULT_SUPERVISORY_WEIGHTS,
  SupervisoryAnalyticsEngine,
} from '../services/supervisoryAnalyticsEngine';
import { offlineDb, DatabaseStats } from '../services/indexedDbService';
import { mathjsAnalyticsService } from '../services/mathjsAnalyticsService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isLiveStreamActive: boolean;
  toggleLiveStream: () => void;
  isAdvisorOpen: boolean;
  setIsAdvisorOpen: (open: boolean) => void;
  // IndexedDB & Sovereign Station Security
  indexedDbReady: boolean;
  dbStats: DatabaseStats | null;
  refreshDbStats: () => Promise<void>;
  isStationLocked: boolean;
  lockStation: () => void;
  unlockStation: (user: UserAccount) => void;
  logoutUser: () => void;
  exportSqliteDump: () => Promise<void>;
  resetDatabaseToDefaults: () => Promise<void>;
  entities: Entity[];
  findings: Finding[];
  priorityItems: PriorityItem[];
  datasets: UploadedDataset[];
  auditLogs: AuditLogEntry[];
  notificationConfig: SupervisorNotificationConfig;
  updateNotificationConfig: (config: Partial<SupervisorNotificationConfig>) => void;
  toggleEntitySubscription: (entityId: string) => void;
  updateEntityOverride: (
    entityId: string,
    overrides: Partial<{ criticalFindings: boolean; highRiskTransition: boolean; slaBreaches: boolean }>
  ) => void;
  sendTestNotification: () => void;
  selectedFinding: Finding | null;
  setSelectedFinding: (finding: Finding | null) => void;
  selectedEntity: Entity | null;
  setSelectedEntity: (entity: Entity | null) => void;
  selectedReportType: string;
  setSelectedReportType: (type: string) => void;
  markPriorityItemReviewed: (id: string, notes?: string) => void;
  escalatePriorityItem: (id: string) => void;
  addUploadedDataset: (dataset: UploadedDataset) => void;
  integrateDataset: (id: string) => void;
  logAuditEvent: (entry: {
    action: AuditActionType;
    category: AuditCategory;
    targetType: 'Entity' | 'Finding' | 'Report' | 'Dataset' | 'PriorityQueue';
    targetId: string;
    targetName: string;
    details: string;
  }) => void;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'info' | 'warning', title: string, message: string) => void;
  removeToast: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
  selectedAuditLog: AuditLogEntry | null;
  setSelectedAuditLog: (entry: AuditLogEntry | null) => void;
  navigateToEntity: (entityId: string) => void;
  navigateToFinding: (findingId: string) => void;
  navigateToReport: (reportType: string) => void;
  navigateToAuditLog: (logId: string) => void;
  navigateToDevice: (deviceId: string) => void;
  // Regulatory Compliance & Remediation Workflow
  complianceControls: ComplianceControl[];
  remediationTasks: RemediationTask[];
  selectedFramework: RegulatoryFramework;
  setSelectedFramework: (framework: RegulatoryFramework) => void;
  selectedControl: ComplianceControl | null;
  setSelectedControl: (control: ComplianceControl | null) => void;
  selectedRemediationTask: RemediationTask | null;
  setSelectedRemediationTask: (task: RemediationTask | null) => void;
  updateControlEntityAssessment: (
    controlId: string,
    entityId: string,
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'PENDING_AUDIT',
    deficiencySummary?: string
  ) => void;
  addRemediationTask: (
    task: Omit<RemediationTask, 'id' | 'createdAt' | 'reminderCount' | 'daysRemaining' | 'submittedEvidence'>
  ) => void;
  updateRemediationTaskStatus: (
    taskId: string,
    status: RemediationTask['status'],
    verificationNotes?: string
  ) => void;
  sendTaskReminder: (taskId: string) => void;
  toggleTaskAutomatedReminders: (taskId: string) => void;
  submitTaskEvidence: (
    taskId: string,
    evidence: { fileName: string; notes: string; hash?: string }
  ) => void;
  navigateToCompliance: (framework?: RegulatoryFramework, controlCode?: string) => void;
  navigateToRemediation: (taskId?: string) => void;
  // Offline Analytics & Air-Gapped Export Service
  rawAlerts: RawSOCAlert[];
  socCases: SOCCaseRecord[];
  supervisoryWeights: SupervisoryWeightsConfig;
  setSupervisoryWeights: (weights: SupervisoryWeightsConfig) => void;
  entityAnalyticsMap: Map<string, EntitySupervisoryAnalytics>;
  recalculateAllEntityScores: (customWeights?: SupervisoryWeightsConfig) => void;
  isAnalyticsInspectorOpen: boolean;
  setIsAnalyticsInspectorOpen: (open: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  exportModalConfig: { type: 'entities' | 'findings' | 'bundle'; filterLabel?: string } | null;
  openExportModal: (config: { type: 'entities' | 'findings' | 'bundle'; filterLabel?: string }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to generate a realistic simulated 64-char hex SHA-256 hash for audit record integrity
const generateHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const nowHex = Date.now().toString(16);
  return (hex + nowHex + 'a8f094b216cd38e7152a4980bb77c92f' + hex).slice(0, 64);
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [currentUser, setCurrentUser] = useState<UserAccount>(PRESET_USERS[0]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(true);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(false);

  // IndexedDB State & Station Security
  const [indexedDbReady, setIndexedDbReady] = useState<boolean>(false);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [isStationLocked, setIsStationLocked] = useState<boolean>(false);

  const [entities, setEntities] = useState<Entity[]>(INITIAL_ENTITIES);
  const [findings, setFindings] = useState<Finding[]>(INITIAL_FINDINGS);
  const [priorityItems, setPriorityItems] = useState<PriorityItem[]>(INITIAL_PRIORITY_QUEUE);
  const [datasets, setDatasets] = useState<UploadedDataset[]>(INITIAL_DATASETS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [notificationConfig, setNotificationConfig] = useState<SupervisorNotificationConfig>(INITIAL_SUPERVISOR_NOTIFICATIONS);
  
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<string>('supervisory-audit');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Compliance & Remediation Workflow State
  const [complianceControls, setComplianceControls] = useState<ComplianceControl[]>(INITIAL_COMPLIANCE_CONTROLS);
  const [remediationTasks, setRemediationTasks] = useState<RemediationTask[]>(INITIAL_REMEDIATION_TASKS);
  const [selectedFramework, setSelectedFramework] = useState<RegulatoryFramework>('NIST CSF 2.0');
  const [selectedControl, setSelectedControl] = useState<ComplianceControl | null>(null);
  const [selectedRemediationTask, setSelectedRemediationTask] = useState<RemediationTask | null>(null);

  // Raw SOC Telemetry & Offline Mathematical Analytics State
  const [rawAlerts, setRawAlerts] = useState<RawSOCAlert[]>(STATIC_ALERTS);
  const [socCases, setSocCases] = useState<SOCCaseRecord[]>(STATIC_CASES);
  const [supervisoryWeights, setSupervisoryWeights] = useState<SupervisoryWeightsConfig>(DEFAULT_SUPERVISORY_WEIGHTS);
  const [entityAnalyticsMap, setEntityAnalyticsMap] = useState<Map<string, EntitySupervisoryAnalytics>>(() => {
    const engine = new SupervisoryAnalyticsEngine(DEFAULT_SUPERVISORY_WEIGHTS);
    return engine.computeAll(INITIAL_ENTITIES, STATIC_ALERTS, STATIC_CASES);
  });
  const [isAnalyticsInspectorOpen, setIsAnalyticsInspectorOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportModalConfig, setExportModalConfig] = useState<{
    type: 'entities' | 'findings' | 'bundle';
    filterLabel?: string;
  } | null>({ type: 'entities', filterLabel: 'All Monitored Critical Entities' });

  const refreshDbStats = async () => {
    try {
      const stats = await offlineDb.getDatabaseStats();
      setDbStats(stats);
    } catch (err) {
      console.error('Error refreshing DB stats:', err);
    }
  };

  // Hydrate from IndexedDB on startup & calculate initial mathjs metrics
  useEffect(() => {
    let mounted = true;

    async function initializeOfflineDatabase() {
      try {
        await offlineDb.seedInitialDataIfEmpty({
          entities: INITIAL_ENTITIES,
          findings: INITIAL_FINDINGS,
          priorityItems: INITIAL_PRIORITY_QUEUE,
          datasets: INITIAL_DATASETS,
          auditLogs: INITIAL_AUDIT_LOGS,
          complianceControls: INITIAL_COMPLIANCE_CONTROLS,
          remediationTasks: INITIAL_REMEDIATION_TASKS,
          rawAlerts: STATIC_ALERTS,
          socCases: STATIC_CASES,
          presetUsers: PRESET_USERS,
          supervisoryWeights: DEFAULT_SUPERVISORY_WEIGHTS,
        });

        const [
          dbEntities,
          dbFindings,
          dbPriority,
          dbDatasets,
          dbAudit,
          dbControls,
          dbTasks,
          dbAlerts,
          dbCases,
          storedWeights,
          stats,
        ] = await Promise.all([
          offlineDb.getAll<Entity>('entities'),
          offlineDb.getAll<Finding>('findings'),
          offlineDb.getAll<PriorityItem>('priority_items'),
          offlineDb.getAll<UploadedDataset>('datasets'),
          offlineDb.getAll<AuditLogEntry>('audit_logs'),
          offlineDb.getAll<ComplianceControl>('compliance_controls'),
          offlineDb.getAll<RemediationTask>('remediation_workflows'),
          offlineDb.getAll<RawSOCAlert>('raw_alerts'),
          offlineDb.getAll<SOCCaseRecord>('soc_cases'),
          offlineDb.getById<{ key: string; value: SupervisoryWeightsConfig }>('system_settings', 'supervisory_weights'),
          offlineDb.getDatabaseStats(),
        ]);

        if (!mounted) return;

        if (dbEntities.length) setEntities(dbEntities);
        if (dbFindings.length) setFindings(dbFindings);
        if (dbPriority.length) setPriorityItems(dbPriority);
        if (dbDatasets.length) setDatasets(dbDatasets);
        if (dbAudit.length) setAuditLogs(dbAudit);
        if (dbControls.length) setComplianceControls(dbControls);
        if (dbTasks.length) setRemediationTasks(dbTasks);
        if (dbAlerts.length) setRawAlerts(dbAlerts);
        if (dbCases.length) setSocCases(dbCases);
        if (storedWeights?.value) setSupervisoryWeights(storedWeights.value);
        if (stats) setDbStats(stats);

        // Perform local real-time calculation with mathjs library
        const activeWeights = storedWeights?.value || DEFAULT_SUPERVISORY_WEIGHTS;
        const { analyticsMap, updatedEntities } = await mathjsAnalyticsService.recalculateFromIndexedDb(activeWeights);

        if (!mounted) return;
        setEntityAnalyticsMap(analyticsMap);
        if (updatedEntities.length) setEntities(updatedEntities);
        setIndexedDbReady(true);
      } catch (err) {
        console.error('IndexedDB initialization failed:', err);
        setIndexedDbReady(true);
      }
    }

    initializeOfflineDatabase();

    return () => {
      mounted = false;
    };
  }, []);

  const openExportModal = (config: { type: 'entities' | 'findings' | 'bundle'; filterLabel?: string }) => {
    setExportModalConfig(config);
    setIsExportModalOpen(true);
  };

  const recalculateAllEntityScores = async (customWeights?: SupervisoryWeightsConfig) => {
    const activeWeights = customWeights || supervisoryWeights;
    setSupervisoryWeights(activeWeights);

    try {
      await offlineDb.put('system_settings', {
        key: 'supervisory_weights',
        value: activeWeights,
        updatedAt: new Date().toISOString(),
      });

      const { analyticsMap, updatedEntities } = await mathjsAnalyticsService.recalculateFromIndexedDb(activeWeights);
      setEntityAnalyticsMap(analyticsMap);
      setEntities(updatedEntities);
      await refreshDbStats();

      addToast(
        'success',
        'Math.js Model Executed',
        'Real-time Execution Gaps & Negative Space recalculated locally from IndexedDB.'
      );
    } catch (err) {
      // Fallback
      const engine = new SupervisoryAnalyticsEngine(activeWeights);
      const newMap = engine.computeAll(entities, rawAlerts, socCases);
      setEntityAnalyticsMap(newMap);
    }
  };

  const lockStation = () => {
    setIsStationLocked(true);
    setCurrentUser((prev) => ({ ...prev, isLoggedIn: false }));
    setActivePage('auth');
    addToast('info', 'Station Terminal Locked', 'Protected supervisor session suspended. Cryptographic PIN or CAC required.');
  };

  const unlockStation = (user: UserAccount) => {
    setCurrentUser({ ...user, isLoggedIn: true });
    setIsStationLocked(false);
    offlineDb.put('user_accounts', { ...user, isLoggedIn: true, lastLogin: 'Active Station Session' }).catch(() => {});
    setActivePage('overview');
  };

  const logoutUser = () => {
    lockStation();
  };

  const exportSqliteDump = async () => {
    try {
      const sqlDump = await offlineDb.exportSqliteDump();
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `sat_sa_offline_sqlite_mirror_${dateStr}.sql`;

      const blob = new Blob([sqlDump], { type: 'application/sql;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logAuditEvent({
        action: 'EVIDENCE_EXPORT',
        category: 'Compliance & Security',
        targetType: 'Report',
        targetId: 'sqlite-dump',
        targetName: fileName,
        details: `Exported complete air-gapped SQLite schema DDL and table inserts (${(sqlDump.length / 1024).toFixed(1)} KB).`,
      });

      addToast(
        'success',
        'SQLite Schema Dump Generated',
        `Downloaded ${fileName} containing complete offline relational schema and tables.`
      );
    } catch (err) {
      addToast('warning', 'Export Failure', 'Failed to generate SQLite dump file.');
    }
  };

  const resetDatabaseToDefaults = async () => {
    try {
      await offlineDb.clear('entities');
      await offlineDb.clear('findings');
      await offlineDb.clear('priority_items');
      await offlineDb.clear('datasets');
      await offlineDb.clear('audit_logs');
      await offlineDb.clear('compliance_controls');
      await offlineDb.clear('remediation_workflows');
      await offlineDb.clear('raw_alerts');
      await offlineDb.clear('soc_cases');

      await offlineDb.seedInitialDataIfEmpty({
        entities: INITIAL_ENTITIES,
        findings: INITIAL_FINDINGS,
        priorityItems: INITIAL_PRIORITY_QUEUE,
        datasets: INITIAL_DATASETS,
        auditLogs: INITIAL_AUDIT_LOGS,
        complianceControls: INITIAL_COMPLIANCE_CONTROLS,
        remediationTasks: INITIAL_REMEDIATION_TASKS,
        rawAlerts: STATIC_ALERTS,
        socCases: STATIC_CASES,
        presetUsers: PRESET_USERS,
        supervisoryWeights: DEFAULT_SUPERVISORY_WEIGHTS,
      });

      setEntities(INITIAL_ENTITIES);
      setFindings(INITIAL_FINDINGS);
      setPriorityItems(INITIAL_PRIORITY_QUEUE);
      setDatasets(INITIAL_DATASETS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setComplianceControls(INITIAL_COMPLIANCE_CONTROLS);
      setRemediationTasks(INITIAL_REMEDIATION_TASKS);
      setRawAlerts(STATIC_ALERTS);
      setSocCases(STATIC_CASES);
      setSupervisoryWeights(DEFAULT_SUPERVISORY_WEIGHTS);

      const { analyticsMap, updatedEntities } = await mathjsAnalyticsService.recalculateFromIndexedDb(
        DEFAULT_SUPERVISORY_WEIGHTS
      );
      setEntityAnalyticsMap(analyticsMap);
      if (updatedEntities.length) setEntities(updatedEntities);
      await refreshDbStats();

      addToast('success', 'Database Restored', 'IndexedDB SQLite mirror reset to official supervisory baseline.');
    } catch (err) {
      addToast('warning', 'Reset Failed', 'Error resetting IndexedDB mirror.');
    }
  };

  // Simulated Real-Time SOC Stream Ticker
  useEffect(() => {
    if (!isLiveStreamActive) return;

    const interval = setInterval(() => {
      // Pick a random entity to receive a simulated telemetry heartbeat
      setEntities((prev) => {
        const randIndex = Math.floor(Math.random() * prev.length);
        return prev.map((ent, idx) => {
          if (idx === randIndex) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return {
              ...ent,
              lastUpdated: `Local sync at ${timeStr} (Packet #${Math.floor(1000 + Math.random() * 9000)})`,
            };
          }
          return ent;
        });
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [isLiveStreamActive]);

  const toggleLiveStream = () => {
    setIsLiveStreamActive((prev) => {
      const next = !prev;
      addToast(
        next ? 'success' : 'info',
        next ? 'Local Stream Active' : 'Local Stream Paused',
        next
          ? 'Connected to local SOC telemetry stream across critical infrastructure operators.'
          : 'Local socket polling suspended. Displaying static snapshot.'
      );
      return next;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const addToast = (type: 'success' | 'info' | 'warning', title: string, message: string) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logAuditEvent = (entry: {
    action: AuditActionType;
    category: AuditCategory;
    targetType: 'Entity' | 'Finding' | 'Report' | 'Dataset' | 'PriorityQueue';
    targetId: string;
    targetName: string;
    details: string;
  }) => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const id = 'aud-' + Math.floor(1000 + Math.random() * 9000);
    const hash = generateHash(id + entry.targetId + timestamp + entry.details);

    const newLog: AuditLogEntry = {
      id,
      timestamp,
      actor: currentUser?.name || 'Dir. Samuel Vance',
      actorRole: currentUser?.role || 'National Cyber Inspector',
      action: entry.action,
      category: entry.category,
      targetType: entry.targetType,
      targetId: entry.targetId,
      targetName: entry.targetName,
      details: entry.details,
      ipAddress: '10.240.12.8 (Sovereign Term #04)',
      integrityHash: hash,
      complianceStatus: 'VERIFIED',
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    offlineDb.put('audit_logs', newLog).catch(() => {});
    refreshDbStats();
  };

  const markPriorityItemReviewed = (id: string, notes?: string) => {
    const item = priorityItems.find((p) => p.id === id);
    let updatedItem: PriorityItem | null = null;
    setPriorityItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          updatedItem = {
            ...i,
            status: 'Reviewed' as const,
            notes:
              notes ||
              i.notes ||
              `Reviewed by supervisor on ${new Date().toISOString().slice(0, 10)}. Findings logged for regular monitoring.`,
          };
          return updatedItem;
        }
        return i;
      })
    );

    if (updatedItem) {
      offlineDb.put('priority_items', updatedItem).catch(() => {});
    }

    if (item) {
      logAuditEvent({
        action: 'STATUS_UPDATE',
        category: 'Supervisory Action',
        targetType: 'PriorityQueue',
        targetId: item.id,
        targetName: item.entityName,
        details: `Supervisor marked rank #${item.rank} review queue item as Reviewed. ${notes ? `Note recorded: "${notes.slice(0, 50)}..."` : 'Regulatory review covenant satisfied.'}`,
      });
    }

    addToast('success', 'Review Completed', `Priority queue item ${id} marked as Reviewed & recorded to Audit Log.`);
  };

  const escalatePriorityItem = (id: string) => {
    const item = priorityItems.find((p) => p.id === id);
    let updatedItem: PriorityItem | null = null;
    setPriorityItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          updatedItem = {
            ...i,
            status: 'Escalated to Directive' as const,
            notes: `Formal supervisory notice initiated on ${new Date().toISOString().slice(0, 10)}. Mandatory compliance summons dispatched.`,
          };
          return updatedItem;
        }
        return i;
      })
    );

    if (updatedItem) {
      offlineDb.put('priority_items', updatedItem).catch(() => {});
    }

    if (item) {
      logAuditEvent({
        action: 'SUPERVISORY_ESCALATION',
        category: 'Supervisory Action',
        targetType: 'PriorityQueue',
        targetId: item.id,
        targetName: item.entityName,
        details: `Statutory emergency escalation issued for ${item.entityName} (Rank #${item.rank}). Reason: ${item.reason.slice(0, 80)}...`,
      });
    }

    addToast('warning', 'Regulatory Escalation', `Formal Supervisory Notice dispatched & registered in immutable audit ledger.`);
  };

  const addUploadedDataset = (dataset: UploadedDataset) => {
    setDatasets((prev) => [dataset, ...prev]);
    offlineDb.put('datasets', dataset).catch(() => {});
    refreshDbStats();

    logAuditEvent({
      action: 'DATA_UPLOAD',
      category: 'Data Ingestion',
      targetType: 'Dataset',
      targetId: dataset.id,
      targetName: dataset.fileName,
      details: `Uploaded and schema-validated ${dataset.fileName} (${dataset.fileSize}, ${dataset.recordCount.toLocaleString()} events). Validation status: ${dataset.status}.`,
    });

    addToast('info', 'Dataset Validated', `File "${dataset.fileName}" parsed with 0 schema violations & saved to IndexedDB SQLite mirror.`);
  };

  const integrateDataset = async (id: string) => {
    const ds = datasets.find((d) => d.id === id);
    const updatedDs = ds ? { ...ds, status: 'Integrated' as const } : null;

    setDatasets((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'Integrated' as const } : d))
    );
    setEntities((prev) =>
      prev.map((ent, i) => (i === 0 ? { ...ent, lastUpdated: 'Just now (Batch Sync)' } : ent))
    );

    if (updatedDs) {
      await offlineDb.put('datasets', updatedDs).catch(() => {});
    }

    // Trigger local real-time mathjs calculations based on IndexedDB
    try {
      const { analyticsMap, updatedEntities } = await mathjsAnalyticsService.recalculateFromIndexedDb();
      setEntityAnalyticsMap(analyticsMap);
      setEntities(updatedEntities);
      await refreshDbStats();
    } catch (err) {
      console.error('Real-time recalculation error:', err);
    }

    if (ds) {
      logAuditEvent({
        action: 'DATA_INTEGRATION',
        category: 'Data Ingestion',
        targetType: 'Dataset',
        targetId: ds.id,
        targetName: ds.fileName,
        details: `Integrated batch ${ds.fileName} (${ds.recordCount.toLocaleString()} records) into local supervisory risk scoring models.`,
      });
    }

    addToast('success', 'Data Synchronized', 'SOC telemetry batch ingested into IndexedDB & real-time mathjs scores updated.');
  };

  const navigateToEntity = (entityId: string) => {
    const ent = entities.find((e) => e.id === entityId);
    if (ent) {
      setSelectedEntity(ent);
    }
    setActivePage('entity-risk');
  };

  const navigateToFinding = (findingId: string) => {
    const fnd = findings.find((f) => f.id === findingId);
    if (fnd) {
      setSelectedFinding(fnd);
    }
    setActivePage('findings');
  };

  const navigateToReport = (reportType: string) => {
    setSelectedReportType(reportType);
    setActivePage('reports');
  };

  const navigateToAuditLog = (logId: string) => {
    const match = auditLogs.find((l) => l.id === logId);
    if (match) {
      setSelectedAuditLog(match);
    }
    setActivePage('audit-logs');
  };

  const navigateToDevice = (_deviceId: string) => {
    setActivePage('devices');
  };

  const updateNotificationConfig = (config: Partial<SupervisorNotificationConfig>) => {
    setNotificationConfig((prev) => {
      const updated = { ...prev, ...config };
      return updated;
    });

    logAuditEvent({
      action: 'STATUS_UPDATE',
      category: 'Compliance & Security',
      targetType: 'Entity',
      targetId: 'notification-settings',
      targetName: 'Supervisor Alert Subscriptions',
      details: `Updated automated email notification parameters. Recipient: ${config.recipientEmail || notificationConfig.recipientEmail}, Delivery: ${config.deliveryMode || notificationConfig.deliveryMode}, Subscribed Entities: ${(config.subscribedEntityIds || notificationConfig.subscribedEntityIds).length}.`,
    });

    addToast('success', 'Preferences Saved', 'Automated email subscription settings updated and recorded to compliance ledger.');
  };

  const toggleEntitySubscription = (entityId: string) => {
    setNotificationConfig((prev) => {
      const exists = prev.subscribedEntityIds.includes(entityId);
      const newIds = exists
        ? prev.subscribedEntityIds.filter((id) => id !== entityId)
        : [...prev.subscribedEntityIds, entityId];

      const entity = entities.find((e) => e.id === entityId);
      const actionName = exists ? 'Unsubscribed from' : 'Subscribed to';

      logAuditEvent({
        action: 'STATUS_UPDATE',
        category: 'Compliance & Security',
        targetType: 'Entity',
        targetId: entityId,
        targetName: entity ? entity.name : entityId,
        details: `Supervisor ${actionName} automated alerts for ${entity ? entity.name : entityId}.`,
      });

      return {
        ...prev,
        subscribedEntityIds: newIds,
      };
    });
  };

  const updateEntityOverride = (
    entityId: string,
    overrides: Partial<{ criticalFindings: boolean; highRiskTransition: boolean; slaBreaches: boolean }>
  ) => {
    setNotificationConfig((prev) => {
      const existing = prev.entityOverrides[entityId] || {
        criticalFindings: true,
        highRiskTransition: true,
        slaBreaches: true,
      };
      return {
        ...prev,
        entityOverrides: {
          ...prev.entityOverrides,
          [entityId]: { ...existing, ...overrides },
        },
      };
    });
  };

  const sendTestNotification = () => {
    const newAlert = {
      id: 'disp-' + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      entityName: 'Metro Continental Power Grid (SCADA/EMS)',
      triggerType: 'TEST_DISPATCH_VERIFICATION',
      subject: `[TEST] SAT-SA Automated Alert Test to ${notificationConfig.recipientEmail}`,
      status: 'SENT' as const,
    };

    setNotificationConfig((prev) => ({
      ...prev,
      recentDispatchedAlerts: [newAlert, ...prev.recentDispatchedAlerts.slice(0, 7)],
    }));

    logAuditEvent({
      action: 'STATUS_UPDATE',
      category: 'Compliance & Security',
      targetType: 'Entity',
      targetId: 'smtp-test',
      targetName: 'Test Notification Dispatch',
      details: `Dispatched test supervisory alert to ${notificationConfig.recipientEmail} via national secure relay.`,
    });

    addToast('success', 'Test Alert Dispatched', `Simulated test notification successfully transmitted to ${notificationConfig.recipientEmail}.`);
  };

  const updateControlEntityAssessment = (
    controlId: string,
    entityId: string,
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'PENDING_AUDIT',
    deficiencySummary?: string
  ) => {
    let updatedCtrl: ComplianceControl | null = null;
    setComplianceControls((prev) =>
      prev.map((ctrl) => {
        if (ctrl.id !== controlId) return ctrl;
        const updatedEntities = ctrl.entitiesAssessment.map((ea) => {
          if (ea.entityId !== entityId) return ea;
          return {
            ...ea,
            status,
            deficiencySummary: deficiencySummary !== undefined ? deficiencySummary : ea.deficiencySummary,
            lastAudited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          };
        });
        updatedCtrl = { ...ctrl, entitiesAssessment: updatedEntities };
        return updatedCtrl;
      })
    );

    if (updatedCtrl) {
      offlineDb.put('compliance_controls', updatedCtrl).catch(() => {});
    }

    const control = complianceControls.find((c) => c.id === controlId);
    const entity = entities.find((e) => e.id === entityId);

    logAuditEvent({
      action: 'STATUS_UPDATE',
      category: 'Compliance & Security',
      targetType: 'Entity',
      targetId: entityId,
      targetName: entity?.name || entityId,
      details: `Updated compliance assessment for control ${control?.code || controlId} to ${status}.`,
    });

    addToast('success', 'Control Assessment Updated', `Control ${control?.code || controlId} marked as ${status} for ${entity?.name || entityId}.`);
  };

  const addRemediationTask = (
    newTask: Omit<RemediationTask, 'id' | 'createdAt' | 'reminderCount' | 'daysRemaining' | 'submittedEvidence'>
  ) => {
    const id = `REM-${String(remediationTasks.length + 1).padStart(3, '0')}`;
    const deadlineDate = new Date(newTask.statutoryDeadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const created: RemediationTask = {
      ...newTask,
      id,
      daysRemaining,
      reminderCount: 0,
      submittedEvidence: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setRemediationTasks((prev) => [created, ...prev]);
    offlineDb.put('remediation_workflows', created).catch(() => {});
    refreshDbStats();

    logAuditEvent({
      action: 'SUPERVISORY_ESCALATION',
      category: 'Supervisory Action',
      targetType: 'Entity',
      targetId: newTask.entityId,
      targetName: newTask.entityName,
      details: `Assigned remediation task ${id}: "${newTask.title}" [Priority: ${newTask.priority}].`,
    });

    addToast('success', 'Remediation Task Assigned', `Task ${id} successfully issued to ${newTask.entityName}. Statutory deadline: ${newTask.statutoryDeadline}.`);
  };

  const updateRemediationTaskStatus = (
    taskId: string,
    status: RemediationTask['status'],
    verificationNotes?: string
  ) => {
    let updatedTask: RemediationTask | null = null;
    setRemediationTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        let progressPercent = t.progressPercent;
        if (status === 'Verified Closed') progressPercent = 100;
        else if (status === 'Verification Requested') progressPercent = Math.max(t.progressPercent, 90);
        else if (status === 'In-Progress') progressPercent = Math.max(t.progressPercent, 40);
        else if (status === 'Pending') progressPercent = 0;

        updatedTask = {
          ...t,
          status,
          progressPercent,
          verificationNotes: verificationNotes || t.verificationNotes,
        };
        return updatedTask;
      })
    );

    if (updatedTask) {
      offlineDb.put('remediation_workflows', updatedTask).catch(() => {});
      refreshDbStats();
    }

    const task = remediationTasks.find((t) => t.id === taskId);

    logAuditEvent({
      action: 'STATUS_UPDATE',
      category: 'Compliance & Security',
      targetType: 'Entity',
      targetId: task?.entityId || taskId,
      targetName: task?.entityName || 'Entity Task',
      details: `Remediation task ${taskId} transition to status: ${status}. ${verificationNotes ? `Notes: ${verificationNotes}` : ''}`,
    });

    addToast('success', 'Task Status Updated', `Task ${taskId} is now "${status}".`);
  };

  const sendTaskReminder = (taskId: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

    setRemediationTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updated = {
          ...t,
          reminderCount: t.reminderCount + 1,
          lastReminderSent: nowStr,
        };
        offlineDb.put('remediation_workflows', updated).catch(() => {});
        return updated;
      })
    );

    const task = remediationTasks.find((t) => t.id === taskId);

    logAuditEvent({
      action: 'STATUS_UPDATE',
      category: 'Supervisory Action',
      targetType: 'Entity',
      targetId: task?.entityId || taskId,
      targetName: task?.entityName || 'Remediation Target',
      details: `Automated statutory compliance reminder #${(task?.reminderCount || 0) + 1} transmitted to ${task?.assignedOperatorContact}.`,
    });

    addToast('info', 'Automated Reminder Dispatched', `Statutory reminder dispatched to ${task?.assignedOperatorContact} for task ${taskId}.`);
  };

  const toggleTaskAutomatedReminders = (taskId: string) => {
    setRemediationTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextState = !t.automatedRemindersEnabled;
        const updated = { ...t, automatedRemindersEnabled: nextState };
        offlineDb.put('remediation_workflows', updated).catch(() => {});
        return updated;
      })
    );

    const task = remediationTasks.find((t) => t.id === taskId);
    addToast('info', 'Reminder Cadence Updated', `Automated reminders ${!task?.automatedRemindersEnabled ? 'enabled' : 'paused'} for task ${taskId}.`);
  };

  const submitTaskEvidence = (
    taskId: string,
    evidence: { fileName: string; notes: string; hash?: string }
  ) => {
    const evidenceItem = {
      id: `ev-${Date.now().toString(36)}`,
      fileName: evidence.fileName,
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      hash: evidence.hash || generateHash(evidence.fileName + Date.now()),
      notes: evidence.notes,
    };

    setRemediationTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updated = {
          ...t,
          status: 'Verification Requested' as const,
          progressPercent: Math.max(t.progressPercent, 90),
          submittedEvidence: [...(t.submittedEvidence || []), evidenceItem],
        };
        offlineDb.put('remediation_workflows', updated).catch(() => {});
        return updated;
      })
    );

    logAuditEvent({
      action: 'DATA_UPLOAD',
      category: 'Compliance & Security',
      targetType: 'Entity',
      targetId: taskId,
      targetName: `Task Evidence: ${evidence.fileName}`,
      details: `Uploaded cryptographic proof of remediation for task ${taskId}. SHA-256: ${evidenceItem.hash}.`,
    });

    addToast('success', 'Evidence Filed for Verification', `Remediation proof "${evidence.fileName}" submitted. Status set to Verification Requested.`);
  };

  const navigateToCompliance = (framework?: RegulatoryFramework, controlCode?: string) => {
    if (framework) setSelectedFramework(framework);
    if (controlCode) {
      const match = complianceControls.find((c) => c.code === controlCode);
      if (match) setSelectedControl(match);
    }
    setActivePage('compliance');
  };

  const navigateToRemediation = (taskId?: string) => {
    if (taskId) {
      const match = remediationTasks.find((t) => t.id === taskId);
      if (match) setSelectedRemediationTask(match);
    }
    setActivePage('remediation');
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        currentUser,
        setCurrentUser,
        isDarkMode,
        toggleDarkMode,
        isLiveStreamActive,
        toggleLiveStream,
        isAdvisorOpen,
        setIsAdvisorOpen,
        indexedDbReady,
        dbStats,
        refreshDbStats,
        isStationLocked,
        lockStation,
        unlockStation,
        logoutUser,
        exportSqliteDump,
        resetDatabaseToDefaults,
        entities,
        findings,
        priorityItems,
        datasets,
        auditLogs,
        notificationConfig,
        updateNotificationConfig,
        toggleEntitySubscription,
        updateEntityOverride,
        sendTestNotification,
        selectedFinding,
        setSelectedFinding,
        selectedEntity,
        setSelectedEntity,
        selectedReportType,
        setSelectedReportType,
        markPriorityItemReviewed,
        escalatePriorityItem,
        addUploadedDataset,
        integrateDataset,
        logAuditEvent,
        toasts,
        addToast,
        removeToast,
        searchQuery,
        setSearchQuery,
        isSearchModalOpen,
        setIsSearchModalOpen,
        selectedAuditLog,
        setSelectedAuditLog,
        navigateToEntity,
        navigateToFinding,
        navigateToReport,
        navigateToAuditLog,
        navigateToDevice,
        complianceControls,
        remediationTasks,
        selectedFramework,
        setSelectedFramework,
        selectedControl,
        setSelectedControl,
        selectedRemediationTask,
        setSelectedRemediationTask,
        updateControlEntityAssessment,
        addRemediationTask,
        updateRemediationTaskStatus,
        sendTaskReminder,
        toggleTaskAutomatedReminders,
        submitTaskEvidence,
        navigateToCompliance,
        navigateToRemediation,
        rawAlerts,
        socCases,
        supervisoryWeights,
        setSupervisoryWeights,
        entityAnalyticsMap,
        recalculateAllEntityScores,
        isAnalyticsInspectorOpen,
        setIsAnalyticsInspectorOpen,
        isExportModalOpen,
        setIsExportModalOpen,
        exportModalConfig,
        openExportModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
