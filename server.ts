/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'logs.json');

// Ensure database and uploads directories exist
function initStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  
  // Consolidate and clean up any old .ecoaudit-local-db.json that was created in the root
  const legacyDbFile = path.join(process.cwd(), '.ecoaudit-local-db.json');
  const legacyDbFileTmp = path.join(process.cwd(), '.ecoaudit-local-db.json.tmp');
  
  if (fs.existsSync(legacyDbFile)) {
    try {
      const content = fs.readFileSync(legacyDbFile, 'utf8').trim();
      // If the root db exists and has data but the data/logs.json is empty/non-existent, migrate it back
      if (content && content !== '[]' && (!fs.existsSync(DB_FILE) || fs.readFileSync(DB_FILE, 'utf8').trim() === '[]')) {
        fs.writeFileSync(DB_FILE, content, 'utf8');
        console.log('[EcoAudit Server] Migrated data from root .ecoaudit-local-db.json back to data/logs.json');
      }
      fs.unlinkSync(legacyDbFile);
      console.log('[EcoAudit Server] Cleaned up redundant root .ecoaudit-local-db.json');
    } catch (e) {
      // ignore errors
    }
  }
  
  if (fs.existsSync(legacyDbFileTmp)) {
    try {
      fs.unlinkSync(legacyDbFileTmp);
    } catch (e) {}
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '[]', 'utf8');
  }
}

initStorage();

// Read logs from JSON file (fallback database)
function readLogs(): any[] {
  try {
    initStorage();
    if (!fs.existsSync(DB_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DB_FILE, 'utf8').trim();
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading logs database, resetting...', err);
    try {
      fs.writeFileSync(DB_FILE, '[]', 'utf8');
    } catch (e) {
      // ignore
    }
    return [];
  }
}

// Write logs to JSON file (fallback database) securely and atomically
function writeLogs(logs: any[]): void {
  try {
    initStorage();
    const content = JSON.stringify(logs, null, 2);
    const tmpFile = DB_FILE + '.tmp';
    fs.writeFileSync(tmpFile, content, 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Error writing logs database:', err);
  }
}

// Initialize Firebase Firestore using the auto-provisioned configuration
let db: any = null;

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const firebaseApp = initializeApp({
      apiKey: configData.apiKey,
      authDomain: configData.authDomain,
      projectId: configData.projectId,
      storageBucket: configData.storageBucket,
      messagingSenderId: configData.messagingSenderId,
      appId: configData.appId
    });
    
    // Check if we have a custom firestore database ID
    if (configData.firestoreDatabaseId) {
      db = getFirestore(firebaseApp, configData.firestoreDatabaseId);
    } else {
      db = getFirestore(firebaseApp);
    }
    console.log(`[EcoAudit Server] Successfully initialized Firestore under Project: ${configData.projectId}`);
  } else {
    console.warn('[EcoAudit Server] firebase-applet-config.json not found, using local file ledger.');
  }
} catch (error) {
  console.error('[EcoAudit Server] Failed to initialize Firebase Firestore:', error);
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Cloud Persistent Firestore Functions with local fallbacks
async function getLogsFromFirestore(): Promise<any[]> {
  const localLogs = readLogs();
  if (!db) {
    return localLogs;
  }
  const pathForGetDocs = 'logs';
  try {
    const logsCol = collection(db, pathForGetDocs);
    const q = query(logsCol, orderBy('timestamp', 'desc'));
    
    // Wrap Firestore fetching in a 3-second timeout
    const querySnapshot = await Promise.race([
      getDocs(q),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Firestore getDocs timeout (3000ms)')), 3000)
      )
    ]);
    
    const firestoreLogs: any[] = [];
    querySnapshot.forEach((document: any) => {
      firestoreLogs.push({
        id: document.id,
        ...document.data()
      });
    });

    // Merge local logs and firestore logs securely to prevent missing any data
    const mergedMap = new Map<string, any>();
    // Insert local logs first
    localLogs.forEach(log => {
      if (log && log.id) mergedMap.set(log.id, log);
    });
    // Overwrite/supplement with Firestore logs
    firestoreLogs.forEach(log => {
      if (log && log.id) mergedMap.set(log.id, log);
    });

    const mergedLogs = Array.from(mergedMap.values()).sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Synchronize the master local mirror with the merged results
    writeLogs(mergedLogs);
    return mergedLogs;
  } catch (error: any) {
    if (error?.message?.includes('permission') || error?.code === 'permission-denied') {
      try {
        handleFirestoreError(error, OperationType.GET, pathForGetDocs);
      } catch (err) {
        // Log handled error and fallback to local storage
        console.error('[EcoAudit Server] Handled firebase get error. Falling back to local ledger.');
      }
    } else {
      console.error('[EcoAudit Server] Error fetching logs from Firestore (falling back to local):', error.message || error);
    }
    return localLogs; // Fallback
  }
}

