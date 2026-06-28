/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Fetch the Firebase config that the server exposes at /api/firebase-config.
// Initialise once; re-use the existing app on HMR reloads.
async function initFirebase() {
  if (getApps().length > 0) return getApps()[0];
  const res = await fetch('/api/firebase-config');
  if (!res.ok) throw new Error('Could not load Firebase config');
  const cfg = await res.json();
  return initializeApp(cfg);
}

export async function getFirebaseStorage() {
  const app = await initFirebase();
  return getStorage(app);
}