# Quick Start Guide

Get your Market Sensor Engine running in 5 minutes.

> **Simple Mode**: No AI required. Uses basic text comparison.

## Step 1: Set Up Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

### Required Services

You need API keys from these services:

1. **Upstash Redis** (Database)
   - Go to https://console.upstash.com/
   - Click "Create Database"
   - Copy REST URL and TOKEN
   - Or use Vercel Integration: https://vercel.com/integrations/upstash

2. **Resend** (Email)
   - Sign up at https://resend.com/
   - Create API key
   - For testing, use `onboarding@resend.dev` as FROM email

3. **Generate Cron Secret**
   ```bash
   openssl rand -base64 32
   ```

### Your .env.local file should look like:

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=Market Sensor <onboarding@resend.dev>

MARKET_PULSE_RECIPIENTS=youremail@example.com

CRON_SECRET=your_random_secret_here
```

## Step 2: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Step 3: Add Your First Competitor

1. Click "Add Competitor"
2. Enter name (e.g., "Acme Corp")
3. Enter URL (e.g., "https://acme.com")
4. Click "Scan Now" to create baseline

**Start your 90-Day Copy Seismograph with your top 3 rivals!**

## Step 4: Build Your Proof Vault

1. Go to "Proof Vault" tab
2. Click "Add Proof"
3. Add evidence with:
   - What you can prove
   - Source link (case study, docs, etc.)
   - Tags (Narrative, Persona, Stage)

This enables the Safety Stop Rule - every counter-move needs proof.

## Step 5: Generate Your First Market Pulse Report

1. After scanning competitors, go to "Market Pulse Reports"
2. Click "Generate Market Pulse Report"
3. Optional: Send via email to see LPNS pattern in action

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add all your environment variables in:
# Vercel Dashboard → Settings → Environment Variables
```

The cron job will run automatically **every Monday at 9 AM UTC**.

## Architecture Overview

```
Your Predictive CI Loop:
┌─────────────────────────────────────────────┐
│  1. COLLECT  → Scrape competitor websites   │
│  2. COMPARE  → Auto-diff vs. 90-day baseline│
│  3. CONCLUDE → LLM analyzes drift & impact  │
│  4. COMMUNICATE → Email Market Pulse report │
│  5. COUNTER  → Validated actions with proof │
└─────────────────────────────────────────────┘
```

## Troubleshooting

**Build fails?**
- Make sure all environment variables are set
- Check that API keys are valid

**Scan fails?**
- Verify competitor URL is accessible
- Check ANTHROPIC_API_KEY has credits

**Email not sending?**
- Verify RESEND_API_KEY
- For testing, use `onboarding@resend.dev` as FROM

**Redis errors?**
- Verify UPSTASH credentials
- Check database is active in Upstash dashboard

## What's Next?

### Stop / Start / Scale

**Stop**: Building static competitive grids

**Start**: Your 90-Day Copy Seismograph with top 3 rivals

**Scale**: Forward your first Market Pulse email to leadership

## Support

- Full documentation: See README.md
- Issues: Check error logs in Vercel dashboard
- Questions: Review the comprehensive README

---

Built with "Systems, Not Slides" framework by Ray Beharry
