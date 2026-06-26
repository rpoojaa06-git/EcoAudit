/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WasteCategory = 'Plastic' | 'E-Waste' | 'Organic' | 'Paper' | 'Metal' | 'Glass' | 'Other';

export interface WasteLog {
  id: string;
  category: WasteCategory;
  weight: number; // in kg
  latitude: number | null;
  longitude: number | null;
  isVerified: boolean; // true if automatically captured via Geolocation API
  locationError?: string; // details if location verification failed
  imagePath?: string; // relative path to the uploaded proof image
  timestamp: string; // ISO format date string
  notes?: string;
  reporterName?: string;
}

export interface WasteStats {
  totalWeight: number;
  categoryTotals: Record<WasteCategory, number>;
  verifiedCount: number;
  unverifiedCount: number;
}
