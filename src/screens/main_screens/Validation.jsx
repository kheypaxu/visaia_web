import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from "../../firebase";
import { HiOutlineSearch, HiOutlineDownload } from 'react-icons/hi';
import { HiOutlineDocumentText, HiCheckCircle } from 'react-icons/hi2';

const Validation = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pending');
  const [selectedCrop, setSelectedCrop] = useState('All Crops');
  const [selectedRisk, setSelectedRisk] = useState('Risk Level');
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [farmerNames, setFarmerNames] = useState({});

  // Fetch farmer name by ID from 'farmers' collection
  const fetchFarmerName = useCallback(async (farmerId) => {
    if (!farmerId) return 'Unknown Farmer';
    if (farmerNames[farmerId]) return farmerNames[farmerId];
    
    try {
      const farmerDoc = await getDoc(doc(db, 'farmers', farmerId));
      if (farmerDoc.exists()) {
        const name = farmerDoc.data().fullName || 'Unknown Farmer';
        setFarmerNames(prev => ({ ...prev, [farmerId]: name }));
        return name;
      }
    } catch (err) {
      console.error("Error fetching farmer:", err);
    }
    return 'Unknown Farmer';
  }, [farmerNames]);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const reportsData = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let farmerName = data.farmerName;
        
        // If farmerName is missing or unknown, try to fetch from farmers collection
        if ((!farmerName || farmerName === 'Unknown Farmer') && data.farmerId) {
          farmerName = await fetchFarmerName(data.farmerId);
        }
        
        return {
          id: docSnap.id,
          ...data,
          date: data.timestamp?.toDate().toLocaleDateString() || 'N/A',
          time: data.timestamp?.toDate().toLocaleTimeString() || 'N/A',
          farmer: farmerName,
          location: data.location?.areaName || 'Unknown Location',
          crop: data.cropAffected || 'Unknown Crop',
          detection: data.detection || 'N/A',
          risk: data.risk || 'N/A',
          status: data.status || 'pending', // default to pending
        };
      }));
      setReports(reportsData);
    });
    return () => unsubscribe();
  }, [fetchFarmerName]);

  // Filter reports based on activeTab, search, crop, risk
  useEffect(() => {
    let filtered = reports.filter(report => {
      // Tab filter (status)
      if (activeTab === 'pending' && report.status !== 'pending') return false;
      if (activeTab === 'validated' && report.status !== 'validated') return false;
      if (activeTab === 'rejected' && report.status !== 'rejected') return false;
      
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          report.id.toLowerCase().includes(term) ||
          report.farmer.toLowerCase().includes(term) ||
          report.location.toLowerCase().includes(term)
        );
      }
      return true;
    });
    
    // Crop filter
    if (selectedCrop !== 'All Crops') {
      filtered = filtered.filter(report => report.crop === selectedCrop);
    }
    
    // Risk filter
    if (selectedRisk !== 'Risk Level') {
      filtered = filtered.filter(report => report.risk === selectedRisk);
    }
    
    setFilteredReports(filtered);
  }, [reports, activeTab, searchTerm, selectedCrop, selectedRisk]);

  // Compute dynamic counts
  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const validatedCount = reports.filter(r => r.status === 'validated').length;
  const rejectedCount = reports.filter(r => r.status === 'rejected').length;

  const tabs = [
    { id: 'pending', label: 'Pending Validation', count: pendingCount },
    { id: 'validated', label: 'Validated', count: validatedCount },
    { id: 'rejected', label: 'Rejected', count: rejectedCount }
  ];

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete report ${id}?`)) {
      // Note: This only removes from local state, not Firestore.
      // To actually delete, you need to call deleteDoc from firestore.
      setReports(reports.filter(report => report.id !== id));
    }
  };

  const handleExport = () => {
    const headers = ['Report ID', 'Date', 'Time', 'Farmer Name', 'Location', 'Crop Type', 'AI Detection', 'Risk Level', 'Status'];
    const csvRows = filteredReports.map(row => [
      row.id,
      `"${row.date}"`,
      `"${row.time}"`,
      `"${row.farmer}"`,
      `"${row.location}"`,
      `"${row.crop}"`,
      `"${row.detection}"`,
      row.risk,
      row.status,
    ].join(','));
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `VISAIA_${activeTab}_reports_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cropOptions = ['All Crops', 'Corn (Glutinous)', 'Corn (Yellow)', 'Rice', 'Tomato', 'Onion'];
  const riskOptions = ['Risk Level', 'Low', 'Low-Moderate', 'Moderate', 'Moderate-High', 'High'];

  return (
    <div className="space-y-6">
      {/* Page Title & Summary Cards */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation Queue</h1>
          <p className="text-gray-500 text-sm mt-1">Review and verify field reports generated by AI.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-yellow-50 text-yellow-500 rounded-lg flex items-center justify-center text-xl">
              <HiOutlineDocumentText />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PENDING</p>
              <h3 className="text-xl font-extrabold text-gray-900 leading-none">{pendingCount}</h3>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-lg flex items-center justify-center text-xl">
              <HiCheckCircle />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">VALIDATED</p>
              <h3 className="text-xl font-extrabold text-gray-900 leading-none">{validatedCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
              {tab.count > 0 && (
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
        <div className="p-6 flex justify-between items-center gap-4 border-b border-gray-100 flex-wrap">
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
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 cursor-pointer"
            >
              {cropOptions.map((crop, index) => (
                <option key={index} value={crop}>{crop}</option>
              ))}
            </select>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 cursor-pointer"
            >
              {riskOptions.map((risk, index) => (
                <option key={index} value={risk}>{risk}</option>
              ))}
            </select>
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
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Report ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Farmer Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Location (Barangay)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Crop Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">AI Detection</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Risk Level</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReports.length > 0 ? (
                filteredReports.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-500">{row.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{row.date}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{row.time}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{row.farmer}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 w-48">{row.location}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.crop}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={row.imageBase64 ? `data:image/jpeg;base64,${row.imageBase64.substring(0, 100)}` : "src/assets/detection-thumb.png"} 
                          alt="Crop" 
                          className="w-10 h-10 rounded-lg object-cover bg-gray-200"
                          onError={(e) => e.target.src = "src/assets/detection-thumb.png"}
                        />
                        <span className="bg-[#8BB76A] text-white text-xs font-bold px-3 py-1.5 rounded-md">
                          {row.detection}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          row.risk === 'High' ? 'bg-red-500' : row.risk === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></span>
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: row.risk === 'High' ? '#dc2626' : row.risk === 'Medium' ? '#eab308' : '#10b981' }}>
                          {row.risk}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {activeTab === 'rejected' ? (
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/validation/${row.id}`)}
                          className="bg-[#0FBD2C] hover:bg-green-600 text-white text-sm font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500 text-sm">
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center">
          <p className="text-sm font-medium text-gray-500">
            Showing {filteredReports.length} of {reports.length} reports
          </p>
        </div>
      </div>
    </div>
  );
};

export default Validation;