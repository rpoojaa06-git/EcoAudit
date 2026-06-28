/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Header from './components/Header';
import WasteForm from './components/WasteForm';
import WasteMap from './components/WasteMap';
import Dashboard from './components/Dashboard';
import { WasteLog, WasteCategory } from './types';
import { ShieldCheck, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  const [logs, setLogs] = useState<WasteLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<WasteLog | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Track only the entry IDs that the current user logged in their browser
  const [myLoggedIds, setMyLoggedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ecoaudit_my_logged_ids');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // --- Fetch Logs from the Database (Express Server) ---
  const fetchLogs = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await fetch('/api/logs');
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }
      const data = await response.json();
      setLogs(data);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError('Could not connect to the remote waste database. Please verify the server is active.');
    } finally {
      if (showLoadingSpinner) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // Initial fetch with loading spinner
    fetchLogs(true);

    // Set up continuous automatic background polling to sync in real-time
    const interval = setInterval(() => {
      fetchLogs(false);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // --- Add a Waste Log Entry (Save to Server Database) ---
  const handleAddLog = async (logData: {
    category: WasteCategory;
    weight: number;
    latitude: number | null;
    longitude: number | null;
    isVerified: boolean;
    locationError?: string;
    image?: string; // base64 payload
    notes?: string;
    reporterName?: string;
  }) => {
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const newLog = await response.json();
      
      // Update local state by putting the newest entry first
      setLogs((prevLogs) => [newLog, ...prevLogs]);

      // Save user's logged entry ID to local state & localStorage
      setMyLoggedIds((prev) => {
        const updated = [...prev, newLog.id];
        try {
          localStorage.setItem('ecoaudit_my_logged_ids', JSON.stringify(updated));
        } catch (e) {
          console.warn('Unable to write to localStorage:', e);
        }
        return updated;
      });
      
      // Auto-select the newly added entry to trigger map camera pan
      setSelectedLog(newLog);
    } catch (err: any) {
      console.error('Error adding log:', err);
      throw new Error(err.message || 'Network submission failure.');
    }
  };

  // Only show pins on the map that the user has submitted
  const mapLogs = logs.filter(log => myLoggedIds.includes(log.id));

  return (
    <div 
      className="min-h-screen text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900"
      style={{ background: 'radial-gradient(circle at top left, #bbf7d0 0%, #f0fdf4 45%, #bae6fd 100%)' }}
    >
      
      {/* 1. Navbar Header with live totals */}
      <Header logs={logs} />

      {/* Main Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Connection status warning */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50/60 backdrop-blur-md border border-rose-100/80 text-rose-800 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchLogs(true)}
              className="inline-flex items-center gap-1 bg-white/75 hover:bg-slate-50 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200/50 text-xs font-bold shadow-xs cursor-pointer transition-colors shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Connection
            </button>
          </div>
        )}

        {/* 2. Structured Sections with Strong Visual Hierarchy */}
        <div className="space-y-16">
          
          {/* SECTION 1 – WASTE SUBMISSION (Primary Action) */}
          <section className="max-w-3xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Verify & Publish Waste Log
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-lg mx-auto">
                Submit waste weights, classifications, and image proof to our secure ledger. Entries require geolocation verification.
              </p>
            </div>

            {/* The main waste log entry form */}
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-1 border border-white/30 shadow-xl shadow-emerald-950/5">
              <WasteForm onAddLog={handleAddLog} />
            </div>
          </section>

          {/* SECTION 2 – COMMUNITY AUDIT DASHBOARD */}
          <section className="pt-12 border-t border-slate-200/50 space-y-8">
            <div className="text-center lg:text-left flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center lg:justify-start gap-2.5">
                  <Layers className="h-6 w-6 text-emerald-600 animate-pulse" />
                  Community Audit Dashboard
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Interactive spatial logs, real-time metrics, analytics distribution, and audited community ledger.
                </p>
              </div>

              {/* Quick indicators */}
              <div className="flex justify-center gap-3 text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1 bg-white/65 px-2.5 py-1 rounded-md border border-white/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE METRICS ACTIVE
                </span>
                <span className="flex items-center gap-1 bg-white/65 px-2.5 py-1 rounded-md border border-white/40">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  100% GPS SECURED
                </span>
              </div>
            </div>

            {/* Interactive map showing all logged locations & quick guide side-by-side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Left Column: Leaflet Interactive Map */}
              <div className="lg:col-span-8 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 p-4 shadow-xl shadow-emerald-950/10 flex flex-col justify-between">
                <div className="h-[380px] sm:h-[420px] lg:h-[450px] w-full rounded-2xl overflow-hidden">
                  <WasteMap 
                    logs={mapLogs} 
                    selectedLog={selectedLog} 
                    onSelectLog={setSelectedLog} 
                  />
                </div>
              </div>

              {/* Right Column: Protocols Quick Guide Widget & live ledger highlight */}
              <div className="lg:col-span-4 flex flex-col justify-between gap-6">
                
                {/* Audit Protocols widget */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 p-6 shadow-xl shadow-emerald-950/10 flex-1 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                    Ledger Audit Protocols
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-3.5 leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="h-4 w-4 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                      <div>
                        <strong className="text-slate-800">Browser Position Check:</strong>
                        <p className="text-slate-500 mt-0.5">Saves active latitude & longitude directly to our transparent ledger.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="h-4 w-4 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                      <div>
                        <strong className="text-slate-800">No Manual Override:</strong>
                        <p className="text-slate-500 mt-0.5">Disabling manual location coordinates ensures absolute spoof-proof integrity.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="h-4 w-4 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                      <div>
                        <strong className="text-slate-800">Image Verification:</strong>
                        <p className="text-slate-500 mt-0.5">Proof-of-disposal uploads allow community members to visually audit entries.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Micro info panel */}
                <div className="bg-emerald-950 text-emerald-100 p-6 rounded-3xl shadow-xl shadow-emerald-950/15 space-y-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase font-mono text-emerald-400">Live Dashboard Stream</span>
                  <p className="text-xs text-emerald-200/80 leading-relaxed">
                    
                    Every waste weight, photo proof, and timestamp logged here is immediately accessible on the open public audit table below.
                  </p>
                </div>

              </div>

            </div>

            {/* Dashboard Live Metrics, Charts and Ledger Streams */}
            {isLoading ? (
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 p-12 text-center shadow-xl shadow-emerald-950/10">
                <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-800">Synchronizing Ledger Data</h4>
                <p className="text-xs text-slate-400 mt-0.5">Contacting database node and fetching audits...</p>
              </div>
            ) : (
              <Dashboard 
                logs={logs} 
                selectedLog={selectedLog} 
                onSelectLog={setSelectedLog} 
              />
            )}

          </section>

        </div>

      </main>

      {/* Humble Footer */}
      <footer className="border-t border-white/20 bg-white/20 backdrop-blur-sm py-6 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 space-y-1">
          <p>© 2026 EcoAudit Community Waste Ledger. Built with Express + React + Leaflet.</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-300">Secured with Auto-Verified Satellite Positioning Telemetry</p>
        </div>
      </footer>

    </div>
  );
}
