import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiBell, HiOutlineEye, HiOutlineDownload, HiOutlineTrash } from 'react-icons/hi';
import { HiOutlineChevronLeft } from 'react-icons/hi2';

const FarmersProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // State for the document tabs
  const [activeDocTab, setActiveDocTab] = useState('All Documents');
  const docTabs = ['All Documents', 'Approved', 'Pending', 'Rejected'];

  // Mock data for the documents list
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

  // Logic to filter the documents based on the active tab
  const filteredDocs = documents.filter(doc => {
    if (activeDocTab === 'All Documents') return true;
    return doc.status === activeDocTab;
  });

  // Function to determine the badge color based on status
  const getBadgeStyle = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-[#10B981] text-white';
      case 'Pending':
        return 'bg-orange-400 text-white';
      case 'Rejected':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Function to delete a document
  const handleDeleteDoc = (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(doc => doc.id !== docId));
    }
  };

  return (
    <div className="space-y-6 pb-12">

      {/* Navigation / Back Button */}
      <div className="mb-6 flex items-center gap-3">
        <button 
          onClick={() => navigate('/farmers')}
          className="p-1.5 rounded-full border border-gray-300 text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <HiOutlineChevronLeft className="text-xl" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Farmer's Profile ({id})</h1>
      </div>

      {/* Section 1: Farmer's Personal Information */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col md:flex-row gap-10">
        <div className="w-full md:w-64 h-64 shrink-0 rounded-3xl overflow-hidden bg-gray-100">
          <img 
            src="https://images.unsplash.com/photo-1595840245037-33f7c32eb34e?q=80&w=600&auto=format&fit=crop" 
            alt="Farmer Profile" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#10B981] mb-6">Farmer's Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-6 mb-6">
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">First Name</p>
                <p className="text-xl font-bold text-gray-900 leading-none">Juan</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">Middle Name</p>
                <p className="text-xl font-bold text-gray-900 leading-none">Bola</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">Last Name</p>
                <p className="text-xl font-bold text-gray-900 leading-none">Dela Cruz</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">Email Address</p>
                <p className="text-base font-bold text-gray-900">juandelacruz@gmail.com</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">Phone Number</p>
                <p className="text-base font-bold text-gray-900">09123456789</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">Age</p>
                <p className="text-base font-bold text-gray-900">46</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-[11px] font-medium text-gray-500 mb-1">Address</p>
                <p className="text-base font-bold text-gray-900">Brgy. Banguit, Cabatuan, Iloilo 5000</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 mt-4">
            <button 
              onClick={() => { alert('Farmer Rejected!'); navigate('/farmers'); }}
              className="px-8 py-2.5 rounded-xl font-bold text-white bg-gray-500 hover:bg-gray-600 transition-colors shadow-sm"
            >
              Reject
            </button>
            <button 
              onClick={() => { alert('Farmer Verified successfully!'); navigate('/farmers'); }}
              className="px-10 py-2.5 rounded-xl font-bold text-white bg-[#10B981] hover:bg-green-600 transition-colors shadow-sm"
            >
              Verify
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Farmer's Farm Information */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col md:flex-row gap-10 mt-6">
        <div className="w-full md:w-64 h-64 shrink-0 rounded-3xl overflow-hidden bg-gray-100">
          <img 
            src="https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=600&auto=format&fit=crop" 
            alt="Farm Map View" 
            className="w-full h-full object-cover grayscale-[0.2]"
          />
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-[#10B981] mb-6">Farmer's Farm Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
            <div className="md:col-span-2">
              <p className="text-[11px] font-medium text-gray-500 mb-1">Farm Location</p>
              <p className="text-base font-bold text-gray-900">Brgy. Kungdiinmanna, Cabatuan, Iloilo 5000</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 mb-1">Farm Size</p>
              <p className="text-base font-bold text-gray-900">5 hectars</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 mb-1">No. of fields</p>
              <p className="text-base font-bold text-gray-900">5</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-[11px] font-medium text-gray-500 mb-1">Crop Type</p>
              <p className="text-base font-bold text-gray-900">Glutinous Corn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Farmer's Documents */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mt-6">
        <h3 className="text-xl font-bold text-[#10B981] mb-6">Farmer's Documents</h3>
        
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-100 pb-4 mb-6">
          {docTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveDocTab(tab)}
              className={`px-8 py-2 rounded-full font-bold text-sm transition-colors ${
                activeDocTab === tab 
                  ? 'bg-[#042F21] text-white shadow-md' 
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dynamic Documents List */}
        <div className="space-y-4">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-gray-900">{doc.title}</h4>
                      <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${getBadgeStyle(doc.status)}`}>
                        {doc.status === 'Pending' ? 'Pending Review' : doc.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">
                      {doc.type} <span className="mx-3">•</span> {doc.size} <span className="mx-3">•</span> Uploaded: {doc.uploaded} <span className="mx-3">•</span> Expires: {doc.expires}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => alert(`Viewing ${doc.title}`)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                    >
                      <HiOutlineEye className="text-lg" />
                    </button>
                    <button 
                      onClick={() => alert(`Downloading ${doc.title}...`)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                    >
                      <HiOutlineDownload className="text-lg" />
                    </button>
                    <button 
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <HiOutlineTrash className="text-lg" />
                    </button>
                  </div>
                </div>
                
                {/* Conditionally render admin note if the document is rejected */}
                {doc.adminNote && (
                  <div className="border border-red-500 bg-red-50/50 p-4 rounded-xl mt-2">
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