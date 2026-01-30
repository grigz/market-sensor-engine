import { NextRequest, NextResponse } from 'next/server';
import { scrapeCompetitorPage } from '@/lib/scraper';
import { analyzeDrift } from '@/lib/analyzer';
import {
  getCompetitorConfigs,
  saveSnapshot,
  getLatestSnapshot,
  getBaselineSnapshot,
  saveDriftAnalysis,
  updateCompetitorConfig,
} from '@/lib/db';

// POST /api/scan - Trigger a manual scan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (url) {
      // Scan a specific competitor
      return await scanSingleCompetitor(url);
    } else {
      // Scan all active competitors
      return await scanAllCompetitors();
    }
  } catch (error) {
    console.error('Error during scan:', error);
    return NextResponse.json(
      { error: 'Failed to complete scan', details: String(error) },
      { status: 500 }
    );
  }
}

async function scanSingleCompetitor(url: string) {
  const configs = await getCompetitorConfigs();
  const config = configs.find(c => c.url === url);

  if (!config) {
    return NextResponse.json(
      { error: 'Competitor not found' },
      { status: 404 }
    );
  }

  try {
    // Scrape current state
    const currentSnapshot = await scrapeCompetitorPage(config.url, config.name);
    await saveSnapshot(currentSnapshot);

    // Get baseline for comparison
    const baseline = await getBaselineSnapshot(config.url);

    let driftAnalysis = null;

    if (baseline && baseline.id !== currentSnapshot.id) {
      // Perform drift analysis
      driftAnalysis = await analyzeDrift(baseline, currentSnapshot);
      await saveDriftAnalysis(driftAnalysis);
    }

    // Update last scanned timestamp
    await updateCompetitorConfig(config.url, { lastScanned: new Date() });

    return NextResponse.json({
      success: true,
      competitor: config.name,
      snapshot: currentSnapshot,
      driftAnalysis,
    });
  } catch (error) {
    console.error(`Error scanning ${config.name}:`, error);
    return NextResponse.json(
      { error: `Failed to scan ${config.name}`, details: String(error) },
      { status: 500 }
    );
  }
}

async function scanAllCompetitors() {
  const configs = await getCompetitorConfigs();
  const activeConfigs = configs.filter(c => c.active);

  if (activeConfigs.length === 0) {
    return NextResponse.json(
      { error: 'No active competitors to scan' },
      { status: 400 }
    );
  }

  const results = [];

  for (const config of activeConfigs) {
    try {
      // Scrape current state
      const currentSnapshot = await scrapeCompetitorPage(config.url, config.name);
      await saveSnapshot(currentSnapshot);

      // Get baseline for comparison
      const baseline = await getBaselineSnapshot(config.url);

      let driftAnalysis = null;

      if (baseline && baseline.id !== currentSnapshot.id) {
        // Perform drift analysis
        driftAnalysis = await analyzeDrift(baseline, currentSnapshot);
        await saveDriftAnalysis(driftAnalysis);
      }

      // Update last scanned timestamp
      await updateCompetitorConfig(config.url, { lastScanned: new Date() });

      results.push({
        competitor: config.name,
        success: true,
        driftScore: driftAnalysis?.driftScore || 0,
      });
    } catch (error) {
      console.error(`Error scanning ${config.name}:`, error);
      results.push({
        competitor: config.name,
        success: false,
        error: String(error),
      });
    }
  }

  return NextResponse.json({
    success: true,
    scannedCount: results.filter(r => r.success).length,
    totalCount: activeConfigs.length,
    results,
  });
}
