# 🛡️ HuntFlow — Enterprise Threat Hunting & Detection Engineering Platform

**Engineered by Ahmed Alaa**

HuntFlow is a unified workflow management platform built for SOC analysts, threat hunters, and detection engineers. It connects simulated and real-world attack labs to live investigations, cryptographic malware reverse engineering, MITRE ATT&CK coverage tracking, Sigma rule translation, and automated multi-provider threat intelligence enrichment.

---

## 🌟 Core Modules & Capabilities

### 1. 🔍 Threat Hunting & Investigation Workspace
- **Case Management**: Document hypotheses, investigation scopes, executed SIEM queries, and forensic findings.
- **Evidence & Artifact Repository**: Catalog extracted network indicators (IPv4/IPv6, FQDNs, URLs), file hashes (MD5, SHA-1, SHA-256), process names, and Windows Event IDs (e.g. Sysmon EID 1, 3, 10, Windows Security 4688, 4624, 7045).
- **Tabbed Investigation Workspace**: Direct first-tab access to Evidence & Artifacts without vertical scrolling.
- **Attack Flow Timeline**: Interactive, chronological sequence of adversary actions mapped directly to supporting evidence.
- **Lab ↔ Investigation Bi-directional Binding**: Group multiple tactical hunts under a parent lab environment (e.g., Splunk BOTS, CyberDefenders, LetsDefend, or internal ranges).
- **Executive Incident Reporting**: One-click generation of formatted Incident Reports with printable layout and clean Markdown export.

### 2. 🧪 Malware Analysis & Reverse Engineering Dossier
- **Cryptographic Verification**: Store and verify MD5, SHA-1, and SHA-256 hashes with one-click VirusTotal file scanning.
- **Static Analysis Documentation**: Track suspicious API imports (e.g., `VirtualAlloc`, `CreateRemoteThread`), extracted strings, entropy, and packers (UPX, Themida, VMProtect).
- **Behavioral & Dynamic Telemetry**: Document Command & Control (C2) server endpoints, secondary dropped payloads, registry persistence keys, and beaconing intervals.
- **Malware Analysis Dossier**: Dedicated printable reverse engineering report export.

### 3. 🌐 Global IOC Repository & Campaign Correlation
- **Cross-Hunt Intelligence**: Unified inventory of all indicators of compromise across the platform.
- **Automated Campaign Correlation**: Automatically highlights when identical IOCs appear across separate investigations.
- **Filterable & Exportable**: Filter by indicator type and export full JSON intelligence dumps.

### 4. ⚡ Live Multi-Provider Threat Intelligence Enrichment
- **Concurrent Dual-Provider IP Queries**: Uses `Promise.allSettled` to query AbuseIPDB v2 and VirusTotal v3 concurrently for public IP addresses.
- **AbuseIPDB Metrics**: Real-time confidence scores, report counts, ISP identification, country codes, and Tor exit node detection.
- **VirusTotal Metrics**: Live security vendor detection ratios, AS owner details, subnet CIDR information, and community reputation scores.
- **Threat Intelligence Dossier Modal**: Comprehensive centered modal showing side-by-side vendor telemetry, threat tags, and pivot links to Shodan and GreyNoise.

### 5. 🛡️ MITRE ATT&CK Matrix & Coverage Gap Analysis
- **Full STIX 2.1 Enterprise Import**: Automatically syncs the MITRE ATT&CK Enterprise Matrix (Tactics, Techniques, and Sub-techniques).
- **Evidence-Backed Mappings**: Enforces that techniques can only be marked as `CONFIRMED` when backed by concrete logged evidence.
- **Coverage Status Hierarchy**: Dynamic evaluation (`NOT_PRACTICED` → `OBSERVED` → `INVESTIGATED` → `DETECTION_CREATED` → `DETECTION_VALIDATED`).
- **Detection Gap Analysis**: Analyzes techniques lacking detection coverage, prioritized by threat severity and critical tactics (Initial Access, Credential Access, Defense Evasion).
- **Navigator Layer Export**: Export your defensive posture directly to MITRE ATT&CK Navigator JSON.

