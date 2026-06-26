/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Layers, 
  TrendingUp,
  Image as ImageIcon,
  Compass,
  ArrowRight,
  X
} from 'lucide-react';
import { WasteCategory, WasteLog } from '../types';

interface DashboardProps {
  logs: WasteLog[];
  selectedLog: WasteLog | null;
  onSelectLog: (log: WasteLog | null) => void;
}

const CATEGORIES: WasteCategory[] = ['Plastic', 'E-Waste', 'Organic', 'Paper', 'Metal', 'Glass', 'Other'];

const CATEGORY_COLORS: Record<WasteCategory, string> = {
  'Plastic': '#0284c7', // sky-600
  'E-Waste': '#4f46e5', // indigo-600
  'Organic': '#059669', // emerald-600
  'Paper': '#d97706',  // amber-600
  'Metal': '#475569',  // slate-600
  'Glass': '#0891b2',  // cyan-600
  'Other': '#7c3aed',  // purple-600
};

const CATEGORY_EMOJIS: Record<WasteCategory, string> = {
  'Plastic': '🥤',
  'E-Waste': '💻',
  'Organic': '🍎',
  'Paper': '📦',
  'Metal': '🥫',
  'Glass': '🍾',
  'Other': '🏷️'
};

export default function Dashboard({ logs, selectedLog, onSelectLog }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [verificationFilter, setVerificationFilter] = useState<string>('All');
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // --- 1. Aggregated Metrics Calculation (MVP Requirement) ---
  const totalWeight = logs.reduce((sum, log) => sum + log.weight, 0);
  
  // Specific Category Totals (e.g. E-Waste specifically required)
  const eWasteTotal = logs
    .filter(log => log.category === 'E-Waste')
    .reduce((sum, log) => sum + log.weight, 0);

  const plasticTotal = logs
    .filter(log => log.category === 'Plastic')
    .reduce((sum, log) => sum + log.weight, 0);

  const organicTotal = logs
    .filter(log => log.category === 'Organic')
    .reduce((sum, log) => sum + log.weight, 0);

  // Anti-fraud analytics
  const verifiedCount = logs.filter(log => log.isVerified).length;
  const totalCount = logs.length;
  const complianceRate = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 100;

  // --- 2. Chart Data Construction ---
  const categoryChartData = CATEGORIES.map(cat => {
    const total = logs
      .filter(log => log.category === cat)
      .reduce((sum, log) => sum + log.weight, 0);
    return {
      name: cat,
      weight: parseFloat(total.toFixed(2)),
      color: CATEGORY_COLORS[cat]
    };
  }).filter(data => data.weight > 0);

  // If no logs, show some placeholders for the charts
  const hasChartData = categoryChartData.length > 0;

  // --- 3. Filter and Search Logic ---
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      (log.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (log.reporterName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;
    
    const matchesVerification = 
      verificationFilter === 'All' || 
      (verificationFilter === 'Verified' && log.isVerified) || 
      (verificationFilter === 'Unverified' && !log.isVerified);

    return matchesSearch && matchesCategory && matchesVerification;
  });

  return (
    <div className="space-y-6">
      
      {/* 4. METRICS ROW (Live Totaling & Compliance Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Overall Waste Weight */}
        <div className="bg-white/75 backdrop-blur-xl rounded-3xl border border-white/60 p-5 shadow-xl shadow-emerald-950/10">
          <span className="text-slate-600 text-xs font-bold tracking-wider uppercase font-sans">
            Total Waste Logged
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-950 font-mono tracking-tight">
              {totalWeight.toFixed(1)}
            </span>
            <span className="text-sm font-extrabold text-slate-600 font-sans">kg</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-2 font-mono uppercase tracking-wider">
            Across {totalCount} total cleanups
          </p>
        </div>

        {/* Card 2: E-Waste Live Totaling (Explicit MVP Metric requirement!) */}
        <div className="bg-white/75 backdrop-blur-xl rounded-3xl border border-white/60 p-5 shadow-xl shadow-emerald-950/10">
          <span className="text-slate-600 text-xs font-bold tracking-wider uppercase font-sans flex items-center gap-1">
            💻 E-Waste Logged
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold text-indigo-700 font-mono tracking-tight">
              {eWasteTotal.toFixed(1)}
            </span>
            <span className="text-sm font-extrabold text-slate-600 font-sans">kg</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-2 font-mono uppercase tracking-wider">
            Critical e-disposal streams
          </p>
        </div>

        {/* Card 3: Organic Waste Weight */}
        <div className="bg-white/75 backdrop-blur-xl rounded-3xl border border-white/60 p-5 shadow-xl shadow-emerald-950/10">
          <span className="text-slate-600 text-xs font-bold tracking-wider uppercase font-sans flex items-center gap-1">
            🍎 Organic Logged
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold text-emerald-700 font-mono tracking-tight">
              {organicTotal.toFixed(1)}
            </span>
            <span className="text-sm font-extrabold text-slate-600 font-sans">kg</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-2 font-mono uppercase tracking-wider">
            Composted & reclaimed bio
          </p>
        </div>

        {/* Card 4: Anti-Fraud Compliance (Verification Rate) */}
        <div className="bg-white/75 backdrop-blur-xl rounded-3xl border border-white/60 p-5 shadow-xl shadow-emerald-950/10">
          <span className="text-slate-600 text-xs font-bold tracking-wider uppercase font-sans flex items-center gap-1">
            🛰️ Verification Compliance
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl md:text-3xl font-extrabold font-mono tracking-tight ${
              complianceRate >= 80 ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {complianceRate}%
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
            <span>{verifiedCount} of {totalCount} verified GPS</span>
          </div>
        </div>

      </div>

      {/* 5. VISUALIZATIONS SECTION */}
      {hasChartData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Bar Chart: Weight breakdown by category */}
          <div className="bg-white/75 backdrop-blur-xl rounded-3xl border border-white/60 p-6 md:col-span-2 shadow-xl shadow-emerald-950/10">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Waste Distribution Metrics (kg)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.2)' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px 0 rgba(16, 185, 129, 0.05)' }}
                    formatter={(value: any) => [`${value} kg`, 'Logged Weight']}
                  />
                  <Bar dataKey="weight" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mini Pie Chart: Verification streams */}
          <div className="bg-white/75 backdrop-blur-xl rounded-3xl border border-white/60 p-6 shadow-xl shadow-emerald-950/10 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-indigo-600" />
                Ledger Veracity
              </h3>
              <p className="text-xs text-slate-600 font-semibold">Comparing anti-fraud telemetry vs. manual override entries.</p>
            </div>
            
            <div className="h-40 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Verified', value: verifiedCount, color: '#10b981' },
                      { name: 'Manual Override', value: totalCount - verifiedCount, color: '#f43f5e' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold text-slate-900 font-mono">{complianceRate}%</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Audit Ok</span>
              </div>
            </div>

            <div className="border-t border-white/20 pt-3 flex justify-around text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 font-medium">Verified: <strong className="text-slate-800 font-mono">{verifiedCount}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                <span className="text-slate-600 font-medium">Override: <strong className="text-slate-800 font-mono">{totalCount - verifiedCount}</strong></span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white/20 backdrop-blur-md border border-dashed border-white/40 rounded-3xl p-8 text-center">
          <Layers className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-800">No Analytics Available</h4>
          <p className="text-xs text-slate-500 mt-0.5">Start logging waste entries above to populate live graphs and stats.</p>
        </div>
      )}

      {/* 6. WASTE LEDGER & AUDIT FEEDS (MVP Requirement) */}
      <div className="bg-white/75 backdrop-blur-xl rounded-3xl border border-white/60 overflow-hidden shadow-xl shadow-emerald-950/10">
        
        {/* Header and Filter Controls */}
        <div className="p-6 border-b border-white/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Community Waste Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time ledger audit entries detailing verified weights and locations.</p>
            </div>
            
            <div className="text-xs font-mono bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-slate-500 flex items-center gap-1.5">
              <span>LEDGER COUNT:</span>
              <strong className="text-slate-900 font-semibold">{filteredLogs.length} entries</strong>
            </div>
          </div>

          {/* Search, Filter Category, Filter Verification Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes or reporter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-white/30 bg-white/50 pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white/80 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 backdrop-blur-md"
              />
            </div>

            {/* Category selection */}
            <div className="relative">
              <Filter className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-white/30 bg-white/50 pl-10 pr-4 py-2 text-xs text-slate-700 appearance-none bg-white/50 focus:bg-white/80 focus:outline-none focus:border-emerald-500 backdrop-blur-md"
              >
                <option value="All">Filter Category: All</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Verification filter */}
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-full rounded-xl border border-white/30 bg-white/50 pl-10 pr-4 py-2 text-xs text-slate-700 appearance-none bg-white/50 focus:bg-white/80 focus:outline-none focus:border-emerald-500 backdrop-blur-md"
              >
                <option value="All">Filter Audit: All</option>
                <option value="Verified">Verified GPS Only</option>
                <option value="Unverified">Manual Overrides Only</option>
              </select>
            </div>

          </div>
        </div>

        {/* Ledger Entries List */}
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-white/20 max-h-[500px] overflow-y-auto">
            {filteredLogs.map((log) => {
              const isSelected = selectedLog?.id === log.id;
              
              return (
                <div 
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  className={`p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/30 ${
                    isSelected ? 'bg-emerald-50/20 backdrop-blur-md border-l-4 border-l-emerald-500' : ''
                  }`}
                  id={`log-item-${log.id}`}
                >
                  
                  {/* Left Column: Category, Weight, Notes, Sub-items */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    
                    {/* Visual Category Badge/Indicator */}
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl">
                      {CATEGORY_EMOJIS[log.category] || '🏷️'}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      
                      {/* Weight and Category Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-950 text-sm">
                          {log.category}
                        </span>
                        <span className="font-semibold text-slate-600 font-mono text-xs bg-slate-100 border border-slate-100 px-2 py-0.5 rounded-md">
                          {log.weight.toFixed(2)} kg
                        </span>
                        
                        {/* Anti-Fraud Validation Badge */}
                        {log.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/80 px-2 py-0.5 rounded-md">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verified Telemetry
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100/80 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Manual Override
                          </span>
                        )}
                      </div>

                      {/* Notes & Reporter */}
                      <p className="text-xs text-slate-600 line-clamp-2 italic pr-2">
                        "{log.notes || 'No custom notes provided for this audit entry.'}"
                      </p>

                      {/* Meta Footer */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1 font-sans">
                          <User className="h-3 w-3 text-slate-400" />
                          By {log.reporterName || 'Anonymous'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 font-sans">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Right Column: Photo Proof (Bonus) & Geolocation Telemetry coordinates (MVP Requirement) */}
                  <div className="flex sm:items-center justify-between md:justify-end gap-4 shrink-0">
                    
                    {/* Geolocation Coordinates (Highly visible in monospace style) */}
                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans mb-0.5">
                        Audit Coordinates
                      </span>
                      {log.latitude !== null && log.longitude !== null ? (
                        <div className="text-xs font-semibold text-slate-700 font-mono flex flex-col items-end gap-0.5 bg-white/50 border border-white/40 p-1.5 rounded-lg shadow-xs backdrop-blur-sm">
                          <span>LAT: {log.latitude.toFixed(5)}°</span>
                          <span>LNG: {log.longitude.toFixed(5)}°</span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-rose-500 font-mono uppercase bg-rose-50 px-2 py-1 rounded-md">
                          Null Coordinates
                        </span>
                      )}
                    </div>

                    {/* Image Thumbnail Preview (Proof of Disposal) */}
                    {log.imagePath && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation(); // Avoid triggering map centering
                          setActivePhoto(log.imagePath || null);
                        }}
                        className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100 cursor-zoom-in group shadow-xs"
                      >
                        <img 
                          src={log.imagePath} 
                          alt="Proof of Disposal" 
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <ImageIcon className="h-3 w-3" />
                        </div>
                      </div>
                    )}

                    {/* interactive guidance to center map */}
                    <div className="hidden lg:flex items-center justify-center h-8 w-8 rounded-full border border-slate-100 text-slate-400 group-hover:bg-slate-100 group-hover:text-emerald-600 transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50/50">
            <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2.5" />
            <h4 className="text-sm font-semibold text-slate-800">No matching ledger entries found</h4>
            <p className="text-xs text-slate-400 mt-1">Adjust search parameters or select a different category filter to query details.</p>
          </div>
        )}

      </div>

      {/* Image Modal Lightbox overlay */}
      {activePhoto && (
        <div 
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div className="relative max-w-2xl w-full bg-white/80 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/40 shadow-2xl">
            <img 
              src={activePhoto} 
              alt="Disposal Proof Enlarged" 
              className="w-full max-h-[70vh] object-contain bg-slate-900"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="h-9 w-9 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white shadow-sm transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 border-t border-white/20 bg-white/65 text-xs font-semibold text-slate-600 font-mono uppercase tracking-wider text-center">
              🛰️ Verified Proof of Disposal Document Entry
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
