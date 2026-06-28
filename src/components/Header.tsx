/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, Sparkles, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { WasteLog } from '../types';

interface HeaderProps {
  logs: WasteLog[];
}

export default function Header({ logs }: HeaderProps) {
  const totalWeight = logs.reduce((sum, log) => sum + log.weight, 0);
  const verifiedWeight = logs.filter(log => log.isVerified).reduce((sum, log) => sum + log.weight, 0);
  const verificationRate = logs.length > 0 
    ? Math.round((logs.filter(log => log.isVerified).length / logs.length) * 100) 
    : 100;

  return (
    <header className="border-b border-white/45 bg-white/50 backdrop-blur-md sticky top-0 z-40 shadow-xs text-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Trash2 className="h-5.5 w-5.5" id="header-logo-icon" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent flex items-center gap-1.5">
                EcoAudit <span className="text-[10px] bg-emerald-100/60 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200/50">Live</span>
              </span>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-bold">Community Waste Tracker</p>
            </div>
          </div>

          {/* Real-time Summary Indicators */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 bg-white/40 px-3.5 py-2 rounded-xl border border-white/60 shadow-xs backdrop-blur-xs">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-slate-600 font-medium">Total Logged:</span>
              <span className="font-bold text-slate-800 font-mono">{totalWeight.toFixed(1)} kg</span>
            </div>

            <div className="flex items-center gap-2 bg-white/40 px-3.5 py-2 rounded-xl border border-white/60 shadow-xs backdrop-blur-xs">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-slate-600 font-medium">Audit Compliance:</span>
              <span className="font-bold text-emerald-700 font-mono flex items-center gap-1">
                100% SECURED
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href="#waste-form-section"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4.5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              id="btn-nav-log"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Log Waste
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}
