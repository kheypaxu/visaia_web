import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiBell, HiArrowLeft, HiOutlineCamera, HiOutlineBadgeCheck, HiOutlineBookOpen, HiOutlineZoomIn, HiOutlineZoomOut, HiArrowsExpand, HiOutlineShieldCheck } from 'react-icons/hi';
import { HiArrowTopRightOnSquare } from 'react-icons/hi2';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const ValidationReview = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from the URL

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState('match');
  const [actionPriority, setActionPriority] = useState('Biological');
  const [advisoryMessage, setAdvisoryMessage] = useState('Default advisory...');
  const [internalNotes, setInternalNotes] = useState('');
  const [viewMode, setViewMode] = useState('annotated'); // 'raw' or 'annotated'

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const docRef = doc(db, "reports", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const reportData = { id: docSnap.id, ...docSnap.data() };
          setReport(reportData);

          // FIX: If we have the base64, send it to the Flask server now
          // Inside your useEffect where you prepare the file:
          if (reportData.imageBase64) {
            // 1. Remove the prefix if it exists
            const base64Content = reportData.imageBase64.includes(',')
              ? reportData.imageBase64.split(',')[1]
              : reportData.imageBase64;

            // 2. Decode safely
            const byteString = atob(base64Content);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);

            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }

            // Use 'image/jpeg' as default; ensure this matches your upload format
            const file = new File([ab], "image.jpg", { type: "image/jpeg" });
            handleAnalyzeImage(file);
          }
        }
      } catch (e) {
        console.error("Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleAnalyzeImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    // This updates the report state to include the annotated_url
    // received from the Flask API
    setReport(prev => ({
      ...prev,
      annotated_url: data.image_url
    }));
  };

  const handleConfirm = async () => {
    if (!report) return;

    try {
      await addDoc(collection(db, "validations"), {
        reportId: report.id,
        expertDiagnosis: diagnosis,
        mitigationAction: actionPriority,
        advisoryMessage: advisoryMessage,
        internalNotes: internalNotes,
        // Ensure these fields exist in your 'reports' document or are defaulted
        lat: report.location?.lat || 14.5995,
        lng: report.location?.lng || 120.9842,
        validatedAt: serverTimestamp(),
        validatedBy: 'Expert_User_ID'
      });

      alert("Validation submitted and map updated!");
      navigate('/validation');
    } catch (e) {
      console.error("Firestore error:", e);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading report details...</div>;
  if (!report) return <div className="p-10 text-center">Report not found.</div>;

  return (
    <div className="space-y-6 pb-12">

      {/* Navigation & Pagination Section */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/validation')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors mb-6"
        >
          <HiArrowLeft className="text-lg" /> Go back to Validation Queue
        </button>

        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[#10B981] font-bold text-sm tracking-wide uppercase">
            PENDING VALIDATION (1 OF 12)
          </h3>
          <div className="flex gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 font-medium text-sm transition-colors">{'<'}</button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#10B981] text-white font-bold text-sm transition-colors">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors">3</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors">{'>'}</button>
          </div>
        </div>

        {/* Full-width Progress Bar */}
        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="bg-[#10B981] w-1/12 h-full rounded-full"></div>
        </div>
      </div>

      {/* Submission Details Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h4 className="font-bold text-sm text-gray-900 tracking-wide">SUBMISSION DETAILS</h4>
          <span className="font-bold text-sm text-gray-900">R0001</span>
        </div>
        <div className="grid grid-cols-4 divide-x divide-gray-100 text-sm">
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">FARMER</p>
            <p className="font-bold text-gray-900">Juan Dela Cruz</p>
          </div>
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">LOCATION</p>
            <p className="font-bold text-gray-900">Cabatuan, Iloilo</p>
          </div>
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">DATE SUBMITTED</p>
            <p className="font-bold text-gray-900">March 4, 2026 <span className="text-gray-400 font-normal mx-1">|</span> 14:32 PM</p>
          </div>
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">CROP STAGE</p>
            <p className="font-bold text-gray-900">Corn - Silking</p>
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

            {/* Toggle buttons for image view */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setViewMode('raw')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'raw'
                  ? 'bg-[#10B981] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                View Original
              </button>
              <button
                onClick={() => setViewMode('annotated')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'annotated'
                  ? 'bg-[#10B981] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                View Annotated
              </button>
            </div>

            <div className="relative bg-gray-200 rounded-2xl overflow-hidden h-[35rem] w-[50rem]">
              <img
                src={
                  viewMode === 'raw'
                    ? `data:image/jpeg;base64,${report.imageBase64}`
                    : report.annotated_url
                }
                alt="Farmer submission"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-3 shadow-sm border border-white/20">
                <button className="text-gray-600 hover:text-black"><HiOutlineZoomIn /></button>
                <div className="w-px h-4 bg-gray-300"></div>
                <button className="text-gray-600 hover:text-black"><HiOutlineZoomOut /></button>
                <div className="w-px h-4 bg-gray-300"></div>
                <button className="text-gray-600 hover:text-black"><HiArrowsExpand /></button>
              </div>
            </div>
          </div>

          {/* Expert Validation Form */}
          <div>
            <div className="flex items-center gap-2 mb-3 mt-8">
              <HiOutlineBadgeCheck className="text-[#10B981] text-xl" />
              <h4 className="font-bold text-sm text-gray-900">EXPERT VALIDATION</h4>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-8">
              {/* Diagnosis Confirmation */}
              <div>
                <h5 className="font-bold text-sm text-gray-900 mb-4">Diagnosis Confirmation</h5>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${diagnosis === 'match' ? 'border-[#10B981] bg-green-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="diagnosis" value="match" checked={diagnosis === 'match'} onChange={(e) => setDiagnosis(e.target.value)} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${diagnosis === 'match' ? 'border-[#10B981]' : 'border-gray-300'}`}>
                      {diagnosis === 'match' && <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>}
                    </div>
                    <span className="text-sm font-medium text-gray-800">Confirmed - matches AI detection</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${diagnosis === 'wrong_stage' ? 'border-[#10B981] bg-green-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="diagnosis" value="wrong_stage" checked={diagnosis === 'wrong_stage'} onChange={(e) => setDiagnosis(e.target.value)} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${diagnosis === 'wrong_stage' ? 'border-[#10B981]' : 'border-gray-300'}`}>
                      {diagnosis === 'wrong_stage' && <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>}
                    </div>
                    <span className="text-sm font-medium text-gray-800">Confirmed - wrong life stage detected</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${diagnosis === 'other' ? 'border-[#10B981] bg-green-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="diagnosis" value="other" checked={diagnosis === 'other'} onChange={(e) => setDiagnosis(e.target.value)} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${diagnosis === 'other' ? 'border-[#10B981]' : 'border-gray-300'}`}>
                      {diagnosis === 'other' && <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>}
                    </div>
                    <span className="text-sm font-medium text-gray-800">Other Pest (manual entry required)</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${diagnosis === 'beneficial' ? 'border-[#10B981] bg-green-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="diagnosis" value="beneficial" checked={diagnosis === 'beneficial'} onChange={(e) => setDiagnosis(e.target.value)} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${diagnosis === 'beneficial' ? 'border-[#10B981]' : 'border-gray-300'}`}>
                      {diagnosis === 'beneficial' && <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>}
                    </div>
                    <span className="text-sm font-medium text-gray-800">Beneficial Insect</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${diagnosis === 'unclear' ? 'border-red-500 bg-red-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="diagnosis" value="unclear" checked={diagnosis === 'unclear'} onChange={(e) => setDiagnosis(e.target.value)} className="hidden" />
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
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]">
                      <option>Biological</option>
                      <option>Chemical</option>
                      <option>Cultural</option>
                    </select>
                  </div>
                  <div className="col-span-2 relative">
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">ADVISORY MESSAGE (SENT TO FARMER)</label>
                      <span className="text-[9px] text-gray-400">Expert may edit below</span>
                    </div>
                    <textarea
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] h-24 resize-none"
                      defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-2">INTERNAL VALIDATION NOTES</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] h-24 resize-none"
                  placeholder="Enter internal notes here..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Results & Guides */}
        <div className="space-y-6">

          {/* AI Result Header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#10B981] text-lg font-bold">⬡</span>
            <h4 className="font-bold text-sm text-gray-900">AI DIAGNOSTIC RESULT</h4>
          </div>

          {/* AI Result Card */}
          <div className="bg-[#F8FDF9] rounded-2xl border border-green-100 shadow-sm p-6">
            <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider mb-1">DETECTED PEST</p>

            {/* Corrected: Accessing 'detection' */}
            <h3 className="text-2xl font-extrabold text-[#042F21] mb-6">{report.detection || 'N/A'}</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">GROWTH STAGE</p>
                {/* Corrected: Accessing 'crop' */}
                <p className="text-xl font-bold text-gray-900">{report.lifeStage || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">RISK LEVEL</p>
                {/* Corrected: Accessing 'risk' */}
                <p className={`text-xl font-bold ${report.riskLevel === 'High' ? 'text-red-600' : 'text-green-600'}`}>
                  {report.risk || 'N/A'}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CONFIDENCE SCORE</p>
                  {/* Fetch confidence from Firestore */}
                  <span className="text-lg font-bold text-[#042F21]">
                    {report.confidence ? `${(report.confidence * 100).toFixed(0)}%` : '0%'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="bg-[#10B981] h-full rounded-full"
                    style={{ width: `${(report.confidence || 0) * 100}%` }}
                  ></div>
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

          {/* Visual Guide Header */}
          <div className="flex items-center gap-2 mb-3 mt-8">
            <HiOutlineBookOpen className="text-[#10B981] text-lg" />
            <h4 className="font-bold text-sm text-gray-900">QUICK REFERENCE - VISUAL GUIDE</h4>
          </div>

          {/* Visual Guide Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h5 className="font-bold text-sm text-gray-900 mb-4">Fall Armyworm Larvae Identification</h5>

            <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video mb-4">
              <img src="https://placehold.co/600x400/e2e8f0/1e293b?text=Pest+Reference+Photo" alt="Reference" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-2 shadow-sm border border-white/20 text-xs">
                <button className="text-gray-600 hover:text-black"><HiOutlineZoomIn /></button>
                <div className="w-px h-3 bg-gray-300"></div>
                <button className="text-gray-600 hover:text-black"><HiOutlineZoomOut /></button>
                <div className="w-px h-3 bg-gray-300"></div>
                <button className="text-gray-600 hover:text-black"><HiArrowsExpand /></button>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-900">Inverted Y-shape:</strong> Distinct marking on the front of the head capsule.
              </li>
              <li className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-900">Four Spots:</strong> Distinct square pattern of dots on the 8th abdominal segment.
              </li>
              <li className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-900">Lookalikes:</strong> Corn Earworm (lack Y-mark), African Armyworm (lack square dots).
              </li>
            </ul>

            <button className="w-full flex items-center justify-center gap-2 text-[#10B981] font-bold text-sm hover:text-green-700 transition-colors">
              View Full Pest Catalog <HiArrowTopRightOnSquare />
            </button>
          </div>

          {/* Notification Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider mb-2">NOTIFICATION SUMMARY</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>

        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="flex justify-end items-center gap-6 pt-6 mt-8 border-t border-gray-200">
        <button
          onClick={() => navigate('/validation')}
          className="text-gray-500 font-bold text-sm hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="bg-[#388E3C] hover:bg-green-700 text-white font-bold text-sm px-8 py-3.5 rounded-lg shadow-sm transition-colors"
        >
          Confirm Validation & Submit
        </button>
      </div>

    </div>
  );
};

export default ValidationReview;