import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Marker,
  Circle,
  Polygon,
  LayerGroup,
  Popup,
  useMap
} from 'react-leaflet';
import {
  ChevronDown, Share2, Bell, Plus, Minus, Loader,
  FileText, Download, MapPin, User, AlertTriangle,
  Bug, Microscope, MapIcon, Radio, Wind, Radar,
  ShieldAlert, Activity, X
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import L from 'leaflet';
import eggIcon from '../../assets/egg.png';
import larvaIcon from '../../assets/larva.png';
import pupaIcon from '../../assets/pupa.png';
import mothIcon from '../../assets/moth.png';
import pestMarker from '../../assets/mark.svg';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Life stage config ────────────────────────────────────────────────────────
const LIFE_STAGE_CONFIG = {
  egg: {
    hasProximity: false,
    label: 'Egg',
    description: 'Stationary stage. No spread radius.',
  },
  larva: {
    hasProximity: true,
    type: 'larva',
    getRadius: () => 2, // meters
    unit: 'm',
    label: 'Larva',
    description: 'Ground-bound feeding stage. Limited mobility.',
    spreadNote: 'Movement constrained to immediate feeding area.',
    actionNote: 'Inspect within 2m radius for egg clusters and feeding damage.',
    colorScheme: 'green-red',
  },
  pupa: {
    hasProximity: false,
    label: 'Pupa',
    description: 'Dormant metamorphosis stage. No active spread.',
  },
  moth: {
    hasProximity: true,
    type: 'moth',
    getRadius: (risk) => {
      if (risk === 'High') return 5000;
      if (risk === 'Medium') return 3000;
      return 1000;
    },
    unit: 'km',
    label: 'Moth (Adult)',
    description: 'Winged adult stage. High dispersal potential.',
    spreadNote: 'Can fly significant distances; radius scales with risk severity.',
    actionNote: 'Monitor all farms within spread zone for new egg masses.',
    colorScheme: 'violet',
  },
};

const normalizeLifeStage = (raw) => {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  if (s.includes('egg')) return 'egg';
  if (s.includes('larv') || s.includes('larva') || s.includes('caterpillar') || s.includes('instar')) return 'larva';
  if (s.includes('pupa') || s.includes('pupal') || s.includes('chrysalis') || s.includes('cocoon')) return 'pupa';
  if (s.includes('moth') || s.includes('adult') || s.includes('imago')) return 'moth';
  return null;
};

// ─── Proximity circle styles ──────────────────────────────────────────────────

const getMarkerIcon = (lifeStage, risk) => {
  const stage = normalizeLifeStage(lifeStage);
  let iconUrl = pestMarker;

  switch (stage) {
    case 'egg':
      iconUrl = eggIcon;
      break;
    case 'larva':
      iconUrl = larvaIcon;
      break;
    case 'pupa':
      iconUrl = pupaIcon;
      break;
    case 'moth':
      iconUrl = mothIcon;
      break;
    default:
      iconUrl = pestMarker;
  }

  let size = 42;
  if (risk === 'High') size = 48;
  if (risk === 'Low') size = 36;

  return new L.Icon({
    iconUrl,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size / 2],
  });
};

const getLarvaCircleOptions = (opacity = 1) => ({
  color: '#ef4444',
  weight: 1.5,
  fillColor: '#22c55e',
  fillOpacity: 0.18 * opacity,
  dashArray: '4 3',
  interactive: true,
});

