# Local SEO & Google Business Profile Operations Platform

A Local SEO Operations Workspace designed for multi-location businesses, local SEO specialists, and digital marketing agencies.

The platform provides a closed-loop operations system:
$$\text{Detect} \longrightarrow \text{Explain Impact} \longrightarrow \text{Prescribe Fix} \longrightarrow \text{Human/AI Execution} \longrightarrow \text{Verification \& Measurement}$$

---

## 1. Core Platform Modules

- **Executive Overview (Module A)**:
  - Answers five core business questions immediately: Profile health, current visibility blockers, recommended next actions, customer discovery actions, and measurable proof of ROI.
  - Priority action queue linking evidence and effort to direct 1-click execution.
  - 7-day impression trend comparison (Google Maps vs. Google Search).
- **Business Profile Manager (Module B)**:
  - Complete NAP (Name, Address, Phone), categories, operating hours, special holiday hours, attributes, and services management.
  - Diff view: Original value vs. Proposed value comparison with approval workflows.
  - Full synchronization status and last Google sync timestamp.
- **12-Point Local SEO Audit Engine (Module C)**:
  - Transparent formula: $\text{Score} = 100 - (15 \times \text{Critical}) - (8 \times \text{High}) - (4 \times \text{Medium}) - (1 \times \text{Low})$.
  - Evaluates business info consistency, category relevance, description length, reviews coverage, photo freshness, duplicate listings, and Schema.org structured data.
  - 1-Click conversion of audit findings into assigned team tasks.
- **Google Maps Ranking Explorer (Module D)**:
  - Interactive Leaflet / OpenStreetMap geo-grid ranking visualization.
  - Signature metrics: **SoLV®** (Share of Local Voice in Top 3), **ARP** (Average Rank Position in visible zones), and **ATRP** (Average Total Rank Position across all pins).
  - Customizable grid densities (3x3, 5x5, 7x7) and scan radii (2.5km to 10km).
  - Side inspector displaying ranking position and competing businesses for any selected pin.
- **Reviews & Reputation Inbox (Module E)**:
  - Multi-criteria filtering (rating, sentiment, response status, search).
  - Escalation flags for complaints and surprise billing claims.
  - **AI Review Response Assistant**: Generates contextual responses in Empathetic, Professional, Concise, or Enthusiastic tones with strict human approval gates before Google publishing.
- **Posts & Content Studio (Module F)**:
  - Create and schedule Standard updates, Special Offers with coupon codes, and Events.
  - **AI Post Studio**: Generates localized promotional and educational copy matching Google Business Profile character and CTA limits.
- **Customer Q&A (Module G)**:
  - Public question queue from Google Maps listings with AI answer drafting and owner publishing.
- **Local Competitor Intelligence (Module H)**:
  - Benchmark review volume, star ratings, primary categories, and estimated SoLV against local competitors.
- **Official Performance Analytics (Module I)**:
  - Schema-aligned with Google Business Profile Performance API v1: Maps vs. Search impressions (Desktop & Mobile), Website clicks, Call clicks, and Direction requests with percentage period deltas.
  - Daily search keyword queries and trends.
- **Actionable Task Management (Module J)**:
  - Workflow board with priorities (urgent, high, medium, low), subtask checklists, and internal team comments.
- **Reports & Client Portal (Module K)**:
  - Executive summary reporting with white-label branding, printable/PDF format, and CSV export.
  - Client portal mode hiding internal agency notes.
- **AI Operations Copilot (Module L)**:
  - Slide-out assistant with permission-aware tools that analyzes live location data, drafts responses, explains ranking shifts, and creates remediation tasks with confirmation gates.

---

## 2. Technology Architecture

- **Frontend**: React 18, TypeScript, Vite, React Router, Bootstrap 5, Leaflet (interactive maps), Chart.js / react-chartjs-2, Lucide icons.
- **Backend**: Node.js, Express, TypeScript, Zod schema validation, CORS.
- **Database**:
  - Out-of-the-box zero-setup SQLite via Node.js built-in `node:sqlite` in `./data/local_seo.db`.
  - Full PostgreSQL schema compatibility via `./server/src/db/schema.sql`.
- **Testing**: Vitest automated test suite covering audit scoring, profile diffs, geo-grid rank formulas, post transitions, review responses, and AI intents.

---

## 3. Quick Start & Local Execution

### Prerequisites
- Node.js v20+ or v24+
- npm v10+

### Installation & Execution
```bash
# 1. Clone repository
cd google-business-profile-and-local-seo

# 2. Install dependencies
npm install

# 3. Start development server (runs backend on :5000 and Vite client on :3000)
npm run dev

# 4. Or build and run production server (serves frontend & backend on :5000)
npm run build
npm start
```

Access the application in your browser:
- **Development**: [http://localhost:3000](http://localhost:3000)
- **Production**: [http://localhost:5000](http://localhost:5000)
- **API Base**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)

### Running Automated Tests
```bash
npm test
```

---

## 4. Google Business Profile API OAuth Setup

To switch from Demo Fixtures mode to live Google Business Profile synchronization:

1. **Google Cloud Console**:
   - Create a Google Cloud project.
   - Enable the **Google My Business Business Information API** and **Google Business Profile Performance API**.
2. **OAuth Consent Screen**:
   - Add scope: `https://www.googleapis.com/auth/business.manage`.
3. **Credentials**:
   - Create an OAuth 2.0 Client ID (Web Application).
   - Set Authorized Redirect URI: `http://localhost:5000/api/v1/auth/google/callback`.
4. **Environment Configuration**:
   - Update `.env`:
     ```env
     DEMO_MODE=false
     GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/auth/google/callback
     ```

---

## 5. Summary of Implemented vs. Demo Features

| Module | Implemented Architecture | Live Integration Status |
| :--- | :--- | :--- |
| **Executive Overview** | Real calculations & priority queue | Live SQLite + Google Performance API schema |
| **Profile Management** | Full CRUD, change proposals & diffs | Bi-directional API adapter with proposal reviews |
| **Local SEO Audit** | 12-category audit engine & transparent scoring | Live evaluation of database & DOM signals |
| **Geo-Grid Rankings** | Leaflet interactive map with ARP, ATRP, SoLV | Search emulation provider adapter with pin inspection |
| **Reviews & Reputation**| Unanswered queue, tone-aware AI drafter | Google Reviews API adapter + approval gate |
| **Posts Studio** | Standard, Offer, Event post scheduler | Google Local Posts API adapter |
| **Q&A Queue** | Question feed & AI answer suggestions | Google Q&A API adapter |
| **Competitors** | Benchmark table, review velocity & SoLV | Local competitive tracking store |
| **Performance KPIs** | Maps vs Search impressions, Clicks, Calls | Google Performance API schema with delta comparison |
| **Task Management** | Actionable tasks, checklists, comments | Relational task workflow engine |
| **Client Reports** | Executive reports, white-label, CSV export | Live report compiler & CSV generator |
| **AI Copilot** | Permission-aware natural language action planner | Integrated operations assistant |
