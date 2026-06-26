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
    <header className="border-b border-white/20 bg-white/30 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <Trash2 className="h-5.5 w-5.5" id="header-logo-icon" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-sky-700 bg-clip-text text-transparent flex items-center gap-1.5">
                EcoAudit <span className="text-[10px] bg-emerald-100/50 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200/50">Live</span>
              </span>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-semibold">Community Waste Tracker</p>
            </div>
          </div>

          {/* Real-time Summary Indicators */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 bg-white/50 px-3.5 py-2 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-slate-600 font-medium">Total Logged:</span>
              <span className="font-semibold text-slate-800 font-mono">{totalWeight.toFixed(1)} kg</span>
            </div>

            <div className="flex items-center gap-2 bg-white/50 px-3.5 py-2 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-slate-600 font-medium">Audit Compliance:</span>
              <span className={`font-semibold font-mono flex items-center gap-1 ${
                verificationRate >= 80 ? 'text-emerald-700' : verificationRate >= 50 ? 'text-amber-700' : 'text-rose-700'
              }`}>
                {verificationRate}%
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href="#waste-form-section"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
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
