import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Entity, SectorType, GeographicRegion } from '../../types';
import { REGIONS_METADATA } from '../../data/dummyData';
import { RiskBadge } from '../common/RiskBadge';
import {
  MapPin,
  Layers,
  Globe,
  ShieldAlert,
  Building2,
  TrendingUp,
  Filter,
  Activity,
  ArrowUpRight,
  Maximize2,
  ChevronRight,
  Zap,
  Info,
} from 'lucide-react';

interface GeographicalHeatMapProps {
  onSelectEntity?: (entity: Entity) => void;
}

export const GeographicalHeatMap: React.FC<GeographicalHeatMapProps> = ({ onSelectEntity }) => {
  const { entities, setSelectedEntity, setActivePage } = useApp();

  // Mode: Geographic regions or Sector overlay
  const [viewMode, setViewMode] = useState<'geographic' | 'sector'>('geographic');
  const [selectedRegionId, setSelectedRegionId] = useState<GeographicRegion | 'All'>('All');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('All');
  const [hoveredEntity, setHoveredEntity] = useState<Entity | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<GeographicRegion | null>(null);

  const sectors = ['All', ...Array.from(new Set(entities.map((e) => e.sector)))];

  // Filtered entities based on toggles
  const displayEntities = useMemo(() => {
    return entities.filter((e) => {
      const matchRegion = selectedRegionId === 'All' || e.region === selectedRegionId;
      const matchSector = selectedSectorFilter === 'All' || e.sector === selectedSectorFilter;
      return matchRegion && matchSector;
    });
  }, [entities, selectedRegionId, selectedSectorFilter]);

  // Aggregate stats per region
  const regionStats = useMemo(() => {
    return REGIONS_METADATA.map((r) => {
      const regionEntities = entities.filter((e) => e.region === r.id);
      const count = regionEntities.length;
      const avgRisk = count
        ? +(regionEntities.reduce((sum, e) => sum + e.riskScore, 0) / count).toFixed(1)
        : 0;
      const highRiskCount = regionEntities.filter((e) => e.riskLevel === 'High').length;
      const criticalFindings = regionEntities.reduce((sum, e) => sum + e.criticalFindings, 0);

      let heatColor = '#10B981'; // green (<40)
      if (avgRisk >= 70) heatColor = '#EF4444'; // red
      else if (avgRisk >= 50) heatColor = '#F59E0B'; // amber

      return {
        ...r,
        count,
        avgRisk,
        highRiskCount,
        criticalFindings,
        heatColor,
        entities: regionEntities,
      };
    });
  }, [entities]);

  const activeRegionStat = selectedRegionId !== 'All' 
    ? regionStats.find((r) => r.id === selectedRegionId) 
    : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900">
              NATIONAL SPATIAL RADAR
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-[11px] font-mono text-slate-500">5 Sovereign Defense Corridors</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <Globe size={18} className="text-blue-600 dark:text-blue-400" />
            Geographical Risk Distribution Heat Map
          </h2>
        </div>

        {/* Toggle between Sector-Specific vs Geographic-Specific View */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => {
                setViewMode('geographic');
                setSelectedSectorFilter('All');
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === 'geographic'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Geographic View
            </button>
            <button
              onClick={() => {
                setViewMode('sector');
                setSelectedRegionId('All');
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === 'sector'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sector-Specific View
            </button>
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {viewMode === 'geographic' ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            <span className="text-slate-400 font-mono text-[11px] mr-1">Region:</span>
            <button
              onClick={() => setSelectedRegionId('All')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                selectedRegionId === 'All'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Regions (5)
            </button>
            {REGIONS_METADATA.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRegionId(r.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedRegionId === r.id
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {r.shortName}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            <span className="text-slate-400 font-mono text-[11px] mr-1">Sector:</span>
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSectorFilter(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedSectorFilter === s
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>High Risk (&ge;70)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Medium (40-69)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Low (&lt;40)</span>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Interactive SVG Sovereign Map (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 rounded-xl p-4 border border-slate-800 relative overflow-hidden min-h-[380px] flex items-center justify-center">
          {/* Subtle Radar Background Grid */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#3B82F6 1px, transparent 1px), linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />

          <svg
            viewBox="0 0 100 100"
            className="w-full h-80 sm:h-96 max-w-xl transition-all select-none"
          >
            {/* National Territorial Perimeter outline */}
            <path
              d="M 12 12 L 52 8 L 94 14 L 92 68 L 84 94 L 32 92 L 6 78 Z"
              fill="none"
              stroke="#334155"
              strokeWidth="0.8"
              strokeDasharray="2,2"
              className="opacity-40"
            />

            {/* Regional Territory Heat Polygons */}
            {regionStats.map((r) => {
              const isSelected = selectedRegionId === r.id;
              const isHovered = hoveredRegion === r.id;

              return (
                <g key={r.id} className="cursor-pointer">
                  <polygon
                    points={r.svgPolygon}
                    fill={r.heatColor}
                    fillOpacity={
                      isSelected
                        ? 0.35
                        : isHovered
                        ? 0.28
                        : selectedRegionId !== 'All'
                        ? 0.05
                        : 0.18
                    }
                    stroke={r.heatColor}
                    strokeWidth={isSelected ? 1.5 : 0.8}
                    strokeOpacity={isSelected ? 0.9 : 0.4}
                    onMouseEnter={() => setHoveredRegion(r.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() =>
                      setSelectedRegionId(selectedRegionId === r.id ? 'All' : r.id)
                    }
                    className="transition-all duration-200"
                  />
                  {/* Region Centered Label */}
                  <text
                    x={r.centerCoordinates.x}
                    y={r.centerCoordinates.y}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="2.8"
                    fontWeight="bold"
                    fontFamily="monospace"
                    className="pointer-events-none uppercase tracking-wider opacity-70"
                  >
                    {r.shortName}
                  </text>
                  <text
                    x={r.centerCoordinates.x}
                    y={r.centerCoordinates.y + 3.4}
                    textAnchor="middle"
                    fill={r.heatColor}
                    fontSize="2.4"
                    fontWeight="bold"
                    fontFamily="monospace"
                    className="pointer-events-none"
                  >
                    Risk {r.avgRisk}
                  </text>
                </g>
              );
            })}

            {/* Entity Markers */}
            {displayEntities.map((entity) => {
              const isHovered = hoveredEntity?.id === entity.id;
              const color =
                entity.riskLevel === 'High'
                  ? '#EF4444'
                  : entity.riskLevel === 'Medium'
                  ? '#F59E0B'
                  : '#10B981';

              return (
                <g
                  key={entity.id}
                  transform={`translate(${entity.coordinates.x}, ${entity.coordinates.y})`}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredEntity(entity)}
                  onMouseLeave={() => setHoveredEntity(null)}
                  onClick={() => {
                    setSelectedEntity(entity);
                    if (onSelectEntity) onSelectEntity(entity);
                  }}
                >
                  {/* Pulsing ring for High Risk */}
                  {entity.riskLevel === 'High' && (
                    <circle
                      r="3.2"
                      fill="none"
                      stroke={color}
                      strokeWidth="0.5"
                      className="animate-ping opacity-75"
                    />
                  )}

                  {/* Outer circle */}
                  <circle
                    r={isHovered ? 2.8 : 2.2}
                    fill={color}
                    stroke="#0F172A"
                    strokeWidth="0.8"
                    className="transition-transform"
                  />

                  {/* Inner dot */}
                  <circle r="0.8" fill="#FFFFFF" />

                  {/* Marker Code label */}
                  <text
                    x="3.2"
                    y="1"
                    fill="#FFFFFF"
                    fontSize="2.2"
                    fontWeight="bold"
                    fontFamily="monospace"
                    className={`transition-opacity ${
                      isHovered ? 'opacity-100 font-bold' : 'opacity-70'
                    }`}
                  >
                    {entity.code}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Hover Tooltip Overlay on Map */}
          {hoveredEntity && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs bg-slate-900/95 text-white p-3 rounded-lg border border-slate-700 shadow-2xl backdrop-blur-md pointer-events-none text-xs space-y-1 z-20">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white truncate">{hoveredEntity.name}</span>
                <span className="font-mono text-[10px] text-blue-400 bg-blue-950 px-1 py-0.2 rounded border border-blue-800">
                  {hoveredEntity.code}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {hoveredEntity.sector} · {hoveredEntity.region}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] font-mono">
                <span>
                  Risk: <strong className="text-white font-bold">{hoveredEntity.riskScore}/100</strong>
                </span>
                <span className={hoveredEntity.riskLevel === 'High' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {hoveredEntity.riskLevel} Tier
                </span>
                <span className="text-slate-400">
                  Critical Gaps: <strong className="text-rose-400">{hoveredEntity.criticalFindings}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Map Status Badge */}
          <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>GEO-RADAR LIVE ({displayEntities.length} PINS)</span>
          </div>
        </div>

        {/* Regional Breakdown & Selected Context (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              {selectedRegionId === 'All' ? 'Regional Defense Corridors' : 'Selected Region Profile'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {displayEntities.length} Operators
            </span>
          </div>

          {/* If specific region is selected, show detail card */}
          {activeRegionStat ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {activeRegionStat.shortName}
                  </h3>
                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
                    {activeRegionStat.code}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-lg font-bold" style={{ color: activeRegionStat.heatColor }}>
                    {activeRegionStat.avgRisk}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Avg Risk</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                {activeRegionStat.description}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">High Risk:</span>
                  <strong className="text-rose-600 dark:text-rose-400 font-bold">
                    {activeRegionStat.highRiskCount} of {activeRegionStat.count}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Critical Gaps:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {activeRegionStat.criticalFindings} Findings
                  </strong>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                  Stationed Operators ({activeRegionStat.entities.length})
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeRegionStat.entities.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => {
                        setSelectedEntity(e);
                        setActivePage('entity-risk');
                      }}
                      className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 text-xs flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-slate-900 dark:text-white truncate block">
                          {e.name}
                        </span>
                        <span className="text-[10px] text-slate-400">{e.sector}</span>
                      </div>
                      <span className="font-mono text-xs font-bold shrink-0">
                        {e.riskScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Otherwise show list of all 5 corridors */
            <div className="space-y-2">
              {regionStats.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRegionId(r.id)}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: r.heatColor }}
                      />
                      <span className="font-semibold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {r.shortName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-500">{r.count} entities</span>
                      <strong className="font-bold" style={{ color: r.heatColor }}>
                        {r.avgRisk}
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                    <span className="truncate max-w-[200px]">{r.description}</span>
                    <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
