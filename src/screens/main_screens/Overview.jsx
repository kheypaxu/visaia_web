import React, { useState } from 'react';
import { 
  HiOutlineDocumentText, 
  HiOutlineClipboardList, 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineExclamationCircle 
} from 'react-icons/hi';
import { HiOutlinePaperAirplane } from 'react-icons/hi2';

const Overview = () => {
  // STATE MANAGEMENT
  const [mapMode, setMapMode] = useState('heatmap'); // 'heatmap' or 'clustered'
  const [mapZoom, setMapZoom] = useState(1); // Controls map scaling

  // HANDLERS
  const handleZoomIn = () => {
    setMapZoom(prev => Math.min(prev + 0.2, 3)); // Max zoom 3x
  };

  const handleZoomOut = () => {
    setMapZoom(prev => Math.max(prev - 0.2, 0.5)); // Min zoom 0.5x
  };

  const handleFullscreen = () => {
    alert("Fullscreen map view will open here in production.");
  };

  // MOCK DATA
  const stats = [
    { 
      label: 'TOTAL REPORTS', 
      value: '1,284', 
      status: '+12%', 
      statusColor: 'text-blue-600', 
      iconBg: 'bg-blue-50', 
      iconColor: 'text-blue-500',
      icon: <HiOutlineDocumentText className="text-xl" /> 
    },
    { 
      label: 'INCOMING VALIDATION', 
      value: '42', 
      status: 'Pending', 
      statusColor: 'text-orange-500', 
      iconBg: 'bg-orange-50', 
      iconColor: 'text-orange-500',
      icon: <HiOutlineClipboardList className="text-xl" /> 
    },
    { 
      label: 'CONFIRMED CASES', 
      value: '856', 
      status: 'Active', 
      statusColor: 'text-green-500', 
      iconBg: 'bg-green-50', 
      iconColor: 'text-green-500',
      icon: <HiOutlineCheckCircle className="text-xl" /> 
    },
    { 
      label: 'REJECTED REPORTS', 
      value: '386', 
      status: '-2%', 
      statusColor: 'text-red-500', 
      iconBg: 'bg-red-50', 
      iconColor: 'text-red-500',
      icon: <HiOutlineXCircle className="text-xl" /> 
    },
    { 
      label: 'HIGH RISK FARMS', 
      value: '15', 
      status: 'Critical', 
      statusColor: 'text-red-600', 
      iconBg: 'bg-red-50', 
      iconColor: 'text-red-600',
      icon: <HiOutlineExclamationCircle className="text-xl" /> 
    },
    { 
      label: 'TOTAL CORNS HARVESTED', 
      value: '50,200', 
      suffix: 'tons',
      status: 'Q2', 
      statusColor: 'text-green-500', 
      iconBg: 'bg-green-50', 
      iconColor: 'text-green-500',
      icon: <HiOutlinePaperAirplane className="text-xl" /> 
    },
  ];

  const pestDistribution = [
    { name: 'Fall Armyworm', val: 42, color: 'bg-[#10B981]' },
    { name: 'Desert Locusts', val: 28, color: 'bg-yellow-400' },
    { name: 'Tomato Leaf Miner', val: 18, color: 'bg-blue-500' },
    { name: 'Others', val: 12, color: 'bg-gray-300' }
  ];

  return (
    <div className="space-y-6 flex flex-col h-full">

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg} ${stat.iconColor}`}>
                 {stat.icon}
               </div>
               <span className={`text-[11px] font-bold ${stat.statusColor}`}>
                 {stat.status}
               </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-extrabold text-gray-900 flex items-baseline gap-1.5">
                {stat.value}
                {stat.suffix && <span className="text-sm font-semibold text-gray-500 tracking-normal">{stat.suffix}</span>}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Left: Mini Risk Map */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-xl font-bold">🌍</span>
              <h3 className="font-bold text-gray-900 tracking-tight text-lg">Mini Risk Map</h3>
            </div>
            
            {/* Toggle Switch */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setMapMode('heatmap')}
                className={`px-5 py-1.5 text-xs font-bold rounded-md transition-all ${
                  mapMode === 'heatmap' ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Heatmap
              </button>
              <button 
                onClick={() => setMapMode('clustered')}
                className={`px-5 py-1.5 text-xs font-bold rounded-md transition-all ${
                  mapMode === 'clustered' ? 'bg-[#10B981] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Clustered
              </button>
            </div>
          </div>
          
          {/* Map Area */}
          <div className="relative flex-1 min-h-[400px] bg-[#E2E8F0] rounded-xl overflow-hidden flex items-center justify-center border border-gray-200">
            
            {/* Map Image - Mock */}
            <img 
              src="https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=1200&auto=format&fit=crop" 
              alt="Farm Map View" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out"
              style={{ transform: `scale(${mapZoom})` }}
            />

            {/* Severity Legend */}
            <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-sm p-5 rounded-xl shadow-md border border-gray-100 min-w-[180px] z-10">
              <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider">Risk Severity Legend</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-xs font-bold text-gray-700">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></span> Critical Risk
                </li>
                <li className="flex items-center gap-3 text-xs font-bold text-gray-700">
                  <span className="w-2.5 h-2.5 bg-[#10B981] rounded-full shadow-sm"></span> Moderate Risk
                </li>
                <li className="flex items-center gap-3 text-xs font-bold text-gray-700">
                  <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-sm"></span> Low Risk
                </li>
              </ul>
            </div>
            
            {/* Zoom Controls */}
            <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-100 flex gap-1 p-1 z-10">
              <button 
                onClick={handleZoomIn}
                className="w-8 h-8 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Zoom In"
              >
                +
              </button>
              <button 
                onClick={handleZoomOut}
                className="w-8 h-8 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Zoom Out"
              >
                -
              </button>
              <div className="w-px h-8 bg-gray-200 mx-1"></div>
              <button 
                onClick={handleFullscreen}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Fullscreen"
              >
                ⛶
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Distributions */}
        <div className="space-y-6 flex flex-col">
          
          {/* Pest Type Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-green-500 text-lg">🐛</span>
              <h3 className="font-bold text-gray-900 tracking-tight">Pest Type Distribution</h3>
            </div>
            
            <div className="space-y-6">
              {pestDistribution.map((pest) => (
                <div key={pest.name}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-gray-800">{pest.name}</span>
                    <span className="text-gray-400">{pest.val}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`${pest.color} h-full rounded-full transition-all duration-1000 ease-out`} 
                      style={{ width: `${pest.val}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Life Stage Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-green-500 text-lg">⌛</span>
              <h3 className="font-bold text-gray-900 tracking-tight">Life Stage Distribution</h3>
            </div>
            
            <div className="flex items-center justify-center gap-8 mt-4">
              
              {/* Donut Placeholder */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="44" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
                  <circle cx="56" cy="56" r="44" stroke="#10B981" strokeWidth="12" fill="transparent" strokeDasharray="276" strokeDashoffset="96" className="transition-all duration-1000 ease-out" />
                  <circle cx="56" cy="56" r="44" stroke="#FACC15" strokeWidth="12" fill="transparent" strokeDasharray="276" strokeDashoffset="207" className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-gray-900 leading-none mb-1">1.2k</span>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Total</p>
                </div>
              </div>
              
              {/* Legend List */}
              <ul className="space-y-3 flex-1">
                <li className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-sm"></span> Egg Larva
                  </div>
                  <span className="text-gray-400 font-medium">(25%)</span>
                </li>
                <li className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="w-2.5 h-2.5 bg-[#10B981] rounded-full shadow-sm"></span> Adult
                  </div>
                  <span className="text-gray-400 font-medium">(65%)</span>
                </li>
                <li className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="w-2.5 h-2.5 bg-gray-200 rounded-full shadow-sm"></span> Pupa
                  </div>
                  <span className="text-gray-400 font-medium">(10%)</span>
                </li>
              </ul>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Overview;