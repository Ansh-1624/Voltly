# Voltly — AI-Powered Peer-to-Peer EV Charging Platform

Voltly is a full-stack web application connecting EV owners who need charging with households that have verified, suitable 16A charging infrastructure.

At its core is **Guardian Angel** — an explainable, deterministic recommendation engine that identifies the single best compatible and reachable charging pod rather than displaying a generic list of nearby chargers.

---

## 1. Core Architecture & Visual Identity

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, `html5-qrcode` (camera/file QR scanner), `qrcode.react` (cryptographic token renderer), `canvas-confetti`.
- **Backend**: Node.js, Express.js, TypeScript, REST APIs, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, cryptographic SHA-256 tokens (`crypto`).
- **Database**: Normalized relational database architecture with atomic transactional locks (`src/database/index.ts`). Supports embedded storage (zero-configuration out of the box) as well as PostgreSQL connection via `DATABASE_URL`.
- **Visual Identity**: Clean **White + Green + Blue** design system.
  - Dominant Background: Clean White (`#FFFFFF`) & Off-white (`#F8FAFC`).
  - Primary Green: Fresh Sustainable Green (`#16A34A` / `#166534` / `#DCFCE7`) for charging, sustainability, availability, and successful actions.
  - Primary Blue: Technology Blue (`#2563EB` / `#1E3A8A` / `#DBEAFE`) for navigation, information, and secondary actions.
  - Borders: `#E2E8F0`, Primary Text: `#0F172A`, Warning: `#F59E0B`, Error: `#DC2626`.

---

## 2. Platform Modules & Engineering Logic

### 1. Guardian Angel — Intelligent Recommendation Engine (`server/src/engines/recommendation.ts`)
- **Hard Constraints (NEVER Relaxed)**:
  - Host Pod & Profile must be `APPROVED` by Voltly Compliance Admin.
  - Socket on host wall must match EVSE supply plug (`16A_3PIN`).
  - EVSE vehicle connector must match vehicle AC inlet (e.g. Type 2 Mennekes).
  - Vehicle must support AC destination charging.
  - Host earthing verified (`PROPER`) and checked by a qualified electrician.
  - Power limits safe: `P_effective = min(P_vehicle, P_evse, P_host)`.
  - Pod status must be `AVAILABLE`.
  - Host simultaneous sessions must not exceed capacity (`max_simultaneous_sessions`).
  - Safe Reachability: Driving distance + **20% mandatory safety reserve** must be $\le$ vehicle estimated remaining range.
- **Adaptive Rejection Handling**:
  - Rejection feedback signals (`TOO_EXPENSIVE`, `TOO_FAR_DETOUR`, `SPEED_TOO_SLOW`, etc.) are accumulated in the database across sessions to dynamically tune ranking weights and present the next best adapted match.

### 2. Dynamic Pricing Engine (`server/src/engines/pricing.ts`)
- Dynamic calculation based on vehicle and verified equipment ratings:
  $$\text{Energy per minute (kWh)} = \frac{P_{\text{effective}}}{60}$$
  $$\text{Price per minute (₹)} = \text{Energy per minute} \times \text{Host electricity tariff}$$
- **Rate Locking**: Billing rate is strictly locked at session authorization. Subsequent host tariff adjustments cannot alter active or completed sessions.
- **Duration Limits**:
  - Two-wheelers: **60 minutes maximum**.
  - Four-wheelers: **120 minutes maximum**.
  - Timestamps are server-enforced (`Date.now()`) to prevent tampering or browser refresh resets.

### 3. QR-Based Single-Use Verification (`server/src/engines/qr.ts`)
- Upon reaching the host, guest generates a cryptographically random 256-bit single-use token (`crypto.randomBytes(32)`).
- Location-proximity validation confirms guest is near the host.
- Host scans token with integrated camera scanner or token input.
- Database transaction verifies single-use status, expiration (10 min), host match, and atomically locks the pod to `OCCUPIED` to eliminate race conditions.

### 4. Direct P2P Billing (`server/src/engines/session.ts`)
- Final bill breakdowns: start/end times, exact duration, estimated kWh, locked rate, final amount.
- Direct peer-to-peer settlement via host's personal UPI QR or Cash. Voltly takes 0% commission.

---

## 3. Quick Start & Installation

### Prerequisites
- Node.js $\ge$ 18.0.0
- npm $\ge$ 9.0.0

### Installation
```bash
# Clone or navigate to the repository
cd Voltly

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

---

## 4. Running the Application

### Option A: Concurrent Development Mode (Recommended)
From the root directory:
```bash
npm run dev
```
- **Frontend (Vite)**: `http://localhost:5173`
- **Backend API (Express)**: `http://localhost:5001`
- Proxies `/api` requests seamlessly from Vite to Express.

### Option B: Production Standalone Mode
Build both packages and run the unified server:
```bash
# Build client and server
npm run build

# Start the full-stack server
cd server && npm start
```
- Visit `http://localhost:5001` to access both the React frontend and Express REST APIs.

---

## 5. Seed Data & Pre-Configured Test Accounts

To seed or reset the database at any time:
```bash
cd server && npm run seed
```

### Instant Test Accounts
The navigation bar includes a **"Demo Switcher"** allowing you to switch between accounts with a single click:

