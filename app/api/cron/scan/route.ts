import { NextRequest, NextResponse } from 'next/server';
import { scrapeCompetitorPage } from '@/lib/scraper';
import { analyzeDrift, generateActionItems, generateMarketPulseEmail } from '@/lib/analyzer-simple';
import {
  getCompetitorConfigs,
  saveSnapshot,
  getBaselineSnapshot,
  saveDriftAnalysis,
  updateCompetitorConfig,
  saveMarketPulseReport,
} from '@/lib/db';
import { Resend } from 'resend';
import type { DriftAnalysis, MarketPulseReport } from '@/lib/types';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'dummy_key');
}

// GET /api/cron/scan - Cron job endpoint (triggered by Vercel Cron)
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const configs = await getCompetitorConfigs();
    const activeConfigs = configs.filter(c => c.active);

    if (activeConfigs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active competitors to scan',
      });
    }

    const driftAnalyses: DriftAnalysis[] = [];

    // Scan all competitors
    for (const config of activeConfigs) {
      try {
        // Scrape current state
        const currentSnapshot = await scrapeCompetitorPage(config.url, config.name);
        await saveSnapshot(currentSnapshot);

        // Get baseline for comparison
        const baseline = await getBaselineSnapshot(config.url);

        if (baseline && baseline.id !== currentSnapshot.id) {
          // Perform drift analysis
          const driftAnalysis = await analyzeDrift(baseline, currentSnapshot);
          await saveDriftAnalysis(driftAnalysis);
          driftAnalyses.push(driftAnalysis);
        }

        // Update last scanned timestamp
        await updateCompetitorConfig(config.url, { lastScanned: new Date() });
      } catch (error) {
        console.error(`Error scanning ${config.name}:`, error);
        // Continue with other competitors even if one fails
      }
    }

    // Check if we should send a Market Pulse email
    const highDriftAnalyses = driftAnalyses.filter(d => d.driftScore >= 30);
    const shouldSendEmail = highDriftAnalyses.length > 0;

    if (shouldSendEmail && driftAnalyses.length > 0) {
      // Generate action items
      const allImplications = driftAnalyses.flatMap(d => d.implications);
      const actionItems = await generateActionItems(allImplications);

      // Generate email
      const { subject, html } = await generateMarketPulseEmail(
        driftAnalyses,
        actionItems
      );

      // Send email
      const recipients = process.env.MARKET_PULSE_RECIPIENTS?.split(',') || [];

      if (recipients.length > 0) {
        try {
          await getResend().emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Market Sensor <onboarding@resend.dev>',
            to: recipients,
            subject,
            html,
          });

          // Save report
          const report: MarketPulseReport = {
            id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            generatedAt: new Date(),
            driftAnalyses,
            topImplications: allImplications
              .filter(i => i.severity === 'high' || i.severity === 'medium')
              .slice(0, 10),
            recommendedActions: actionItems,
            sentViaEmail: true,
            sentAt: new Date(),
          };

          await saveMarketPulseReport(report);
        } catch (emailError) {
          console.error('Error sending Market Pulse email:', emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      scannedCount: activeConfigs.length,
      driftDetected: driftAnalyses.length,
      emailSent: shouldSendEmail,
      highDriftCount: highDriftAnalyses.length,
    });
  } catch (error) {
    console.error('Error in cron scan:', error);
    return NextResponse.json(
      { error: 'Cron scan failed', details: String(error) },
      { status: 500 }
    );
  }
}
