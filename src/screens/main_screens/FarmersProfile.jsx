import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineEye, HiOutlineDownload, HiOutlineTrash, HiOutlineX, HiSearch } from 'react-icons/hi';
import { HiOutlineChevronLeft } from 'react-icons/hi2';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';

const FarmersProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [farmer, setFarmer] = useState(null);
  const [farms, setFarms] = useState([]);
  const [fields, setFields] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDocTab, setActiveDocTab] = useState('All Documents');
  const docTabs = ['All Documents', 'Approved', 'Pending', 'Rejected'];

  const [documents, setDocuments] = useState([
    {
      id: 1,
      title: 'Land Certificate',
      type: 'Business License',
      size: '2.4 MB',
      uploaded: '12/09/2025',
      expires: '12/31/2025',
      status: 'Approved',
      adminNote: null
    },
    {
      id: 2,
      title: "National's ID",
      type: 'Insurance Certificate',
      size: '3.2 MB',
      uploaded: '12/09/2025',
      expires: '12/31/2025',
      status: 'Pending',
      adminNote: null
    },
    {
      id: 3,
      title: 'DA Permit',
      type: 'Tax Certificate',
      size: '1.8 MB',
      uploaded: '12/09/2025',
      expires: '12/31/2025',
      status: 'Rejected',
      adminNote: 'Document is unclear. Please upload a higher quality scan.'
    }
  ]);

  const calculateAge = (birthdate) => {
    if (!birthdate) return null;
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const parseFullName = (fullName) => {
    if (!fullName) return { firstName: 'N/A', lastName: 'N/A' };
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], lastName: 'N/A' };
    }
    const lastName = nameParts.pop();
    const firstName = nameParts.join(' ');
    return { firstName, lastName };
  };

  const filteredDocs = documents.filter(doc => {
    if (activeDocTab === 'All Documents') return true;
    return doc.status === activeDocTab;
  });

  const getBadgeStyle = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'approved': return 'bg-[#10B981] text-white';
      case 'pending': return 'bg-orange-400 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      case 'verified': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-green-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleDeleteDoc = (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(doc => doc.id !== docId));
    }
  };

  useEffect(() => {
    const fetchFarmerData = async () => {
      setLoading(true);

      try {
        // =========================
        // FARMER DOCUMENT
        // =========================
        const farmerRef = doc(db, 'farmers', id);
        const farmerSnap = await getDoc(farmerRef);

        if (farmerSnap.exists()) {
          setFarmer(farmerSnap.data());
        }

        // =========================
        // USER DOCUMENT
        // =========================
        const userRef = doc(db, 'users', id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          console.log('USER DATA:', userData);

          // Optional arrays inside user doc
          if (userData.farms) {
            setFarms(userData.farms);
          }

          if (userData.fields) {
            setFields(userData.fields);
          }
        }

        // =========================
        // CYCLES SUBCOLLECTION
        // =========================
        const cyclesRef = collection(db, 'users', id, 'cycles');
        const cyclesSnap = await getDocs(cyclesRef);

        const cyclesList = cyclesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log('CYCLES:', cyclesList);

        setCycles(cyclesList);

        // =========================
        // FARMS SUBCOLLECTION
        // =========================
        const farmsRef = collection(db, 'users', id, 'farms');
        const farmsSnap = await getDocs(farmsRef);

        if (!farmsSnap.empty) {
          const farmsList = farmsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));

          console.log('FARMS:', farmsList);

          setFarms(farmsList);
        }

        // =========================
        // FIELDS SUBCOLLECTION
        // =========================
        const fieldsRef = collection(db, 'users', id, 'fields');
        const fieldsSnap = await getDocs(fieldsRef);

        if (!fieldsSnap.empty) {
          const fieldsList = fieldsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));

          console.log('FIELDS:', fieldsList);

          setFields(fieldsList);
        }

      } catch (error) {
        console.error('Error fetching farmer data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFarmerData();
    }
  }, [id]);

  const handleVerifyFarmer = async () => {
    if (!farmer) {
      alert('No farmer data loaded');
      return;
    }
    
    try {
      const docRef = doc(db, 'farmers', id);
      console.log('Attempting to verify farmer:', id);
      console.log('Current status:', farmer.status);
      
      await updateDoc(docRef, { status: 'verified' });
      setFarmer({ ...farmer, status: 'verified' });
      alert('Farmer Verified successfully!');
      navigate('/farmers');
    } catch (error) {
      console.error('Error verifying farmer:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Show specific error message
      if (error.code === 'permission-denied') {
        alert('Permission denied. Check your Firestore security rules.');
      } else if (error.code === 'not-found') {
        alert('Farmer document not found.');
      } else {
        alert(`Failed to verify farmer: ${error.message}`);
      }
    }
  };

  const { firstName, lastName } = parseFullName(farmer?.fullName);
  const age = calculateAge(farmer?.birthdate);
  
  const formatBirthdate = (birthdate) => {
    if (!birthdate) return 'N/A';
    const date = new Date(birthdate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDisplayStatus = (status) => {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Calculate total farm size from farms array
  const totalFarmSize = farms.reduce((total, farm) => total + (farm.acres || 0), 0);
  
  const activeCycles = cycles.filter(
    cycle =>
      cycle.status?.toLowerCase() === 'active' ||
      cycle.isCompleted === false
  );

  const completedCycles = cycles.filter(
    cycle =>
      cycle.status?.toLowerCase() === 'completed' ||
      cycle.isCompleted === true
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10B981] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading farmer profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-14">
      {/* RSBSA Phone-sized Side Drawer */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setIsModalOpen(false)} />
          <div className={`fixed top-0 right-0 h-full w-full max-w-[375px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isModalOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-bold text-gray-900">RSBSA Finder</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <HiOutlineX className="text-lg text-gray-700" />
              </button>
            </div>
            <div className="h-[calc(100vh-61px)] bg-white">
              <iframe src="http://www.finder-rsbsa.da.gov.ph/" title="RSBSA Finder System" className="w-full h-full border-0" />
            </div>
          </div>
        </>
      )}

      {/* Navigation / Back Button */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/farmers')} className="p-1.5 rounded-full border border-gray-300 text-gray-900 hover:bg-gray-100 transition-colors">
            <HiOutlineChevronLeft className="text-xl" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">
            Farmer's Profile ({farmer?.fullName || id})
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[#10B981] border border-[#10B981] bg-white hover:bg-green-50 transition-colors shadow-sm">
            <HiSearch className="text-lg" />
            Search Farmer via RSBSA
          </button>
          <button onClick={() => { alert('Farmer Rejected!'); navigate('/farmers'); }} className="px-8 py-2.5 rounded-xl font-bold text-white bg-gray-500 hover:bg-gray-600 transition-colors shadow-sm">
            Reject
          </button>
          <button
            onClick={handleVerifyFarmer}
            disabled={farmer?.status === 'verified'}
            className={`px-10 py-2.5 rounded-xl font-bold text-white transition-colors shadow-sm ${farmer?.status === 'verified' ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#10B981] hover:bg-green-600'}`}
          >
            {farmer?.status === 'verified' ? 'Verified' : 'Verify'}
          </button>
        </div>
      </div>

      {/* Section 1: Personal Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col md:flex-row gap-10">
        <div className="w-full md:w-64 h-64 shrink-0 rounded-3xl overflow-hidden bg-gray-100">
          <img
            src={
              farmer?.farmerIdImage
                ? `data:image/jpeg;base64,${farmer.farmerIdImage}`
                : "https://images.unsplash.com/photo-1595840245037-33f7c32eb34e?q=80&w=600&auto=format&fit=crop"
            }
            alt="Farmer ID"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src =
                "https://images.unsplash.com/photo-1595840245037-33f7c32eb34e?q=80&w=600&auto=format&fit=crop";
            }}
          />
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#10B981] mb-6">Farmer's Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-6 mb-6">
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">Full Name</p>
                <p className="text-xl font-bold text-gray-900 leading-none">{farmer?.fullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">First Name</p>
                <p className="text-xl font-bold text-gray-900 leading-none">{firstName}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">Middle Name</p>
                <p className="text-xl font-bold text-gray-900 leading-none">{farmer?.middleName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">Last Name</p>
                <p className="text-xl font-bold text-gray-900 leading-none">{lastName}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">RSBSA ID</p>
                <p className="text-base font-bold text-gray-900">{farmer?.rsbsaId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">Status</p>
                <p className="text-base font-bold text-gray-900">
                  <span className={`px-3 py-1 rounded-full text-xs ${getBadgeStyle(farmer?.status)}`}>
                    {getDisplayStatus(farmer?.status)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">Email Address</p>
                <p className="text-base font-bold text-gray-900">{farmer?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">Sex</p>
                <p className="text-base font-bold text-gray-900">{farmer?.sex || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">Birthdate</p>
                <p className="text-base font-bold text-gray-900">{formatBirthdate(farmer?.birthdate)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">Age</p>
                <p className="text-base font-bold text-gray-900">{age ? `${age} years old` : 'N/A'}</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-[11px] font-medium text-gray-500 mb-1">Member Since</p>
                <p className="text-base font-bold text-gray-900">
                  {farmer?.createdAt
                    ? farmer.createdAt.toDate().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Farm Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mt-6">
        <h3 className="text-xl font-bold text-[#10B981] mb-6">Farmer's Farm Information</h3>
        
        {/* Farm Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">Total Farms</p>
            <p className="text-2xl font-bold text-[#10B981]">{farms.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">Total Fields</p>
            <p className="text-2xl font-bold text-[#10B981]">{fields.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">Total Farm Size</p>
            <p className="text-2xl font-bold text-[#10B981]">{totalFarmSize.toFixed(2)} ha</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-1">Cycles</p>
            <p className="text-2xl font-bold text-[#10B981]">{cycles.length}</p>
            <p className="text-xs text-gray-500 mt-1">{activeCycles.length} active, {completedCycles.length} completed</p>
          </div>
        </div>

        {/* Farms List */}
        {farms.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Registered Farms</h4>
            <div className="space-y-4">
              {farms.map((farm) => (
                <div key={farm.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-bold text-gray-900">{farm.name || 'Unnamed Farm'}</h5>
                    {farm.acres && (
                      <span className="text-sm text-gray-600">{farm.acres.toFixed(2)} hectares</span>
                    )}
                  </div>
                  {farm.boundaries && farm.boundaries.length > 0 && (
                    <p className="text-xs text-gray-500">Polygon: {farm.boundaries.length} boundary points</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Created: {farm.createdAt?._seconds 
                      ? new Date(farm.createdAt._seconds * 1000).toLocaleDateString()
                      : 'Unknown date'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fields List */}
        {fields.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Registered Fields</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field.id} className="border border-gray-200 rounded-xl p-4">
                  <h5 className="font-bold text-gray-900 mb-2">{field.name || 'Unnamed Field'}</h5>
                  {field.acres > 0 && (
                    <p className="text-sm text-gray-600">Size: {field.acres.toFixed(2)} hectares</p>
                  )}
                  {field.crop && (
                    <p className="text-sm text-gray-600">Crop: {field.crop}</p>
                  )}
                  {field.boundaries && field.boundaries.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">Contains {field.boundaries.length} boundary points</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cycles/Cropping History */}
        {cycles.length > 0 && (
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4">Cropping Cycles</h4>
            <div className="space-y-4">
              {cycles.map((cycle) => (
                <div key={cycle.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-bold text-gray-900">{cycle.cycleName || 'Unnamed Cycle'}</h5>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getBadgeStyle(
                        cycle.isCompleted ? 'completed' : 'active'
                      )}`}
                    >
                      {cycle.isCompleted ? 'Completed' : 'Active'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {cycle.cropType && <p><span className="text-gray-500">Crop Type:</span> {cycle.cropType}</p>}
                    {cycle.cropVariety && <p><span className="text-gray-500">Variety:</span> {cycle.cropVariety}</p>}
                    {cycle.plantingDate && (
                      <p><span className="text-gray-500">Planted:</span> {new Date(cycle.plantingDate._seconds * 1000).toLocaleDateString()}</p>
                    )}
                    {cycle.harvestDate && (
                      <p><span className="text-gray-500">Harvest:</span> {new Date(cycle.harvestDate._seconds * 1000).toLocaleDateString()}</p>
                    )}
                    {cycle.area && <p><span className="text-gray-500">Area:</span> {cycle.area} ha</p>}
                    {cycle.totalYield && <p><span className="text-gray-500">Total Yield:</span> {cycle.totalYield} units</p>}
                  </div>
                  {cycle.isPreviousCycle && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">Previous Cycle Data</p>
                    </div>
                  )}
                </div>
              ))}
              {cycles.length > 5 && (
                <p className="text-center text-sm text-gray-500">+ {cycles.length - 5} more cycles</p>
              )}
            </div>
          </div>
        )}

        {/* If no farm data exists */}
        {farms.length === 0 && fields.length === 0 && cycles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No farm information available for this farmer.</p>
          </div>
        )}
      </div>

      {/* Section 3: Documents */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mt-6">
        <h3 className="text-xl font-bold text-[#10B981] mb-6">Farmer's Documents</h3>

        <div className="flex gap-2 border-b border-gray-100 pb-4 mb-6 overflow-x-auto">
          {docTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveDocTab(tab)}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-colors whitespace-nowrap ${activeDocTab === tab
                ? 'bg-[#042F21] text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-xl mb-4">
            <p className="text-xs font-medium text-yellow-800">
              📄 Note: Document management system is being set up. The farmer has submitted an ID document: {farmer?.farmerIdFileName || 'No ID image available yet'}.
            </p>
          </div>
          
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4 className="font-bold text-gray-900">{doc.title}</h4>
                      <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${getBadgeStyle(doc.status)}`}>
                        {doc.status === 'Pending' ? 'Pending Review' : doc.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">
                      {doc.type} <span className="mx-2">•</span> {doc.size} <span className="mx-2">•</span> Uploaded: {doc.uploaded}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => alert(`Viewing ${doc.title}`)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                      <HiOutlineEye className="text-lg" />
                    </button>
                    <button onClick={() => alert(`Downloading ${doc.title}...`)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                      <HiOutlineDownload className="text-lg" />
                    </button>
                    <button onClick={() => handleDeleteDoc(doc.id)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                      <HiOutlineTrash className="text-lg" />
                    </button>
                  </div>
                </div>
                {doc.adminNote && (
                  <div className="border border-red-500 bg-red-50/50 p-4 rounded-xl">
                    <p className="text-xs font-bold text-red-600 mb-1">Admin Note:</p>
                    <p className="text-xs text-red-600">{doc.adminNote}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm font-medium border border-dashed border-gray-300 rounded-xl">
              No documents found in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmersProfile;