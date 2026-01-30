import { NextRequest, NextResponse } from 'next/server';
import {
  getRecentMarketPulseReports,
  getMarketPulseReport,
  saveMarketPulseReport,
  getAllDriftAnalyses,
} from '@/lib/db';
import { generateActionItems, generateMarketPulseEmail } from '@/lib/analyzer-simple';
import { Resend } from 'resend';
import type { MarketPulseReport } from '@/lib/types';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'dummy_key');
}

// GET /api/reports - Get recent market pulse reports
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportId = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (reportId) {
      const report = await getMarketPulseReport(reportId);
      if (!report) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(report);
    }

    const reports = await getRecentMarketPulseReports(limit);
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Generate and optionally send a market pulse report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sendEmail, recipients } = body;

    // Get all recent drift analyses
    const driftAnalyses = await getAllDriftAnalyses();

    if (driftAnalyses.length === 0) {
      return NextResponse.json(
        { error: 'No drift analyses available to generate report' },
        { status: 400 }
      );
    }

    // Collect all implications
    const allImplications = driftAnalyses.flatMap(d => d.implications);

    // Generate action items
    const actionItems = await generateActionItems(allImplications);

    // Create report
    const report: MarketPulseReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date(),
      driftAnalyses,
      topImplications: allImplications
        .filter(i => i.severity === 'high' || i.severity === 'medium')
        .slice(0, 10),
      recommendedActions: actionItems,
      sentViaEmail: false,
    };

    await saveMarketPulseReport(report);

    // Send email if requested
    if (sendEmail && recipients && recipients.length > 0) {
      const { subject, html } = await generateMarketPulseEmail(
        driftAnalyses,
        actionItems
      );

      try {
        await getResend().emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Market Sensor <onboarding@resend.dev>',
          to: recipients,
          subject,
          html,
        });

        report.sentViaEmail = true;
        report.sentAt = new Date();
        await saveMarketPulseReport(report);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: String(error) },
      { status: 500 }
    );
  }
}
