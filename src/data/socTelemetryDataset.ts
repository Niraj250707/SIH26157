import { RawSOCAlert, SOCCaseRecord } from '../types';

export const ALERT_CATEGORIES = [
  'Authentication & Brute Force',
  'Malware & C2 Beaconing',
  'SCADA / ICS Telemetry Anomaly',
  'Data Exfiltration Attempt',
  'Privilege Escalation',
  'Perimeter Boundary Scanning',
  'Lateral Movement',
  'Service Principal Anomaly',
];

export const TEMPLATE_NOTES = [
  'Resolved as per standard SOP - closed without further analysis.',
  'Alert acknowledged. Nominal operational traffic confirmed. No further action needed.',
  'Whitelisted per shift supervisor oral instruction. Ticket closed.',
  'Automated ticket closure - SLA turnaround metric satisfied.',
  'False positive reported by shift analyst. Closed without packet capture review.',
];

export const MEANINGFUL_NOTES = [
  'Identified anomalous Kerberos ticket request from host 10.24.18.99. Isolated endpoint, extracted memory dump for forensic sandbox, escalated to Tier-3 incident response team.',
  'SCADA RTU dual-homed gateway drop verified. Packet capture confirms unencrypted syslog suppression. Firewall rule revised, management interface locked down.',
  'Entra ID service principal role elevation detected outside maintenance window. Revoked global admin consent grant, triggered automated credential rotation and SOC supervisor review.',
  'Airside baggage sorting controller PLC connection reset inspected. Traced to unauthorized dual-homed maintenance laptop; physical port disabled on switch 4A.',
  'Suspicious SMB v1 file transfer to external IP range. Blocked via Palo Alto perimeter NGFW, revoked Active Directory session, initiated full host scan.',
];

