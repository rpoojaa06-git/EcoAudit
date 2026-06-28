/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { WasteLog } from '../types';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface WasteMapProps {
  logs: WasteLog[];
  selectedLog: WasteLog | null;
  onSelectLog: (log: WasteLog | null) => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Plastic': '🥤',
  'E-Waste': '💻',
  'Organic': '🍎',
  'Paper': '📦',
  'Metal': '🥫',
  'Glass': '🍾',
  'Other': '🏷️'
};

export default function WasteMap({ logs, selectedLog, onSelectLog }: WasteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const markerClusterGroupRef = useRef<L.LayerGroup | null>(null);

  // Helper to get category emoji
  const getEmoji = (cat: string) => CATEGORY_EMOJIS[cat] || '🏷️';

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default starting point (India center)
    const startLat = 20.5937;
    const startLng = 78.9629;
    const startZoom = 5;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: startZoom,
      zoomControl: false, // Custom position later
      layers: []
    });

    // Add clean minimal map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Add zoom controls at the bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // Save map reference
    mapRef.current = map;

    // Create marker layer group
    const markerGroup = L.layerGroup().addTo(map);
    markerClusterGroupRef.current = markerGroup;

    // Handle map clicks to close active selection
    map.on('click', () => {
      onSelectLog(null);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers when logs change
  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markerClusterGroupRef.current;
    if (!map || !markerGroup) return;

    // Clear old markers from map and tracking ref
    markerGroup.clearLayers();
    markersRef.current = {};

    logs.forEach((log) => {
      if (log.latitude === null || log.longitude === null) return;

      const emoji = getEmoji(log.category);
      const color = '#10b981';
      const shadowColor = 'rgba(16, 185, 129, 0.15)';

      // Gorgeous Custom SVG DivIcon (solves Leaflet default asset-loading path bug!)
      const customIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center group">
            <span class="absolute inline-flex h-9 w-9 rounded-full bg-emerald-400/25 animate-pulse" style="background-color: ${shadowColor};"></span>
            <div class="relative flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 text-md shadow-md hover:scale-110 transition-transform cursor-pointer" style="border-color: ${color};">
              <span>${emoji}</span>
            </div>
            <div class="absolute -bottom-1 h-2 w-2 rotate-45 border-r border-b" style="background-color: ${color}; border-color: ${color};"></div>
          </div>
        `,
        className: 'custom-leaflet-marker-wrapper',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      // Construct elegant custom popup body HTML
      const popupHtml = `
        <div class="p-1 font-sans text-slate-800 max-w-[240px]">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xl">${emoji}</span>
            <div>
              <h4 class="font-bold text-sm text-slate-900">${log.category} Waste</h4>
              <p class="text-xs text-slate-400 font-mono">${log.weight.toFixed(2)} kg</p>
            </div>
          </div>
          
          ${log.imagePath ? `
            <div class="my-2 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
              <img src="${log.imagePath}" alt="Waste Proof" class="w-full h-24 object-cover" referrerpolicy="no-referrer" />
            </div>
          ` : ''}

          <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span class="text-slate-500 font-mono">${new Date(log.timestamp).toLocaleDateString()}</span>
            <span class="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
              ● Verified GPS
            </span>
          </div>
          
          <p class="text-[11px] text-slate-500 italic mt-1.5 line-clamp-2">
            "${log.notes || 'No disposal notes registered.'}"
          </p>
        </div>
      `;

      // Create Leaflet Marker
      const marker = L.marker([log.latitude, log.longitude], { icon: customIcon })
        .bindPopup(popupHtml, {
          closeButton: false,
          maxWidth: 250,
          className: 'custom-leaflet-popup'
        })
        .addTo(markerGroup);

      // Handle marker click
      marker.on('click', () => {
        onSelectLog(log);
      });

      // Store reference
      markersRef.current[log.id] = marker;
    });

  }, [logs]);

  // Handle flyTo when a log is selected from the dashboard list
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLog || selectedLog.latitude === null || selectedLog.longitude === null) return;

    // Fly smoothly to coordinates
    map.flyTo([selectedLog.latitude, selectedLog.longitude], 16, {
      duration: 1.5,
      easeLinearity: 0.25
    });

    // Open associated popup
    const marker = markersRef.current[selectedLog.id];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 350);
    }
  }, [selectedLog]);

  return (
    <div className="relative h-full w-full min-h-[350px] lg:min-h-0 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
      
      {/* Map Container Element */}
      <div ref={mapContainerRef} className="h-full w-full z-10" id="leaflet-waste-map" />

      {/* Floating Status / Legenda overlay */}
      <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-100/80 shadow-sm text-xs font-sans max-w-xs">
        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
          <span>📍 Community Ledger Map</span>
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-600 font-medium">Verified Coordinates (Anti-Fraud)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
