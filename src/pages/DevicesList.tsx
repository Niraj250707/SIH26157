import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DeviceAsset, SectorType, GeographicRegion } from '../types';
import { INITIAL_DEVICES, REGIONS_METADATA } from '../data/dummyData';
import { RiskBadge } from '../components/common/RiskBadge';
import JSZip from 'jszip';
import {
  Server,
  Download,
  Search,
  Filter,
  SlidersHorizontal,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Cpu,
  Layers,
  Radio,
  FileSpreadsheet,
  Building2,
  Globe,
  Archive,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  X,
  FileCode,
} from 'lucide-react';

export const DevicesList: React.FC = () => {
  const { addToast, logAuditEvent, setActivePage, setSelectedEntity, entities } = useApp();

  const [devices, setDevices] = useState<DeviceAsset[]>(INITIAL_DEVICES);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [inspectedDevice, setInspectedDevice] = useState<DeviceAsset | null>(null);

  const statuses = ['All', 'HEALTHY', 'DEGRADED', 'BLIND', 'OFFLINE'];
  const sectors = ['All', ...Array.from(new Set(devices.map((d) => d.sector)))];
  const regions = ['All', ...REGIONS_METADATA.map((r) => r.id)];
  const zones = ['All', 'OT Supervisory L2/L3', 'DMZ Perimeter', 'Cloud Edge', 'IT Corporate'];

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch =
        d.name.toLowerCase().includes(q) ||
        d.assetTag.toLowerCase().includes(q) ||
        d.entityName.toLowerCase().includes(q) ||
        d.ipAddress.toLowerCase().includes(q) ||
        d.deviceType.toLowerCase().includes(q) ||
        d.operatingSystem.toLowerCase().includes(q);

      const matchStatus = selectedStatus === 'All' || d.telemetryStatus === selectedStatus;
      const matchSector = selectedSector === 'All' || d.sector === selectedSector;
      const matchRegion = selectedRegion === 'All' || d.region === selectedRegion;
      const matchZone = selectedZone === 'All' || d.zone === selectedZone;

      return matchSearch && matchStatus && matchSector && matchRegion && matchZone;
    });
  }, [devices, search, selectedStatus, selectedSector, selectedRegion, selectedZone]);

  // Metric counts
  const totalDevices = devices.length;
  const blindCount = devices.filter((d) => d.telemetryStatus === 'BLIND' || d.telemetryStatus === 'OFFLINE').length;
  const degradedCount = devices.filter((d) => d.telemetryStatus === 'DEGRADED').length;
  const criticalCveCount = devices.reduce((sum, d) => sum + d.criticalCves.length, 0);

  // 'Export All' ZIP Generator
  const handleExportAllZip = async () => {
    setIsExportingZip(true);
    try {
      const zip = new JSZip();

      // Master manifest CSV
      const manifestHeaders = [
        'Asset_Tag',
        'Device_Name',
        'Device_Type',
        'Parent_Entity',
        'Sector',
        'Region',
        'Security_Zone',
        'IP_Address',
        'MAC_Address',
        'OS_Firmware',
        'Telemetry_Status',
        'Risk_Score',
        'Vulnerabilities_Count',
        'Critical_CVEs',
        'Compliance_State',
        'Last_Telemetry_Ping',
      ];

      const manifestRows = devices.map((d) => [
        d.assetTag,
        `"${d.name.replace(/"/g, '""')}"`,
        `"${d.deviceType}"`,
        `"${d.entityName}"`,
        `"${d.sector}"`,
        `"${d.region}"`,
        `"${d.zone}"`,
        d.ipAddress,
        d.macAddress,
        `"${d.operatingSystem} (${d.firmwareVersion})"`,
        d.telemetryStatus,
        d.riskScore,
        d.openVulnerabilities,
        `"${d.criticalCves.join('; ')}"`,
        d.complianceState,
        `"${d.lastTelemetryPing}"`,
      ]);

      const manifestCsv = [manifestHeaders.join(','), ...manifestRows.map((r) => r.join(','))].join('\n');
      zip.file('00_INVENTORY_MANIFEST.csv', manifestCsv);

      // Create individual CSV report for every single device
      devices.forEach((d) => {
        const individualDeviceCsv = [
          '# NATIONAL CYBER SECURITY SUPERVISORY ASSET AUDIT REPORT',
          `# Generated: ${new Date().toISOString()}`,
          `# System: SAT-SA Supervisory Station Level 4`,
          '',
          'ATTRIBUTE,VALUE',
          `Asset Tag,${d.assetTag}`,
          `Device Name,"${d.name.replace(/"/g, '""')}"`,
          `Device Type,"${d.deviceType}"`,
          `Parent Entity,"${d.entityName}"`,
          `Sector,"${d.sector}"`,
          `Region,"${d.region}"`,
          `Security Zone,"${d.zone}"`,
          `IP Address,${d.ipAddress}`,
          `MAC Address,${d.macAddress}`,
          `Operating System,"${d.operatingSystem}"`,
          `Firmware Version,"${d.firmwareVersion}"`,
          `Telemetry Status,${d.telemetryStatus}`,
          `Risk Score,${d.riskScore}/100`,
          `Open Vulnerabilities,${d.openVulnerabilities}`,
          `Critical CVEs,"${d.criticalCves.join(', ') || 'NONE'}"`,
          `Compliance State,${d.complianceState}`,
          `Last Telemetry Forwarding Ping,"${d.lastTelemetryPing}"`,
          '',
          '# SUPERVISORY AUDIT ASSESSMENT',
          `Audit Mandate,"NIST SP 800-82 § 5.3 OT Boundary Monitoring"`,
          `Supervisory Status,"${d.telemetryStatus === 'BLIND' ? 'STATUTORY DEFICIENCY - NOTICE REQUIRED' : 'NOMINAL MONITORING'}"`,
        ].join('\n');

        const fileName = `device_${d.assetTag}_${d.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)}.csv`;
        zip.file(fileName, individualDeviceCsv);
      });

      // Generate the ZIP file blob
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `SAT-SA-Monitored-Devices-Inventory-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      // Log to compliance audit ledger
      logAuditEvent({
        action: 'EVIDENCE_EXPORT',
        category: 'Reporting',
        targetType: 'Entity',
        targetId: 'devices-inventory-zip',
        targetName: `Full Monitored Assets Inventory (${devices.length} Devices)`,
        details: `Supervisor initiated batch ZIP export containing ${devices.length} individual device CSV audit dossiers plus 00_INVENTORY_MANIFEST.csv.`,
      });

      addToast(
        'success',
        'ZIP Archive Generated',
        `Successfully bundled ${devices.length} individual device reports into ZIP package.`
      );
    } catch (err: any) {
      console.error('ZIP Export Error:', err);
      addToast('warning', 'Export Interrupted', 'Could not compile device archive.');
    } finally {
      setIsExportingZip(false);
    }
  };

  const getStatusBadge = (status: DeviceAsset['telemetryStatus']) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
      case 'DEGRADED':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
      case 'BLIND':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 font-bold animate-pulse';
      case 'OFFLINE':
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              CRITICAL INFRASTRUCTURE ASSETS & TELEMETRY
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold font-mono">
              Live Fleet Inventory
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Monitored Devices & Operational Technology Assets
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Comprehensive inventory of SCADA RTUs, dual-homed firewalls, cryptographic payment switches, and 5G packet gateways across all critical sectors.
          </p>
        </div>

        {/* 'Export All' Button */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleExportAllZip}
            disabled={isExportingZip}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Download ZIP package containing individual CSV reports for all devices"
          >
            {isExportingZip ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Generating ZIP Package...</span>
              </>
            ) : (
              <>
                <Archive size={14} />
                <span>Export All (ZIP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-medium">Total Assets</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {totalDevices}
            </div>
            <span className="text-[11px] text-slate-400">12 Critical Operators</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Server size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-medium">Blind Telemetry</span>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              {blindCount}
            </div>
            <span className="text-[11px] text-rose-500 font-semibold">Immediate Audit Required</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-medium">Degraded Logs</span>
            <div className="text-2xl font-bold font-mono text-amber-500 mt-1">
              {degradedCount}
            </div>
            <span className="text-[11px] text-slate-400">Packet Drop Anomalies</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-medium">Critical CVEs</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {criticalCveCount}
            </div>
            <span className="text-[11px] text-slate-400">Unpatched Firmware</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Cpu size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset tag, device name, IP, firmware, or CVE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>

          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
          >
            {sectors.map((s) => (
              <option key={s} value={s}>
                Sector: {s}
              </option>
            ))}
          </select>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                Zone: {z}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Devices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-mono text-slate-500">
            SHOWING {filteredDevices.length} OF {devices.length} MONITORED ASSETS
          </span>
          <span className="text-[11px] text-slate-400">
            Click any row to inspect technical firmware audit
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Asset Tag</th>
                <th className="py-3 px-4 font-semibold">Device & Type</th>
                <th className="py-3 px-4 font-semibold">Entity & Sector</th>
                <th className="py-3 px-4 font-semibold">IP & Zone</th>
                <th className="py-3 px-4 font-semibold">OS / Firmware</th>
                <th className="py-3 px-4 font-semibold">Telemetry Status</th>
                <th className="py-3 px-4 font-semibold text-center">Risk Score</th>
                <th className="py-3 px-4 font-semibold">Critical CVEs</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDevices.map((device) => (
                <tr
                  key={device.id}
                  onClick={() => setInspectedDevice(device)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {device.assetTag}
                  </td>

                  <td className="py-3.5 px-4 min-w-[200px]">
                    <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {device.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {device.deviceType}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 min-w-[190px]">
                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {device.entityName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {device.sector} · {device.region.split(' ')[0]}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="text-slate-900 dark:text-white font-medium">{device.ipAddress}</div>
                    <div className="text-slate-400 text-[10px]">{device.zone}</div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="text-slate-800 dark:text-slate-200">{device.operatingSystem}</div>
                    <div className="text-slate-400 text-[10px]">{device.firmwareVersion}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${getStatusBadge(
                        device.telemetryStatus
                      )}`}
                    >
                      {device.telemetryStatus}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {device.lastTelemetryPing}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        device.riskScore >= 70
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          : device.riskScore >= 40
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      }`}
                    >
                      {device.riskScore}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {device.criticalCves.length > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                        {device.criticalCves[0]}
                        {device.criticalCves.length > 1 && ` (+${device.criticalCves.length - 1})`}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">None flagged</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectedDevice(device);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Inspect Technical Dossier"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Technical Detail Modal */}
      {inspectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 text-xs text-slate-900 dark:text-white">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold uppercase">
                  OPERATIONAL ASSET DOSSIER · {inspectedDevice.assetTag}
                </span>
                <h2 className="text-base font-bold mt-0.5">{inspectedDevice.name}</h2>
                <span className="text-slate-500 text-[11px]">{inspectedDevice.entityName}</span>
              </div>
              <button
                onClick={() => setInspectedDevice(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">IP Address:</span>
                <strong className="text-xs">{inspectedDevice.ipAddress}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">MAC Hardware:</span>
                <strong className="text-xs">{inspectedDevice.macAddress}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Security Zone:</span>
                <strong className="text-xs text-blue-600 dark:text-blue-400">{inspectedDevice.zone}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Operating System:</span>
                <strong className="text-xs truncate block">{inspectedDevice.operatingSystem}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Firmware Version:</span>
                <strong className="text-xs">{inspectedDevice.firmwareVersion}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Risk Score:</span>
                <strong className="text-xs text-rose-600 dark:text-rose-400">{inspectedDevice.riskScore}/100</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="font-bold text-[11px] uppercase tracking-wider block">
                Vulnerability Assessment & Telemetry Health
              </span>
              <p className="text-slate-600 dark:text-slate-300">
                Telemetry Status:{' '}
                <span className={`px-2 py-0.5 rounded font-mono ${getStatusBadge(inspectedDevice.telemetryStatus)}`}>
                  {inspectedDevice.telemetryStatus}
                </span>{' '}
                · Last Ping: <strong>{inspectedDevice.lastTelemetryPing}</strong>
              </p>
              {inspectedDevice.criticalCves.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-rose-500 font-bold">Unmitigated CVEs:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedDevice.criticalCves.map((cve) => (
                      <span
                        key={cve}
                        className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-mono text-[10px]"
                      >
                        {cve}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const parent = entities.find((e) => e.id === inspectedDevice.entityId);
                  if (parent) {
                    setSelectedEntity(parent);
                    setActivePage('entity-risk');
                    setInspectedDevice(null);
                  }
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Drill down into {inspectedDevice.entityName}</span>
                <ExternalLink size={12} />
              </button>

              <button
                onClick={() => setInspectedDevice(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs"
              >
                Dismiss Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
