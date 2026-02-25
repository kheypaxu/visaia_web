import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom'; // Using react-router-dom for navigation

const MainLayout = () => {
  return (
    <div className="flex min-h-screen w-full bg-[#F8F9FA]">
      {/* Fixed Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* The Outlet renders whatever page you are currently on (e.g., Overview) */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;