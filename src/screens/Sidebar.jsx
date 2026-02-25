import React from 'react';
import { HiViewGrid, HiMap, HiUsers, HiChartBar, HiCog, HiLogout } from 'react-icons/hi';
import { HiCheckBadge } from "react-icons/hi2";

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: <HiViewGrid />, active: true },
    { name: 'Validation', icon: <HiCheckBadge />, active: false },
    { name: 'Risk Map', icon: <HiMap />, active: false },
    { name: 'Farmers', icon: <HiUsers />, active: false },
    { name: 'Analytics', icon: <HiChartBar />, active: false },
    { name: 'Settings', icon: <HiCog />, active: false },
  ];

  return (
    <aside className="w-64 bg-[#042F21] text-white flex flex-col shrink-0">
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <img src="src/assets/visaia_logo.png" alt="Logo" className="w-10 h-10" />
        <div>
          <h2 className="font-bold tracking-tight text-lg leading-none">VISAIA</h2>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">Pest Management</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.name}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              item.active 
                ? 'bg-white text-[#042F21] shadow-lg' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>

      {/* User Profile & Logout Section */}
      <div className="p-6 border-t border-white/10">
        <div className="flex flex-col items-center text-center">
          <img 
            src="src/assets/john-doe.png" 
            className="w-12 h-12 rounded-full border-2 border-white/20 mb-3"
            alt="Profile"
          />
          <h4 className="font-bold text-sm">John Peter Doe</h4>
          <p className="text-xs text-gray-400 mb-4">Maknae</p>
          
          <button className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors">
            <HiLogout className="text-lg" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;