// Seeded pseudo-random generator for 100% deterministic offline generation
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateSeededTelemetry(): {
  alerts: RawSOCAlert[];
  cases: SOCCaseRecord[];
} {
  const rand = createSeededRandom(42);

  const entitiesConfig = [
    {
      id: 'ent-001',
      name: 'Metro Continental Power Grid (SCADA/EMS)',
      sector: 'Power & Energy' as const,
      hasExecutionGap: true,
      hasNegativeSpace: true,
      silentAsset: 'AST-MCP-01',
    },
    {
      id: 'ent-002',
      name: 'Apex National Reserve Bank',
      sector: 'Banking & Finance' as const,
      hasExecutionGap: true,
      hasNegativeSpace: false,
      silentAsset: null,
    },
    {
      id: 'ent-003',
      name: 'TransGlobal Telecom Core (5G SA & Evolved Packet Core)',
      sector: 'Telecommunications' as const,
      hasExecutionGap: false,
      hasNegativeSpace: true,
      silentAsset: 'AST-TTC-01',
    },
    {
      id: 'ent-004',
      name: 'Eastern Maritime Port Authority',
      sector: 'Transportation' as const,
      hasExecutionGap: false,
      hasNegativeSpace: true,
      silentAsset: 'AST-EMP-01',
    },
    {
      id: 'ent-005',
      name: 'Capital Central Metro Rail Transit',
      sector: 'Transportation' as const,
      hasExecutionGap: false,
      hasNegativeSpace: false,
      silentAsset: null,
    },
    {
      id: 'ent-006',
      name: 'Continental Expressway & Tollway Network',
      sector: 'Transportation' as const,
      hasExecutionGap: false,
      hasNegativeSpace: false,
      silentAsset: null,
    },
    {
      id: 'ent-007',
      name: 'St. Jude Regional Healthcare System',
      sector: 'Healthcare & Public Health' as const,
      hasExecutionGap: true,
      hasNegativeSpace: false,
      silentAsset: null,
    },
  ];

  const alerts: RawSOCAlert[] = [];
  const cases: SOCCaseRecord[] = [];

  let alertSeq = 1000;
  let caseSeq = 2000;

  entitiesConfig.forEach((entity) => {
    // Generate between 80 and 160 alerts per entity (total ~800 alerts)
    const count = entity.hasNegativeSpace && entity.id === 'ent-004' ? 65 : Math.floor(rand() * 40) + 100;

    for (let i = 0; i < count; i++) {
      alertSeq++;
      caseSeq++;

      const alertId = `ALT-2026-${alertSeq}`;
      const caseId = `CAS-2026-${caseSeq}`;

      const catIndex = Math.floor(rand() * ALERT_CATEGORIES.length);
      const category = ALERT_CATEGORIES[catIndex];

      const sevRoll = rand();
      let severity: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
      if (sevRoll < 0.18) severity = 'Critical';
      else if (sevRoll < 0.45) severity = 'High';
      else if (sevRoll < 0.75) severity = 'Medium';

      let closureTime = 0;
      let isTemplate = false;
      let escalated: 'Yes' | 'No' = 'No';
      let investigationTime = 0;
      let notes = '';

      const isExecutionGapEntity = entity.hasExecutionGap && (severity === 'Critical' || severity === 'High');

      if (isExecutionGapEntity && rand() < 0.7) {
        // Intentionally inject Execution Gap: closed in 4 - 14 minutes, template note, not escalated
        closureTime = Math.floor(rand() * 11) + 4;
        isTemplate = true;
        escalated = 'No';
        investigationTime = Math.floor(rand() * 7) + 2;
        notes = TEMPLATE_NOTES[Math.floor(rand() * TEMPLATE_NOTES.length)];
      } else {
        // Normal SOC operational behavior
        closureTime = severity === 'Critical' ? Math.floor(rand() * 240) + 45 : Math.floor(rand() * 120) + 20;
        isTemplate = rand() < 0.12;
        if (severity === 'Critical') {
          escalated = rand() < 0.85 ? 'Yes' : 'No';
        } else if (severity === 'High') {
          escalated = rand() < 0.45 ? 'Yes' : 'No';
        } else {
          escalated = rand() < 0.1 ? 'Yes' : 'No';
        }
        investigationTime = Math.floor(rand() * 120) + 25;
        notes = isTemplate
          ? TEMPLATE_NOTES[Math.floor(rand() * TEMPLATE_NOTES.length)]
          : MEANINGFUL_NOTES[Math.floor(rand() * MEANINGFUL_NOTES.length)];
      }

      const assetNum = (i % 6) + 1;
      const assetId = `AST-${entity.id.slice(4).toUpperCase()}-${String(assetNum).padStart(2, '0')}`;

      // In Negative Space entities, silent asset drops all alerts!
      if (entity.hasNegativeSpace && entity.silentAsset && assetId === entity.silentAsset) {
        continue;
      }

      const dayOffset = Math.floor(rand() * 28);
      const hourOffset = Math.floor(rand() * 23);
      const minOffset = Math.floor(rand() * 59);
      const date = new Date(Date.now() - (dayOffset * 86400000 + hourOffset * 3600000 + minOffset * 60000));
      const timestamp = date.toISOString().replace('T', ' ').slice(0, 19);

      const isFastCritical = (severity === 'Critical' || severity === 'High') && closureTime < 15;
      const isExecGap = isFastCritical && isTemplate;

      // Statistical anomaly flag (rapid closure or extreme duration or unescalated critical)
      const isAnomaly = (closureTime < 8 && severity === 'Critical') || closureTime > 360 || (severity === 'Critical' && escalated === 'No' && closureTime < 15);

      alerts.push({
        alert_id: alertId,
        entity_id: entity.id,
        entity_name: entity.name,
        sector: entity.sector,
        timestamp,
        category,
        severity,
        asset_id: assetId,
        closure_time_minutes: closureTime,
        escalated,
        status: 'Closed',
        is_execution_gap: isExecGap,
        is_anomaly: isAnomaly,
        anomaly_score: isAnomaly ? -1 : 1,
      });

      cases.push({
        case_id: caseId,
        alert_id: alertId,
        entity_id: entity.id,
        entity_name: entity.name,
        investigation_time_minutes: investigationTime,
        notes_template_flag: isTemplate ? 'Template' : 'Custom Detailed',
        investigation_notes: notes,
        outcome: isTemplate ? 'Suppressed / False Positive' : 'Remediated',
        analyst_id: `ANL-${Math.floor(rand() * 15) + 101}`,
      });
    }
  });

  return { alerts, cases };
}

export const { alerts: STATIC_ALERTS, cases: STATIC_CASES } = generateSeededTelemetry();
