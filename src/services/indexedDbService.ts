/**
 * SAT-SA Offline SQLite Mirror Database Utility (IndexedDB Service)
 *
 * Implements a 100% browser-based IndexedDB storage layer that mirrors
 * a production SQLite relational database schema for air-gapped environments.
 *
 * Stores:
 * - entities (mirroring `entities` table)
 * - findings (mirroring `findings` table)
 * - remediation_workflows (mirroring `remediation_tasks` table)
 * - compliance_controls (mirroring `compliance_controls` table)
 * - raw_alerts (mirroring `raw_soc_alerts` table)
 * - soc_cases (mirroring `soc_cases` table)
 * - audit_logs (mirroring `audit_log_entries` table)
 * - priority_items (mirroring `priority_queue` table)
 * - datasets (mirroring `uploaded_datasets` table)
 * - user_accounts (mirroring `authorized_inspectors` table)
 * - system_settings (mirroring `system_kv_config` table)
 */

import {
  Entity,
  Finding,
  RemediationTask,
  ComplianceControl,
  RawSOCAlert,
  SOCCaseRecord,
  AuditLogEntry,
  PriorityItem,
  UploadedDataset,
  UserAccount,
  SupervisoryWeightsConfig,
} from '../types';

export const DB_NAME = 'sat_sa_offline_sqlite_mirror_db';
export const DB_VERSION = 2;

export interface DatabaseStats {
  entitiesCount: number;
  findingsCount: number;
  remediationTasksCount: number;
  complianceControlsCount: number;
  rawAlertsCount: number;
  socCasesCount: number;
  auditLogsCount: number;
  priorityItemsCount: number;
  datasetsCount: number;
  usersCount: number;
  dbSizeBytesEstimated: number;
  lastSyncTimestamp: string;
  isAirGapped: boolean;
}

