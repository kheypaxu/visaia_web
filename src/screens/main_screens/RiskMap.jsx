import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup } from 'react-leaflet';
import { ChevronDown, Share2, Bell, Maximize, Plus, Minus } from 'lucide-react';
import { MdPestControl } from 'react-icons/md';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust this import path as needed
import L from 'leaflet';
import { renderToString } from 'react-dom/server';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Zoom Control to match the UI top-right placement
const CustomZoomControls = () => (
    <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2 bg-white rounded-xl shadow-lg p-1">
        <button className="p-2 hover:bg-gray-100 border-b border-gray-100 transition-colors">
            <Plus size={20} className="text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 border-b border-gray-100 transition-colors">
            <Minus size={20} className="text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 transition-colors">
            <Maximize size={20} className="text-gray-600" />
        </button>
    </div>
);

const RiskMap = () => {
    const [position] = useState([10.7202, 122.5621]); // Updated to Iloilo City coordinates
    const [markers, setMarkers] = useState([]);

    // Add this helper function inside RiskMap
    const getPestIcon = (action) => {
        // Create custom icon using react-icons
        const iconColor = action === 'Chemical' ? '#ef4444' : '#10b981'; // Red for Chemical, Green for others

        const iconHTML = renderToString(
            <MdPestControl size={32} color={iconColor} />
        );

        return new L.DivIcon({
            html: iconHTML,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
            className: 'custom-div-icon'
        });
    };

    // Set up real-time listener for validations collection
    useEffect(() => {
        const validationsCollection = collection(db, 'validations');

        const fetchAllData = async (snapshot) => {
            const promises = snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                if (!data.lat || !data.lng) return null;

                let markerInfo = {
                    id: docSnap.id,
                    lat: data.lat,
                    lng: data.lng,
                    expertDiagnosis: data.expertDiagnosis || 'No diagnosis available',
                    mitigationAction: data.mitigationAction || 'No mitigation action specified',
                    risk: 'Unknown',
                    lifeStage: 'Unknown',
                    detection: 'Unknown',
                    annotated_url: null,
                    imageBase64: null,
                    ...data
                };

                if (data.reportId) {
                    try {
                        const reportRef = doc(db, 'reports', data.reportId);
                        const reportSnap = await getDoc(reportRef);
                        if (reportSnap.exists()) {
                            const reportData = reportSnap.data();
                            markerInfo.detection = reportData.detection || markerInfo.detection;
                            markerInfo.risk = reportData.risk || reportData.riskLevel || markerInfo.risk;
                            markerInfo.lifeStage = reportData.lifeStage || markerInfo.lifeStage;
                            markerInfo.imageBase64 = reportData.imageBase64;

                            if (reportData.imageBase64) {
                                try {
                                    const base64Content = reportData.imageBase64.includes(',')
                                        ? reportData.imageBase64.split(',')[1]
                                        : reportData.imageBase64;

                                    const byteString = atob(base64Content);
                                    const ab = new ArrayBuffer(byteString.length);
                                    const ia = new Uint8Array(ab);
                                    for (let i = 0; i < byteString.length; i++) {
                                        ia[i] = byteString.charCodeAt(i);
                                    }
                                    const file = new File([ab], "image.jpg", { type: "image/jpeg" });
                                    const formData = new FormData();
                                    formData.append('image', file);

                                    const response = await fetch('http://localhost:5000/predict', {
                                        method: 'POST',
                                        body: formData
                                    });
                                    if (response.ok) {
                                        const predData = await response.json();
                                        markerInfo.annotated_url = predData.image_url;
                                    }
                                } catch (e) {
                                    console.error("Error generating annotated image for marker:", e);
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching report data for marker:", err);
                    }
                }
                return markerInfo;
            });
            const results = await Promise.all(promises);
            setMarkers(results.filter(r => r !== null));
        };

        const unsubscribe = onSnapshot(validationsCollection, fetchAllData, (error) => {
            console.error("Error fetching validations: ", error);
        });

        // Cleanup the listener when component unmounts
        return () => unsubscribe();
    }, []); // Empty dependency array means this effect runs once on mount

    return (
        <div className="relative w-full h-[48rem] font-['Inter'] overflow-hidden bg-[#062C1E]">

            {/* 1. Floating Filter Bar (Top) */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-6xl">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 flex items-center justify-between gap-4 border border-white/20">
                    {[
                        { label: 'PEST TYPE', value: 'ALL PESTS' },
                        { label: 'DATE RANGE', value: 'Last 7 Days' },
                        { label: 'SEVERITY', value: 'ALL LEVELS' },
                        { label: 'DISTRICT/LOCATION', value: 'ENTIRE REGION' }
                    ].map((filter, idx) => (
                        <div key={idx} className="flex-1 group cursor-pointer">
                            <p className="text-[10px] font-bold text-gray-500 mb-1 tracking-wider uppercase">
                                {filter.label}
                            </p>
                            <div className="flex items-center justify-between border-r border-gray-200 last:border-0 px-1">
                                <span className="font-semibold text-gray-800 text-sm">{filter.value}</span>
                                <ChevronDown size={16} className="text-gray-400 mr-4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Map Container */}
            <MapContainer
                center={position}
                zoom={13}
                zoomControl={false}
                className="w-full h-full z-0"
            >
                <LayersControl position="topleft">
                    <LayersControl.BaseLayer checked name="OpenStreetMap">
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                    </LayersControl.BaseLayer>

                    <LayersControl.BaseLayer name="Satellite">
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>

                {/* Render markers from Firestore data with custom icons */}
                {markers.map((marker) => (
                    marker.lat && marker.lng && (
                        <Marker
                            key={marker.id}
                            position={[marker.lat, marker.lng]}
                            icon={getPestIcon(marker.mitigationAction)}
                        >
                            <Popup className="custom-popup-card">
                                <div className="w-[320px] bg-white rounded-2xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border border-gray-100 font-['Inter']">
                                    {/* Image Gallery Style Header */}
                                    <div className="relative h-44 w-full group overflow-hidden">
                                        <img
                                            src={marker.annotated_url || (marker.imageBase64 ? `data:image/jpeg;base64,${marker.imageBase64}` : "https://placehold.co/600x400/e2e8f0/1e293b?text=No+Image")}
                                            alt="Diagnosis"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-900/40 to-transparent"></div>

                                        {/* Top Badges */}
                                        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg backdrop-blur-md border ${marker.risk === 'High'
                                                ? 'bg-red-500/30 text-red-50 border-red-500/50'
                                                : marker.risk === 'Unknown'
                                                    ? 'bg-gray-500/30 text-gray-50 border-gray-500/50'
                                                    : 'bg-green-500/30 text-green-50 border-green-500/50'
                                                }`}>
                                                <span className="flex items-center gap-1.5">
                                                    {marker.risk === 'High' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>}
                                                    {marker.risk} RISK
                                                </span>
                                            </span>
                                        </div>

                                        {/* Bottom Left Title */}
                                        <div className="absolute bottom-4 left-5 right-5">
                                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-1 opacity-90">Identified Pest</p>
                                            <h4 className="text-xl font-black text-white leading-tight drop-shadow-md tracking-tight">
                                                {marker.detection !== 'Unknown' ? marker.detection : marker.expertDiagnosis}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-4">
                                        {/* Quick Stats Grid */}
                                        <div className="grid grid-cols-2 gap-3 pb-4 border-b border-gray-100">
                                            <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/60 transition-colors hover:bg-gray-100">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                    Life Stage
                                                </p>
                                                <p className="font-bold text-gray-800 text-xs truncate">{marker.lifeStage}</p>
                                            </div>
                                            <div className={`rounded-xl p-3 border transition-colors ${marker.expertDiagnosis === 'match' ? 'bg-[#10B981]/10 border-[#10B981]/20 hover:bg-[#10B981]/20' : 'bg-gray-50/80 border-gray-100/60 hover:bg-gray-100'}`}>
                                                <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${marker.expertDiagnosis === 'match' ? 'text-[#10B981]' : 'text-gray-400'}`}>
                                                    Validation
                                                </p>
                                                <p className={`font-bold text-xs truncate capitalize ${marker.expertDiagnosis === 'match' ? 'text-[#065F46]' : 'text-gray-800'}`}>
                                                    {marker.expertDiagnosis === 'match' ? 'Confirmed ✓' : marker.expertDiagnosis}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Strategy Section */}
                                        <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100/40">
                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-800">Action Plan</p>
                                            </div>
                                            <p className="text-xs font-semibold text-blue-900/80 leading-relaxed pl-8">
                                                {marker.mitigationAction}
                                            </p>
                                        </div>

                                        {/* Notes (if any) */}
                                        {marker.internalNotes && marker.internalNotes.trim() !== '' && (
                                            <div className="pt-1">
                                                <p className="text-[10px] text-gray-500 font-medium italic relative pl-3 leading-relaxed before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-gray-200 before:rounded-full">
                                                    "{marker.internalNotes}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}

                <CustomZoomControls />
            </MapContainer>

            {/* 3. Bottom Overlays */}
            {/* Added pointer-events-none here to allow map dragging everywhere by default */}
            <div className="absolute bottom-10 left-0 right-0 z-[1000] px-10 flex items-end justify-between pointer-events-none">

                {/* Risk Density Legend - Still visual, but won't block map dragging */}
                <div className="bg-white rounded-2xl p-5 shadow-2xl w-72 border border-gray-100">
                    <h4 className="text-[10px] font-bold text-gray-500 mb-4 uppercase tracking-widest">Risk Density Heatmap</h4>
                    <div className="h-2 w-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-600 mb-2" />
                    <div className="flex justify-between text-[10px] text-gray-400 font-medium mb-4">
                        <span>Low</span>
                        <span>Moderate</span>
                        <span>High</span>
                    </div>

                    <div className="space-y-2">
                        <StatusItem color="bg-red-500" label="Outbreak" range="> 65%" />
                        <StatusItem color="bg-yellow-400" label="Warning" range="30 - 64%" />
                        <StatusItem color="bg-green-500" label="Monitoring" range="< 30%" />
                    </div>
                </div>

                {/* Data Insight Cards - Still visual, but won't block map dragging */}
                <div className="flex flex-col gap-4 mb-[0.3rem] mr-[30rem]">
                    <InsightCard label="ACTIVE FARMS" value="430" badge="IN RANGE" badgeColor="text-green-500 bg-green-50" />
                    <InsightCard label="ACREAGE AFFECTED" value="12,450" badge="12%" badgeColor="text-red-500 bg-red-50" />
                </div>

                {/* Action Buttons - Re-enabled pointer-events so buttons are clickable */}
                <div className="flex gap-4 mb-2 pointer-events-auto">
                    <button className="px-8 py-4 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-all uppercase text-sm tracking-widest flex items-center gap-2">
                        <Share2 size={18} />
                        Export
                    </button>
                    <button className="px-8 py-4 bg-[#14532D] text-white rounded-xl font-bold shadow-lg hover:bg-[#062C1E] transition-all uppercase text-sm tracking-widest flex items-center gap-2">
                        <Bell size={18} />
                        Send Regional Alert
                    </button>
                </div>

            </div>
        </div>
    );
};

// Helper Components
const StatusItem = ({ color, label, range }) => (
    <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-gray-600 font-medium">{label}</span>
        </div>
        <span className="text-gray-400 font-mono text-[10px]">{range}</span>
    </div>
);

const InsightCard = ({ label, value, badge, badgeColor }) => (
    <div className="bg-white rounded-2xl p-5 shadow-2xl min-w-[200px] h-[5rem] border border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 mb-1 tracking-widest">{label}</p>
        <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black text-gray-800">{value}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeColor}`}>
                {badge}
            </span>
        </div>
    </div>
);

export default RiskMap;