| Role | Account Name | Email | Details |
|---|---|---|---|
| **Host** | Rajesh Sharma | `rajesh.host@voltly.com` | Approved 16A pod in Indiranagar, Bengaluru. Tariff ₹8.50/kWh. |
| **Host** | Priya Patel | `priya.host@voltly.com` | Approved 16A pod in Koramangala, Bengaluru. Tariff ₹9.00/kWh. |
| **Host** | Arun Mehta | `arun.host@voltly.com` | Pending host in Marathahalli (for testing Admin review flow). |
| **Guest** | Vikram Rao | `vikram.guest@voltly.com` | 4-Wheeler: Tata Nexon EV (40.5 kWh, Type 2, 3.3 kW AC). |
| **Guest** | Ananya Iyer | `ananya.guest@voltly.com` | 2-Wheeler: Ather 450X (3.7 kWh, 1.4 kW AC). |
| **Admin** | Compliance Admin | `admin@voltly.com` | Full administrative review and pod approval capabilities. |

---

## 6. End-to-End Walkthrough (Discover $\to$ Recommend $\to$ Navigate $\to$ Verify $\to$ Charge $\to$ Bill)

1. **Guest Search**:
   - Open `http://localhost:5173` and click **Demo Switcher $\to$ Vikram Rao (Guest)**.
   - Adjust your battery percentage slider (e.g., 35%) and estimated range (e.g., 48 km).
   - Click **"Find Best Compatible Charging Pod"**.
   - Guardian Angel selects Pod *"Indiranagar Driveway Pod #1"* and presents an explainable breakdown.
2. **Adaptive Rejection Test**:
   - Click **"Not Right For Me (Reject)"** and pick *"Too expensive / High tariff"*.
   - Guardian Angel dynamically adapts its cost weight and finds the next best alternative pod!
3. **Accept & Navigate**:
   - Click **"Accept Recommendation & Navigate"**.
   - Review live route guidance, distance, ETA, and real-time pod availability.
4. **Arrival & QR Generation**:
   - Click **"I Have Arrived — Generate Host QR Code"**.
   - A single-use QR code and 64-character token appear with a 10-minute countdown.
   - Click **"Copy"** next to the cryptographic token.
5. **Host Scan & Authorization**:
   - Use the **Demo Switcher $\to$ Rajesh Sharma (Host)**.
   - Click **"Scan Guest QR"** on the Host Dashboard.
   - Paste the token (or scan with camera) and click **"Verify"**.
   - The session is atomically created and locked to `OCCUPIED`.
6. **Active Charging & Stop**:
   - Live elapsed minutes, accumulated kWh, and locked rate are metered.
   - Click **"Stop Charging"** to safely terminate the session.
   - View the itemized final bill and mark as settled via UPI or Cash.

---

## 7. Running the Automated Test Suite

Voltly features unit and integration tests covering electrical compatibility, dynamic pricing, recommendation ranking, cryptographic QR single-use validation, session duration limits, and billing:

```bash
cd server && npm test
```

Expected output:
```text
PASS src/__tests__/voltly.test.ts
  Voltly Engine Test Suite
    Electrical Compatibility Engine
      ✓ should approve fully compatible socket, EVSE, and vehicle
      ✓ should reject incompatible socket and EVSE supply plug
      ✓ should reject connector mismatch between EVSE output and vehicle inlet
      ✓ should reject vehicle when AC charging is unsupported
      ✓ should reject unverified host installation and uncertain earthing
      ✓ should enforce the lowest power bottleneck: min(P_vehicle, P_evse, P_host)
    Dynamic Pricing Engine
      ✓ should correctly calculate energy per minute, price per minute, and session limits
      ✓ should enforce 60 minute duration limit for two-wheelers
      ✓ should throw error on invalid power or negative tariff
    Guardian Angel Recommendation Engine
      ✓ should recommend the best compatible option for guest
      ✓ should exclude unreachable options exceeding remaining range + 20% reserve
      ✓ should exclude occupied and unapproved pods
      ✓ should adapt ranking based on accumulated rejection feedback
    QR Generation and Session Authorization
      ✓ should generate valid QR and atomically initiate charging session on host scan
      ✓ should reject reused QR tokens (single-use guarantee)
      ✓ should reject scan from unauthorized host (wrong host)
      ✓ should reject expired QR tokens
    Session Stop and Billing Engine
      ✓ should stop charging session and accurately compute bill and energy
      ✓ should transition to LIMIT_REACHED when maximum duration is reached

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
```

---

## 8. Environment Variables

Create `.env` in `Voltly/server/.env` if you wish to configure external services:

```env
PORT=5001
JWT_SECRET=voltly_super_secure_jwt_secret_2026
NODE_ENV=development

# Optional: Google Maps Platform API key (for live Google Distance Matrix)
# If omitted or set to 'demo_key', Voltly uses high-accuracy local routed Haversine calculations
GOOGLE_MAPS_API_KEY=demo_key

# Optional: Remote PostgreSQL connection
# If omitted, Voltly uses its embedded ACID-compliant relational store in server/data/voltly.json
# DATABASE_URL=postgresql://postgres:password@localhost:5432/voltly
```

---

## 9. Known Scope Boundaries (Hackathon Prototype)
- **Physical Electricity Control**: Voltly coordinates peer-to-peer charging sessions, enforces time limits, and calculates bills; it does not contain physical hardware relays to physically cut power lines without IoT contactors.
- **Payment Processing**: All settlements occur directly between host and guest via UPI QR or Cash; Voltly charges zero platform commissions.

