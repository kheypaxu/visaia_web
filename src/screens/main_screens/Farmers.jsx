import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineDownload, HiOutlineTrash } from 'react-icons/hi';
import { HiOutlineUserGroup, HiCheckCircle, HiXCircle } from 'react-icons/hi2'; // Added HiXCircle
import { db } from '../../firebase';
import { collection, onSnapshot } from "firebase/firestore";

const Farmers = () => {
  const navigate = useNavigate();

  // State for the currently active tab
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [farmersData, setFarmersData] = useState([]);

  // Global Fetch: Fetches all farmers in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "farmers"), (snapshot) => {
      const farmers = snapshot.docs.map((doc) => {
        const data = doc.data();

        let date = "";
        let time = "";

        if (data.createdAt?.toDate) {
          const d = data.createdAt.toDate(); // Firestore Timestamp → JS Date
          date = d.toLocaleDateString();
          time = d.toLocaleTimeString();
        }

        return {
          id: doc.id,
          email: data.email || "",
          fullName: data.fullName || "",
          middleName: data.middleName || "",
          rsbsaId: data.rsbsaId || "",
          farmSize: data.farmSize || "",
          sex: data.sex || "",
          birthdate: data.birthdate || "",
          rsbsaIdImage: data.rsbsaIdImage || "",
          status: data.status || "pending", // Ensure status is present
          date,
          time
        };
      });

      setFarmersData(farmers);
    });

    return () => unsubscribe();
  }, []);

  // Tab definitions
  const tabs = [
    { id: 'pending', label: 'Pending Verification', icon: HiOutlineUserGroup },
    { id: 'verified', label: 'Verified', icon: HiCheckCircle },
    { id: 'rejected', label: 'Rejected', icon: HiXCircle }
  ];

  // Client-Side Filtering: Filters the full dataset based on activeTab and searchTerm
  const filteredFarmers = farmersData.filter(farmer => {

    const matchesTab = farmer.status === activeTab;
    
    const matchesSearch =
      farmer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.rsbsaId.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const handleDelete = (id) => {
    // In a real app, you would perform a delete operation in Firestore here
    if (window.confirm(`Are you sure you want to delete farmer record ${id}?`)) {
      console.log(`Deleting farmer with ID: ${id}`);
      // For demo purposes, we just remove it from the UI state
      // setFarmersData(farmersData.filter(farmer => farmer.id !== id));
    }
  };

  const handleExport = () => {
    const headers = [
      'Farmers ID',
      'Name',
      'RSBSA ID',
      'Sex',
      'Farm Size',
      'Date Registered',
      'Status'
    ];

    const csvRows = filteredFarmers.map(row => [
      row.id,
      `"${row.fullName}"`,
      `"${row.rsbsaId}"`,
      `"${row.sex}"`,
      `"${row.farmSize}"`,
      `"${row.date}"`,
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
    switch (status.toLowerCase()) { // Ensure comparison is lowercase
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-yellow-400 text-yellow-500 uppercase tracking-wider">PENDING REVIEW</span>;
      case 'verified':
        return <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-green-500 text-green-600 uppercase tracking-wider">VERIFIED</span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-red-500 text-red-600 uppercase tracking-wider">REJECTED</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-gray-400 text-gray-500 uppercase tracking-wider">UNKNOWN</span>;
    }
  };

  // Dynamic Counts
  const pendingCount = farmersData.filter(f => f.status === 'pending').length;
  const verifiedCount = farmersData.filter(f => f.status === 'verified').length;
  const rejectedCount = farmersData.filter(f => f.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
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
              <h3 className="text-xl font-extrabold text-gray-900 leading-none">{pendingCount}</h3>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-lg flex items-center justify-center text-xl">
              <HiCheckCircle />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">VERIFIED</p>
              <h3 className="text-xl font-extrabold text-gray-900 leading-none">{verifiedCount}</h3>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center text-xl">
              <HiXCircle />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">REJECTED</p>
              <h3 className="text-xl font-extrabold text-gray-900 leading-none">{rejectedCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex space-x-1 border-b border-gray-200">
        {tabs.map((tab) => {
          const count = farmersData.filter(f => f.status === tab.id).length;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-6 text-sm font-medium transition-colors ${activeTab === tab.id
                ? 'text-green-700 border-b-2 border-green-500 bg-green-50'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Icon className="text-lg" />
              {tab.label}
              <span className="ml-2 bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center gap-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-lg">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search by Farmer, RSBSA ID, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-[#6B7280] hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <HiOutlineDownload className="text-lg" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Farmers ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Profile</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">RSBSA ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Sex</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase tracking-wider">Farm Size (Ha)</th>
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
                          src={`https://ui-avatars.com/api/?name=${row.fullName.replace(' ', '+')}`}
                          alt={row.fullName}
                          className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                        />
                        <span className="text-sm font-bold text-gray-900">{row.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.rsbsaId}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.sex}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.farmSize} ha</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{row.date}</p>
                      <p className="text-xs text-gray-400">{row.time}</p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(row.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => navigate(`/farmers/${row.id}`)} // Assuming a route for details
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
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500 text-sm">
                    No farmers found for the selected status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Farmers;