const getMothCircleOptions = (risk, opacity = 1) => {
  const colors = {
    High: { stroke: '#7c3aed', fill: '#8b5cf6' },
    Medium: { stroke: '#9333ea', fill: '#a855f7' },
    Low: { stroke: '#6d28d9', fill: '#7c3aed' },
  };
  const c = colors[risk] || colors.Low;
  return {
    color: c.stroke,
    weight: 1.5,
    fillColor: c.fill,
    fillOpacity: 0.10 * opacity,
    dashArray: '6 4',
    interactive: true,
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const zoomToBounds = (map, bounds, padding = 50) => {
  if (!map || !bounds || !Array.isArray(bounds) || bounds.length < 2) return;
  try {
    const validBounds = bounds.filter(b => Array.isArray(b) && b.length === 2 && 
      typeof b[0] === 'number' && typeof b[1] === 'number' && 
      !isNaN(b[0]) && !isNaN(b[1]));
    if (validBounds.length < 2) return;
    map.fitBounds(validBounds, { padding });
  } catch (e) { console.error('zoomToBounds error:', e); }
};

const formatArea = (radiusM) => {
  const areaM2 = Math.PI * radiusM * radiusM;
  if (areaM2 >= 1_000_000) return `${(areaM2 / 1_000_000).toFixed(2)} km²`;
  if (areaM2 >= 10_000) return `${(areaM2 / 10_000).toFixed(2)} ha`;
  return `${areaM2.toFixed(0)} m²`;
};

const formatRadius = (radiusM) => {
  if (radiusM >= 1000) return `${(radiusM / 1000).toFixed(1)} km`;
  return `${radiusM} m`;
};

const parseTreatmentData = (str) => {
  if (!str) return null;
  try { return typeof str === 'object' ? str : JSON.parse(str); } catch { return null; }
};

const formatTimestamp = (ts) => {
  if (!ts) return 'N/A';
  try {
    if (ts?.toDate) return ts.toDate().toLocaleString();
    if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    if (ts?._seconds) return new Date(ts._seconds * 1000).toLocaleString();
    if (typeof ts === 'string') return new Date(ts).toLocaleString();
  } catch {}
  return 'N/A';
};

// ─── Map Controller ───────────────────────────────────────────────────────────
const MapController = ({ polygons, mapRef }) => {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  useEffect(() => {
    if (!map || !polygons?.length) return;
    const all = polygons.flatMap(p => p.coordinates || []);
    if (!all.length) return;
    const validCoords = all.filter(c => Array.isArray(c) && c.length === 2 && 
      typeof c[0] === 'number' && typeof c[1] === 'number' && 
      !isNaN(c[0]) && !isNaN(c[1]));
    if (!validCoords.length) return;
    const lats = validCoords.map(c => c[0]), lngs = validCoords.map(c => c[1]);
    setTimeout(() => zoomToBounds(map, [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ], 60), 500);
  }, [map, polygons]);
  return null;
};

// ─── Zoom Controls ────────────────────────────────────────────────────────────
const CustomZoomControls = ({ mapRef, farmPolygons }) => {
  const [loading, setLoading] = useState(false);
  const handleLocate = () => {
    if (!mapRef.current || !farmPolygons.length) return;
    setLoading(true);
    const all = farmPolygons.flatMap(p => p.coordinates || []);
    const validCoords = all.filter(c => Array.isArray(c) && c.length === 2 && 
      typeof c[0] === 'number' && typeof c[1] === 'number' && 
      !isNaN(c[0]) && !isNaN(c[1]));
    if (validCoords.length) {
      const lats = validCoords.map(c => c[0]), lngs = validCoords.map(c => c[1]);
      zoomToBounds(mapRef.current, [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], 60);
    }
    setTimeout(() => setLoading(false), 300);
  };
  return (
    <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2 bg-white rounded-xl shadow-lg p-1 pointer-events-auto">
      <button onClick={() => mapRef.current?.zoomIn()} className="p-2 hover:bg-blue-50 border-b border-gray-100 transition-colors"><Plus size={20} className="text-gray-600" /></button>
      <button onClick={() => mapRef.current?.zoomOut()} className="p-2 hover:bg-blue-50 border-b border-gray-100 transition-colors"><Minus size={20} className="text-gray-600" /></button>
      <button onClick={handleLocate} disabled={loading} className="p-2 hover:bg-green-50 transition-colors disabled:opacity-50">
        {loading ? <Loader size={20} className="text-gray-600 animate-spin" /> : <MapIcon size={20} className="text-gray-600" />}
      </button>
    </div>
  );
};

// ─── Clickable Polygon ────────────────────────────────────────────────────────
const ClickablePolygon = React.memo(({ poly, onPolygonClick, mapRef, isSelected }) => {
  const [hovered, setHovered] = useState(false);
  const pathOptions = useMemo(() => ({
    color: poly.type === 'farm' ? '#2563eb' : '#16a34a',
    weight: isSelected ? 4 : hovered ? 3 : 2,
    fillColor: poly.type === 'farm' ? '#3b82f6' : '#22c55e',
    fillOpacity: isSelected ? 0.5 : hovered ? 0.4 : 0.2,
    interactive: true,
  }), [hovered, isSelected, poly.type]);

  const handleClick = useCallback(() => {
    onPolygonClick(poly);
    if (mapRef.current && poly.coordinates?.length) {
      const validCoords = poly.coordinates.filter(c => Array.isArray(c) && c.length === 2 && 
        typeof c[0] === 'number' && typeof c[1] === 'number' && 
        !isNaN(c[0]) && !isNaN(c[1]));
      if (validCoords.length) {
        const lats = validCoords.map(c => c[0]), lngs = validCoords.map(c => c[1]);
        zoomToBounds(mapRef.current, [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], 80);
      }
    }
  }, [poly, onPolygonClick, mapRef]);

  return (
    <Polygon positions={poly.coordinates} pathOptions={pathOptions}
      eventHandlers={{ click: handleClick, mouseover: () => setHovered(true), mouseout: () => setHovered(false) }}>
      <Popup>
        <div className="p-2 min-w-[150px]">
          <div className="font-bold text-gray-800">{poly.name}</div>
          <div className="text-sm text-gray-600">Farmer: {poly.farmerName || 'Unknown'}</div>
          {poly.area && <div className="text-sm text-gray-600">Area: {poly.area} acres</div>}
        </div>
      </Popup>
    </Polygon>
  );
});
ClickablePolygon.displayName = 'ClickablePolygon';

// ─── Proximity Circle Layer ───────────────────────────────────────────────────
const ProximityCircle = React.memo(({ marker, onCircleClick }) => {
  const stage = normalizeLifeStage(marker.lifeStage);
  const cfg = stage ? LIFE_STAGE_CONFIG[stage] : null;
  if (!cfg?.hasProximity) return null;

  const radius = cfg.getRadius(marker.risk);
  const circleOptions = stage === 'larva'
    ? getLarvaCircleOptions()
    : getMothCircleOptions(marker.risk);

  return (
    <Circle
      center={[marker.lat, marker.lng]}
      radius={radius}
      pathOptions={circleOptions}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          onCircleClick(marker, cfg, radius);
        },
      }}
    />
  );
});
ProximityCircle.displayName = 'ProximityCircle';

