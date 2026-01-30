import { NextRequest, NextResponse } from 'next/server';
import {
  saveProofRecord,
  getProofRecord,
  getAllProofRecords,
  deleteProofRecord,
  searchProofRecords,
} from '@/lib/db';
import type { ProofRecord } from '@/lib/types';

// GET /api/proof - Get all proof records or search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const persona = searchParams.get('persona');
    const narrativeTag = searchParams.get('narrativeTag');
    const stage = searchParams.get('stage');
    const proofId = searchParams.get('proofId');

    if (proofId) {
      const proof = await getProofRecord(proofId);
      if (!proof) {
        return NextResponse.json(
          { error: 'Proof record not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(proof);
    }

    if (persona || narrativeTag || stage) {
      const results = await searchProofRecords({
        persona: persona || undefined,
        narrativeTag: narrativeTag || undefined,
        stage: stage || undefined,
      });
      return NextResponse.json(results);
    }

    const allProofs = await getAllProofRecords();
    return NextResponse.json(allProofs);
  } catch (error) {
    console.error('Error fetching proof records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proof records' },
      { status: 500 }
    );
  }
}

// POST /api/proof - Create a new proof record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      evidenceSentence,
      sourceLink,
      personaTag,
      narrativeTag,
      stage,
      expiryDate,
    } = body;

    if (!evidenceSentence || !sourceLink || !personaTag || !narrativeTag || !stage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate ProofID
    const proofId = `PROOF-${narrativeTag.toUpperCase()}-${personaTag.replace(/\s+/g, '')}-${Date.now().toString(36).toUpperCase()}`;

    const proof: ProofRecord = {
      proofId,
      evidenceSentence,
      sourceLink,
      personaTag,
      narrativeTag,
      stage,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveProofRecord(proof);

    return NextResponse.json(proof, { status: 201 });
  } catch (error) {
    console.error('Error creating proof record:', error);
    return NextResponse.json(
      { error: 'Failed to create proof record' },
      { status: 500 }
    );
  }
}

// DELETE /api/proof?proofId=XXX - Delete a proof record
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const proofId = searchParams.get('proofId');

    if (!proofId) {
      return NextResponse.json(
        { error: 'proofId is required' },
        { status: 400 }
      );
    }

    await deleteProofRecord(proofId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting proof record:', error);
    return NextResponse.json(
      { error: 'Failed to delete proof record' },
      { status: 500 }
    );
  }
}
