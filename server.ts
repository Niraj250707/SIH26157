import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '10mb' }));

  // Shared Gemini client setup
  const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // AI-powered Risk Advisor endpoint
  app.post('/api/ai/risk-advisor', async (req, res) => {
    try {
      const { message, contextData } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Missing user message' });
      }

      // If no API key or in simulated demo mode
      if (!process.env.GEMINI_API_KEY || !ai) {
        // High-fidelity domain-accurate supervisory response
        const fallback = generateSupervisoryAnalysis(message, contextData);
        return res.json({ reply: fallback });
      }

      const systemInstruction = `You are "SAT-SA Risk Advisor", the elite National Cyber Supervisory AI for government inspectors overseeing Critical Sector Entities (Power & Energy, Banking & Finance, Telecommunications, Transportation, Healthcare, Water & Dams, Government Services).
Your duty is to provide authoritative, rigorous, and actionable supervisory guidance adhering strictly to NIST CSF 2.0, MITRE ATT&CK for Enterprise/ICS, and National Critical Infrastructure Directives.

Current Live Telemetry Context:
- Total Monitored Entities: ${contextData?.entityCount || 12}
- Average Fleet Risk Score: ${contextData?.avgRiskScore || 61.6}/100
- Fleet Compliance Index: ${contextData?.fleetCompliance || '78.4%'}
- High Risk Operators: ${JSON.stringify(contextData?.highRiskEntities || [
  { name: 'Metro Continental Power Grid', code: 'MCP-01', risk: 89, sector: 'Power & Energy', issue: '68-day DMZ OT log gap' },
  { name: 'Apex National Reserve Bank', code: 'ANB-04', risk: 82, sector: 'Banking & Finance', issue: 'Service Principal Entra ID anomaly' },
  { name: 'TransGlobal Telecom Core', code: 'TTC-02', risk: 78, sector: 'Telecommunications', issue: '5G core packet drop' },
  { name: 'Port Authority Maritime Logistics', code: 'PML-08', risk: 76, sector: 'Transportation', issue: 'Quay crane unmonitored link' }
])}
- Critical Deficiencies Active: ${JSON.stringify(contextData?.criticalFindings || [
  'OT DMZ Dual-Homed Gateway Logs Missing in Central SIEM',
  'Absence of Behavioral Correlation for Cloud Entra ID Service Principals',
  'Automated Port Crane Wireless Link Lacks Encrypted Telemetry Ingestion'
])}

Instructions:
1. Always structure your response clearly: Executive Assessment, Specific Risk Drivers, and Recommended Supervisory Action (e.g. Issue Statutory Directive, Escalate to Triage Priority 1, Conduct On-Site Technical Audit).
2. Cite regulatory frameworks where appropriate (NCSC-DIR-2026, NIST SP 800-82, CISA Cross-Sector Goals).
3. Keep the tone authoritative, concise, objective, and executive-ready.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nInspector Query: "${message}"` }],
          },
        ],
      });

      const reply = response.text || generateSupervisoryAnalysis(message, contextData);
      return res.json({ reply });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      const fallback = generateSupervisoryAnalysis(req.body.message, req.body.contextData);
      return res.json({ reply: fallback });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'nominal',
      service: 'SAT-SA Sovereign Supervisory Core',
      timestamp: new Date().toISOString(),
      geminiConnected: !!process.env.GEMINI_API_KEY,
    });
  });

  // Vite development mode middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SAT-SA Supervisory Server running on http://0.0.0.0:${PORT}`);
  });
}

function generateSupervisoryAnalysis(query: string, context: any): string {
  const q = (query || '').toLowerCase();

  if (q.includes('metro') || q.includes('power') || q.includes('grid') || q.includes('scada')) {
    return `### Supervisory Assessment: Metro Continental Power Grid (MCP-01)

**Risk Posture:** Critical Exposure (89/100 · Rank #1)
- **Primary Finding:** OT DMZ Dual-Homed Gateway syslog forwarding has been suppressed for 68 consecutive days.
- **Vulnerability Nexus:** SCADA Intertie RTU Gateway (AST-SCADA-011) running unpatched VxWorks firmware (CVE-2026-38291).
- **Compliance Status:** Non-compliant with National Electric Infrastructure Security Standard §4.2.

**Recommended Supervisory Mitigation:**
1. **Immediate Statutory Order:** Dispatch an Emergency Notice of Deficiency requiring restoration of Syslog-ng forwarding to the Central SIEM within 48 hours.
2. **Technical Audit:** Mandate independent third-party validation of boundary firewall rules (AST-FW-SUB-04).
3. **Escalation:** Maintain under Active Enhanced Oversight with weekly technical attestation.`;
  }

  if (q.includes('apex') || q.includes('bank') || q.includes('finance')) {
    return `### Supervisory Assessment: Apex National Reserve Bank (ANB-04)

**Risk Posture:** High Risk (82/100 · Rank #2)
- **Primary Finding:** Uncorrelated Entra ID non-human service principal escalated to Global Administrator without Multi-Factor or PAM authorization.
- **Operational Deficit:** MTTD is 195 minutes against the 60-minute regulatory ceiling; 412 unreviewed alerts backlogged over weekend shift.
- **Regulatory Clause:** Article 14 Supervisory Mandate on Continuous Financial Interbank Logging.

**Recommended Supervisory Mitigation:**
1. Require immediate cryptographic key revocation for compromised service principals.
2. Mandate reallocation of 4 dedicated Tier-2 analysts to clear triage queue backlogs within 72 hours.
3. Issue an administrative warning citing SLA delinquency.`;
  }

  if (q.includes('mitigat') || q.includes('recommend') || q.includes('action')) {
    return `### National Cyber Inspectorate Strategic Recommendations

Based on aggregate analysis across all 12 Critical Sector Entities:
1. **Critical Priority:** Focus immediate enforcement on **Power & Energy** (MCP-01) and **Maritime Transport** (PML-08), where OT boundary visibility has degraded below 60%.
2. **SLA Adherence:** 3 of 12 operators exceed the statutory MTTD threshold (180 mins). Issue automated summons for staffing reviews.
3. **Credential Security:** Audit all cloud service principals across Banking & Government portals to curb unmonitored lateral escalation.
4. **Directives:** Escalate Priority Item #1 and #2 to Formal Directives in the Priority Review Queue.`;
  }

  return `### SAT-SA Supervisory Intelligence Brief

**Current Fleet Summary:**
- **Monitored Entities:** 12 Critical Operators across 5 Sovereign Regions.
- **High-Risk Entities:** 5 Operators (Composite Risk Index: 61.6/100).
- **Fleet Compliance Score:** 78.4% (+4.2% over past 30 days).
- **Active Telemetry Anomaly:** SCADA Gateway AST-SCADA-011 in the Northern Grid Region is reporting BLIND status.

**Supervisory Advice:**
Inquire specifically regarding any entity (e.g. *Metro Continental*, *Apex Bank*, *Port Authority*) or ask for sector comparative gap analyses or formal directive drafting.`;
}

startServer();
