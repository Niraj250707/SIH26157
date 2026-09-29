# SAT-SA: Supervisory Analytics Tool for SOC Assessment
### Smart India Hackathon 2026 | Problem Statement 26157
**Organization:** National Technical Research Organisation (NTRO) / National Critical Information Infrastructure Protection Centre (NCIIPC)  
**Category:** Software | **Theme:** Blockchain & Cybersecurity

---

## 1. Executive Summary & Problem Understanding

The National Critical Information Infrastructure Protection Centre (NCIIPC) conducts supervisory reviews of Security Operations Centres (SOCs) across Critical Sector Entities (CSEs) in Power & Energy, Banking & Finance, Telecommunications, Transportation, Civil Aviation, and Government Services.

Conventional KPI dashboards and audit checklists report nominal numbers (e.g. *99% SLA adherence*), yet manual sampling consistently uncovers critical operational deficiencies that traditional audits miss:
1. **Execution Gaps:** Good on paper, poorly executed in reality (e.g., Critical alerts closed in <15 minutes with empty or template notes; high-severity cases closed with zero escalation).
2. **Negative Space:** Missing expected evidence (e.g., critical SCADA RTUs with zero alerts over 30+ days; broken syslog pipelines; blind spots in core networks).

**SAT-SA (Supervisory Analytics Tool for SOC Assessment)** is a **100% offline, air-gapped, privacy-preserving analytical suite** designed to empower human supervisors to analyze periodic alert metadata, prioritize investigations for manual review, benchmark entities against peers, and enforce prescriptive remediation directives.

---

## 2. Core Architecture & Tech Stack (100% Offline)

| Layer | Technology | Operational Justification |
| :--- | :--- | :--- |
| **User Interface** | Streamlit + React/Vite | Clean government cybersecurity dark theme, zero-latency local rendering |
| **Data Processing** | Pandas + NumPy | High-performance feature engineering on alert & case metadata |
| **Anomaly Detection** | Scikit-learn (Isolation Forest) | Multivariate unsupervised outlier identification without cloud APIs |
| **Visualization** | Plotly + Recharts | Interactive radar charts, risk distribution donuts, and longitudinal trends |
| **Local Storage** | SQLite + CSV | Encrypted, air-gapped, zero-network database storage |
| **Report Generation** | ReportLab | Native PDF generation without internet, browser, or printer dependencies |

---

## 3. Seven Monitored Critical Sector Entities (CSEs)

SAT-SA includes synthesized telemetry adhering strictly to the NCIIPC/NTRO National Cyber Supervisory Directive 26157 specifications:
1. **National Power Grid Corporation** (Power & Energy) — *Injected with SCADA RTU 68-day telemetry suppression*
2. **Apex National Bank** (Banking & Finance) — *Injected with Entra ID service principal unmonitored elevation*
3. **Bharat Telecom Ltd** (Telecommunications) — *Injected with 5G roaming interface flooding gap*
4. **Metro Airport Authority** (Civil Aviation) — *Injected with airside baggage SCADA VLAN bypass*
5. **Eastern Port Trust** (Maritime Logistics) — *Injected with quay crane wireless data diode omission*
6. **Central Metro Rail** (Urban Mass Transit) — *Benchmarked mass transit signalling telemetry*
7. **National Highway Authority** (Transport Infrastructure) — *Tollway sensor perimeter analytics*

---

## 4. Key Functional Modules

1. **Overview Dashboard:**
   - 4 supervisory metrics: Total Entities, High-Risk Entities, Execution Gaps, Review Priority.
   - Interactive Risk Distribution Donut & Top 5 High-Risk Entities table.
   - **Automated Remediation Proposals:** Algorithmic patch & policy proposals with 1-click deployment into the remediation engine.
2. **Entity Risk View:**
   - Searchable, sortable matrix with composite risk scores (0–100) and risk tier badges.
   - Drill-down inspector for category breakdowns and asset telemetry health.
3. **Findings Explorer (Evidence Drawer):**
   - Categorized by **Execution Gaps**, **Negative Space**, and **Statistical Anomalies**.
   - Evidence Drawer format: *1. What was detected*, *2. Why it is a problem*, *3. Supporting Operational Evidence*.
4. **Priority Review Queue:**
   - Algorithmic triage queue prioritizing alerts requiring immediate supervisory inspection.
   - In-memory state tracking (`st.session_state`) for *"Mark as Reviewed"*.
5. **Peer Comparison & Benchmarking:**
   - Dynamic radar chart comparing an entity against the sector peer cohort baseline across 5 supervisory vectors.
6. **Reports (Official PDF Export):**
   - Air-gapped PDF generation via ReportLab complete with executive summaries, metrics tables, and Corrective Action Plans (CAP).
7. **Data Ingestion:**
   - Drag-and-drop CSV / JSON file uploader with schema validation.

---

## 5. Quickstart & Run Instructions

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Generate Synthetic SOC Data
```bash
python generate_data.py
```
*Creates `satsa.db` and synthetic CSV records in `data/`.*

### Step 3: Run the Air-Gapped Streamlit App
```bash
streamlit run app.py
```

### Step 4: Access Application
Open your browser to: **`http://localhost:8501`** (or port 3000 for the full web platform).
