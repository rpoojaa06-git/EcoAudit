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
      
      // Auto-select the newly added entry to trigger map camera pan
      setSelectedLog(newLog);
    } catch (err: any) {
      console.error('Error adding log:', err);
      throw new Error(err.message || 'Network submission failure.');
    }
  };

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

        {/* 2. Responsive Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column A (Left): Logger Panel - Taking 1/3 layout (lg:col-span-4) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* The main waste log entry form */}
            <WasteForm onAddLog={handleAddLog} />

            {/* Quick guide card with elegant Frosted Glass design */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 p-5 shadow-xl shadow-emerald-950/10">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                Audit compliance protocols
              </h4>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed list-disc list-inside">
                <li>
                  <strong className="text-slate-800">Native Telemetry Verification:</strong> Submit entries via browser location permissions to obtain an <span className="text-emerald-700 font-bold">Approved</span> stamp.
                </li>
                <li>
                  <strong className="text-slate-800">Anti-Spoofing:</strong> Coordinate validation occurs instantly on submit. Manual changes are marked as <span className="text-rose-600 font-bold">Unverified</span>.
                </li>
                <li>
                  <strong className="text-slate-800">Visual Auditing:</strong> Uploading image proofs allows administrators to verify waste stream classifications.
                </li>
              </ul>
            </div>

          </div>

          {/* Column B (Right): Map and dashboard - Taking 2/3 layout (lg:col-span-8) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Map Frame Card - Frosted Glass */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 p-4 shadow-xl shadow-emerald-950/10">
              <div className="h-[350px] sm:h-[400px] lg:h-[420px]">
                <WasteMap 
                  logs={logs} 
                  selectedLog={selectedLog} 
                  onSelectLog={setSelectedLog} 
                />
              </div>
            </div>

            {/* Loader indicator while fetching logs database on startup */}
            {isLoading ? (
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 p-12 text-center shadow-xl shadow-emerald-950/10">
                <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-800">Synchronizing Ledger Data</h4>
                <p className="text-xs text-slate-400 mt-0.5">Contacting database node and fetching audits...</p>
              </div>
            ) : (
              /* Main Stats and list dashboard */
              <Dashboard 
                logs={logs} 
                selectedLog={selectedLog} 
                onSelectLog={setSelectedLog} 
              />
            )}

          </div>

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
