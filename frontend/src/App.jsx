import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Activity, Camera, AlertTriangle, ShieldCheck,
  RefreshCw, Settings2, Sparkles, Server, Zap
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001' || 'https://microplatic-detector-in-water.onrender.com/';

function App() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const [pulseLine, setPulseLine] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/history?limit=100`);
      if (res.ok) {
        const data = await res.json();
        // Check if there's new data to trigger a pulse animation
        if (history.length > 0 && data.length > 0 && data[0].id !== history[0].id) {
          setPulseLine(true);
          setTimeout(() => setPulseLine(false), 1000);
        }
        setHistory(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    let intervalId;
    if (isLive) {
      intervalId = setInterval(fetchHistory, 3000);
    }
    return () => clearInterval(intervalId);
  }, [isLive]);

  const latestReading = history.length > 0 ? history[0] : null;

  const chartData = [...history].reverse().map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    percentage: parseFloat(item.percentage.toFixed(2)),
    isHigh: item.percentage > 5.0
  }));

  const getStatusConfig = (percentage) => {
    if (percentage > 5.0) return {
      color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]',
      text: 'Critical Concentration', icon: <AlertTriangle className="text-rose-500 w-8 h-8 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
    };
    if (percentage > 1.0) return {
      color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
      text: 'Moderate Presence', icon: <Activity className="text-amber-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
    };
    return {
      color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', glow: 'shadow-[0_0_30px_rgba(52,211,153,0.2)]',
      text: 'Baseline Normal', icon: <ShieldCheck className="text-emerald-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
    };
  };

  const status = latestReading ? getStatusConfig(latestReading.percentage) : null;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-50 font-sans relative overflow-x-hidden selection:bg-cyan-500/30">

      {/* Background FX */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0 mix-blend-screen mix-blend-overlay"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/40 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 h-full">

        {/* HEADER */}
        <header className="glass-panel px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-6 sticky top-4 z-50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/40">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 animate-ping opacity-75"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                AQUA<span className="text-cyan-400 font-light tracking-widest">SENSE</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 ml-2">PRO</span>
              </h1>
              <p className="text-slate-400 text-sm mt-0.5 tracking-wide flex items-center gap-2">
                <Server className="w-3 h-3" /> UV Microplastics Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-2xl border border-white/5">
            <div className="px-4 py-2 flex items-center gap-2 border-r border-white/10">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-cyan-500 shadow-[0_0_8px_#06b6d4] animate-pulse' : 'bg-slate-600'}`}></div>
              <span className="text-sm font-medium text-slate-300 select-none">
                {isLive ? 'LIVE STREAM' : 'PAUSED'}
              </span>
            </div>
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${isLive
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95'
                : 'bg-cyan-500 text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:bg-cyan-400 active:scale-95'
                }`}
            >
              {isLive ? 'STOP' : 'RESUME'}
            </button>
            <button
              onClick={fetchHistory}
              className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors active:scale-95 ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </header>

        {loading && history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-blue-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              <div className="absolute inset-4 rounded-full border-b-2 border-indigo-500 animate-spin" style={{ animationDuration: '2s' }}></div>
              <Sparkles className="absolute inset-0 m-auto text-cyan-400 animate-pulse w-6 h-6" />
            </div>
            <p className="text-cyan-400 font-mono tracking-widest text-sm animate-pulse">ESTABLISHING UPLINK...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="glass-panel p-16 text-center max-w-2xl mx-auto mt-20 border-dashed border-2 border-slate-700">
            <div className="w-24 h-24 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700 shadow-inner">
              <Camera className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Awaiting Optical Input</h3>
            <p className="text-slate-400 pb-6">The telemetry database is currently empty. Ensure the Raspberry Pi hardware is calibrated and transmitting to <code className="bg-black py-1 px-2 rounded text-cyan-400 text-sm border border-cyan-900/30">{API_BASE_URL}/upload</code></p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* LEFT COLUMN: LIVE FEED (Spans 8 cols on large screens) */}
            <div className="xl:col-span-8 flex flex-col gap-6">

              {/* Camera Feed Card */}
              <div className="glass-panel overflow-hidden group/card relative">
                {/* Glowing border effect on update */}
                <div className={`absolute inset-0 border-2 border-cyan-400/50 rounded-3xl transition-opacity duration-1000 z-20 pointer-events-none ${pulseLine ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}></div>

                <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Camera className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="font-semibold text-white tracking-wide">Optical Sensor Node 01</h2>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 flex items-center gap-2">
                      {latestReading?.original_filename ? latestReading.original_filename.split('.')[0] : 'UNKNOWN_FRAME'}
                    </span>
                    <button className="text-slate-500 hover:text-white transition-colors">
                      <Settings2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 bg-black/50 p-6 gap-6 relative">
                  {/* Decorative corner brackets */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-700 pointer-events-none"></div>
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-700 pointer-events-none"></div>
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-700 pointer-events-none"></div>
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-700 pointer-events-none"></div>

                  {/* Raw Input */}
                  <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
                    <img
                      src={`${API_BASE_URL}${latestReading.original_image}`}
                      alt="Raw UV Feed"
                      className="w-full h-full object-contain filter contrast-[1.1] brightness-[0.9]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                    <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-white/10 shadow-lg">
                      <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                      <span className="text-[10px] font-mono text-slate-300 tracking-wider">365nm IN</span>
                    </div>
                  </div>

                  {/* Processed Output */}
                  <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 ring-1 ring-cyan-500/30 group">
                    {/* Fake scanner line */}
                    {isLive && <div className="scanner-line"></div>}
                    <img
                      src={`${API_BASE_URL}${latestReading.detected_image}`}
                      alt="Detection Overlay"
                      className="w-full h-full object-contain filter contrast-[1.2]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none"></div>

                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                      <div className="bg-black/80 backdrop-blur-xl border border-cyan-500/30 px-4 py-2 rounded-lg flex items-center gap-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span className="text-xs font-mono tracking-widest text-cyan-50">CV CORE OUT</span>
                      </div>
                      <div className={`font-mono text-2xl font-bold bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border flex items-center ${status.color} ${status.border} shadow-2xl`}>
                        {latestReading.percentage.toFixed(2)}<span className="text-sm opacity-50 ml-1">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Activity */}
              <div className="glass-panel p-6 flex-1 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex justify-between items-end mb-6 z-10">
                  <div>
                    <h2 className="font-semibold text-white tracking-wide flex items-center gap-2">
                      Telemetry Trends
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Real-time volumetric plot</p>
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[300px] z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        stroke="#475569"
                        fontSize={11}
                        tickMargin={12}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={40}
                      />
                      <YAxis
                        stroke="#475569"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          backdropFilter: 'blur(12px)',
                          borderColor: 'rgba(56, 189, 248, 0.3)',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                        }}
                        itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
                        formatter={(value) => [`${value}%`, 'Volume']}
                        labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                      />
                      <ReferenceLine y={5.0} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.5} />
                      <Area
                        type="monotone"
                        dataKey="percentage"
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorGradient)"
                        animationDuration={1500}
                        animationEasing="ease-out"
                        activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2, shadow: '0 0 10px #06b6d4' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: METRICS & LOGS (Spans 4 cols on large screens) */}
            <div className="xl:col-span-4 flex flex-col gap-6">

              {/* Primary Metric Hero Card */}
              <div className={`glass-panel p-8 relative overflow-hidden transition-all duration-500 ${status.glow} border ${status.border} bg-gradient-to-br from-slate-900 via-black to-slate-900`}>
                {/* Background glow behind text */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full opacity-20 blur-[60px] ${status.bg.replace('/10', '')} pointer-events-none`}></div>

                <h2 className="text-sm font-semibold text-slate-400 tracking-[0.2em] uppercase mb-8 relative z-10 flex items-center justify-between">
                  Current Density
                  {status.icon}
                </h2>

                <div className="relative z-10 mb-6 flex flex-col items-center">
                  <div className={`text-7xl font-bold tracking-tighter ${status.color} drop-shadow-xl tabular-nums leading-none`}>
                    {latestReading.percentage.toFixed(3)}<span className="text-4xl opacity-50 ml-1">%</span>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl ${status.bg} border ${status.border} relative z-10 backdrop-blur-md`}>
                  <div className={`text-lg font-bold ${status.color} mb-1`}>
                    {status.text}
                  </div>
                  <div className="text-sm text-slate-400 leading-relaxed">
                    Volumetric inference computed from 365nm fluorescent signatures.
                  </div>
                </div>
              </div>

              {/* Historical Log */}
              <div className="glass-panel overflow-hidden flex flex-col flex-1 max-h-[600px] lg:max-h-none h-full">
                <div className="p-5 border-b border-white/5 bg-white/5">
                  <h2 className="font-semibold text-white tracking-wide">Data Matrix</h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md text-[10px] uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold w-1/2">Timestamp (Local)</th>
                        <th className="px-5 py-3 font-semibold text-right">Concentration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {history.map((item, idx) => {
                        const rowConfig = getStatusConfig(item.percentage);
                        return (
                          <tr key={item.id} className={`group hover:bg-white/5 transition-colors ${idx === 0 ? 'bg-cyan-500/5' : ''}`}>
                            <td className="px-5 py-4">
                              <div className="font-mono text-xs text-slate-300 group-hover:text-white transition-colors">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </div>
                              <div className="text-[10px] font-mono text-slate-600 mt-1 uppercase">
                                Frame {item.id}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border ${rowConfig.border} ${rowConfig.bg} ${rowConfig.color}`}>
                                {item.percentage.toFixed(3)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
