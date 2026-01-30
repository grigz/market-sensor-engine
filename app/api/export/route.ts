import { NextResponse } from 'next/server';
import { getAllDriftAnalyses, getAllProofRecords } from '@/lib/db';
import { generateActionItems } from '@/lib/analyzer-simple';

// GET /api/export - Export all data as CSV
export async function GET() {
  try {
    const driftAnalyses = await getAllDriftAnalyses();
    const proofRecords = await getAllProofRecords();

    // Generate CSV header
    const headers = [
      'Date',
      'Competitor',
      'Drift Score',
      'Implication',
      'So What',
      'Narrative Tag',
      'Persona',
      'Stage',
      'Severity',
      'Proof ID',
      'Action Status',
    ];

    const rows: string[][] = [headers];

    // Process each drift analysis
    for (const drift of driftAnalyses) {
      const actionItems = await generateActionItems(drift.implications);

      for (let i = 0; i < drift.implications.length; i++) {
        const imp = drift.implications[i];
        const action = actionItems[i];

        rows.push([
          drift.analyzedAt.toISOString().split('T')[0],
          drift.competitorName,
          drift.driftScore.toString(),
          imp.text,
          imp.soWhat,
          imp.narrativeTag,
          imp.persona,
          imp.stage,
          imp.severity,
          action?.proofId || '',
          action?.status || '',
        ]);
      }
    }

    // Convert to CSV
    const csv = rows
      .map(row =>
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma or quote
          const escaped = cell.replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
            ? `"${escaped}"`
            : escaped;
        }).join(',')
      )
      .join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="market-pulse-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