async function addLogToFirestore(logData: any): Promise<any> {
  // Always assign a unique ID
  const newLog = {
    id: logData.id || `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    ...logData
  };

  // Always save to local mirror first so it's persisted immediately
  const logs = readLogs();
  logs.unshift(newLog);
  writeLogs(logs);

  if (!db) {
    return newLog;
  }
  const pathForWrite = 'logs';
  try {
    const logsCol = collection(db, pathForWrite);
    
    // Wrap Firestore addDoc in a 3-second timeout
    await Promise.race([
      addDoc(logsCol, newLog),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Firestore addDoc timeout (3000ms)')), 3000)
      )
    ]);
    return newLog;
  } catch (error: any) {
    if (error?.message?.includes('permission') || error?.code === 'permission-denied') {
      try {
        handleFirestoreError(error, OperationType.CREATE, pathForWrite);
      } catch (err) {
        // Log handled error and fallback to local storage
        console.error('[EcoAudit Server] Handled firebase write error. Saved securely to local ledger.');
      }
    } else {
      console.error('[EcoAudit Server] Error adding log to Firestore (saved to local ledger):', error.message || error);
    }
    return newLog;
  }
}

async function clearLogsFromFirestore(): Promise<void> {
  if (!db) {
    writeLogs([]);
    return;
  }
  const pathForClear = 'logs';
  try {
    const logsCol = collection(db, pathForClear);
    
    // Wrap Firestore getDocs in a 3-second timeout
    const querySnapshot = await Promise.race([
      getDocs(logsCol),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Firestore getDocs timeout (3000ms)')), 3000)
      )
    ]);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((document: any) => {
      batch.delete(doc(db, pathForClear, document.id));
    });
    
    // Wrap batch.commit in a 3-second timeout
    await Promise.race([
      batch.commit(),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Firestore commit timeout (3000ms)')), 3000)
      )
    ]);
    
    console.log('[EcoAudit Server] Cleared Firestore logs successfully.');
    writeLogs([]); // Ensure local fallback database is also cleared on successful deletion
  } catch (error: any) {
    if (error?.message?.includes('permission') || error?.code === 'permission-denied') {
      try {
        handleFirestoreError(error, OperationType.DELETE, pathForClear);
      } catch (err) {
        // Log handled error and fallback to local storage
        console.error('[EcoAudit Server] Handled firebase clear error. Falling back to local ledger.');
      }
    } else {
      console.error('[EcoAudit Server] Error clearing logs from Firestore:', error);
    }
    writeLogs([]); // Fallback
  }
}

async function startServer() {
  const app = express();

  // Increase payload limit to support base64 image uploads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Serve uploads statically
  app.use('/uploads', express.static(UPLOADS_DIR));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get all logs from persistent database
  app.get('/api/logs', async (req, res) => {
    try {
      const logs = await getLogsFromFirestore();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new log with optional base64 image
  app.post('/api/logs', async (req, res) => {
    try {
      const { category, weight, latitude, longitude, isVerified, locationError, image, notes, reporterName } = req.body;

      if (!category || !weight) {
        return res.status(400).json({ error: 'Category and weight are required.' });
      }

      let imagePath = '';

      // If there is an image uploaded as a base64 data string
      if (image && typeof image === 'string' && image.startsWith('data:image/')) {
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          // Determine file extension
          let ext = 'jpg';
          if (contentType.includes('png')) ext = 'png';
          else if (contentType.includes('webp')) ext = 'webp';
          else if (contentType.includes('gif')) ext = 'gif';

          const filename = `waste-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
          const filePath = path.join(UPLOADS_DIR, filename);

          fs.writeFileSync(filePath, buffer);
          imagePath = `/uploads/${filename}`;
        }
      }

      const logPayload = {
        category,
        weight: Number(weight),
        latitude: latitude !== undefined ? Number(latitude) : null,
        longitude: longitude !== undefined ? Number(longitude) : null,
        isVerified: Boolean(isVerified),
        locationError: locationError || '',
        imagePath,
        timestamp: new Date().toISOString(),
        notes: notes || '',
        reporterName: reporterName || 'Anonymous',
      };

      const savedLog = await addLogToFirestore(logPayload);
      res.status(201).json(savedLog);
    } catch (error: any) {
      console.error('Error saving log:', error);
      res.status(500).json({ error: error.message });
    }
  });



  // --- Vite Dev Server & Static Bundle Setup ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EcoAudit Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