// ─── Proximity Panel ──────────────────────────────────────────────────────────
const ProximityPanel = ({ data, onClose }) => {
  if (!data) return null;
  const { marker, cfg, radius } = data;
  const isLarva = cfg.type === 'larva';
  const isMoth = cfg.type === 'moth';

  const accentColor = isLarva ? '#16a34a' : '#7c3aed';
  const bgGradient = isLarva
    ? 'from-green-900 to-green-700'
    : 'from-violet-900 to-purple-700';
  const badgeBg = isLarva ? 'bg-green-100 text-green-800' : 'bg-violet-100 text-violet-800';
  const ringBg = isLarva ? 'bg-green-50 border-green-100' : 'bg-violet-50 border-violet-100';
  const ringText = isLarva ? 'text-green-700' : 'text-violet-700';
  const ringIcon = isLarva ? <Radio size={16} className="text-green-600" /> : <Wind size={16} className="text-violet-600" />;

  return (
    <>
      {/* Header */}
      <div className={`relative h-52 w-full overflow-hidden bg-gradient-to-br ${bgGradient}`}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 30% 50%, white 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }} />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white/30 transition-colors"
        >
          <X size={16} className="text-white" />
        </button>
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg ${badgeBg}`}>
            {cfg.label}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg ${
            marker.risk === 'High' ? 'bg-red-500 text-white' :
            marker.risk === 'Medium' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
          }`}>{marker.risk} Risk</span>
        </div>
        <div className="absolute bottom-6 left-6 right-10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-1">Spread Proximity Zone</p>
          <h2 className="text-3xl font-black text-white leading-tight">{formatRadius(radius)}</h2>
          <p className="text-white/70 text-sm mt-1">radius from detection point</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`${ringBg} rounded-xl p-3 text-center border`}>
            <p className="text-[10px] uppercase font-bold text-gray-500">Radius</p>
            <p className={`text-lg font-black ${ringText}`}>{formatRadius(radius)}</p>
          </div>
          <div className={`${ringBg} rounded-xl p-3 text-center border`}>
            <p className="text-[10px] uppercase font-bold text-gray-500">Zone Area</p>
            <p className={`text-sm font-black ${ringText}`}>{formatArea(radius)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
            <p className="text-[10px] uppercase font-bold text-red-500">Risk</p>
            <p className="text-sm font-black text-red-700">{marker.risk || 'N/A'}</p>
          </div>
        </div>

        {/* Spread zone info */}
        <div className={`${ringBg} rounded-2xl p-5 border`}>
          <div className="flex items-center gap-2 mb-4">
            {ringIcon}
            <h3 className="text-sm font-black uppercase">Spread Zone Details</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Life Stage</span>
              <span className={`font-bold text-sm px-3 py-0.5 rounded-full ${badgeBg}`}>{cfg.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Detection Point</span>
              <span className="font-mono text-sm">{marker.lat?.toFixed(5)}, {marker.lng?.toFixed(5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Zone Radius</span>
              <span className="font-semibold text-sm">{formatRadius(radius)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Total Zone Area</span>
              <span className="font-semibold text-sm">{formatArea(radius)}</span>
            </div>
            {isMoth && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Radius basis</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold">
                  {marker.risk === 'High' ? 'High risk → 5 km' : marker.risk === 'Medium' ? 'Medium risk → 3 km' : 'Low risk → 1 km'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mobility description */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-gray-600" />
            <h3 className="text-sm font-black uppercase">Mobility Profile</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{cfg.description}</p>
          {cfg.spreadNote && (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{cfg.spreadNote}</p>
          )}
        </div>

        {/* Recommended action */}
        {cfg.actionNote && (
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={14} className="text-amber-600" />
              <h3 className="text-sm font-black uppercase">Recommended Action</h3>
            </div>
            <p className="text-sm text-amber-900 leading-relaxed">{cfg.actionNote}</p>
          </div>
        )}

        {/* Pest ID cross-ref */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bug size={14} className="text-gray-500" />
            <h3 className="text-sm font-black uppercase">Associated Detection</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Pest</span>
              <span className="font-semibold text-sm">{marker.detection || marker.expertDiagnosis || 'N/A'}</span>
            </div>
            {marker.scientificName && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Scientific</span>
                <span className="italic text-sm text-gray-700">{marker.scientificName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Crop Affected</span>
              <span className="text-sm">{marker.cropAffected || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Area</span>
              <span className="text-sm">{marker.areaName || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Hint to open full report */}
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-400 font-medium">Click the marker pin to view the full pest report</p>
        </div>

        <div className="text-center text-[10px] font-mono text-gray-400">Proximity zone · Report ID: {marker.id}</div>
      </div>
    </>
  );
};

// ─── Report Panel (existing, streamlined) ─────────────────────────────────────
const ReportPanel = ({ marker, loadingDetails, onClose }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  if (!marker) return null;

  const toggle = (s) => setExpandedSection(p => p === s ? null : s);

  return (
    <>
      {loadingDetails && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#14532D] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="relative h-80 w-full overflow-hidden">
        <img
          src={marker.annotated_url || (marker.imageBase64 && typeof marker.imageBase64 === 'string' && marker.imageBase64.length > 0 ? `data:image/jpeg;base64,${marker.imageBase64}` : "https://placehold.co/600x400/e2e8f0/1e293b?text=No+Image")}
          alt="pest" className="w-full h-full object-cover"
          onError={(e) => { e.target.src = "https://placehold.co/600x400/e2e8f0/1e293b?text=No+Image"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg">
          <X size={16} />
        </button>
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg ${marker.risk === 'High' ? 'bg-red-500 text-white' : marker.risk === 'Medium' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}`}>{marker.risk} Risk</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg bg-white/90 backdrop-blur text-gray-800">{marker.status || 'Pending'}</span>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-300 mb-2">Pest Detection Report</p>
          <h2 className="text-3xl font-black text-white leading-tight">{marker.detection || marker.expertDiagnosis}</h2>
          <p className="text-white/80 text-sm mt-1 italic">{marker.scientificName}</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <p className="text-[10px] uppercase font-bold text-green-600">Confidence</p>
            <p className="text-xl font-black text-green-700">{marker.confidence ? `${(marker.confidence * 100).toFixed(0)}%` : 'N/A'}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
            <p className="text-[10px] uppercase font-bold text-amber-600">Life Stage</p>
            <p className="text-sm font-black text-amber-700 uppercase">{marker.lifeStage || 'N/A'}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
            <p className="text-[10px] uppercase font-bold text-purple-600">Crop</p>
            <p className="text-xs font-black text-purple-700">{marker.cropAffected || 'Maize'}</p>
          </div>
        </div>

        {/* Proximity badge if applicable */}
        {(() => {
          const stage = normalizeLifeStage(marker.lifeStage);
          const cfg = stage ? LIFE_STAGE_CONFIG[stage] : null;
          if (!cfg?.hasProximity) return null;
          const radius = cfg.getRadius(marker.risk);
          const isLarva = cfg.type === 'larva';
          return (
            <div className={`${isLarva ? 'bg-green-50 border-green-100' : 'bg-violet-50 border-violet-100'} rounded-xl p-3 border flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                {isLarva ? <Radio size={14} className="text-green-600" /> : <Wind size={14} className="text-violet-600" />}
                <span className={`text-sm font-bold ${isLarva ? 'text-green-700' : 'text-violet-700'}`}>
                  {isLarva ? 'Ground spread zone' : 'Aerial spread zone'}
                </span>
              </div>
              <span className={`text-xs font-black px-2 py-1 rounded-full ${isLarva ? 'bg-green-200 text-green-800' : 'bg-violet-200 text-violet-800'}`}>
                {formatRadius(radius)} radius
              </span>
            </div>
          );
        })()}

        {/* Location */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4"><MapPin size={16} className="text-green-600" /><h3 className="text-sm font-black uppercase">Location Details</h3></div>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500 text-sm">Area</span><span className="font-semibold bg-gray-50 px-3 py-1 rounded-full text-sm">{marker.areaName || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 text-sm">Coordinates</span><span className="font-mono text-sm">{marker.lat?.toFixed(6)}, {marker.lng?.toFixed(6)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 text-sm">Mitigation</span><span className={`px-3 py-1 rounded-full text-xs font-bold ${marker.mitigationAction === 'Chemical' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{marker.mitigationAction}</span></div>
          </div>
        </div>

        {/* Farmer */}
        <div className="bg-gray-50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4"><User size={16} className="text-gray-600" /><h3 className="text-sm font-black uppercase">Farmer Information</h3></div>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-600 text-sm">Name</span><span className="font-semibold">{marker.farmerName !== 'Unknown Farmer' ? marker.farmerName : 'Fetching...'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600 text-sm">Reported On</span><span className="text-sm">{formatTimestamp(marker.timestamp)}</span></div>
            {marker.farmerId && <div className="flex justify-between"><span className="text-gray-600 text-sm">Farmer ID</span><span className="text-xs font-mono">{marker.farmerId.substring(0, 12)}...</span></div>}
          </div>
        </div>

        {marker.analysis && (
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggle('analysis')}>
              <Microscope size={12} className="text-blue-700" /><h3 className="text-sm font-black uppercase flex-1">AI Analysis</h3>
              <ChevronDown size={16} className={`transition-transform ${expandedSection === 'analysis' ? 'rotate-180' : ''}`} />
            </div>
            {expandedSection === 'analysis' && <p className="text-sm mt-3">{marker.analysis}</p>}
          </div>
        )}

        {marker.treatment && (
          <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggle('treatment')}>
              <Bug size={12} className="text-green-700" /><h3 className="text-sm font-black uppercase flex-1">Treatment Plan</h3>
              <ChevronDown size={16} className={`transition-transform ${expandedSection === 'treatment' ? 'rotate-180' : ''}`} />
            </div>
            {expandedSection === 'treatment' && (
              <div className="mt-3 space-y-3">
                {marker.treatment.control_methods?.length > 0 && <div><h4 className="text-xs font-bold">Control Methods:</h4><ul className="list-disc pl-5 text-sm">{marker.treatment.control_methods.map((m, i) => <li key={i}>{m}</li>)}</ul></div>}
                {marker.treatment.mitigation_plan?.length > 0 && <div><h4 className="text-xs font-bold">Mitigation Plan:</h4><ul className="list-disc pl-5 text-sm">{marker.treatment.mitigation_plan.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
                {marker.treatment.prevention && <div><h4 className="text-xs font-bold">Prevention:</h4><p className="text-sm">{marker.treatment.prevention}</p></div>}
              </div>
            )}
          </div>
        )}

        {marker.historicalContext && (
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggle('historical')}>
              <AlertTriangle size={12} className="text-amber-700" /><h3 className="text-sm font-black uppercase flex-1">Historical Context</h3>
              <ChevronDown size={16} className={`transition-transform ${expandedSection === 'historical' ? 'rotate-180' : ''}`} />
            </div>
            {expandedSection === 'historical' && <p className="text-sm mt-3">{marker.historicalContext}</p>}
          </div>
        )}

        <div className="bg-indigo-50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><FileText size={12} className="text-indigo-700" /><h3 className="text-sm font-black uppercase">Expert Diagnosis</h3></div>
          <p className="text-sm">{marker.expertDiagnosis}</p>
        </div>

        {marker.internalNotes && (
          <div className="bg-gray-50 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><FileText size={12} className="text-gray-600" /><h3 className="text-sm font-black uppercase">Internal Notes</h3></div>
            <p className="text-sm">{marker.internalNotes}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-xl bg-[#14532D] text-white font-bold text-sm flex items-center justify-center gap-2"><FileText size={16} /> View Full Report</button>
          <button className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-bold text-sm flex items-center justify-center gap-2"><Download size={16} /> Export</button>
        </div>
        <div className="text-center text-[10px] font-mono text-gray-400 pt-2">Report ID: {marker.id}</div>
      </div>
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const RiskMap = () => {
  const [position] = useState([10.7202, 122.5621]);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [proximityData, setProximityData] = useState(null); // { marker, cfg, radius }
  const [activeSidebarType, setActiveSidebarType] = useState(null); // 'report' | 'proximity' | 'farm'
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [farmPolygons, setFarmPolygons] = useState([]);
  const enrichedCache = useRef({});
  const loadingRef = useRef(false);
  const mapRef = useRef(null);

    const [filters, setFilters] = useState({
    pestType: 'ALL',
    dateRange: 'Last 7 Days',
    severity: 'ALL',
    district: 'ALL'
    });

    const [filteredMarkers, setFilteredMarkers] = useState([]);
    const [activeFarmsCount, setActiveFarmsCount] = useState(0);
    const [acreageAffected, setAcreageAffected] = useState(0);
    const [availablePestTypes, setAvailablePestTypes] = useState([]);
    const [availableDistricts, setAvailableDistricts] = useState([]);

  const fetchFarmerName = async (farmerId) => {
    if (!farmerId) return null;
    try {
      const s = await getDoc(doc(db, 'farmers', farmerId));
      if (s.exists()) return s.data().fullName || s.data().name || null;
      const u = await getDoc(doc(db, 'users', farmerId));
      if (u.exists()) return u.data().fullName || u.data().name || u.data().displayName || null;
    } catch {}
    return null;
  };

  const getPestIcon = (risk) => new L.Icon({
    iconUrl: pestMarker,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42],
  });

  const loadMarkerDetails = useCallback(async (marker) => {
    if (loadingRef.current) return;
    if (enrichedCache.current[marker.id]?.isFullyLoaded) {
      setSelectedMarker(enrichedCache.current[marker.id]);
      return;
    }
    loadingRef.current = true;
    setLoadingDetails(true);
    try {
      let enriched = { ...marker };
      if (marker.reportId) {
        const snap = await getDoc(doc(db, 'reports', marker.reportId));
        if (snap.exists()) {
          const d = snap.data();
          enriched = {
            ...enriched, ...d,
            detection: enriched.detection !== 'Unknown' ? enriched.detection : d.detection,
            risk: enriched.risk !== 'Unknown' ? enriched.risk : (d.risk || d.riskLevel),
            lifeStage: enriched.lifeStage !== 'Unknown' ? enriched.lifeStage : d.lifeStage,
            farmerName: d.farmerName || marker.farmerName,
            treatment: d.treatment ? parseTreatmentData(d.treatment) : null,
          };
        }
      }
      if ((!enriched.farmerName || enriched.farmerName === 'Unknown Farmer') && enriched.farmerId) {
        const name = await fetchFarmerName(enriched.farmerId);
        if (name) enriched.farmerName = name;
      }
      if (enriched.treatment && typeof enriched.treatment === 'string') enriched.treatment = parseTreatmentData(enriched.treatment);
      enriched.isFullyLoaded = true;
      enrichedCache.current[marker.id] = enriched;
      setSelectedMarker(enriched);
    } catch (err) {
      console.error(err);
      setSelectedMarker(marker);
    } finally {
      setLoadingDetails(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!markers.length) return;
        const pestTypes = ['ALL', ...new Set(markers.map(m => m.detection).filter(Boolean))];
        const districts = ['ALL', ...new Set(markers.map(m => m.areaName).filter(Boolean))];
        setAvailablePestTypes(pestTypes);
        setAvailableDistricts(districts);
    }, [markers]);

useEffect(() => {
  let filtered = [...markers];
  
  // Pest Type filter
  if (filters.pestType !== 'ALL') {
    filtered = filtered.filter(m => m.detection === filters.pestType);
  }
  
  // Severity filter
  if (filters.severity !== 'ALL') {
    filtered = filtered.filter(m => m.risk === filters.severity);
  }
  
  // District filter
  if (filters.district !== 'ALL') {
    filtered = filtered.filter(m => m.areaName === filters.district);
  }
  
  // Date Range filter
  const now = new Date();
  let cutoffDate = null;
  if (filters.dateRange === 'Last 7 Days') {
    cutoffDate = new Date(now.setDate(now.getDate() - 7));
  } else if (filters.dateRange === 'Last 30 Days') {
    cutoffDate = new Date(now.setDate(now.getDate() - 30));
  }
  if (cutoffDate) {
    filtered = filtered.filter(m => {
      if (!m.timestamp) return false;
      const ts = m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000) : new Date(m.timestamp);
      return ts >= cutoffDate;
    });
  }
  
  setFilteredMarkers(filtered);
}, [markers, filters]);

useEffect(() => {
  // Active farms: unique farmerIds from filtered markers
  const uniqueFarmers = new Set(filteredMarkers.map(m => m.farmerId).filter(Boolean));
  setActiveFarmsCount(uniqueFarmers.size);
  
  // Acreage affected: sum of acres of farms that have at least one filtered marker
  const affectedFarmerIds = new Set(filteredMarkers.map(m => m.farmerId).filter(Boolean));
  let totalAcreage = 0;
  farmPolygons.forEach(poly => {
    if (affectedFarmerIds.has(poly.farmerId) && poly.area) {
      totalAcreage += parseFloat(poly.area) || 0;
    }
  });
  setAcreageAffected(Math.round(totalAcreage).toLocaleString());
}, [filteredMarkers, farmPolygons]);

  // Fetch polygons
  useEffect(() => {
    const run = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const polygons = [];
        for (const userDoc of usersSnap.docs) {
          const userId = userDoc.id;
          const ud = userDoc.data();
          const farmerName = ud.fullName || ud.name || 'Unnamed Farmer';
          const farmsSnap = await getDocs(collection(db, 'users', userId, 'farms'));
          farmsSnap.forEach(fd => {
            const f = fd.data();
            if (f.boundaries?.length > 2)
              polygons.push({ type: 'farm', id: fd.id, name: f.name || 'Unnamed Farm', farmerId: userId, farmerName, area: f.acres, coordinates: f.boundaries.map(p => [p.lat, p.lng]) });
          });
          const fieldsSnap = await getDocs(collection(db, 'users', userId, 'fields'));
          fieldsSnap.forEach(fd => {
            const f = fd.data();
            if (f.boundaries?.length > 2)
              polygons.push({ type: 'field', id: fd.id, name: f.name || 'Unnamed Field', farmerId: userId, farmerName, area: f.acres, crop: f.crop, coordinates: f.boundaries.map(p => [p.lat, p.lng]) });
          });
        }
        setFarmPolygons(polygons);
      } catch (err) { console.error(err); }
    };
    run();
  }, []);

  // Listen for validations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'reports'), (snap) => {
    const list = snap.docs.map(d => {
    const data = d.data();
    const lat = data.location?.lat;
    const lng = data.location?.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        console.warn('Skipping invalid validation doc:', d.id);
        return null;
    }
    return {
        id: d.id,
        lat: lat,
        lng: lng,
        reportId: data.reportId,
        expertDiagnosis: data.expertDiagnosis || 'No diagnosis',
        mitigationAction: data.mitigationAction || 'Not specified',
        detection: data.detection || 'Unknown',
        risk: data.risk || 'Unknown',
        lifeStage: data.lifeStage || 'Unknown',
        internalNotes: data.internalNotes,
        farmerId: data.farmerId,
        farmerName: data.farmerName || 'Unknown Farmer',
        scientificName: data.scientificName,
        confidence: data.confidence,
        status: data.status,
        timestamp: data.timestamp,
        areaName: data.location?.areaName,
        analysis: data.analysis,
        treatment: data.treatment,
        historicalContext: data.historicalContext,
        cropAffected: data.cropAffected,
        imageBase64: data.imageBase64 || null,
        annotated_url: data.annotated_url || null,
        isFullyLoaded: false,
    };
    }).filter(Boolean);
      setMarkers(list);
    }, err => console.error(err));
    return () => unsub();
  }, []);

  const closeAll = () => {
    setSelectedMarker(null);
    setProximityData(null);
    setSelectedFarm(null);
    setActiveSidebarType(null);
  };

  const handleMarkerClick = (marker) => {
    setActiveSidebarType('report');
    setProximityData(null);
    setSelectedFarm(null);
    loadMarkerDetails(marker);
  };

  const handleCircleClick = (marker, cfg, radius) => {
    setActiveSidebarType('proximity');
    setSelectedMarker(null);
    setSelectedFarm(null);
    setProximityData({ marker, cfg, radius });
  };

  const handleFarmClick = (farm) => {
    setActiveSidebarType('farm');
    setSelectedMarker(null);
    setProximityData(null);
    setSelectedFarm(farm);
  };

  return (
    <div className="relative w-full h-[48rem] font-['Inter'] overflow-hidden bg-[#062C1E]">
      {/* Filter bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-6xl">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 flex items-center justify-between gap-4 border border-white/20">
        <div className="flex-1 group cursor-pointer relative">
            <p className="text-[10px] font-bold text-gray-500 mb-1 tracking-wider uppercase">PEST TYPE</p>
            <select 
            value={filters.pestType}
            onChange={(e) => setFilters({...filters, pestType: e.target.value})}
            className="w-full bg-transparent font-semibold text-gray-800 text-sm appearance-none cursor-pointer focus:outline-none"
            >
            {availablePestTypes.map(type => (
                <option key={type} value={type}>{type}</option>
            ))}
            </select>
            <ChevronDown size={16} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        
        <div className="flex-1 group cursor-pointer relative">
            <p className="text-[10px] font-bold text-gray-500 mb-1 tracking-wider uppercase">DATE RANGE</p>
            <select 
            value={filters.dateRange}
            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
            className="w-full bg-transparent font-semibold text-gray-800 text-sm appearance-none cursor-pointer focus:outline-none"
            >
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="All Time">All Time</option>
            </select>
            <ChevronDown size={16} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        
        <div className="flex-1 group cursor-pointer relative">
            <p className="text-[10px] font-bold text-gray-500 mb-1 tracking-wider uppercase">SEVERITY</p>
            <select 
            value={filters.severity}
            onChange={(e) => setFilters({...filters, severity: e.target.value})}
            className="w-full bg-transparent font-semibold text-gray-800 text-sm appearance-none cursor-pointer focus:outline-none"
            >
            <option value="ALL">ALL LEVELS</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            </select>
            <ChevronDown size={16} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        
        <div className="flex-1 group cursor-pointer relative">
            <p className="text-[10px] font-bold text-gray-500 mb-1 tracking-wider uppercase">DISTRICT/LOCATION</p>
            <select 
            value={filters.district}
            onChange={(e) => setFilters({...filters, district: e.target.value})}
            className="w-full bg-transparent font-semibold text-gray-800 text-sm appearance-none cursor-pointer focus:outline-none"
            >
            {availableDistricts.map(district => (
                <option key={district} value={district}>{district === 'ALL' ? 'ENTIRE REGION' : district}</option>
            ))}
            </select>
            <ChevronDown size={16} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        </div>
      </div>

      {/* Map */}
      <MapContainer center={position} zoom={13} zoomControl={false} className="w-full h-full z-0">
        <MapController polygons={farmPolygons} mapRef={mapRef} />
        <LayersControl position="topleft">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; Esri' />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Proximity circles (rendered below markers) */}
        <LayerGroup>
        {filteredMarkers.map(m => (
            <ProximityCircle key={`prox-${m.id}`} marker={m} onCircleClick={handleCircleClick} />
        ))}
        </LayerGroup>

        {filteredMarkers.map(m => m.lat && m.lng && (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={getMarkerIcon(m.lifeStage, m.risk)}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                handleMarkerClick(m);
              },
            }}
          />
        ))}

        {/* Farm polygons */}
        <LayerGroup>
          {farmPolygons.map(poly => (
            <ClickablePolygon
              key={`${poly.type}-${poly.id}`}
              poly={poly}
              onPolygonClick={handleFarmClick}
              mapRef={mapRef}
              isSelected={selectedFarm?.id === poly.id}
            />
          ))}
        </LayerGroup>

        <CustomZoomControls mapRef={mapRef} farmPolygons={farmPolygons} />
      </MapContainer>

      {/* ── Report Panel ── */}
      <div className={`fixed top-0 right-0 h-screen w-[520px] bg-white z-[2000] shadow-[-10px_0_40px_rgba(0,0,0,0.15)] transition-transform duration-300 overflow-y-auto ${selectedMarker && activeSidebarType === 'report' ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedMarker && activeSidebarType === 'report' && (
          <ReportPanel
            marker={selectedMarker}
            loadingDetails={loadingDetails}
            onClose={closeAll}
          />
        )}
      </div>

      {/* ── Proximity Panel ── */}
      <div className={`fixed top-0 right-0 h-screen w-[520px] bg-white z-[2000] shadow-[-10px_0_40px_rgba(0,0,0,0.15)] transition-transform duration-300 overflow-y-auto ${proximityData && activeSidebarType === 'proximity' ? 'translate-x-0' : 'translate-x-full'}`}>
        {proximityData && activeSidebarType === 'proximity' && (
          <ProximityPanel
            data={proximityData}
            onClose={closeAll}
          />
        )}
      </div>

      {/* ── Farm/Field Panel ── */}
      <div className={`fixed top-0 right-0 h-screen w-[520px] bg-white z-[2000] shadow-[-10px_0_40px_rgba(0,0,0,0.15)] transition-transform duration-300 overflow-y-auto ${selectedFarm && activeSidebarType === 'farm' ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedFarm && activeSidebarType === 'farm' && (
          <>
            <div className={`relative h-64 w-full overflow-hidden ${selectedFarm.type === 'farm' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-green-400 to-green-600'}`}>
              <div className="absolute inset-0 bg-black/20" />
              <button onClick={closeAll} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg"><X size={16} /></button>
              <div className="absolute top-4 left-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg ${selectedFarm.type === 'farm' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>{selectedFarm.type}</span></div>
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/80 mb-2">{selectedFarm.type === 'farm' ? 'Farm Details' : 'Field Details'}</p>
                <h2 className="text-3xl font-black text-white">{selectedFarm.name}</h2>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className={`${selectedFarm.type === 'farm' ? 'bg-blue-50' : 'bg-green-50'} rounded-xl p-4 text-center border`}>
                  <p className="text-[10px] uppercase font-bold text-gray-500">Area</p>
                  <p className="text-2xl font-black">{selectedFarm.area ? `${selectedFarm.area} ac` : 'N/A'}</p>
                </div>
                {selectedFarm.crop && (
                  <div className="bg-amber-50 rounded-xl p-4 text-center border">
                    <p className="text-[10px] uppercase font-bold text-amber-600">Crop</p>
                    <p className="text-xl font-black text-amber-700">{selectedFarm.crop}</p>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4"><User size={16} /><h3 className="text-sm font-black uppercase">Farmer Information</h3></div>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-gray-600">Name</span><span className="font-semibold">{selectedFarm.farmerName || 'Unknown'}</span></div>
                  {selectedFarm.farmerId && <div className="flex justify-between"><span className="text-gray-600">Farmer ID</span><span className="text-xs font-mono">{selectedFarm.farmerId.substring(0, 12)}...</span></div>}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { 
                    if (mapRef.current && selectedFarm.coordinates?.length) { 
                      const validCoords = selectedFarm.coordinates.filter(c => Array.isArray(c) && c.length === 2 && 
                        typeof c[0] === 'number' && typeof c[1] === 'number' && 
                        !isNaN(c[0]) && !isNaN(c[1]));
                      if (validCoords.length) {
                        const lats = validCoords.map(c => c[0]), lngs = validCoords.map(c => c[1]); 
                        zoomToBounds(mapRef.current, [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], 80);
                      }
                    } 
                  }}
                  className={`flex-1 py-3 rounded-xl ${selectedFarm.type === 'farm' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white font-bold text-sm flex items-center justify-center gap-2`}
                >
                  <MapPin size={16} /> Zoom to {selectedFarm.type}
                </button>
                <button className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-bold text-sm flex items-center justify-center gap-2"><Share2 size={16} /> Export</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Legend & overlays */}
      <div className="absolute bottom-10 left-0 right-0 z-[1000] px-10 flex items-end justify-between pointer-events-none">
        <div className="bg-white rounded-2xl p-5 shadow-2xl w-72 border border-gray-100 pointer-events-auto">
          <h4 className="text-[10px] font-bold text-gray-500 mb-4 uppercase">Risk Density Heatmap</h4>
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-600 mb-2" />
          <div className="flex justify-between text-[10px] text-gray-400 font-medium mb-4"><span>Low</span><span>Moderate</span><span>High</span></div>
          <div className="space-y-2">
            <StatusItem color="bg-red-500" label="Outbreak" range="> 65%" />
            <StatusItem color="bg-yellow-400" label="Warning" range="30 - 64%" />
            <StatusItem color="bg-green-500" label="Monitoring" range="< 30%" />
          </div>
          {/* Life stage proximity legend */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Proximity Zones</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 border border-dashed border-green-500 rounded" style={{ background: 'rgba(34,197,94,0.2)' }} />
              <span className="text-[10px] text-gray-600">Larva · 2 m ground zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 border border-dashed border-violet-500 rounded" style={{ background: 'rgba(139,92,246,0.15)' }} />
              <span className="text-[10px] text-gray-600">Moth · 1–5 km aerial zone</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-[0.3rem] mr-[30rem] pointer-events-auto">
          <InsightCard 
            label="ACTIVE FARMS" 
            value={activeFarmsCount.toString()} 
            badge="IN RANGE" 
            badgeColor="text-green-500 bg-green-50" 
            />
        <InsightCard 
            label="ACREAGE AFFECTED" 
            value={acreageAffected} 
            badge={`${filteredMarkers.length} reports`} 
            badgeColor="text-red-500 bg-red-50" 
            />
        </div>

        <div className="flex gap-4 mb-2 pointer-events-auto">
          <button className="px-8 py-4 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-2"><Share2 size={18} /> Export</button>
          <button className="px-8 py-4 bg-[#14532D] text-white rounded-xl font-bold shadow-lg hover:bg-[#062C1E] flex items-center gap-2"><Bell size={18} /> Send Alert</button>
        </div>
      </div>
    </div>
  );
};

const StatusItem = ({ color, label, range }) => (
  <div className="flex items-center justify-between text-xs">
    <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${color}`} /><span className="text-gray-600 font-medium">{label}</span></div>
    <span className="text-gray-400 font-mono text-[10px]">{range}</span>
  </div>
);

const InsightCard = ({ label, value, badge, badgeColor }) => (
  <div className="bg-white rounded-2xl p-5 shadow-2xl min-w-[200px] h-[5rem] border border-gray-100">
    <p className="text-[10px] font-bold text-gray-400 mb-1 tracking-widest">{label}</p>
    <div className="flex items-baseline gap-3">
      <span className="text-2xl font-black text-gray-800">{value}</span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeColor}`}>{badge}</span>
    </div>
  </div>
);

export default RiskMap;