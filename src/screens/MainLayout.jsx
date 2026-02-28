import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { HiBell, HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi';

const MainLayout = () => {
  const location = useLocation();

  // Dynamically set the title based on the current URL
  let pageTitle = 'Dashboard';
  if (location.pathname.includes('/validation')) {
    pageTitle = 'Validation';
  } else if (location.pathname.includes('/farmers')) {
    pageTitle = "Farmer's Verification & Management";
  } else if (location.pathname.includes('/risk-map')) {
    pageTitle = 'Risk Map';
  } else if (location.pathname.includes('/analytics')) {
    pageTitle = 'Analytics';
  } else if (location.pathname.includes('/settings')) {
    pageTitle = 'Settings';
  }

  return (
    <div className="flex h-screen w-full bg-[#F8FAF8] font-['Inter']">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-[#FFFFFF] border-b border-gray-200 px-8 py-5 flex justify-between items-center shrink-0 shadow-sm z-10">
          <div>
            <h2 className="text-[21px] font-semibold text-gray-900 mb-1 leading-none tracking-[0.1 em]">
              {pageTitle}
            </h2>
            <div className="flex items-center gap-3 text-[12px] font-normal text-[#94A3B8] mt-1.5 tracking-wide">
              <span className="flex items-center gap-1.5">
                <HiOutlineCalendar className="text-sm" /> Monday, February 09, 2026
              </span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1.5">
                <HiOutlineClock className="text-sm" /> 09:42 AM (GMT+8)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 bg-white text-green-700 px-4 py-1.5 rounded-full text-[11px] font-bold border border-green-200 shadow-sm tracking-wide">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              ADMIN
            </div>
            <button className="relative p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
              <HiBell className="text-[22px]" />
              <span className="absolute top-1 right-1.5 w-3.5 h-3.5 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-white">
                3
              </span>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
        
      </main>
    </div>
  );
};

export default MainLayout;