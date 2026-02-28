import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiViewGrid, HiMap, HiUsers, HiChartBar, HiCog, HiLogout } from 'react-icons/hi';
import { HiCheckBadge } from "react-icons/hi2";
import visaiaLogo from '../assets/visaia_logo.png';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/overview', icon: <HiViewGrid /> },
    { name: 'Validation', path: '/validation', icon: <HiCheckBadge /> },
    { name: 'Risk Map', path: '/risk-map', icon: <HiMap /> },
    { name: 'Farmers', path: '/farmers', icon: <HiUsers /> },
    { name: 'Analytics', path: '/analytics', icon: <HiChartBar /> },
    { name: 'Settings', path: '/settings', icon: <HiCog /> },
  ];

  return (
    <aside 
      className="w-64 bg-[#042F21] text-white flex flex-col shrink-0 h-screen sticky top-0"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      
      {/* Logo Section */}
      <div className="pt-10 pb-8 pl-8 flex items-center gap-3">
        <img 
          src={visaiaLogo} 
          alt="VISAIA Logo" 
          className="w-10 h-10 object-contain"
          onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=V&background=10B981&color=fff&rounded=true"; }}
        />
        <div className="flex flex-col">
          <h2 className="font-black text-[24px] leading-none tracking-[0.2em] mb-1">
            VISAIA
          </h2>
          <span className="text-[9px] font-normal text-gray-300 uppercase tracking-[0.05em]">
            Pest Management
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 pl-6 space-y-2 overflow-y-auto mt-2">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);

          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 py-3.5 pl-6 transition-all rounded-l-full tracking-[0.03em] ${
                isActive 
                  ? 'bg-white text-[#042F21] font-bold shadow-md' // Active = Bold
                  : 'text-gray-300 hover:bg-white/10 hover:text-white font-normal' // Inactive = Regular
              }`}
            >
              <span className="text-[20px]">{item.icon}</span>
              <span className="text-[12px]">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout Section */}
      <div className="p-6 border-t border-white/10 mt-auto">
        <div className="flex flex-col items-center text-center">
          <img 
            src="https://ui-avatars.com/api/?name=John+Doe&background=E5E7EB&color=374151"
            className="w-12 h-12 rounded-full mb-3 object-cover border-2 border-white/20"
            alt="Profile"
          />
          <h4 className="font-bold text-[13px] tracking-[0.03em] mb-0.5">John Peter Doe</h4>
          <p className="text-[11px] font-normal text-gray-400 mb-5 tracking-[0.03em]">Maknae</p>
          
          <button 
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 bg-white text-[#042F21] py-2.5 rounded-full font-bold text-[13px] hover:bg-gray-100 transition-colors shadow-sm tracking-[0.03em]"
          >
            <HiLogout className="text-lg" />
            Logout
          </button>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;