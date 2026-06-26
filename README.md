# 🛰️ EcoAudit - Community Waste Logger & Auditor

EcoAudit is a polished, full-stack community waste ledger application designed to help citizens log disposed waste categories and weights while enforcing anti-fraud protocols. 

To prevent fraudulent or spoofed ledger entries, the system automatically validates the user's physical coordinates using the browser's native **Geolocation API** on submission. If a user denies location access, the system gracefully handles the error, providing an educational fallback to proceed with manual coordinates while marking the entry with a permanent, high-contrast **Unverified Manual Override** audit tag.

---

## ✨ Features & Capabilities

### 1. 📋 Log a Waste Entry
- An elegant, visual grid form supporting category selection (Plastic, E-Waste, Organic, Paper, Metal, Glass, Other).
- Robust weight entry validation (in kg).
- **Proof of Disposal (Image Upload):** Supports drag-and-drop or file selector to attach actual photos of the disposed waste as audit proof.

### 2. 🛰️ Validated Geolocation (Anti-Fraud Telemetry)
- Native geolocation lookup with high-accuracy satellite-link simulation screens.
- **Location Error Handling:** Graceful modal overlays explaining why GPS tracking is vital for community ledger trust.
- Allows unverified manual overrides with clear coordinate flags, preventing system blockage while maintaining audit integrity.

### 3. 🗺️ Live Leaflet Map Audit
- Interactive Leaflet map with customized, animated SVG marker pins mapping every single logged waste entry.
- Clicking on map markers slides open details including **disposal proof images**, weight metrics, notes, and the telemetry verification badge.
- Clicking on any dashboard list item triggers a smooth Map camera `flyTo` transition, centering directly on the chosen coordinates.

### 4. 📊 Live Totaling & Recharts Analytics
- Real-time aggregated metrics (Total Waste Logged, E-Waste Logged, Organic Composted, Compliance Rates).
- Beautiful visual charts (Bar Chart showing category distribution, and a Pie Chart illustrating Ledger Veracity proportions).

### 5. 💾 Full-Stack Data Persistence
- Built with a full-stack Express.js server and an autonomous, atomic filesystem-based JSON database (`/.ecoaudit-local-db.json`).
- Automatically manages uploaded proof of disposal images as compressed files served via static uploads routes (`/uploads/*`).

---

## 🛠️ The Tech Stack

- **Client-Side Framework:** React 19 + TypeScript (ES2022) + Vite 6
- **Backend API Server:** Node.js + Express 4 + tsx (TypeScript Dev execution)
- **Styling & Theme:** Tailwind CSS 4 (with fluid responsive layouts)
- **Map & Geolocation:** Leaflet Map API with modern CSS custom overrides
- **Analytics & Graphs:** Recharts Data Visualization Suite
- **Interactive Transitions:** Lucide React icons + Native Spring CSS effects

---

## 📦 Project Directory Structure

```text
├── data/                    # Uploaded Image Assets (Server-Side)
│   └── uploads/             # Saved image proofs of disposal
├── .ecoaudit-local-db.json  # Atomic, persistent JSON fallback database (hidden from Vite watcher)
├── src/
│   ├── components/
│   │   ├── Header.tsx       # Live status header & stats ticker
│   │   ├── WasteForm.tsx    # Waste input, drag-drop image uploader, & GPS validation
│   │   ├── WasteMap.tsx     # Leaflet map instance & SVG pins
│   │   └── Dashboard.tsx    # Live totaling cards, Recharts plots, & ledger query list
│   ├── types.ts             # TypeScript structured interfaces
│   ├── App.tsx              # Main orchestrating controller (fetches & layout)
│   ├── index.css            # Tailwind & customized Leaflet theme overrides
│   └── main.tsx             # React SPA entry node
├── server.ts                # Full-stack Express.js server & Vite middleware integrations
├── package.json             # Build script compilation rules & dependency matrix
└── vite.config.ts           # Bundler environment settings
```

---

## 🚀 Running Locally

Follow these steps to clone and run the full-stack EcoAudit ledger system on your local machine:

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)

### 2. Installation
Install all package dependencies defined in the project configuration:
```bash
npm install
```

### 3. Run Development Server
Boot the Express.js server in development mode. The server will mount Vite automatically as middleware:
```bash
npm run dev
```
Once active, open your browser and navigate to **`http://localhost:3000`** to interact with the application.

### 4. Build for Production
Compiles the React assets using Vite, and bundles the Express server file into a standalone, optimized file (`dist/server.cjs`) using `esbuild`:
```bash
npm run build
```

### 5. Start Production Server
Launch the compiled full-stack production build:
```bash
npm run start
```

---

## 🛡️ Audit compliance guidelines

This application ensures data transparency:
- Every record is saved with `latitude` and `longitude` fields.
- The `isVerified` flag is mathematically bound to browser Geolocation API successes, preventing users from forging the geolocation verification status.
