import { useEffect, useMemo, useRef, useState } from 'react';

const Analytics = () => {
  const lineChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedMunicipality, setSelectedMunicipality] = useState('Cabatuan');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last 30 Days');
  const [selectedYear, setSelectedYear] = useState('2026');
  
  // Tooltip States
  const [heatmapTooltip, setHeatmapTooltip] = useState(null);
  const [severityHover, setSeverityHover] = useState(null);

  const iloiloMunicipalities = [
    "Ajuy", "Alimodian", "Anilao", "Badiangan", "Balasan", "Banate", 
    "Barotac Nuevo", "Barotac Viejo", "Batad", "Bingawan", "Cabatuan", 
    "Calinog", "Carles", "Concepcion", "Dingle", "Dueñas", "Dumangas", 
    "Estancia", "Guimbal", "Igbaras", "Janiuay", "Lambunao", "Leganes", 
    "Lemery", "Leon", "Maasin", "Miagao", "Mina", "New Lucena", "Oton", 
    "Passi City", "Pavia", "Pototan", "San Dionisio", "San Enrique", 
    "San Joaquin", "San Miguel", "San Rafael", "Santa Barbara", "Sara", 
    "Tigbauan", "Tubungan", "Zarraga"
  ];

  const availableYears = ['2024', '2025', '2026', '2027', '2028'];

  const filteredData = useMemo(() => {
    const baseData = {
      kpiData: {
        outbreakIncidents: { value: 1284, trend: '+12% vs last cycle' },
        affectedArea: { value: 1240, trend: '+5% from last week' },
        yieldLoss: { value: '-4.2%', note: 'Projected' },
        totalHarvested: { value: 84200, status: 'On target for Q2' }
      },
      pestData: [
        { month: 'JAN', monthFull: 'January', fallArmyworm: 420, locusts: 280, aphids: 190 },
        { month: 'FEB', monthFull: 'February', fallArmyworm: 480, locusts: 320, aphids: 210 },
        { month: 'MAR', monthFull: 'March', fallArmyworm: 550, locusts: 380, aphids: 240 },
        { month: 'APR', monthFull: 'April', fallArmyworm: 620, locusts: 450, aphids: 270 },
        { month: 'MAY', monthFull: 'May', fallArmyworm: 710, locusts: 520, aphids: 310 },
        { month: 'JUN', monthFull: 'June', fallArmyworm: 820, locusts: 610, aphids: 360 },
        { month: 'JUL', monthFull: 'July', fallArmyworm: 780, locusts: 580, aphids: 340 },
        { month: 'AUG', monthFull: 'August', fallArmyworm: 690, locusts: 490, aphids: 300 },
        { month: 'SEP', monthFull: 'September', fallArmyworm: 580, locusts: 410, aphids: 260 },
        { month: 'OCT', monthFull: 'October', fallArmyworm: 500, locusts: 350, aphids: 220 },
        { month: 'NOV', monthFull: 'November', fallArmyworm: 430, locusts: 300, aphids: 200 },
        { month: 'DEC', monthFull: 'December', fallArmyworm: 400, locusts: 260, aphids: 180 }
      ],
      severityData: {
        fallArmyworm: { light: 20, moderate: 45, severe: 35 },
        locusts: { light: 65, moderate: 20, severe: 15 },
        aphids: { light: 40, moderate: 50, severe: 10 }
      }
    };

    const municipalityFactors = {
      'Batad': { multiplier: 1.5, trend: '+25% vs last cycle' },
      'Janiuay': { multiplier: 1.3, trend: '+18% vs last cycle' },
      'Dumangas': { multiplier: 0.8, trend: '-5% vs last cycle' },
      'Passi City': { multiplier: 1.4, trend: '+22% vs last cycle' },
      'Oton': { multiplier: 0.9, trend: '-2% vs last cycle' },
      'Pavia': { multiplier: 1.2, trend: '+15% vs last cycle' },
      'Santa Barbara': { multiplier: 1.1, trend: '+8% vs last cycle' },
      'Miagao': { multiplier: 0.7, trend: '-12% vs last cycle' },
      'Leon': { multiplier: 0.6, trend: '-15% vs last cycle' }
    };

    const timeRangeFactors = {
      'Last 30 Days': { multiplier: 1.0 },
      'Last 90 Days': { multiplier: 1.2 },
      'Last 12 Months': { multiplier: 1.5 }
    };

    const mFactor = municipalityFactors[selectedMunicipality]?.multiplier || 1.0;
    const tFactor = timeRangeFactors[selectedTimeRange]?.multiplier || 1.0;
    const combined = mFactor * tFactor;

    return {
      kpiData: {
        outbreakIncidents: { value: Math.round(baseData.kpiData.outbreakIncidents.value * combined), trend: `${selectedMunicipality} - Update` },
        affectedArea: { value: Math.round(baseData.kpiData.affectedArea.value * combined), trend: `+${Math.round(combined * 2)}% trend` },
        yieldLoss: { value: `-${(4.2 * combined).toFixed(1)}%`, note: 'Projected' },
        totalHarvested: { value: Math.round(baseData.kpiData.totalHarvested.value / combined), status: 'Projection' }
      },
      pestData: baseData.pestData.map(d => ({
        ...d,
        fallArmyworm: Math.round(d.fallArmyworm * combined),
        locusts: Math.round(d.locusts * combined),
        aphids: Math.round(d.aphids * combined)
      })),
      severityData: {
        fallArmyworm: { light: 20, moderate: 45, severe: 35 },
        locusts: { light: 65, moderate: 20, severe: 15 },
        aphids: { light: 40, moderate: 50, severe: 10 }
      }
    };
  }, [selectedMunicipality, selectedTimeRange]);

  const getLifeStageDataByYear = (year) => {
    const yearData = {
      '2024': { egg: [15, 18, 25, 35, 45, 55, 60, 58, 48, 35, 22, 16], larva: [10, 15, 28, 42, 58, 72, 80, 75, 60, 40, 25, 12], pupa: [5, 8, 12, 18, 25, 35, 42, 38, 28, 18, 10, 6], adult: [8, 12, 18, 25, 32, 40, 45, 42, 35, 25, 15, 10] },
      '2025': { egg: [20, 25, 32, 40, 48, 52, 55, 50, 42, 35, 28, 22], larva: [15, 22, 35, 48, 62, 70, 75, 68, 55, 42, 30, 18], pupa: [8, 12, 18, 25, 32, 38, 42, 38, 30, 22, 15, 10], adult: [12, 16, 22, 28, 35, 42, 48, 45, 38, 30, 22, 15] },
      '2026': { egg: [25, 30, 35, 42, 50, 58, 65, 62, 55, 45, 35, 28], larva: [20, 28, 40, 52, 68, 80, 88, 82, 70, 55, 40, 25], pupa: [10, 15, 22, 30, 38, 45, 52, 48, 38, 28, 18, 12], adult: [15, 20, 28, 35, 42, 52, 58, 55, 48, 38, 28, 18] },
      '2027': { egg: [30, 35, 42, 48, 55, 62, 68, 65, 58, 48, 38, 32], larva: [25, 32, 45, 58, 72, 85, 92, 88, 75, 60, 45, 30], pupa: [12, 18, 25, 32, 40, 48, 55, 52, 42, 32, 22, 15], adult: [18, 22, 30, 38, 45, 55, 62, 58, 50, 40, 30, 22] },
      '2028': { egg: [28, 32, 38, 45, 52, 60, 65, 62, 55, 45, 35, 28], larva: [22, 30, 42, 55, 68, 82, 90, 85, 72, 58, 42, 28], pupa: [10, 15, 22, 28, 35, 42, 48, 45, 35, 25, 18, 12], adult: [15, 20, 28, 35, 42, 50, 58, 55, 45, 35, 25, 18] }
    };
    return yearData[year] || yearData['2026'];
  };

  const lifeStageNames = ['Egg', 'Larva', 'Pupa', 'Adult'];
  
  const getDensityColor = (value) => {
    if (value > 70) return 'bg-green-700';
    if (value > 60) return 'bg-green-600';
    if (value > 50) return 'bg-green-500';
    if (value > 40) return 'bg-green-400';
    if (value > 30) return 'bg-green-300';
    if (value > 20) return 'bg-green-200';
    if (value > 10) return 'bg-green-100';
    return 'bg-green-50';
  };

  const highRiskAreas = [
    { name: 'Punta Taytay', score: 94, risk: 'Critical' },
    { name: 'Balay', score: 28, risk: 'Moderate' },
    { name: 'Baybay', score: 18, risk: 'Low' }
  ];

  useEffect(() => {
    const canvas = lineChartRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    let internalPoints = { fallArmyworm: [], locusts: [], aphids: [] };

    const drawChart = (highlighted = null) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#F1F5F9'; ctx.lineWidth = 1;
      for (let i = 0; i <= 8; i++) {
        const y = (canvas.height / 8) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        ctx.fillStyle = '#94A3B8'; ctx.font = 'bold 10px Inter';
        ctx.fillText(1000 - (i * 125), 5, y - 5);
      }

      const drawLine = (points, color) => {
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 3;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        const scaled = points.map(p => canvas.height - (p / 1000) * canvas.height);
        ctx.moveTo(0, scaled[0]);
        for (let i = 1; i < scaled.length; i++) {
          const x = (canvas.width / (scaled.length - 1)) * i;
          ctx.lineTo(x, scaled[i]);
        }
        ctx.stroke(); return scaled;
      };

      const faPoints = filteredData.pestData.map(d => d.fallArmyworm);
      const locustPoints = filteredData.pestData.map(d => d.locusts);
      const aphidPoints = filteredData.pestData.map(d => d.aphids);

      internalPoints.fallArmyworm = drawLine(faPoints, '#22C55E').map((y, i) => ({
        x: (canvas.width / (faPoints.length - 1)) * i, y, value: faPoints[i], month: filteredData.pestData[i].month, species: 'fallArmyworm'
      }));
      internalPoints.locusts = drawLine(locustPoints, '#EF4444').map((y, i) => ({
        x: (canvas.width / (locustPoints.length - 1)) * i, y, value: locustPoints[i], month: filteredData.pestData[i].month, species: 'locusts'
      }));
      internalPoints.aphids = drawLine(aphidPoints, '#38BDF8').map((y, i) => ({
        x: (canvas.width / (aphidPoints.length - 1)) * i, y, value: aphidPoints[i], month: filteredData.pestData[i].month, species: 'aphids'
      }));

      const dots = (coords, color) => {
        coords.forEach(p => {
          ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'white'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
        });
      };
      dots(internalPoints.fallArmyworm, '#22C55E');
      dots(internalPoints.locusts, '#EF4444');
      dots(internalPoints.aphids, '#38BDF8');

      ctx.fillStyle = '#94A3B8'; ctx.textAlign = 'center';
      filteredData.pestData.forEach((d, i) => {
        const x = (canvas.width / (filteredData.pestData.length - 1)) * i;
        ctx.fillText(d.month, x, canvas.height - 5);
      });

      if (highlighted) {
        ctx.beginPath(); ctx.arc(highlighted.x, highlighted.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = highlighted.color + '22'; ctx.fill();
        ctx.beginPath(); ctx.arc(highlighted.x, highlighted.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = highlighted.color; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
      }
    };

    const initResize = () => { canvas.width = container.offsetWidth; canvas.height = 350; drawChart(); };
    const move = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      let found = null;
      const flat = [...internalPoints.fallArmyworm, ...internalPoints.locusts, ...internalPoints.aphids];
      for (const p of flat) { if (Math.sqrt((x - p.x)**2 + (y - p.y)**2) < 15) { found = p; break; } }
      if (found) {
        const color = found.species === 'fallArmyworm' ? '#22C55E' : found.species === 'locusts' ? '#EF4444' : '#38BDF8';
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setHoveredPoint({ ...found, color });
        drawChart({ ...found, color });
      } else { setHoveredPoint(null); drawChart(); }
    };

    window.addEventListener('resize', initResize);
    canvas.addEventListener('mousemove', move);
    initResize();
    return () => { window.removeEventListener('resize', initResize); canvas.removeEventListener('mousemove', move); };
  }, [filteredData]);

  useEffect(() => {
    const dCanvas = doughnutChartRef.current;
    if (!dCanvas) return;
    const ctx = dCanvas.getContext('2d');
    const radius = 90; const thickness = 25;
    ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);
    const drawSeg = (start, end, color) => {
      ctx.beginPath(); ctx.arc(dCanvas.width / 2, dCanvas.height / 2, radius, start, end);
      ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.lineCap = 'round'; ctx.stroke();
    };
    const start = -Math.PI / 2;
    drawSeg(start, start + (2 * Math.PI * 0.68), '#22C55E');
    drawSeg(start + (2 * Math.PI * 0.68), start + (2 * Math.PI * 0.90), '#EF4444');
    drawSeg(start + (2 * Math.PI * 0.90), start + (2 * Math.PI), '#FACC15');
  }, []);

  const currentLifeStageData = getLifeStageDataByYear(selectedYear);

  return (
    <div className="bg-dashboard-bg text-slate-900 font-sans min-h-screen">
      <div className="max-w-[1400px] mx-auto p-6 lg:p-10">
        
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-4 rounded-xl card-shadow">
          <div>
            <h2 className="text-xl font-bold text-slate-800">System Analytics & Trends</h2>
            <p className="text-xs text-pest-green mt-1">Showing data for: <span className="font-bold">{selectedMunicipality}</span> - {selectedTimeRange}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select className="rounded-lg border-slate-200 text-sm p-2 min-w-[180px]" value={selectedMunicipality} onChange={(e) => setSelectedMunicipality(e.target.value)}>
              {iloiloMunicipalities.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="rounded-lg border-slate-200 text-sm p-2" value={selectedTimeRange} onChange={(e) => setSelectedTimeRange(e.target.value)}>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Last 12 Months">Last 12 Months</option>
            </select>
            <button className="bg-pest-green hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Export Report</button>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-50 hover:shadow-lg transition-shadow">
            <p className="text-slate-500 text-sm font-medium">Outbreak Incidents</p>
            <h3 className="text-3xl font-bold mt-2">{filteredData.kpiData.outbreakIncidents.value.toLocaleString()}</h3>
            <span className="inline-block mt-3 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">{filteredData.kpiData.outbreakIncidents.trend}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-50 hover:shadow-lg transition-shadow">
            <p className="text-slate-500 text-sm font-medium">Affected Area</p>
            <h3 className="text-3xl font-bold mt-2">{filteredData.kpiData.affectedArea.value.toLocaleString()} <span className="text-xl font-normal text-slate-400">ha</span></h3>
            <span className="inline-block mt-3 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">{filteredData.kpiData.affectedArea.trend}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-50 hover:shadow-lg transition-shadow">
            <p className="text-slate-500 text-sm font-medium">Yield Loss Est.</p>
            <h3 className="text-3xl font-bold mt-2">{filteredData.kpiData.yieldLoss.value}</h3>
            <span className="inline-block mt-3 px-2.5 py-1 bg-yellow-50 text-yellow-600 text-xs font-bold rounded-full">{filteredData.kpiData.yieldLoss.note}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-50 hover:shadow-lg transition-shadow">
            <p className="text-slate-500 text-sm font-medium">Total Corn Harvested</p>
            <h3 className="text-3xl font-bold mt-2">{filteredData.kpiData.totalHarvested.value.toLocaleString()} <span className="text-xl font-normal text-slate-400">tons</span></h3>
            <span className="inline-block mt-3 px-2.5 py-1 bg-green-50 text-pest-green text-xs font-bold rounded-full">{filteredData.kpiData.totalHarvested.status}</span>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl card-shadow border border-slate-50">
            <div className="flex justify-between items-start mb-6">
              <div><h4 className="text-lg font-bold">Pest Occurrence Over Time</h4><p className="text-xs text-slate-400">Historical trend analysis by species</p></div>
              <div className="flex gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pest-green"></span> Fall Armyworm</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pest-red"></span> Locusts</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pest-blue"></span> Aphids</div>
              </div>
            </div>
            <div className="relative h-[350px] w-full">
              <canvas ref={lineChartRef} className="w-full h-full cursor-pointer"></canvas>
              {hoveredPoint && (
                <div className="absolute z-20 pointer-events-none bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden min-w-[200px]" style={{ left: mousePosition.x + 15, top: mousePosition.y - 100 }}>
                  <div className="px-4 py-2 flex justify-between items-center" style={{ backgroundColor: hoveredPoint.color + '15' }}>
                    <span className="font-black text-[11px] uppercase tracking-widest" style={{ color: hoveredPoint.color }}>{hoveredPoint.species === 'fallArmyworm' ? 'Fall Armyworm' : hoveredPoint.species === 'locusts' ? 'Locusts' : 'Aphids'}</span>
                    <span className="text-[10px] font-bold text-slate-500">{hoveredPoint.month} 2026</span>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Population Density</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-800">{hoveredPoint.value.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-500">Individuals/ha</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-50">
            <h4 className="text-lg font-bold">Pest Infestation Severity Breakdown</h4>
            <div className="space-y-8 mt-8">
              {['fallArmyworm', 'locusts', 'aphids'].map(p => (
                <div key={p} className="relative group cursor-pointer" onMouseEnter={() => setSeverityHover(p)} onMouseLeave={() => setSeverityHover(null)}>
                  <p className="text-sm font-bold mb-2 capitalize">{p.replace(/([A-Z])/g, ' $1')}</p>
                  {severityHover === p && (
                    <div className="absolute -top-8 left-0 right-0 flex justify-center z-10">
                      <div className="bg-white px-3 py-1.5 rounded-full shadow-xl">
                        <span className="text-[10px] font-black tracking-wide">
                          <span className="text-pest-green">LIGHT: {filteredData.severityData[p].light}%</span><span className="text-slate-300 mx-2">|</span> 
                          <span className="text-orange-500">MODERATE: {filteredData.severityData[p].moderate}%</span><span className="text-slate-300 mx-2">|</span> 
                          <span className="text-pest-red">SEVERE: {filteredData.severityData[p].severe}%</span>
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex h-6 rounded-full overflow-hidden transition-all duration-300 group-hover:scale-[1.01]">
                    <div className="bg-pest-green flex-grow" style={{ width: `${filteredData.severityData[p].light}%` }}></div>
                    <div className="bg-pest-yellow flex-grow" style={{ width: `${filteredData.severityData[p].moderate}%` }}></div>
                    <div className="bg-pest-red flex-grow" style={{ width: `${filteredData.severityData[p].severe}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl card-shadow border border-slate-50 relative">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold">Life Stage Seasonality</h4>
              <div className="flex bg-slate-100 rounded-lg p-1">
                {availableYears.map(y => (
                  <button key={y} onClick={() => setSelectedYear(y)} className={`px-3 py-1 text-sm rounded-md ${selectedYear === y ? 'bg-pest-green text-white shadow-sm' : 'text-slate-600'}`}>{y}</button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-[80px_1fr] gap-4 mt-6">
              <div className="flex flex-col justify-between py-2 text-xs font-semibold text-slate-500">{lifeStageNames.map(s => <div key={s} className="py-1">{s}</div>)}</div>
              <div>
                <div className="grid grid-cols-12 gap-1 mb-2">{['J','F','M','A','M','J','J','A','S','O','N','D'].map(m => <span key={m} className="text-[10px] text-center text-slate-400 font-bold">{m}</span>)}</div>
                {lifeStageNames.map((s) => (
                  <div key={s} className="grid grid-cols-12 gap-1 mb-1">
                    {currentLifeStageData[s.toLowerCase()].map((v, i) => (
                      <div key={i} className={`aspect-[1/0.5] ${getDensityColor(v)} rounded hover:ring-2 hover:ring-pest-green cursor-pointer transition-all`}
                        onMouseEnter={(e) => {
                          const r = e.currentTarget.getBoundingClientRect(); const c = e.currentTarget.closest('.relative').getBoundingClientRect();
                          setHeatmapTooltip({ stage: s === 'Egg' ? 'Eggs' : s, count: v, month: filteredData.pestData[i].monthFull, year: selectedYear, x: r.left - c.left + (r.width / 2), y: r.top - c.top });
                        }} onMouseLeave={() => setHeatmapTooltip(null)}></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-50 flex flex-wrap justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-50"></span> Very Low</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-200"></span> Low</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-400"></span> Medium</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-600"></span> High</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-700"></span> Very High</div>
            </div>

            {heatmapTooltip && (
              <div className="absolute z-30 bg-white p-4 rounded-xl shadow-2xl border border-slate-100 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 min-w-[220px]" style={{ left: heatmapTooltip.x, top: heatmapTooltip.y }}>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Life Stage</p>
                <p className="text-sm font-black text-pest-green">{heatmapTooltip.stage}</p>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 my-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Number of Pest per Hectare</p>
                  <p className="text-base font-black text-slate-800">{heatmapTooltip.count} {heatmapTooltip.stage}</p>
                </div>
                <p className="text-xs font-bold text-slate-600">{heatmapTooltip.month} {heatmapTooltip.year}</p>
              </div>
            )}
          </div>
          <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-50 flex flex-col justify-between">
            <div><h4 className="text-lg font-bold">High-Risks Areas</h4>
            <div className="space-y-6 mt-8">{highRiskAreas.map(a => (
                <div key={a.name}>
                  <div className="flex justify-between text-sm mb-1.5 font-bold"><span>{a.name}</span><span className="text-slate-400">{a.score}%</span></div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className={`${a.risk === 'Critical' ? 'bg-pest-red' : 'bg-pest-yellow'} h-full`} style={{ width: `${a.score}%` }}></div></div>
                </div>
              ))}</div></div>
            <button className="mt-8 w-full border border-pest-green text-pest-green py-3 rounded-xl font-bold">Launch Geospatial View</button>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl card-shadow border border-slate-50 flex items-center gap-8 hover:shadow-lg transition-shadow">
            <div className="relative w-56 h-56 flex-shrink-0">
              <canvas ref={doughnutChartRef} height="224" width="224"></canvas>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-3xl font-black">68%</span><span className="text-xs text-slate-400 font-bold">Healthy</span></div>
            </div>
            <div className="flex-grow">
              <h4 className="text-2xl font-bold mb-6">Corn Crop Health</h4>
              <div className="space-y-4 font-semibold text-sm">
                <div className="flex justify-between"><span>Healthy</span><span className="text-pest-green">68%</span></div>
                <div className="flex justify-between"><span>Infested</span><span className="text-pest-red">22%</span></div>
                <div className="flex justify-between"><span>Warning</span><span className="text-pest-yellow">10%</span></div>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-2xl card-shadow border border-slate-50">
            <h4 className="text-2xl font-bold mb-6">Top Corn Producers</h4>
            <div className="space-y-5">{[{ n: 'Batad', t: '54,560' }, { n: 'Cabatuan', t: '50,782' }, { n: 'Janiuay', t: '38,876' }].map(p => (
                <div key={p.n} className="flex justify-between py-2 border-b border-slate-50 font-medium"><span className="text-xl text-slate-700">{p.n}</span><span className="text-xl text-pest-green font-bold">{p.t} tons</span></div>
              ))}</div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .card-shadow { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .bg-dashboard-bg { background-color: #F9FAFB; }
        .bg-pest-green { background-color: #22C55E; }
        .bg-pest-yellow { background-color: #FACC15; }
        .bg-pest-red { background-color: #EF4444; }
        .bg-pest-blue { background-color: #38BDF8; }
        .text-pest-green { color: #22C55E; }
      `}</style>
    </div>
  );
};

export default Analytics;