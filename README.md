# SoilSense AI
**Multisensor Soil Health Monitoring & Action System for Urban Community Gardens**

SoilSense AI is an agritech system built to solve urban community garden irrigation dilemmas: over-watering and under-watering due to lack of ground-truth telemetry. It converts continuous soil and environmental readings into plain-language diagnostics, actionable irrigation recommendations, and autonomous actuator controls.

---

## 1. System Architecture

```
[ PHYSICAL SENSORS ]
  ├── Capacitive Soil Moisture V1.2 (Analog ADC)
  ├── DS18B20 Waterproof Temperature Probe (1-Wire)
  ├── DHT22 / SHT31 Ambient Relative Humidity
  ├── Photodiode Lux Solar Sensor
  ├── Optical Digital Rain Sensor
  └── (Optional) RS485 NPK Sensor
         │
         ▼
[ ESP32 NODE 1: SENSORY ACQUISITION ]
  ├── Analog ADC Calibration & Outlier Filtering
  └── GPIO Interrupts (Rain Detect)
         │
         ▼
[ ESP32 NODE 2: EDGE ML & LOCAL DECISIONS ]
  ├── Microcontroller Offline Rules Engine
  └── Actuator Relays (12V Submersible Pump + 12V Solenoid Valve)
         │  (HTTP POST / MQTT when online)
         ▼
[ SOILSENSE FULL-STACK ENGINE (Port 3000) ]
  ├── Express Backend API (/api/*)
  ├── Soil Health Evaluation Engine (0-100 Score, Water Risk, Thermal Stress)
  ├── Smart Irrigation Decision Engine (IRRIGATE_NOW / WAIT / NO_IRRIGATION)
  ├── Actuator Simulation & Moisture Recharge Dynamics
  ├── Gemini 3.8 Flash Agronomist Insight Engine
  ├── Persistent Storage Engine (data/db.json & Firestore compatibility)
  └── Interactive Vite + React + Tailwind + Recharts Dashboard
```

---

## 2. Environment Variables

Create a `.env` file (copied from `.env.example`):

```bash
# GEMINI_API_KEY: Optional for Gemini 3.8 Flash agronomist insights.
# If omitted or unconfigured, the deterministic rule-based engine operates seamlessly.
GEMINI_API_KEY="your-gemini-api-key"

# APP_URL: Base URL for self-referential links and webhook callbacks
APP_URL="http://localhost:3000"

# PORT: Server port (defaults to 3000 for AI Studio container)
PORT=3000
```

---

## 3. Demo Mode & Simulation Scenarios

Physical ESP32 hardware may not always be connected during evaluations. SoilSense AI includes a full **Interactive Demo Engine**:

Switch scenarios with a single click in the dashboard:
1. **Healthy Soil**: 55–70% moisture, 20–28°C temperature, no rain. Action: `NO_IRRIGATION`.
2. **Dry Soil**: 15–30% moisture, 28–35°C temperature, no rain. Action: `IRRIGATE_NOW` (3 minutes).
3. **Waterlogged Soil**: 80–95% moisture, rain detected. Action: `NO_IRRIGATION` (Root hypoxia lockout).
4. **Hot & Arid Stress**: 35–42°C heat wave, 15–35% moisture. Action: `IRRIGATE_NOW` (High priority).
5. **Recent Precipitation**: Rain sensor triggered, moisture climbing. Action: `WAIT` (Withhold watering).

*Microclimate Jitter*: When Demo Mode is active, sensor telemetry naturally fluctuates every 5 seconds to simulate ambient soil dynamics. When irrigation is active, soil moisture progressively increases!

---

## 4. ESP32 Hardware API Integration

Real ESP32 microcontrollers send telemetry directly to the backend without modifying the frontend:

### Ingest Telemetry Endpoint
`POST /api/devices/:deviceId/readings`

```json
{
  "deviceId": "ESP32-001",
  "moisture": 42.5,
  "soilTemperature": 24.3,
  "humidity": 63.0,
  "light": 720,
  "rain": false,
  "timestamp": "2026-10-08T11:00:00Z"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "reading": { ... },
    "soilStatus": "HEALTHY",
    "score": 86,
    "irrigationAction": "NO_IRRIGATION",
    "recommendedDuration": 0
  }
}
```

### Flashable Firmware
A ready-to-flash C++ sketch is available directly inside the app on the **ESP32 & Edge** tab (`/hardware`).

---

## 5. Gemini AI Setup

- **Model**: `gemini-3.8-flash` via modern `@google/genai` TypeScript SDK.
- **Server-Side Only**: Calls occur exclusively in `server/services/geminiService.ts` on the backend. The API key is never exposed to the browser.
- **Graceful Fallback**: If `GEMINI_API_KEY` is not present, the system defaults to the deterministic rule-based agronomist diagnosis. The core application never breaks.

---

## 6. Firebase Firestore Integration

Data collections follow standard Firestore schemas:
- `users`: Community garden accounts and roles (`ADMIN`, `GARDEN_MANAGER`, `VIEWER`).
- `gardens`: Garden locations and plots.
- `gardenBeds`: Crop types, dimensions, assigned hardware node.
- `sensorReadings`: Capacitive, DS18B20, ambient, and rain readings.
- `soilHealthReports`: Diagnostic scores, water risk, and recommendations.
- `irrigationEvents`: Audit history of pump and valve actuations.
- `alerts`: Safety and threshold notifications.
- `devices`: Registered ESP32 nodes and optical cameras.

Local persistence is stored in `data/db.json` and automatically seeded on first launch.

---

## 7. Development & Deployment

```bash
# Install dependencies
npm install

# Start full-stack development server on port 3000
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
