#!/usr/bin/env python3
"""
SAT-SA Synthetic Data Generator
Smart India Hackathon 2026 - Problem Statement 26157 (NCIIPC / NTRO)
Supervisory Analytics Tool for SOC Assessment

Generates realistic SOC alert metadata, case management investigations,
and asset inventories with intentionally injected:
- Execution Gaps (superficial closures, rapid triage without investigation)
- Negative Space (silent critical assets, missing expected alert vectors)
- Anomalies (Isolation Forest outliers in closure velocity and escalation)
"""

import os
import sqlite3
import random
import datetime
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(os.path.dirname(__file__), "satsa.db")

CRITICAL_SECTOR_ENTITIES = [
    {
        "entity_id": "CSE-001",
        "name": "National Power Grid Corporation",
        "sector": "Power & Energy",
        "criticality": "Tier-1 Sovereign",
        "size": "Very Large",
        "baseline_mttd": 18,
        "region": "Northern Grid",
        "has_execution_gap": True,
        "has_negative_space": True,
    },
    {
        "entity_id": "CSE-002",
        "name": "Apex National Bank",
        "sector": "Banking & Finance",
        "criticality": "Tier-1 Sovereign",
        "size": "Very Large",
        "baseline_mttd": 12,
        "region": "Western Financial Belt",
        "has_execution_gap": True,
        "has_negative_space": False,
    },
    {
        "entity_id": "CSE-003",
        "name": "Bharat Telecom Ltd",
        "sector": "Telecommunications",
        "criticality": "Tier-1 Sovereign",
        "size": "Large",
        "baseline_mttd": 15,
        "region": "National Backbone",
        "has_execution_gap": False,
        "has_negative_space": True,
    },
    {
        "entity_id": "CSE-004",
        "name": "Metro Airport Authority",
        "sector": "Civil Aviation",
        "criticality": "Tier-2 Vital",
        "size": "Medium",
        "baseline_mttd": 22,
        "region": "Capital Region",
        "has_execution_gap": True,
        "has_negative_space": False,
    },
    {
        "entity_id": "CSE-005",
        "name": "Eastern Port Trust",
        "sector": "Maritime Logistics",
        "criticality": "Tier-2 Vital",
        "size": "Medium",
        "baseline_mttd": 25,
        "region": "Eastern Seaboard",
        "has_execution_gap": False,
        "has_negative_space": True,
    },
    {
        "entity_id": "CSE-006",
        "name": "Central Metro Rail",
        "sector": "Urban Mass Transit",
        "criticality": "Tier-2 Vital",
        "size": "Medium",
        "baseline_mttd": 20,
        "region": "Central Corridor",
        "has_execution_gap": False,
        "has_negative_space": False,
    },
    {
        "entity_id": "CSE-007",
        "name": "National Highway Authority",
        "sector": "Transportation",
        "criticality": "Tier-3 Significant",
        "size": "Large",
        "baseline_mttd": 30,
        "region": "National Arterial",
        "has_execution_gap": False,
        "has_negative_space": False,
    },
]

ALERT_CATEGORIES = [
    "Authentication & Brute Force",
    "Malware & C2 Beaconing",
    "SCADA / ICS Telemetry Anomaly",
    "Data Exfiltration Attempt",
    "Privilege Escalation",
    "Perimeter Boundary Scanning",
    "Lateral Movement",
    "Service Principal Anomaly",
]

TEMPLATE_NOTES = [
    "Resolved as per standard SOP - closed.",
    "Alert acknowledged. Nominal traffic confirmed. No further action.",
    "Whitelisted per shift supervisor instruction. Ticket closed.",
    "Automated ticket closure - SLA satisfied.",
    "False positive reported by analyst. Closed.",
]

MEANINGFUL_NOTES = [
    "Identified anomalous Kerberos ticket request from host 10.24.18.99. Isolated endpoint, extracted memory dump for forensic sandbox, escalated to Tier-3 incident handler.",
    "SCADA RTU dual-homed gateway drop verified. Packet capture confirms unencrypted syslog suppression. Firewall rule AST-FW-SUB-04 revised, management interface locked down.",
    "Entra ID service principal role elevation detected outside maintenance window. Revoked global admin consent grant, triggered automated credential rotation.",
    "Airside baggage sorting controller PLC connection reset inspected. Traced to unauthorized dual-homed maintenance laptop; physical port disabled on switch 4A.",
]


