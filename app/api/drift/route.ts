import { NextResponse } from 'next/server';
import { getAllDriftAnalyses } from '@/lib/db';

// GET /api/drift - Get all drift analyses
export async function GET() {
  try {
    const analyses = await getAllDriftAnalyses();
    return NextResponse.json(analyses);
  } catch (error) {
    console.error('Error fetching drift analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drift analyses' },
      { status: 500 }
    );
  }
}
