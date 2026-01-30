# Market Sensor Engine

A **Predictive CI Loop** system built on Ray Beharry's "Systems, Not Slides" framework.

**Collect → Compare → Conclude → Communicate → Counter**

Transform your competitive intelligence from static monitoring to real-time momentum sensing.

> **📌 Simple Mode**: This version uses basic text comparison without AI. No API costs, no LLM required.
> Want AI-powered insights? See [Upgrading to AI Mode](#upgrading-to-ai-mode) below.

## Features

### Module A: Language Drift Analyzer (Sensing)
- **90-Day Baseline**: Maintains historical snapshots of competitor messaging
- **Auto-Diff Engine**: Compares current vs. baseline to detect changes
- **Text Analysis**: Basic keyword extraction and change detection (no AI required)
- **Drift Scoring**: 0-100 scale for measuring magnitude of competitive shifts
- **Manual Review**: Insights flagged for human analysis

### Module B: Proof Vault (Governance)
- **ESOT (Enablement Source of Truth)**: Centralized evidence repository
- **ProofID System**: Unique identifiers linking counter-moves to evidence
- **Safety Stop Rule**: Blocks unvalidated claims with `[INSUFFICIENT DATA—PROOF NEEDED]`
- **Four-Tag System**: NarrativeTag, Persona, Stage, ProofID

### Module C: Activation & Export
- **Resend Integration**: Automated Market Pulse email reports
- **LPNS Email Pattern**: Line → Proof → Next Step format
- **CSV Export**: Download all signals for Command Board usage
- **Weekly Cron Jobs**: Automated scanning via Vercel Cron

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Hosting**: Vercel
- **Database**: Upstash Redis (replaces deprecated Vercel KV)
- **Email**: Resend API
- **Analysis**: Simple text comparison (no AI/LLM required)
- **Styling**: Tailwind CSS

## Getting Started

### 1. Prerequisites

- Node.js 18+ installed
- Vercel account
- Upstash account (or use Vercel Integrations)
- Resend account

### 2. Installation

```bash
# Navigate to the project
cd market-sensor-engine

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials
```

### 3. Environment Setup

Get your credentials from these services:

#### Upstash Redis
1. Go to https://upstash.com/ or add via Vercel Integrations
2. Create a new Redis database
3. Copy the REST URL and TOKEN to `.env.local`

#### Resend Email
1. Sign up at https://resend.com/
2. Create an API key
3. Verify your domain (or use `onboarding@resend.dev` for testing)
4. Add to `.env.local`

#### Anthropic API
1. Get API key from https://console.anthropic.com/
2. Add to `.env.local`

#### Cron Secret
```bash
# Generate a random secret
openssl rand -base64 32
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 to see the dashboard.

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel Dashboard
# Settings → Environment Variables
```

The cron job will automatically run **every Monday at 9 AM** to scan competitors.

## Usage Guide

### Adding Competitors

1. Go to the **Competitors** tab
2. Click "Add Competitor"
3. Enter competitor name and website URL
4. Click "Scan Now" to create the first baseline snapshot

**Pro Tip**: Add your top 3 rivals to start your 90-Day Copy Seismograph.

### Building Your Proof Vault

1. Go to the **Proof Vault** tab
2. Click "Add Proof"
3. Fill in:
   - Evidence sentence (the claim you can prove)
   - Source link (case study, data sheet, etc.)
   - Tags: Narrative, Persona, Stage
   - Optional expiry date (for time-sensitive proof)

This vault enables the **Safety Stop Rule** - every counter-move requires proof.

### Viewing Drift Analysis

1. Go to the **Drift Analysis** tab
2. View detected changes:
   - New nouns/verbs in competitor messaging
   - Tone shifts
   - Drift score (0-100)
   - Strategic implications with "So What?" analysis

### Generating Market Pulse Reports

1. Go to the **Market Pulse Reports** tab
2. Click "Generate Market Pulse Report"
3. Optionally send via email (uses LPNS pattern)
4. View validated counter-moves vs. those needing proof

### Exporting Data

Click "Export CSV" in the header to download all data for:
- Command Board analysis
- Executive presentations
- Quarterly planning

## Cron Job Setup

The system runs automatic scans weekly. The cron configuration is in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/scan",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

**Schedule**: Every Monday at 9:00 AM (UTC)

### Manual Trigger

You can also manually trigger scans:
- Single competitor: Use "Scan Now" button
- All competitors: Click "Scan All"

## API Endpoints

### Competitors
- `GET /api/competitors` - List all competitors
- `POST /api/competitors` - Add new competitor
- `PATCH /api/competitors` - Update competitor config

### Scanning
- `POST /api/scan` - Trigger manual scan (with or without URL)

### Proof Vault
- `GET /api/proof` - List proof records (supports filtering)
- `POST /api/proof` - Add proof record
- `DELETE /api/proof?proofId=XXX` - Delete proof record

### Reports
- `GET /api/reports` - List recent reports
- `POST /api/reports` - Generate new report (optionally send email)

### Export
- `GET /api/export` - Download CSV export

### Cron
- `GET /api/cron/scan` - Automated weekly scan (requires CRON_SECRET)

## Data Contracts

Every data point includes these four mandatory tags:

1. **NarrativeTag**: Trust, Speed, Control, Innovation, Cost, Security
2. **Persona**: CTO, CFO, Data Engineer, VP Engineering, Product Manager
3. **Stage**: Awareness, Consideration, Decision
4. **ProofID**: Unique identifier linking to evidence

## Stop / Start / Scale Framework

### Stop
Building static competitive grids - they're history books, not sensing systems.

### Start
Your 90-Day Copy Seismograph by adding your top 3 rivals' URLs.

### Scale
Forward your first Resend Market Pulse email to leadership to prove your value as a Market Architect.

## Architecture

```
market-sensor-engine/
├── app/
│   ├── api/
│   │   ├── competitors/     # Competitor management
│   │   ├── scan/            # Manual scanning
│   │   ├── proof/           # Proof vault CRUD
│   │   ├── reports/         # Market Pulse reports
│   │   ├── export/          # CSV export
│   │   └── cron/scan/       # Automated weekly scan
│   └── page.tsx             # Dashboard UI
├── components/
│   ├── CompetitorsPanel.tsx
│   ├── DriftAnalysisPanel.tsx
│   ├── ProofVaultPanel.tsx
│   └── ReportsPanel.tsx
├── lib/
│   ├── types.ts             # TypeScript definitions
│   ├── db.ts                # Redis operations
│   ├── scraper.ts           # Web scraping
│   └── analyzer.ts          # LLM drift analysis
└── vercel.json              # Cron configuration
```

## Security Notes

- The cron endpoint requires `CRON_SECRET` in Authorization header
- Redis credentials should never be committed to git
- Use environment variables for all secrets
- The `.env.local` file is gitignored by default

## Troubleshooting

### Redis Connection Issues
- Verify UPSTASH_REDIS_REST_URL and TOKEN are correct
- Check Upstash dashboard for database status
- Ensure database is in the same region as Vercel deployment

### Email Not Sending
- Verify RESEND_API_KEY is valid
- Check domain verification in Resend dashboard
- For testing, use `onboarding@resend.dev` as from address

### Cron Not Running
- Verify vercel.json is in project root
- Check cron logs in Vercel Dashboard → Deployments → Logs
- Ensure CRON_SECRET environment variable is set

## Upgrading to AI Mode

Currently running in **Simple Mode** (text comparison only). Want AI-powered strategic insights?

### What You Get With AI

**Current (Simple Mode):**
- ✅ Detects text changes
- ✅ Extracts new keywords
- ✅ Basic drift scoring
- ❌ Manual "So What?" analysis required

**With AI Mode:**
- ✅ All of the above, plus:
- ✅ AI-generated strategic implications
- ✅ Automated "So What?" insights
- ✅ Intelligent categorization (Trust, Speed, Control, etc.)
- ✅ Context-aware recommendations
- **Cost**: ~$0.03 per scan (~$1.50/year for weekly scans)

### How to Upgrade

1. **Get Anthropic API Key**
   - Sign up at https://console.anthropic.com/
   - Add $10 credits (lasts ~300 scans)

2. **Install AI Dependencies**
   ```bash
   npm install @ai-sdk/anthropic ai
   ```

3. **Restore AI Analyzer**
   ```bash
   mv lib/analyzer-ai.ts.backup lib/analyzer.ts
   mv lib/analyzer-simple.ts lib/analyzer-simple.ts.backup
   ```

4. **Update API Routes**
   Replace all imports:
   ```typescript
   // Change from:
   import { analyzeDrift } from '@/lib/analyzer-simple';

   // To:
   import { analyzeDrift } from '@/lib/analyzer';
   ```

5. **Add Environment Variable**
   ```bash
   # In Vercel Dashboard or .env.local
   ANTHROPIC_API_KEY=sk-ant-your_key_here
   ```

6. **Deploy**
   ```bash
   git add . && git commit -m "Upgrade to AI mode" && git push
   ```

The AI analyzer backup is already in your codebase at `lib/analyzer-ai.ts.backup`.

## License

MIT

## Credits

Built with the "Systems, Not Slides" framework by Ray Beharry.
