import { NextRequest, NextResponse } from 'next/server';
import { addCompetitorConfig, getCompetitorConfigs, updateCompetitorConfig } from '@/lib/db';
import type { CompetitorConfig } from '@/lib/types';

// GET /api/competitors - Get all competitor configurations
export async function GET() {
  try {
    const competitors = await getCompetitorConfigs();
    return NextResponse.json(competitors);
  } catch (error) {
    console.error('Error fetching competitors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitors' },
      { status: 500 }
    );
  }
}

// POST /api/competitors - Add a new competitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, name } = body;

    if (!url || !name) {
      return NextResponse.json(
        { error: 'URL and name are required' },
        { status: 400 }
      );
    }

    const config: CompetitorConfig = {
      url,
      name,
      active: true,
      addedAt: new Date(),
    };

    await addCompetitorConfig(config);

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('Error adding competitor:', error);
    return NextResponse.json(
      { error: 'Failed to add competitor' },
      { status: 500 }
    );
  }
}

// PATCH /api/competitors - Update competitor configuration
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, ...updates } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    await updateCompetitorConfig(url, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating competitor:', error);
    return NextResponse.json(
      { error: 'Failed to update competitor' },
      { status: 500 }
    );
  }
}
