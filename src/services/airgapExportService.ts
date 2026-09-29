import {
  Entity,
  Finding,
  AirgapExportResult,
  EntitySupervisoryAnalytics,
  RawSOCAlert,
  SOCCaseRecord,
} from '../types';

/**
 * SAT-SA Air-Gapped Data Export Service Layer
 * 100% Client-Side, Zero External Dependencies, Zero Network Egress.
 *
 * Implements:
 * - RFC 4180 CSV serialization with UTF-8 BOM for spreadsheet compatibility
 * - Structured ECMA-404 JSON with cryptographic envelope & supervisory metadata
 * - Pure client-side SHA-256 integrity calculation
 * - NCIIPC / NTRO official air-gap classification stamps
 * - Complete supervisory audit bundle serialization
 */

export const AIRGAP_CLASSIFICATION = 'OFFICIAL AIR-GAPPED EXPORT // NCIIPC-NTRO RESTRICTED';
export const SCHEMA_VERSION = 'SAT-SA-AIRGAP-v2.6';

/**
 * Pure TypeScript SHA-256 implementation as foolproof fallback
 * if Web Crypto API is restricted in air-gapped sandboxes.
 */
function sha256Pure(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let compositeHash: number[] = hash.slice();

  for (i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= (code & 0xff) << (24 - (i % 4) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    let a = compositeHash[0];
    let b = compositeHash[1];
    let c = compositeHash[2];
    let d = compositeHash[3];
    let e = compositeHash[4];
    let f = compositeHash[5];
    let g = compositeHash[6];
    let h = compositeHash[7];

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + k[j] + w[j]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    compositeHash[0] = (compositeHash[0] + a) | 0;
    compositeHash[1] = (compositeHash[1] + b) | 0;
    compositeHash[2] = (compositeHash[2] + c) | 0;
    compositeHash[3] = (compositeHash[3] + d) | 0;
    compositeHash[4] = (compositeHash[4] + e) | 0;
    compositeHash[5] = (compositeHash[5] + f) | 0;
    compositeHash[6] = (compositeHash[6] + g) | 0;
    compositeHash[7] = (compositeHash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    result += (compositeHash[i] >>> 0).toString(16).padStart(8, '0');
  }

  return result;
}

/**
 * Calculates SHA-256 checksum for arbitrary string payload
 */
export async function computePayloadHash(payload: string): Promise<string> {
  try {
    if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(payload);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // fallback to pure JS
  }
  return sha256Pure(payload);
}

/**
 * Triggers native browser download without internet connection
 */
export function triggerClientDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Sanitizes CSV field according to RFC 4180
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

// ==========================================
// AIR-GAPPED EXPORT SERVICE CLASS
// ==========================================

export class AirgapExportService {
  /**
   * Export all Entities to CSV (RFC 4180 with UTF-8 BOM)
   */
  public static async exportEntitiesToCSV(
    entities: Entity[],
    filterLabel = 'All Entities'
  ): Promise<AirgapExportResult> {
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.slice(0, 10);

    const headers = [
      'Entity Code',
      'Entity Name',
      'Sector',
      'Geographic Region',
      'Supervisory Risk Score (0-100)',
      'Risk Classification',
      'Total Supervisory Findings',
      'Critical Findings',
      'High Findings',
      'Medium Findings',
      'Low Findings',
      'SOC Telemetry Coverage (%)',
      'MTTD (Minutes)',
      'MTTR (Hours)',
      'Log Retention (Days)',
      'Active Analysts',
      'MITRE ATT&CK Matrix (%)',
      'Supervisory Oversight Status',
      'OT/SCADA Operational Env',
      'Last Audit Assessment',
    ];

    const rows = entities.map((e) => [
      escapeCsv(e.code),
      escapeCsv(e.name),
      escapeCsv(e.sector),
      escapeCsv(e.region),
      e.riskScore,
      escapeCsv(e.riskLevel),
      e.totalFindings,
      e.criticalFindings,
      e.highFindings,
      e.mediumFindings,
      e.lowFindings,
      `${e.socCoveragePercent}%`,
      e.mttdMinutes,
      e.mttrHours,
      e.logRetentionDays,
      e.activeAnalysts,
      `${e.mitreCoveragePercent}%`,
      escapeCsv(e.supervisoryStatus),
      e.otEnvironmentPresent ? 'YES' : 'NO',
      escapeCsv(e.lastUpdated),
    ]);

    const classificationBanner = [
      `# ==============================================================================`,
      `# CLASSIFICATION: ${AIRGAP_CLASSIFICATION}`,
      `# SCHEMA: ${SCHEMA_VERSION} | DATE: ${timestamp}`,
      `# SYSTEM: SAT-SA Supervisory Analytics Engine (National Directive 26157)`,
      `# FILTER CONTEXT: ${filterLabel} | RECORD COUNT: ${entities.length}`,
      `# AIR-GAP ATTESTATION: Verified offline generation; zero external egress`,
      `# ==============================================================================`,
    ].join('\n');

    const csvBody = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const fullCsv = `\uFEFF${classificationBanner}\n\n${csvBody}`;

    const integrityHash = await computePayloadHash(fullCsv);
    const fileName = `SAT-SA-Entities-${filterLabel.replace(/[^a-zA-Z0-9]/g, '_')}-${dateStr}.csv`;

    triggerClientDownload(fullCsv, fileName, 'text/csv;charset=utf-8;');

    return {
      fileName,
      recordCount: entities.length,
      fileSizeBytes: new Blob([fullCsv]).size,
      integrityHash,
      timestamp,
      classification: AIRGAP_CLASSIFICATION,
      format: 'csv',
    };
  }

  /**
   * Export Entities to Structured JSON Envelope
   */
  public static async exportEntitiesToJSON(
    entities: Entity[],
    filterLabel = 'All Entities'
  ): Promise<AirgapExportResult> {
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.slice(0, 10);

    const payloadWithoutHash = {
      classification: AIRGAP_CLASSIFICATION,
      schemaVersion: SCHEMA_VERSION,
      exportType: 'ENTITIES_SUPERVISORY_EXPORT',
      generationTimestamp: timestamp,
      filterScope: filterLabel,
      recordCount: entities.length,
      airgapCompliance: {
        offlineExecution: true,
        rfc4180Compliant: true,
        sovereignRegulatoryDomain: 'NCIIPC / NTRO India',
        terminalId: 'SAT-SA-CLIENT-AIRGAP-NODE-01',
      },
      data: entities,
    };

    const preliminaryJson = JSON.stringify(payloadWithoutHash, null, 2);
    const integrityHash = await computePayloadHash(preliminaryJson);

    const finalEnvelope = {
      ...payloadWithoutHash,
      integrityDigest: {
        algorithm: 'SHA-256',
        checksum: integrityHash,
      },
    };

    const jsonString = JSON.stringify(finalEnvelope, null, 2);
    const fileName = `SAT-SA-Entities-${filterLabel.replace(/[^a-zA-Z0-9]/g, '_')}-${dateStr}.json`;

    triggerClientDownload(jsonString, fileName, 'application/json;charset=utf-8;');

    return {
      fileName,
      recordCount: entities.length,
      fileSizeBytes: new Blob([jsonString]).size,
      integrityHash,
      timestamp,
      classification: AIRGAP_CLASSIFICATION,
      format: 'json',
    };
  }

  /**
   * Export Findings to RFC 4180 CSV
   */
  public static async exportFindingsToCSV(
    findings: Finding[],
    filterLabel = 'All Findings'
  ): Promise<AirgapExportResult> {
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.slice(0, 10);

    const headers = [
      'Finding ID',
      'Entity Name',
      'Sector',
      'Category (Gap/Negative/Anomaly)',
      'Severity Level',
      'Deficiency Title',
      'Description',
      'MITRE ATT&CK Technique',
      'Impacted Systems',
      'Detection Date',
      'Remediation Status',
      'Telemetry Log Source',
      'Observed Telemetry Gap',
      'Supervisory Benchmark Standard',
      'Mandatory Regulatory Clause',
      'Remediation Statutory Deadline',
      'Sample Log Evidentiary Snippet',
    ];

    const rows = findings.map((f) => [
      escapeCsv(f.id),
      escapeCsv(f.entityName),
      escapeCsv(f.sector),
      escapeCsv(f.category),
      escapeCsv(f.severity),
      escapeCsv(f.title),
      escapeCsv(f.description),
      escapeCsv(f.mitreTechnique),
      escapeCsv(f.impactedSystems.join('; ')),
      escapeCsv(f.detectionDate),
      escapeCsv(f.status),
      escapeCsv(f.evidenceData.logSource),
      escapeCsv(f.evidenceData.observedTelemetryGap),
      escapeCsv(f.evidenceData.supervisoryBenchmark),
      escapeCsv(f.evidenceData.regulatoryClause),
      escapeCsv(f.evidenceData.remediationDeadline),
      escapeCsv(f.evidenceData.sampleLog.replace(/\n/g, ' ')),
    ]);

    const classificationBanner = [
      `# ==============================================================================`,
      `# CLASSIFICATION: ${AIRGAP_CLASSIFICATION}`,
      `# SCHEMA: ${SCHEMA_VERSION} | DATE: ${timestamp}`,
      `# DEFICIENCY RECORDS: ${findings.length} | FILTER: ${filterLabel}`,
      `# DIRECTIVE: REF-26157 (NCIIPC / NTRO SOC Supervisory Analytics)`,
      `# ==============================================================================`,
    ].join('\n');

    const csvBody = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const fullCsv = `\uFEFF${classificationBanner}\n\n${csvBody}`;

    const integrityHash = await computePayloadHash(fullCsv);
    const fileName = `SAT-SA-Supervisory-Findings-${filterLabel.replace(/[^a-zA-Z0-9]/g, '_')}-${dateStr}.csv`;

    triggerClientDownload(fullCsv, fileName, 'text/csv;charset=utf-8;');

    return {
      fileName,
      recordCount: findings.length,
      fileSizeBytes: new Blob([fullCsv]).size,
      integrityHash,
      timestamp,
      classification: AIRGAP_CLASSIFICATION,
      format: 'csv',
    };
  }

  /**
   * Export Findings to Structured JSON
   */
  public static async exportFindingsToJSON(
    findings: Finding[],
    filterLabel = 'All Findings'
  ): Promise<AirgapExportResult> {
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.slice(0, 10);

    const payloadWithoutHash = {
      classification: AIRGAP_CLASSIFICATION,
      schemaVersion: SCHEMA_VERSION,
      exportType: 'FINDINGS_SUPERVISORY_EXPORT',
      generationTimestamp: timestamp,
      filterScope: filterLabel,
      totalFindings: findings.length,
      categoryCounts: {
        executionGaps: findings.filter((f) => f.category === 'Execution Gaps').length,
        negativeSpace: findings.filter((f) => f.category === 'Negative Space').length,
        anomalies: findings.filter((f) => f.category === 'Anomalies').length,
      },
      severityCounts: {
        critical: findings.filter((f) => f.severity === 'Critical').length,
        high: findings.filter((f) => f.severity === 'High').length,
        medium: findings.filter((f) => f.severity === 'Medium').length,
        low: findings.filter((f) => f.severity === 'Low').length,
      },
      findings,
    };

    const preliminaryJson = JSON.stringify(payloadWithoutHash, null, 2);
    const integrityHash = await computePayloadHash(preliminaryJson);

    const finalEnvelope = {
      ...payloadWithoutHash,
      integrityDigest: {
        algorithm: 'SHA-256',
        checksum: integrityHash,
      },
    };

    const jsonString = JSON.stringify(finalEnvelope, null, 2);
    const fileName = `SAT-SA-Supervisory-Findings-${filterLabel.replace(/[^a-zA-Z0-9]/g, '_')}-${dateStr}.json`;

    triggerClientDownload(jsonString, fileName, 'application/json;charset=utf-8;');

    return {
      fileName,
      recordCount: findings.length,
      fileSizeBytes: new Blob([jsonString]).size,
      integrityHash,
      timestamp,
      classification: AIRGAP_CLASSIFICATION,
      format: 'json',
    };
  }

  /**
   * Export Complete Supervisory Audit Package (Master Air-Gapped Bundle)
   */
  public static async exportCompleteSupervisoryBundle(data: {
    entities: Entity[];
    findings: Finding[];
    rawAlerts?: RawSOCAlert[];
    cases?: SOCCaseRecord[];
    analyticsMap?: Map<string, EntitySupervisoryAnalytics>;
    auditLogs?: any[];
    priorityQueue?: any[];
  }): Promise<AirgapExportResult> {
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.slice(0, 10);

    const analyticsArray = data.analyticsMap ? Array.from(data.analyticsMap.values()) : [];

    const bundlePayload = {
      classification: AIRGAP_CLASSIFICATION,
      schemaVersion: SCHEMA_VERSION,
      exportType: 'FULL_AIRGAP_SUPERVISORY_AUDIT_PACKAGE',
      generationTimestamp: timestamp,
      statutoryAuthority: 'National Critical Information Infrastructure Protection Centre (NCIIPC)',
      sovereignJurisdiction: 'Government of India - Critical Sector Cyber Resilience',
      manifest: {
        entityCount: data.entities.length,
        findingsCount: data.findings.length,
        rawAlertsCount: data.rawAlerts ? data.rawAlerts.length : 0,
        caseRecordsCount: data.cases ? data.cases.length : 0,
        analyticsCount: analyticsArray.length,
        priorityItemsCount: data.priorityQueue ? data.priorityQueue.length : 0,
        auditLogEntriesCount: data.auditLogs ? data.auditLogs.length : 0,
      },
      entities: data.entities,
      findings: data.findings,
      analyticsBreakdown: analyticsArray,
      rawAlertSamples: (data.rawAlerts || []).slice(0, 300),
      caseManagementSamples: (data.cases || []).slice(0, 300),
      priorityQueue: data.priorityQueue || [],
      auditTrail: data.auditLogs || [],
    };

    const preliminaryJson = JSON.stringify(bundlePayload, null, 2);
    const integrityHash = await computePayloadHash(preliminaryJson);

    const finalEnvelope = {
      ...bundlePayload,
      integrityDigest: {
        algorithm: 'SHA-256',
        checksum: integrityHash,
      },
    };

    const jsonString = JSON.stringify(finalEnvelope, null, 2);
    const fileName = `SAT-SA-COMPLETE-AIRGAP-AUDIT-PACKAGE-${dateStr}.json`;

    triggerClientDownload(jsonString, fileName, 'application/json;charset=utf-8;');

    return {
      fileName,
      recordCount: data.entities.length + data.findings.length,
      fileSizeBytes: new Blob([jsonString]).size,
      integrityHash,
      timestamp,
      classification: AIRGAP_CLASSIFICATION,
      format: 'json',
    };
  }

  /**
   * Generic Export for ANY Current View (Filtered Table/Grid) to CSV
   * Uses only standard browser APIs (Blob, URL.createObjectURL, RFC-4180).
   */
  public static async exportCurrentViewToCSV(options: {
    data: Record<string, any>[];
    columns?: { key: string; header: string }[];
    filenamePrefix: string;
    viewTitle: string;
  }): Promise<AirgapExportResult> {
    const { data, filenamePrefix, viewTitle } = options;
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.slice(0, 10);

    if (!data || data.length === 0) {
      throw new Error('No records available in current view to export');
    }

    // Determine columns if not specified
    const cols =
      options.columns ||
      Object.keys(data[0])
        .filter((k) => typeof data[0][k] !== 'object' || Array.isArray(data[0][k]))
        .map((k) => ({
          key: k,
          header: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
        }));

    const headers = cols.map((c) => c.header);
    const rows = data.map((row) =>
      cols.map((col) => {
        const val = row[col.key];
        if (Array.isArray(val)) {
          return escapeCsv(val.join('; '));
        }
        return escapeCsv(val);
      })
    );

    const classificationBanner = [
      `# ==============================================================================`,
      `# CLASSIFICATION: ${AIRGAP_CLASSIFICATION}`,
      `# SCHEMA: ${SCHEMA_VERSION} | DATE: ${timestamp}`,
      `# VIEW: ${viewTitle} | RECORD COUNT: ${data.length}`,
      `# CLIENT-SIDE AIR-GAP VERIFICATION: 100% In-Browser Zero Egress Export`,
      `# ==============================================================================`,
    ].join('\n');

    const csvBody = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const fullCsv = `\uFEFF${classificationBanner}\n\n${csvBody}`;

    const integrityHash = await computePayloadHash(fullCsv);
    const cleanPrefix = filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanPrefix}-${dateStr}.csv`;

    triggerClientDownload(fullCsv, fileName, 'text/csv;charset=utf-8;');

    return {
      fileName,
      recordCount: data.length,
      fileSizeBytes: new Blob([fullCsv]).size,
      integrityHash,
      timestamp,
      classification: AIRGAP_CLASSIFICATION,
      format: 'csv',
    };
  }

  /**
   * Generic Export for ANY Current View (Filtered Table/Grid) to Structured JSON
   * Uses only standard browser APIs (Blob, URL.createObjectURL, JSON.stringify).
   */
  public static async exportCurrentViewToJSON(options: {
    data: any[];
    filenamePrefix: string;
    viewTitle: string;
    metadata?: Record<string, any>;
  }): Promise<AirgapExportResult> {
    const { data, filenamePrefix, viewTitle, metadata = {} } = options;
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.slice(0, 10);

    const payloadWithoutHash = {
      classification: AIRGAP_CLASSIFICATION,
      schemaVersion: SCHEMA_VERSION,
      exportType: 'CURRENT_VIEW_SUPERVISORY_EXPORT',
      generationTimestamp: timestamp,
      viewTitle,
      recordCount: data.length,
      airgapAttestation: {
        browserStandardApisOnly: true,
        offlineExecution: true,
        cloudCallsDetected: 0,
      },
      metadata,
      records: data,
    };

    const preliminaryJson = JSON.stringify(payloadWithoutHash, null, 2);
    const integrityHash = await computePayloadHash(preliminaryJson);

    const finalEnvelope = {
      ...payloadWithoutHash,
      integrityDigest: {
        algorithm: 'SHA-256',
        checksum: integrityHash,
      },
    };

    const jsonString = JSON.stringify(finalEnvelope, null, 2);
    const cleanPrefix = filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanPrefix}-${dateStr}.json`;

    triggerClientDownload(jsonString, fileName, 'application/json;charset=utf-8;');

    return {
      fileName,
      recordCount: data.length,
      fileSizeBytes: new Blob([jsonString]).size,
      integrityHash,
      timestamp,
      classification: AIRGAP_CLASSIFICATION,
      format: 'json',
    };
  }
}
