import React from 'react';
import { HiTrendingUp, HiTrendingDown, HiBell } from 'react-icons/hi';
import { MdOutlineDashboard } from 'react-icons/md';

const Overview = () => {
  // Data for the summary cards
  const stats = [
    { label: 'TOTAL REPORTS', value: '1,284', change: '+12%', color: 'blue' },
    { label: 'INCOMING VALIDATION', value: '42', status: 'Pending', color: 'orange' },
    { label: 'CONFIRMED CASES', value: '856', status: 'Active', color: 'green' },
    { label: 'REJECTED REPORTS', value: '386', change: '-2%', color: 'red' },
    { label: 'HIGH RISK FARMS', value: '15', status: 'Critical', color: 'pink' },
    { label: 'ALERTS SENT', value: '5,200', status: 'Sent', color: 'emerald' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <div className="flex gap-4 text-xs text-gray-400 mt-1 font-medium">
            <span>📅 Monday, February 09, 2026</span>
            <span>🕒 09:42 AM (GMT+8)</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            ADMIN
          </div>
          <button className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <HiBell className="text-xl" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
               <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-opacity-10 bg-${stat.color}-500`}>
                 <MdOutlineDashboard className={`text-${stat.color}-500 text-lg`} />
               </div>
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.change?.includes('+') ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                 {stat.change || stat.status}
               </span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Mini Risk Map (2/3 width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xl font-bold">🌍</span>
              <h3 className="font-bold text-gray-900">Mini Risk Map</h3>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button className="px-4 py-1.5 text-xs font-bold bg-green-600 text-white rounded-md shadow-sm">Heatmap</button>
              <button className="px-4 py-1.5 text-xs font-bold text-gray-500">Clustered</button>
            </div>
          </div>
          
          <div className="relative h-[400px] bg-gray-100 rounded-xl overflow-hidden">
            {/* Placeholder for Map - In production, you'd use Leaflet or Google Maps */}
            <img 
              src="src/assets/map-placeholder.png" 
              className="w-full h-full object-cover grayscale-[0.2]" 
              alt="Map View"
            />
            {/* Severity Legend */}
            <div className="absolute bottom-4 left-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100 min-w-[160px]">
              <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-tighter">Risk Severity Legend</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span> Critical Risk
                </li>
                <li className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span> Moderate Risk
                </li>
                <li className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                  <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></span> Low Risk
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Distributions */}
        <div className="space-y-6">
          {/* Pest Type Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-green-600">🐛</span>
              <h3 className="font-bold text-gray-900">Pest Type Distribution</h3>
            </div>
            <div className="space-y-6">
              {[
                { name: 'Fall Armyworm', val: 42, color: 'bg-green-500' },
                { name: 'Desert Locusts', val: 28, color: 'bg-yellow-400' },
                { name: 'Tomato Leaf Miner', val: 18, color: 'bg-blue-500' },
                { name: 'Others', val: 12, color: 'bg-gray-300' }
              ].map((pest) => (
                <div key={pest.name}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-gray-700">{pest.name}</span>
                    <span className="text-gray-400">{pest.val}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className={`${pest.color} h-full`} style={{ width: `${pest.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Life Stage Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-green-600">⌛</span>
              <h3 className="font-bold text-gray-900">Life Stage Distribution</h3>
            </div>
            <div className="flex flex-col items-center">
              {/* Simple CSS-based Donut Placeholder */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="50" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
                  <circle cx="64" cy="64" r="50" stroke="#22c55e" strokeWidth="12" fill="transparent" strokeDasharray="314" strokeDashoffset="100" />
                  <circle cx="64" cy="64" r="50" stroke="#eab308" strokeWidth="12" fill="transparent" strokeDasharray="314" strokeDashoffset="260" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-extrabold text-gray-900">1.2k</span>
                  <p className="text-[10px] text-gray-400 font-bold uppercase leading-none">Total</p>
                </div>
              </div>
              <ul className="mt-6 space-y-2 w-full px-4">
                <li className="flex items-center justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 bg-yellow-400 rounded-full"></span> Egg Larva</div>
                  <span className="text-gray-400">25%</span>
                </li>
                <li className="flex items-center justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Adult</div>
                  <span className="text-gray-400">65%</span>
                </li>
                <li className="flex items-center justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 bg-gray-200 rounded-full"></span> Pupa</div>
                  <span className="text-gray-400">10%</span>
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