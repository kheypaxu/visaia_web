import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiBell, HiOutlineSearch, HiOutlineDownload, HiOutlineTrash } from 'react-icons/hi';
import { HiOutlineUserGroup, HiCheckCircle } from 'react-icons/hi2';

const Farmers = () => {
  const navigate = useNavigate();

  // State for filters and data
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('Filter by Barangay');

  // Mock Data
  const [farmersData, setFarmersData] = useState([
    // PENDING
    { id: 'F0001', name: 'Juan Dela Cruz', location: 'Brgy. Baringuit, Cabatuan', crop: 'Corn (Glutinous)', date: 'Mar. 02, 2026', time: '08:45 AM', status: 'pending' },
    { id: 'F0002', name: 'Juan Dela Cruz', location: 'Brgy. Baringuit, Cabatuan', crop: 'Corn (Glutinous)', date: 'Mar. 02, 2026', time: '08:45 AM', status: 'pending' },
    { id: 'F0003', name: 'Juan Dela Cruz', location: 'Brgy. Baringuit, Cabatuan', crop: 'Corn (Glutinous)', date: 'Mar. 02, 2026', time: '08:45 AM', status: 'pending' },
    { id: 'F0004', name: 'Juan Dela Cruz', location: 'Brgy. Baringuit, Cabatuan', crop: 'Corn (Glutinous)', date: 'Mar. 02, 2026', time: '08:45 AM', status: 'pending' },
    
    // VERIFIED
    { id: 'F0005', name: 'Juan Dela Cruz', location: 'Brgy. Baringuit, Cabatuan', crop: 'Corn (Glutinous)', date: 'Mar. 02, 2026', time: '08:45 AM', status: 'verified' },
    { id: 'F0006', name: 'Juan Dela Cruz', location: 'Brgy. Baringuit, Cabatuan', crop: 'Corn (Glutinous)', date: 'Mar. 02, 2026', time: '08:45 AM', status: 'verified' },
    { id: 'F0007', name: 'Juan Dela Cruz', location: 'Brgy. Baringuit, Cabatuan', crop: 'Corn (Glutinous)', date: 'Mar. 02, 2026', time: '08:45 AM', status: 'verified' },
    { id: 'F0008', name: 'Juan Dela Cruz', location: 'Brgy. Baringuit, Cabatuan', crop: 'Corn (Glutinous)', date: 'Mar. 02, 2026', time: '08:45 AM', status: 'verified' },

    // REJECTED
    { id: 'F0009', name: 'Juan Dela Cruz', location: 'Brgy. Baringuit, Cabatuan', crop: 'Corn (Glutinous)', date: 'Mar. 02, 2026', time: '08:45 AM', status: 'rejected' },
    { id: 'F0010', name: 'Juan Dela Cruz', location: 'Brgy. Baringuit, Cabatuan', crop: 'Corn (Glutinous)', date: 'Mar. 02, 2026', time: '08:45 AM', status: 'rejected' },
    { id: 'F0011', name: 'Juan Dela Cruz', location: 'Brgy. Baringuit, Cabatuan', crop: 'Corn (Glutinous)', date: 'Mar. 02, 2026', time: '08:45 AM', status: 'rejected' },
    { id: 'F0012', name: 'Juan Dela Cruz', location: 'Brgy. Baringuit, Cabatuan', crop: 'Corn (Glutinous)', date: 'Mar. 02, 2026', time: '08:45 AM', status: 'rejected' },
  ]);

  // Options for the dropdown
  const barangayOptions = ['Filter by Barangay', 'Brgy. Baringuit, Cabatuan', 'Brgy. Inaca, Cabatuan', 'Brgy. Acao, Cabatuan'];

  const tabs = [
    { id: 'pending', label: 'Pending Verification', count: 12 },
    { id: 'verified', label: 'Verified' },
    { id: 'rejected', label: 'Rejected' }
  ];

  // Filter logic
  const filteredFarmers = farmersData.filter(farmer => {
    const matchesTab = farmer.status === activeTab;
    const matchesSearch = 
      farmer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBarangay = selectedBarangay === 'Filter by Barangay' || farmer.location === selectedBarangay;

    return matchesTab && matchesSearch && matchesBarangay;
  });

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete farmer record ${id}?`)) {
      setFarmersData(farmersData.filter(farmer => farmer.id !== id));
    }
  };

  const handleExport = () => {
    const headers = ['Farmers ID', 'Name', 'Location', 'Crop Type', 'Date Registered', 'Time', 'Status'];
    const csvRows = filteredFarmers.map(row => [
      row.id,
      `"${row.name}"`,
      `"${row.location}"`,
      `"${row.crop}"`,
      `"${row.date}"`,
      `"${row.time}"`,
      row.status.toUpperCase()
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `VISAIA_Farmers_${activeTab}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-yellow-400 text-yellow-500 uppercase tracking-wider">PENDING REVIEW</span>;
      case 'verified':
        return <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-green-500 text-green-600 uppercase tracking-wider">VERIFIED</span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-red-500 text-red-600 uppercase tracking-wider">REJECTED</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">

      {/* Page Title & Summary Cards */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
          <p className="text-gray-500 text-sm mt-1">Review and verify farmer's account.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-yellow-50 text-yellow-500 rounded-lg flex items-center justify-center text-xl">
              <HiOutlineUserGroup />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PENDING</p>
              <h3 className="text-xl font-extrabold text-gray-900 leading-none">
                {farmersData.filter(f => f.status === 'pending').length}
              </h3>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-lg flex items-center justify-center text-xl">
              <HiCheckCircle />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">VERIFIED</p>
              <h3 className="text-xl font-extrabold text-gray-900 leading-none">
                {farmersData.filter(f => f.status === 'verified').length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#042F21] text-[#042F21]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {tab.id === 'pending' && tab.count && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id ? 'bg-[#042F21] text-white' : 'bg-green-100 text-green-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-6 flex justify-between items-center gap-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-lg">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search by Farmer, Barangay, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center gap-3">
            
            <div className="relative">
              <select 
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-10 pr-8 py-2 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 cursor-pointer"
              >
                {barangayOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              </div>
            </div>

            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-[#6B7280] hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              <HiOutlineDownload className="text-lg" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Farmers ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Profile</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Location (Barangay)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Crop Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Date Registered</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFarmers.length > 0 ? (
                filteredFarmers.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-500">{row.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src="/src/assets/john-doe.png" 
                          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${row.name.replace(' ', '+')}&background=E5E7EB&color=374151`; }}
                          alt={row.name} 
                          className="w-10 h-10 rounded-full border border-gray-200 object-cover" 
                        />
                        <span className="text-sm font-bold text-gray-900">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 w-48">{row.location}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.crop}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{row.date}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{row.time}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-4">
                        <button 
                            onClick={() => navigate(row.id)}
                            className="bg-[#0FBD2C] hover:bg-green-600 text-white text-xs font-bold py-2 px-5 rounded-lg transition-colors"
                        >
                        Review
                        </button>
                        <button 
                          onClick={() => handleDelete(row.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                        >
                          <HiOutlineTrash className="text-xl" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500 text-sm">
                    No farmers found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center">
          <p className="text-sm font-medium text-gray-500">
            Showing {filteredFarmers.length} of {activeTab === 'pending' ? '12 pending verifications' : `328 ${activeTab} farmers`}
          </p>
          <div className="flex gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 font-medium text-sm transition-colors">{'<'}</button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#10B981] text-white font-bold text-sm transition-colors">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors">3</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors">{'>'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Farmers;