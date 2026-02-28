import React, { useState, useRef } from 'react';
import { HiPencil, HiTrash, HiPlus } from 'react-icons/hi'; // Added HiPlus for adding users
import { HiUserCircle, HiUsers, HiBell, HiAdjustmentsHorizontal } from "react-icons/hi2";

const Settings = () => {
  const fileInputRef = useRef(null);
 
  // State for Form Inputs
  const [profile, setProfile] = useState({
    fullName: "John Peter Doe",
    email: "johnpeter.doe@da.gov.ph",
    phone: "09123456789"
  });

  // State for Profile Picture
  const [profilePic, setProfilePic] = useState(null);

  const [notifications, setNotifications] = useState({
    sms: true,
    email: true,
    push: true
  });

  // --- FUNCTIONAL ACTIONS FOR USER MANAGEMENT ---
  const [staff, setStaff] = useState([
    { id: 1, name: "John Peter Doe", email: "johnpeter.doe@da.gov.ph", role: "ADMIN", status: "ACTIVE" },
    { id: 2, name: "Jane Smith", email: "jane.smith@da.gov.ph", role: "EDITOR", status: "ACTIVE" },
    { id: 3, name: "Robert Fox", email: "robert.fox@da.gov.ph", role: "VIEWER", status: "INACTIVE" },
  ]);

  const deleteStaff = (id) => {
    if (window.confirm("Are you sure you want to remove this staff member?")) {
      setStaff(staff.filter(user => user.id !== id));
    }
  };

  const editStaff = (user) => {
    // Basic prompt for demonstration, usually you'd use a Modal
    const newName = prompt("Edit Name:", user.name);
    if (newName) {
      setStaff(staff.map(u => u.id === user.id ? { ...u, name: newName } : u));
    }
  };
  // ----------------------------------------------

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePic(URL.createObjectURL(file));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      {/* 1. Profile & Account Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 text-[#2D8A4E] font-bold">
          <HiUserCircle className="text-2xl" />
          <h3 className="text-lg text-black">Profile & Account</h3>
        </div>
       
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         
          {/* Column 1: Profile Image Upload */}
          <div className="lg:col-span-3 flex justify-center lg:justify-start">
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
              <div className="w-65 h-65 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden transition-colors hover:border-[#2D8A4E]">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center space-y-2">
                    <svg className="w-20 h-20 text-black mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
              <button
                onClick={handleImageClick}
                className="absolute -bottom-3 -right-3 p-3 bg-white border border-gray-200 rounded-xl shadow-xl hover:bg-gray-50 transition-all group-hover:scale-110"
              >
                <HiPencil className="w-6 h-6 text-[#1A202C]" />
              </button>
            </div>
          </div>

          {/* Column 2: Profile Fields */}
          <div className="lg:col-span-5 space-y-4">
            {Object.keys(profile).map((key) => (
              <div key={key}>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={profile[key]}
                    onChange={(e) => setProfile({...profile, [key]: e.target.value})}
                    className="w-full bg-[#F8F9FA] border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-1 focus:ring-[#042F21] outline-none transition-all"
                  />
                  <HiPencil className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
            ))}
          </div>

          {/* Column 3: Change Password Card */}
          <div className="lg:col-span-4 bg-[#F8F9FA] p-6 rounded-2xl border border-gray-100 flex flex-col">
            <h4 className="font-bold text-gray-800 mb-4 text-center">Change Password</h4>
            <div className="space-y-3 flex-1">
              <input type="password" placeholder="Current Password" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#042F21]" />
              <input type="password" placeholder="New Password" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#042F21]" />
              <button className="w-full bg-[#042F21] text-white py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-[#06422f] transition-all mt-2">
                Update Password
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. User Management Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#2D8A4E] font-bold">
            <HiUsers className="text-2xl" />
            <h3 className="text-lg text-black">User Management</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-[#F8F9FA] border-b border-gray-100">
              <tr className="text-left text-[11px] font-black text-gray-400 uppercase tracking-[2px]">
                <th className="px-8 py-5">Staff Member</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-800">{user.name}</div>
                        <div className="text-[11px] text-gray-400 font-medium italic">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <span className="px-3 py-1 bg-[#E8F5E9] text-[#2D8A4E] text-[10px] font-bold rounded-md tracking-wider border border-[#2D8A4E]/10">{user.role}</span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-md tracking-wider border ${user.status === 'ACTIVE' ? 'bg-[#E8F5E9] text-[#2D8A4E] border-[#2D8A4E]/10' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-3 text-gray-400">
                      <button 
                        onClick={() => editStaff(user)}
                        className="p-2 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <HiPencil className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => deleteStaff(user.id)}
                        className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3 & 4 Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center gap-2 mb-4 text-[#2D8A4E] font-bold">
            <HiBell className="text-2xl" />
            <h3 className="text-lg text-black">Notifications</h3>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
            {Object.keys(notifications).map((type) => (
              <div key={type} className="flex items-center justify-between p-6">
                <div>
                  <h5 className="font-bold text-sm text-gray-800">
                    {type === 'sms' ? 'SMS Alerts' : type === 'email' ? 'Email Summaries' : 'System Push Notifications'}
                  </h5>
                  <p className="text-xs text-gray-400">Receive alerts via {type}.</p>
                </div>
                <button
                  onClick={() => handleToggle(type)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notifications[type] ? 'bg-[#4ADE80]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications[type] ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 text-[#2D8A4E] font-bold">
            <HiAdjustmentsHorizontal className="text-2xl" />
            <h3 className="text-lg text-black">System Preferences</h3>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            {['Language', 'Timezone', 'Units of Measurement'].map((label) => (
              <div key={label}>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{label}</label>
                <select className="w-full bg-[#F8F9FA] border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium outline-none">
                  <option>{label === 'Language' ? 'English (US)' : label === 'Timezone' ? 'GMT +0:00 (UTC)' : 'Metric (C, km, m²)'}</option>
                </select>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;