### 6. ⚙️ Detection Engineering & Sigma Translation
- **Sigma to SIEM Converter**: Embedded translator that translates Sigma YAML detection logic into Splunk SPL and Microsoft Sentinel KQL.
- **Query Library**: Repository of reusable hunting queries categorized by SPL, KQL, EQL, and Sigma.
- **Playbooks**: Structured threat hunting playbooks with step-by-step procedures and conclusion criteria.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 14 (App Router, Server Actions, Dynamic Routes) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Database & ORM** | PostgreSQL 16 + Prisma ORM 5 |
| **Styling** | Tailwind CSS with CSS Variables for Dark / Light mode |
| **Data Visualization** | Recharts + Custom ATT&CK Matrix Grid |
| **Icons & Fonts** | Lucide React + IBM Plex Sans & IBM Plex Mono |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.17+ or v20+
- **Docker & Docker Compose** (for PostgreSQL)

### 1. Clone & Install
```bash
git clone https://github.com/AhmedAlaa/huntflow.git
cd huntflow
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your settings:
```env
DATABASE_URL="postgresql://huntflow:huntflow@localhost:5432/huntflow"
VIRUSTOTAL_API_KEY="your_virustotal_api_key_here"
ABUSEIPDB_API_KEY="your_abuseipdb_api_key_here"
```

### 3. Start Database
```bash
docker compose up -d
```

### 4. Initialize Database & ATT&CK Matrix
```bash
# Push Prisma schema
npx prisma db push

# Import full MITRE ATT&CK Enterprise STIX 2.1 matrix
npm run mitre:import

# (Optional) Seed realistic demo hunting cases & labs
npm run db:seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Repository Structure

```
huntflow/
├── prisma/
│   ├── schema.prisma        # Complete relational schema (22 models)
│   └── seed.ts              # Idempotent realistic threat hunting seed data
├── scripts/
│   └── import-mitre.ts      # Automated STIX 2.1 ATT&CK import script
├── src/
│   ├── app/
│   │   ├── page.tsx         # Executive Threat Hunting Dashboard
│   │   ├── [entity]/        # Universal CRUD engine (Labs, Investigations, Detections, Malware...)
│   │   │   ├── page.tsx     # Filterable list view with CSV/JSON export
│   │   │   └── [id]/page.tsx# Detail workspace & investigation tabs
│   │   ├── iocs/            # Global IOC Repository & Campaign Correlation
│   │   ├── coverage/        # ATT&CK Coverage Matrix & Gap Analysis
│   │   ├── mitre/           # ATT&CK Explorer & technique dossiers
│   │   ├── knowledge/       # Universal cross-entity full-text search
│   │   ├── docs/            # Built-in platform documentation
│   │   ├── malware/[id]/report # Printable Malware Analysis Dossier
│   │   ├── investigations/[id]/report # Printable Incident Report
│   │   └── api/
│   │       ├── enrich/      # Live VirusTotal v3 & AbuseIPDB v2 concurrent API
│   │       ├── search/      # Command Palette search endpoint
│   │       ├── export/      # Data export (JSON/CSV)
│   │       └── health/      # Platform health & DB latency check
│   ├── components/
│   │   ├── ArtifactBadge.tsx # Large Threat Intel Dossier Modal & Live check
│   │   ├── InvestigationTabs.tsx # Specialized tabbed case workspace
│   │   ├── InvestigationTimeline.tsx # Chronological attack timeline
│   │   ├── SigmaConverter.tsx # Sigma YAML to SPL/KQL translator
│   │   ├── CommandPalette.tsx # Spotlight Ctrl+K navigation
│   │   ├── ThemeToggle.tsx  # Dark / Light theme switcher
│   │   └── Sidebar.tsx      # Grouped collapsible navigation
│   └── lib/
│       ├── db.ts            # Prisma client singleton
│       ├── entities.ts      # Entity configuration & form definitions
│       ├── coverage.ts      # ATT&CK coverage calculation service
│       └── mapping.ts       # Evidence-backed technique verification
└── docker-compose.yml       # Local PostgreSQL container definition
```

---

## ⌨️ Shortcuts & Hotkeys

- **`Ctrl + K` / `Cmd + K`**: Open the Command Palette from anywhere to jump to any technique, investigation, or query.
- **`Escape`**: Close any active modal, pop-up, or overlay.

---

## 📄 License & Credits

Designed and engineered by **Ahmed Alaa**.
Distributed under the MIT License.