class IndexedDbService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  public async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this runtime environment'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Entities Store
        if (!db.objectStoreNames.contains('entities')) {
          const store = db.createObjectStore('entities', { keyPath: 'id' });
          store.createIndex('sector', 'sector', { unique: false });
          store.createIndex('riskLevel', 'riskLevel', { unique: false });
          store.createIndex('riskScore', 'riskScore', { unique: false });
        }

        // 2. Findings Store
        if (!db.objectStoreNames.contains('findings')) {
          const store = db.createObjectStore('findings', { keyPath: 'id' });
          store.createIndex('entityId', 'entityId', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('severity', 'severity', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }

        // 3. Remediation Workflows Store
        if (!db.objectStoreNames.contains('remediation_workflows')) {
          const store = db.createObjectStore('remediation_workflows', { keyPath: 'id' });
          store.createIndex('entityId', 'entityId', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('statutoryDeadline', 'statutoryDeadline', { unique: false });
        }

        // 4. Compliance Controls Store
        if (!db.objectStoreNames.contains('compliance_controls')) {
          const store = db.createObjectStore('compliance_controls', { keyPath: 'id' });
          store.createIndex('code', 'code', { unique: true });
          store.createIndex('framework', 'framework', { unique: false });
          store.createIndex('mandatoryTier', 'mandatoryTier', { unique: false });
        }

        // 5. Raw Alerts Store
        if (!db.objectStoreNames.contains('raw_alerts')) {
          const store = db.createObjectStore('raw_alerts', { keyPath: 'alert_id' });
          store.createIndex('entity_id', 'entity_id', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('severity', 'severity', { unique: false });
          store.createIndex('closure_time_minutes', 'closure_time_minutes', { unique: false });
          store.createIndex('is_execution_gap', 'is_execution_gap', { unique: false });
        }

        // 6. SOC Cases Store
        if (!db.objectStoreNames.contains('soc_cases')) {
          const store = db.createObjectStore('soc_cases', { keyPath: 'case_id' });
          store.createIndex('entity_id', 'entity_id', { unique: false });
          store.createIndex('alert_id', 'alert_id', { unique: false });
          store.createIndex('notes_template_flag', 'notes_template_flag', { unique: false });
        }

        // 7. Cryptographic Audit Logs Store
        if (!db.objectStoreNames.contains('audit_logs')) {
          const store = db.createObjectStore('audit_logs', { keyPath: 'id' });
          store.createIndex('action', 'action', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('targetId', 'targetId', { unique: false });
        }

        // 8. Priority Queue Store
        if (!db.objectStoreNames.contains('priority_items')) {
          const store = db.createObjectStore('priority_items', { keyPath: 'id' });
          store.createIndex('entityId', 'entityId', { unique: false });
          store.createIndex('severity', 'severity', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }

        // 9. Uploaded Datasets Store
        if (!db.objectStoreNames.contains('datasets')) {
          const store = db.createObjectStore('datasets', { keyPath: 'id' });
          store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }

        // 10. User Accounts / Sessions Store
        if (!db.objectStoreNames.contains('user_accounts')) {
          const store = db.createObjectStore('user_accounts', { keyPath: 'id' });
          store.createIndex('email', 'email', { unique: true });
        }

        // 11. System Configuration Key-Value Store
        if (!db.objectStoreNames.contains('system_settings')) {
          db.createObjectStore('system_settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to initialize IndexedDB SQLite mirror'));
      };
    });

    return this.initPromise;
  }

  // -------------------------------------------------------------
  // GENERIC STORE OPERATIONS
  // -------------------------------------------------------------

  public async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve((request.result || []) as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  public async getById<T>(storeName: string, id: string | number): Promise<T | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve((request.result as T) || null);
      request.onerror = () => reject(request.error);
    });
  }

  public async put<T>(storeName: string, item: T): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async putMany<T>(storeName: string, items: T[]): Promise<void> {
    if (!items.length) return;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      items.forEach((item) => store.put(item));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  public async delete(storeName: string, key: string | number): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async clear(storeName: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async count(storeName: string): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // -------------------------------------------------------------
  // SEEDING AND HYDRATION
  // -------------------------------------------------------------

  public async seedInitialDataIfEmpty(defaults: {
    entities: Entity[];
    findings: Finding[];
    priorityItems: PriorityItem[];
    datasets: UploadedDataset[];
    auditLogs: AuditLogEntry[];
    complianceControls: ComplianceControl[];
    remediationTasks: RemediationTask[];
    rawAlerts: RawSOCAlert[];
    socCases: SOCCaseRecord[];
    presetUsers: UserAccount[];
    supervisoryWeights: SupervisoryWeightsConfig;
  }): Promise<{ seeded: boolean; counts: Record<string, number> }> {
    const db = await this.open();
    const existingEntities = await this.count('entities');

    if (existingEntities > 0) {
      // Already populated, return existing store counts
      return {
        seeded: false,
        counts: {
          entities: await this.count('entities'),
          findings: await this.count('findings'),
          remediation_workflows: await this.count('remediation_workflows'),
          compliance_controls: await this.count('compliance_controls'),
          raw_alerts: await this.count('raw_alerts'),
          soc_cases: await this.count('soc_cases'),
          audit_logs: await this.count('audit_logs'),
        },
      };
    }

    // Populate all initial stores
    await this.putMany('entities', defaults.entities);
    await this.putMany('findings', defaults.findings);
    await this.putMany('priority_items', defaults.priorityItems);
    await this.putMany('datasets', defaults.datasets);
    await this.putMany('audit_logs', defaults.auditLogs);
    await this.putMany('compliance_controls', defaults.complianceControls);
    await this.putMany('remediation_workflows', defaults.remediationTasks);
    await this.putMany('raw_alerts', defaults.rawAlerts);
    await this.putMany('soc_cases', defaults.socCases);
    await this.putMany('user_accounts', defaults.presetUsers);

    await this.put('system_settings', {
      key: 'supervisory_weights',
      value: defaults.supervisoryWeights,
      updatedAt: new Date().toISOString(),
    });

    return {
      seeded: true,
      counts: {
        entities: defaults.entities.length,
        findings: defaults.findings.length,
        remediation_workflows: defaults.remediationTasks.length,
        compliance_controls: defaults.complianceControls.length,
        raw_alerts: defaults.rawAlerts.length,
        soc_cases: defaults.socCases.length,
        audit_logs: defaults.auditLogs.length,
      },
    };
  }

  // -------------------------------------------------------------
  // DATABASE HEALTH & METRICS
  // -------------------------------------------------------------

  public async getDatabaseStats(): Promise<DatabaseStats> {
    const [
      entitiesCount,
      findingsCount,
      remediationTasksCount,
      complianceControlsCount,
      rawAlertsCount,
      socCasesCount,
      auditLogsCount,
      priorityItemsCount,
      datasetsCount,
      usersCount,
    ] = await Promise.all([
      this.count('entities').catch(() => 0),
      this.count('findings').catch(() => 0),
      this.count('remediation_workflows').catch(() => 0),
      this.count('compliance_controls').catch(() => 0),
      this.count('raw_alerts').catch(() => 0),
      this.count('soc_cases').catch(() => 0),
      this.count('audit_logs').catch(() => 0),
      this.count('priority_items').catch(() => 0),
      this.count('datasets').catch(() => 0),
      this.count('user_accounts').catch(() => 0),
    ]);

    // Approximate size calculation
    const approxBytes =
      entitiesCount * 1200 +
      findingsCount * 1800 +
      remediationTasksCount * 1400 +
      complianceControlsCount * 1100 +
      rawAlertsCount * 320 +
      socCasesCount * 450 +
      auditLogsCount * 600;

    return {
      entitiesCount,
      findingsCount,
      remediationTasksCount,
      complianceControlsCount,
      rawAlertsCount,
      socCasesCount,
      auditLogsCount,
      priorityItemsCount,
      datasetsCount,
      usersCount,
      dbSizeBytesEstimated: approxBytes,
      lastSyncTimestamp: new Date().toISOString(),
      isAirGapped: true,
    };
  }

  // -------------------------------------------------------------
  // SQLITE EXPORT UTILITY (Generate valid SQLite .sql dump)
  // -------------------------------------------------------------

  public async exportSqliteDump(): Promise<string> {
    const entities = await this.getAll<Entity>('entities');
    const findings = await this.getAll<Finding>('findings');
    const remediation = await this.getAll<RemediationTask>('remediation_workflows');
    const controls = await this.getAll<ComplianceControl>('compliance_controls');
    const alerts = await this.getAll<RawSOCAlert>('raw_alerts');
    const cases = await this.getAll<SOCCaseRecord>('soc_cases');
    const audit = await this.getAll<AuditLogEntry>('audit_logs');

    const escapeSql = (val: any): string => {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return val.toString();
      if (typeof val === 'boolean') return val ? '1' : '0';
      if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      return `'${String(val).replace(/'/g, "''")}'`;
    };

    let sql = `-- ==========================================================================\n`;
    sql += `-- SAT-SA AIR-GAPPED SQLITE DATABASE BACKUP\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- Standard: National Critical Infrastructure Cyber Supervisory Framework\n`;
    sql += `-- Storage Engine: Browser-Based SQLite IndexedDB Mirror\n`;
    sql += `-- ==========================================================================\n\n`;
    sql += `PRAGMA foreign_keys = ON;\nBEGIN TRANSACTION;\n\n`;

    // 1. Entities Table
    sql += `-- Table: entities\n`;
    sql += `CREATE TABLE IF NOT EXISTS entities (\n`;
    sql += `    id TEXT PRIMARY KEY,\n`;
    sql += `    name TEXT NOT NULL,\n`;
    sql += `    code TEXT NOT NULL,\n`;
    sql += `    sector TEXT NOT NULL,\n`;
    sql += `    region TEXT NOT NULL,\n`;
    sql += `    risk_score INTEGER NOT NULL,\n`;
    sql += `    risk_level TEXT NOT NULL,\n`;
    sql += `    soc_coverage_percent REAL,\n`;
    sql += `    critical_findings INTEGER DEFAULT 0,\n`;
    sql += `    supervisory_status TEXT,\n`;
    sql += `    ot_environment_present INTEGER DEFAULT 0,\n`;
    sql += `    last_updated TEXT\n`;
    sql += `);\n\n`;

    for (const e of entities) {
      sql += `INSERT INTO entities (id, name, code, sector, region, risk_score, risk_level, soc_coverage_percent, critical_findings, supervisory_status, ot_environment_present, last_updated) VALUES (${escapeSql(e.id)}, ${escapeSql(e.name)}, ${escapeSql(e.code)}, ${escapeSql(e.sector)}, ${escapeSql(e.region)}, ${escapeSql(e.riskScore)}, ${escapeSql(e.riskLevel)}, ${escapeSql(e.socCoveragePercent)}, ${escapeSql(e.criticalFindings)}, ${escapeSql(e.supervisoryStatus)}, ${escapeSql(e.otEnvironmentPresent ? 1 : 0)}, ${escapeSql(e.lastUpdated)});\n`;
    }

    // 2. Findings Table
    sql += `\n-- Table: findings\n`;
    sql += `CREATE TABLE IF NOT EXISTS findings (\n`;
    sql += `    id TEXT PRIMARY KEY,\n`;
    sql += `    entity_id TEXT NOT NULL,\n`;
    sql += `    entity_name TEXT NOT NULL,\n`;
    sql += `    sector TEXT NOT NULL,\n`;
    sql += `    title TEXT NOT NULL,\n`;
    sql += `    category TEXT NOT NULL,\n`;
    sql += `    severity TEXT NOT NULL,\n`;
    sql += `    description TEXT,\n`;
    sql += `    status TEXT NOT NULL,\n`;
    sql += `    mitre_technique TEXT,\n`;
    sql += `    evidence_json TEXT,\n`;
    sql += `    FOREIGN KEY (entity_id) REFERENCES entities(id)\n`;
    sql += `);\n\n`;

    for (const f of findings) {
      sql += `INSERT INTO findings (id, entity_id, entity_name, sector, title, category, severity, description, status, mitre_technique, evidence_json) VALUES (${escapeSql(f.id)}, ${escapeSql(f.entityId)}, ${escapeSql(f.entityName)}, ${escapeSql(f.sector)}, ${escapeSql(f.title)}, ${escapeSql(f.category)}, ${escapeSql(f.severity)}, ${escapeSql(f.description)}, ${escapeSql(f.status)}, ${escapeSql(f.mitreTechnique)}, ${escapeSql(f.evidenceData)});\n`;
    }

    // 3. Remediation Workflows Table
    sql += `\n-- Table: remediation_workflows\n`;
    sql += `CREATE TABLE IF NOT EXISTS remediation_workflows (\n`;
    sql += `    id TEXT PRIMARY KEY,\n`;
    sql += `    entity_id TEXT NOT NULL,\n`;
    sql += `    entity_name TEXT NOT NULL,\n`;
    sql += `    title TEXT NOT NULL,\n`;
    sql += `    priority TEXT NOT NULL,\n`;
    sql += `    status TEXT NOT NULL,\n`;
    sql += `    assigned_supervisor TEXT,\n`;
    sql += `    statutory_deadline TEXT,\n`;
    sql += `    days_remaining INTEGER,\n`;
    sql += `    progress_percent INTEGER,\n`;
    sql += `    verification_notes TEXT\n`;
    sql += `);\n\n`;

    for (const r of remediation) {
      sql += `INSERT INTO remediation_workflows (id, entity_id, entity_name, title, priority, status, assigned_supervisor, statutory_deadline, days_remaining, progress_percent, verification_notes) VALUES (${escapeSql(r.id)}, ${escapeSql(r.entityId)}, ${escapeSql(r.entityName)}, ${escapeSql(r.title)}, ${escapeSql(r.priority)}, ${escapeSql(r.status)}, ${escapeSql(r.assignedSupervisor)}, ${escapeSql(r.statutoryDeadline)}, ${escapeSql(r.daysRemaining)}, ${escapeSql(r.progressPercent)}, ${escapeSql(r.verificationNotes)});\n`;
    }

    // 4. Raw SOC Alerts (sample top 200 for concise export)
    sql += `\n-- Table: raw_soc_alerts\n`;
    sql += `CREATE TABLE IF NOT EXISTS raw_soc_alerts (\n`;
    sql += `    alert_id TEXT PRIMARY KEY,\n`;
    sql += `    entity_id TEXT NOT NULL,\n`;
    sql += `    category TEXT NOT NULL,\n`;
    sql += `    severity TEXT NOT NULL,\n`;
    sql += `    closure_time_minutes INTEGER,\n`;
    sql += `    escalated TEXT,\n`;
    sql += `    status TEXT,\n`;
    sql += `    is_execution_gap INTEGER\n`;
    sql += `);\n\n`;

    for (const a of alerts.slice(0, 300)) {
      sql += `INSERT INTO raw_soc_alerts (alert_id, entity_id, category, severity, closure_time_minutes, escalated, status, is_execution_gap) VALUES (${escapeSql(a.alert_id)}, ${escapeSql(a.entity_id)}, ${escapeSql(a.category)}, ${escapeSql(a.severity)}, ${escapeSql(a.closure_time_minutes)}, ${escapeSql(a.escalated)}, ${escapeSql(a.status)}, ${escapeSql(a.is_execution_gap ? 1 : 0)});\n`;
    }

    sql += `\nCOMMIT;\n-- END OF SQLITE DUMP\n`;
    return sql;
  }
}

// Global Singleton Instance
export const offlineDb = new IndexedDbService();
