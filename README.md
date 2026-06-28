# 🛰️ EcoAudit - Verified Community Waste Logger & Auditor

EcoAudit is a polished, production-ready single-page full-stack application designed to track community waste cleanup streams with verified geographic authenticity.

To preserve absolute ledger integrity, EcoAudit enforces a **spoof-proof submission workflow** using the browser's native **Geolocation API** on submission. Manual coordinate entry is disabled, ensuring every ledger entry corresponds to an authenticated location verified at the time of disposal.

---

## 📸 Section 1: Waste Submission

This is the primary focused action block of the single-page dashboard. It keeps distractions to a minimum to guide users through logging waste materials:
* **Category Selection:** Quick visual cards supporting classification (Plastic, E-Waste, Organic, Paper, Metal, Glass, Other).
* **Weight Input:** Validated weight inputs (in kilograms) representing cleanup size.
* **Metadata Fields:** Optional Reporter Name and Disposal Notes.
* **Proof of Disposal:** A drag-and-drop or file-click file uploader to attach photo proof of the waste.
* **GPS Telemetry Lock:** Automatic retrieval of latitude and longitude coordinates upon submission. Graceful browser permissions handling displays clear guided tips if location access is blocked.

---

## 📊 Section 2: Community Audit Dashboard

Located right below the submission console, the Community Audit Dashboard displays aggregated community ledger data in a highly scannable layout:
* **Interactive Map:** Leaflet map displaying custom animated SVG marker pins representing the user's verified log entries. Camera smoothly flies to center pins when selected.
* **Live Aggregate Metrics:** Tickers detailing Total Waste Logged, active Cleanup Streams, and 100% verified ledger indicators.
* **Stream Distribution Chart:** Responsive Recharts visualization of category distribution weights.
* **Community Waste Ledger:** A real-time, searchable feed detailing all submitted entries with coordinates, timestamps, and proof-of-disposal image attachments.

---

## ⚙️ Environment Variables (`.env`)

For local development or standard cloud preview runs, **no third-party API keys are required**. The application works entirely out-of-the-box.

If you are setting up a `.env` file, you can keep it simple or blank. Here is the recommended configuration:

```env
# Optional environment overrides (defaults are used if omitted)
NODE_ENV=development
PORT=3000
```

---

## 🛠️ Tech Stack

* **Frontend:** React 19, TypeScript, Tailwind CSS 4, Recharts, Lucide Icons, Leaflet Maps
* **Backend:** Node.js, Express 4, tsx (direct TypeScript execution)
* **Build System:** Vite 6 (Frontend bundling), esbuild (Server-side optimization into `dist/server.cjs`)

---

## 🚀 Local Setup Instructions

### 1. Installation
Install all package dependencies:
```bash
npm install
```

### 2. Run in Development Mode
Start the full-stack server. Vite is mounted dynamically as middleware on port 3000:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 3. Production Build & Start
Compile the client SPA and bundle the backend into a single CommonJS file:
```bash
npm run build
npm run start
```