def generate_synthetic_soc_data(num_alerts: int = 1400) -> tuple:
    """Generate complete relational synthetic dataset for the 7 CSEs."""
    os.makedirs(DATA_DIR, exist_ok=True)
    random.seed(42)
    np.random.seed(42)

    alerts = []
    cases = []
    assets = []
    now = datetime.datetime.now()

    # 1. Assets generation
    for entity in CRITICAL_SECTOR_ENTITIES:
        eid = entity["entity_id"]
        ename = entity["name"]

        # Generate 6 assets per entity
        asset_types = ["SCADA Master", "Core Router", "Database Cluster", "Domain Controller", "DMZ Firewall", "Payment Switch"]
        for idx, atype in enumerate(asset_types):
            asset_tag = f"AST-{eid[-3:]}-{idx+1:02d}"
            # Inject Negative Space: specific critical assets report silent / blind
            is_silent = (entity["has_negative_space"] and idx == 0)

            assets.append({
                "asset_id": asset_tag,
                "entity_id": eid,
                "entity_name": ename,
                "asset_type": atype,
                "zone": "OT Supervisory L2" if "SCADA" in atype else "Core IT",
                "criticality": "High" if idx < 3 else "Medium",
                "telemetry_status": "BLIND_SILENT" if is_silent else "ACTIVE",
                "days_since_last_alert": random.randint(35, 72) if is_silent else random.randint(0, 3),
            })

    # 2. Alerts & Cases generation
    alert_counter = 1
    case_counter = 1

    for _ in range(num_alerts):
        entity = random.choice(CRITICAL_SECTOR_ENTITIES)
        eid = entity["entity_id"]
        ename = entity["name"]

        alert_id = f"ALT-2026-{alert_counter:05d}"
        alert_counter += 1

        delta_days = random.randint(0, 30)
        delta_hours = random.randint(0, 23)
        delta_minutes = random.randint(0, 59)
        timestamp = now - datetime.timedelta(days=delta_days, hours=delta_hours, minutes=delta_minutes)

        category = random.choice(ALERT_CATEGORIES)
        severity = random.choices(["Critical", "High", "Medium", "Low"], weights=[0.15, 0.30, 0.35, 0.20])[0]

        # Execution Gap injection for flagged entities
        if entity["has_execution_gap"] and severity in ["Critical", "High"]:
            # Intentionally close in < 15 minutes with template notes
            closure_time_min = random.randint(2, 14)
            is_template = True
            escalated = "No"  # Execution Gap: Critical alert closed without escalation
            investigation_notes = random.choice(TEMPLATE_NOTES)
            investigation_time = random.randint(2, 8)
        else:
            closure_time_min = random.randint(45, 480) if severity in ["Critical", "High"] else random.randint(15, 120)
            is_template = random.random() < 0.15
            escalated = "Yes" if (severity == "Critical" and random.random() < 0.85) else ("Yes" if random.random() < 0.25 else "No")
            investigation_notes = random.choice(TEMPLATE_NOTES if is_template else MEANINGFUL_NOTES)
            investigation_time = random.randint(30, 180)

        # Asset selection
        entity_assets = [a for a in assets if a["entity_id"] == eid]
        chosen_asset = random.choice(entity_assets)["asset_id"] if entity_assets else "AST-GEN-01"

        # Negative space rule check: silent assets generate 0 alerts
        if chosen_asset in [a["asset_id"] for a in assets if a["telemetry_status"] == "BLIND_SILENT"]:
            continue  # Skip to preserve Negative Space (zero telemetry from critical asset)

        alerts.append({
            "alert_id": alert_id,
            "entity_id": eid,
            "entity_name": ename,
            "sector": entity["sector"],
            "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "category": category,
            "severity": severity,
            "asset_id": chosen_asset,
            "closure_time_minutes": closure_time_min,
            "escalated": escalated,
            "status": "Closed",
            "is_execution_gap": bool(entity["has_execution_gap"] and severity in ["Critical", "High"] and closure_time_min < 15),
        })

        # Generate corresponding case record
        case_id = f"CAS-2026-{case_counter:05d}"
        case_counter += 1

        cases.append({
            "case_id": case_id,
            "alert_id": alert_id,
            "entity_id": eid,
            "entity_name": ename,
            "investigation_time_minutes": investigation_time,
            "notes_template_flag": "Template" if is_template else "Custom Detailed",
            "investigation_notes": investigation_notes,
            "outcome": "Remediated" if not is_template else "Suppressed / False Positive",
            "analyst_id": f"OPR-{random.randint(101, 115)}",
        })

    df_entities = pd.DataFrame(CRITICAL_SECTOR_ENTITIES)
    df_alerts = pd.DataFrame(alerts)
    df_cases = pd.DataFrame(cases)
    df_assets = pd.DataFrame(assets)

    # 3. Anomaly Detection (Isolation Forest)
    features = df_alerts[["closure_time_minutes"]].copy()
    features["is_escalated_num"] = (df_alerts["escalated"] == "Yes").astype(int)
    features["severity_num"] = df_alerts["severity"].map({"Critical": 4, "High": 3, "Medium": 2, "Low": 1})

    iso_forest = IsolationForest(contamination=0.06, random_state=42)
    df_alerts["anomaly_score"] = iso_forest.fit_predict(features)
    df_alerts["is_anomaly"] = df_alerts["anomaly_score"] == -1

    # 4. Save to CSV and SQLite
    df_entities.to_csv(os.path.join(DATA_DIR, "entities.csv"), index=False)
    df_alerts.to_csv(os.path.join(DATA_DIR, "alerts.csv"), index=False)
    df_cases.to_csv(os.path.join(DATA_DIR, "cases.csv"), index=False)
    df_assets.to_csv(os.path.join(DATA_DIR, "assets.csv"), index=False)

    conn = sqlite3.connect(DB_PATH)
    df_entities.to_sql("entities", conn, if_exists="replace", index=False)
    df_alerts.to_sql("alerts", conn, if_exists="replace", index=False)
    df_cases.to_sql("cases", conn, if_exists="replace", index=False)
    df_assets.to_sql("assets", conn, if_exists="replace", index=False)
    conn.close()

    print(f"✅ Generated {len(df_alerts)} alerts, {len(df_cases)} cases, {len(df_assets)} assets across {len(df_entities)} CSEs.")
    print(f"📁 Datasets written to: {DATA_DIR}")
    print(f"🗄️ SQLite database written to: {DB_PATH}")

    return df_entities, df_alerts, df_cases, df_assets


if __name__ == "__main__":
    generate_synthetic_soc_data()
