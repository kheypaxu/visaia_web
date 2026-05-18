import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft, HiOutlineCamera, HiOutlineBadgeCheck, HiOutlineBookOpen, HiOutlineZoomIn, HiOutlineZoomOut, HiArrowsExpand, HiOutlineShieldCheck } from 'react-icons/hi';
import { HiArrowTopRightOnSquare } from 'react-icons/hi2';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";

const ValidationReview = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [report, setReport] = useState(null);
  const [farmerName, setFarmerName] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState('match');
  const [correctedStage, setCorrectedStage] = useState('');
  const [actionPriority, setActionPriority] = useState('Biological');
  const [advisoryMessage, setAdvisoryMessage] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [viewMode, setViewMode] = useState('annotated');

  // Helper to fetch farmer name from farmers collection using farmerId
  const fetchFarmerName = async (farmerId) => {
    if (!farmerId) return 'Unknown Farmer';
    try {
      const farmerDoc = await getDoc(doc(db, 'farmers', farmerId));
      if (farmerDoc.exists()) {
        return farmerDoc.data().fullName || 'Unknown Farmer';
      }
    } catch (err) {
      console.error("Error fetching farmer:", err);
    }
    return 'Unknown Farmer';
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const docRef = doc(db, "reports", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const reportData = { id: docSnap.id, ...docSnap.data() };
          setReport(reportData);

          // Fetch farmer name if farmerId exists
          if (reportData.farmerId) {
            const name = await fetchFarmerName(reportData.farmerId);
            setFarmerName(name);
          } else if (reportData.farmerName) {
            setFarmerName(reportData.farmerName);
          }

          // Pre-fill advisory message from report treatment if available
          if (reportData.treatment) {
            if (typeof reportData.treatment === 'object') {
              const treatmentText = reportData.treatment.prevention || 
                                    reportData.treatment.control_methods?.join('. ') || 
                                    '';
              setAdvisoryMessage(treatmentText);
            } else if (typeof reportData.treatment === 'string') {
              setAdvisoryMessage(reportData.treatment);
            }
          } else {
            setAdvisoryMessage('Please follow recommended integrated pest management practices.');
          }

          // Optional: send to Flask for annotation (non-blocking)
          if (reportData.imageBase64) {
            const base64Content = reportData.imageBase64.includes(',')
              ? reportData.imageBase64.split(',')[1]
              : reportData.imageBase64;
            try {
              const byteString = atob(base64Content);
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              const file = new File([ab], "image.jpg", { type: "image/jpeg" });
              await handleAnalyzeImage(file);
            } catch (err) {
              console.warn("Could not decode base64 image", err);
            }
          }
        }
      } catch (e) {
        console.error("Error fetching report:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleAnalyzeImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setReport(prev => ({
        ...prev,
        annotated_url: data.image_url
      }));
    } catch (err) {
      console.error("Flask annotation failed:", err);
    }
  };

  const handleConfirm = async () => {
    if (!report) return;
    if (diagnosis === 'wrong_stage' && !correctedStage) {
      alert("Please select a life stage when confirming wrong life stage detection.");
      return;
    }

    try {
      // 1. Create validation document
      const validationData = {
        reportId: report.id,
        expertDiagnosis: diagnosis,
        mitigationAction: actionPriority,
        advisoryMessage: advisoryMessage,
        internalNotes: internalNotes,
        lat: report.location?.lat || 0,
        lng: report.location?.lng || 0,
        validatedAt: serverTimestamp(),
        validatedBy: 'Expert_User_ID',
        originalDetection: report.detection,
        originalLifeStage: report.lifeStage,
      };
      if (diagnosis === 'wrong_stage') {
        validationData.correctedStage = correctedStage;
      }
      await addDoc(collection(db, "validations"), validationData);

      // 2. Update the original report's status to 'validated' (or 'rejected' if needed)
      const reportRef = doc(db, "reports", report.id);
      await updateDoc(reportRef, {
        status: 'validated',
        validatedAt: serverTimestamp(),
        validationNotes: internalNotes,
        ...(diagnosis === 'wrong_stage' && { correctedLifeStage: correctedStage })
      });

      alert("Validation submitted successfully!");
      navigate('/validation');
    } catch (e) {
      console.error("Firestore error:", e);
      alert("Failed to submit validation.");
    }
  };

  // Helper to format timestamp
  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const formatTime = (ts) => {
    if (!ts) return 'N/A';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="p-10 text-center">Loading report details...</div>;
  if (!report) return <div className="p-10 text-center">Report not found.</div>;

  return (
    <div className="space-y-6 pb-12">

      {/* Navigation & Pagination Section (simplified) */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/validation')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors mb-6"
        >
          <HiArrowLeft className="text-lg" /> Go back to Validation Queue
        </button>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[#10B981] font-bold text-sm tracking-wide uppercase">
            VALIDATION DETAILS
          </h3>
        </div>
      </div>

      {/* Submission Details Card - DYNAMIC from Firestore */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h4 className="font-bold text-sm text-gray-900 tracking-wide">SUBMISSION DETAILS</h4>
          <span className="font-bold text-sm text-gray-900">{report.id.slice(0, 8)}</span>
        </div>
        <div className="grid grid-cols-4 divide-x divide-gray-100 text-sm">
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">FARMER</p>
            <p className="font-bold text-gray-900">{farmerName}</p>
          </div>
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">LOCATION</p>
            <p className="font-bold text-gray-900">{report.location?.areaName || 'Unknown Location'}</p>
          </div>
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">DATE SUBMITTED</p>
            <p className="font-bold text-gray-900">
              {formatDate(report.timestamp)} <span className="text-gray-400 font-normal mx-1">|</span> {formatTime(report.timestamp)}
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">LIFE STAGE</p>
            <p className="font-bold text-gray-900">{report.lifeStage || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Photos & Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineCamera className="text-[#10B981] text-lg" />
              <h4 className="font-bold text-sm text-gray-900">FARMER PHOTO</h4>
            </div>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setViewMode('raw')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'raw' ? 'bg-[#10B981] text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                View Original
              </button>
              <button
                onClick={() => setViewMode('annotated')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'annotated' ? 'bg-[#10B981] text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                View Annotated
              </button>
            </div>
            <div className="relative bg-gray-200 rounded-2xl overflow-hidden h-[35rem] w-[50rem]">
              <img
                src={
                  viewMode === 'raw' && report.imageBase64
                    ? `data:image/jpeg;base64,${report.imageBase64}`
                    : report.annotated_url || (report.imageBase64 ? `data:image/jpeg;base64,${report.imageBase64}` : '')
                }
                alt="Farmer submission"
                className="w-full h-full object-cover"
                onError={(e) => e.target.src = 'https://placehold.co/600x400/e2e8f0/1e293b?text=Image+Error'}
              />
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-3 shadow-sm">
                <button className="text-gray-600 hover:text-black"><HiOutlineZoomIn /></button>
                <div className="w-px h-4 bg-gray-300"></div>
                <button className="text-gray-600 hover:text-black"><HiOutlineZoomOut /></button>
                <div className="w-px h-4 bg-gray-300"></div>
                <button className="text-gray-600 hover:text-black"><HiArrowsExpand /></button>
              </div>
            </div>
          </div>

          {/* Expert Validation Form (structure preserved) */}
          <div>
            <div className="flex items-center gap-2 mb-3 mt-8">
              <HiOutlineBadgeCheck className="text-[#10B981] text-xl" />
              <h4 className="font-bold text-sm text-gray-900">EXPERT VALIDATION</h4>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-8">
              {/* Diagnosis Confirmation (same radio/button logic, unchanged) */}
              <div>
                <h5 className="font-bold text-sm text-gray-900 mb-4">Diagnosis Confirmation</h5>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${diagnosis === 'match' ? 'border-[#10B981] bg-green-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="diagnosis" value="match" checked={diagnosis === 'match'} onChange={(e) => {
                      setDiagnosis(e.target.value);
                      if (e.target.value !== 'wrong_stage') setCorrectedStage('');
                    }} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${diagnosis === 'match' ? 'border-[#10B981]' : 'border-gray-300'}`}>
                      {diagnosis === 'match' && <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>}
                    </div>
                    <span className="text-sm font-medium text-gray-800">Confirmed - matches AI detection</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${diagnosis === 'wrong_stage' ? 'border-[#10B981] bg-green-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="diagnosis" value="wrong_stage" checked={diagnosis === 'wrong_stage'} onChange={(e) => {
                      setDiagnosis(e.target.value);
                      if (e.target.value !== 'wrong_stage') setCorrectedStage('');
                    }} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${diagnosis === 'wrong_stage' ? 'border-[#10B981]' : 'border-gray-300'}`}>
                      {diagnosis === 'wrong_stage' && <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>}
                    </div>
                    <span className="text-sm font-medium text-gray-800">Confirmed - wrong life stage detected</span>
                  </label>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${diagnosis === 'wrong_stage' ? 'max-h-60 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs font-bold text-gray-700 mb-3">SELECT CORRECT LIFE STAGE:</p>
                      <div className="grid grid-cols-4 gap-3">
                        {['Egg', 'Larva', 'Pupa', 'Moth'].map((stage) => (
                          <button key={stage} type="button" onClick={() => setCorrectedStage(stage)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${correctedStage === stage ? 'bg-[#10B981] text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>
                            {stage}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${diagnosis === 'other' ? 'border-[#10B981] bg-green-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="diagnosis" value="other" checked={diagnosis === 'other'} onChange={(e) => {
                      setDiagnosis(e.target.value);
                      if (e.target.value !== 'wrong_stage') setCorrectedStage('');
                    }} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${diagnosis === 'other' ? 'border-[#10B981]' : 'border-gray-300'}`}>
                      {diagnosis === 'other' && <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>}
                    </div>
                    <span className="text-sm font-medium text-gray-800">Other Pest (manual entry required)</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${diagnosis === 'beneficial' ? 'border-[#10B981] bg-green-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="diagnosis" value="beneficial" checked={diagnosis === 'beneficial'} onChange={(e) => {
                      setDiagnosis(e.target.value);
                      if (e.target.value !== 'wrong_stage') setCorrectedStage('');
                    }} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${diagnosis === 'beneficial' ? 'border-[#10B981]' : 'border-gray-300'}`}>
                      {diagnosis === 'beneficial' && <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>}
                    </div>
                    <span className="text-sm font-medium text-gray-800">Beneficial Insect</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${diagnosis === 'unclear' ? 'border-red-500 bg-red-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="diagnosis" value="unclear" checked={diagnosis === 'unclear'} onChange={(e) => {
                      setDiagnosis(e.target.value);
                      if (e.target.value !== 'wrong_stage') setCorrectedStage('');
                    }} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${diagnosis === 'unclear' ? 'border-red-500' : 'border-gray-300'}`}>
                      {diagnosis === 'unclear' && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                    </div>
                    <span className={`text-sm font-medium ${diagnosis === 'unclear' ? 'text-red-500' : 'text-gray-800'}`}>Unclear / Poor Image Quality</span>
                  </label>
                </div>
              </div>

              {/* Mitigation Strategy */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineShieldCheck className="text-[#10B981] text-lg" />
                  <h5 className="font-bold text-sm text-gray-900">Recommended Mitigation Strategy</h5>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">ACTION PRIORITY</label>
                    <select value={actionPriority} onChange={(e) => setActionPriority(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm">
                      <option>Biological</option><option>Chemical</option><option>Cultural</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">ADVISORY MESSAGE (SENT TO FARMER)</label>
                      <span className="text-[9px] text-gray-400">Expert may edit below</span>
                    </div>
                    <textarea className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm h-24 resize-none" value={advisoryMessage} onChange={(e) => setAdvisoryMessage(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-2">INTERNAL VALIDATION NOTES</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm h-24 resize-none" placeholder="Enter internal notes here..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Results & Guides */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#10B981] text-lg font-bold">⬡</span>
            <h4 className="font-bold text-sm text-gray-900">AI DIAGNOSTIC RESULT</h4>
          </div>
          <div className="bg-[#F8FDF9] rounded-2xl border border-green-100 shadow-sm p-6">
            <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider mb-1">DETECTED PEST</p>
            <h3 className="text-2xl font-extrabold text-[#042F21] mb-6">{report.detection || 'N/A'}</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">LIFE STAGE</p>
                <p className="text-xl font-bold text-gray-900">{report.lifeStage || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">RISK LEVEL</p>
                <p className={`text-xl font-bold ${report.risk === 'High' ? 'text-red-600' : report.risk === 'Medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                  {report.risk || 'N/A'}
                </p>
              </div>
              <div className="col-span-2">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CONFIDENCE SCORE</p>
                  <span className="text-lg font-bold text-[#042F21]">{report.confidence ? `${(report.confidence * 100).toFixed(0)}%` : '0%'}</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="bg-[#10B981] h-full rounded-full" style={{ width: `${(report.confidence || 0) * 100}%` }}></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-green-100/60">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <HiOutlineBadgeCheck className="text-[#10B981] text-lg" />
                Image Quality: Good
              </div>
              <span className="px-2 py-1 bg-white border border-green-200 text-[#10B981] text-[9px] font-bold uppercase tracking-wider rounded">AI VERIFIED</span>
            </div>
          </div>

          {/* Visual Guide Card (static) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h5 className="font-bold text-sm text-gray-900 mb-4">Fall Armyworm Larvae Identification</h5>
            <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video mb-4">
              <img src="https://placehold.co/600x400/e2e8f0/1e293b?text=Pest+Reference+Photo" alt="Reference" className="w-full h-full object-cover" />
            </div>
            <ul className="space-y-3 mb-6">
              <li className="text-xs text-gray-600"><strong>Inverted Y-shape:</strong> Distinct marking on the front of the head capsule.</li>
              <li className="text-xs text-gray-600"><strong>Four Spots:</strong> Distinct square pattern of dots on the 8th abdominal segment.</li>
              <li className="text-xs text-gray-600"><strong>Lookalikes:</strong> Corn Earworm (lack Y-mark), African Armyworm (lack square dots).</li>
            </ul>
            <button className="w-full flex items-center justify-center gap-2 text-[#10B981] font-bold text-sm hover:text-green-700">
              View Full Pest Catalog <HiArrowTopRightOnSquare />
            </button>
          </div>

          {/* Notification Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider mb-2">NOTIFICATION SUMMARY</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              After validation, the farmer will receive an advisory based on your recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="flex justify-end items-center gap-6 pt-6 mt-8 border-t border-gray-200">
        <button onClick={() => navigate('/validation')} className="text-gray-500 font-bold text-sm hover:text-gray-800">Cancel</button>
        <button onClick={handleConfirm} className="bg-[#388E3C] hover:bg-green-700 text-white font-bold text-sm px-8 py-3.5 rounded-lg shadow-sm">Confirm Validation & Submit</button>
      </div>
    </div>
  );
};

export default ValidationReview;