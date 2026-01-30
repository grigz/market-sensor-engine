import type { CompetitorSnapshot, DriftAnalysis, DriftImplication, ActionItem } from './types';
import { searchProofRecords } from './db';

// Simple text-based drift detection without LLM
export async function analyzeDrift(
  baseline: CompetitorSnapshot,
  current: CompetitorSnapshot
): Promise<DriftAnalysis> {
  // Extract words from both snapshots
  const baselineWords = extractWords([
    baseline.heroText,
    ...baseline.subheads,
    ...baseline.pricingBlocks,
  ]);

  const currentWords = extractWords([
    current.heroText,
    ...current.subheads,
    ...current.pricingBlocks,
  ]);

  // Find new words (nouns/verbs - simple heuristic)
  const newWords = currentWords.filter(word => !baselineWords.includes(word));
  const newNouns = newWords.filter(word =>
    word.length > 4 && /^[A-Z]/.test(word) // Capitalized words likely nouns
  );
  const newVerbs = newWords.filter(word =>
    ['ing', 'ed', 'ify', 'ize'].some(suffix => word.endsWith(suffix))
  );

  // Detect tone shifts (basic keyword changes)
  const toneShifts = detectToneShifts(baseline, current);

  // Calculate drift score (0-100)
  const driftScore = calculateDriftScore(baseline, current, newWords.length);

  // Generate basic implications
  const implications = generateBasicImplications(
    baseline,
    current,
    newNouns,
    newVerbs,
    toneShifts
  );

  const analysis: DriftAnalysis = {
    id: `drift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    competitorUrl: current.competitorUrl,
    competitorName: current.competitorName,
    analyzedAt: new Date(),
    driftScore,
    newNouns: newNouns.slice(0, 10),
    newVerbs: newVerbs.slice(0, 10),
    toneShifts,
    implications,
    trajectoryCall: driftScore >= 30 ? 'Significant language drift detected' : undefined,
  };

  return analysis;
}

function extractWords(texts: string[]): string[] {
  const allText = texts.join(' ');
  return allText
    .split(/\s+/)
    .map(word => word.replace(/[^a-zA-Z0-9-]/g, ''))
    .filter(word => word.length > 2);
}

function detectToneShifts(baseline: CompetitorSnapshot, current: CompetitorSnapshot): string[] {
  const shifts: string[] = [];

  // Check hero text changes
  if (baseline.heroText !== current.heroText) {
    shifts.push(`Hero text changed from "${baseline.heroText.substring(0, 50)}..." to "${current.heroText.substring(0, 50)}..."`);
  }

  // Check for keyword category shifts
  const baselineKeywords = categorizeKeywords(baseline.heroText + ' ' + baseline.subheads.join(' '));
  const currentKeywords = categorizeKeywords(current.heroText + ' ' + current.subheads.join(' '));

  if (baselineKeywords.ai < 2 && currentKeywords.ai >= 2) {
    shifts.push('Added AI/ML positioning');
  }
  if (baselineKeywords.enterprise < 2 && currentKeywords.enterprise >= 2) {
    shifts.push('Moving upmarket to enterprise');
  }
  if (baselineKeywords.speed > currentKeywords.speed + 1) {
    shifts.push('De-emphasizing speed/performance');
  }

  return shifts;
}

function categorizeKeywords(text: string): {
  ai: number;
  enterprise: number;
  speed: number;
  security: number;
  cost: number;
} {
  const lower = text.toLowerCase();

  return {
    ai: (lower.match(/\b(ai|artificial intelligence|machine learning|ml|neural|gpt|llm)\b/g) || []).length,
    enterprise: (lower.match(/\b(enterprise|business|organization|team|scale)\b/g) || []).length,
    speed: (lower.match(/\b(fast|quick|instant|real-time|performance|latency)\b/g) || []).length,
    security: (lower.match(/\b(secure|security|encryption|compliance|private|privacy)\b/g) || []).length,
    cost: (lower.match(/\b(free|cheap|affordable|cost|price|pricing)\b/g) || []).length,
  };
}

function calculateDriftScore(
  baseline: CompetitorSnapshot,
  current: CompetitorSnapshot,
  newWordCount: number
): number {
  let score = 0;

  // Hero text change (high impact)
  if (baseline.heroText !== current.heroText) {
    score += 30;
  }

  // Subheads changes
  const subheadChanges = current.subheads.filter(
    (sh, i) => sh !== baseline.subheads[i]
  ).length;
  score += Math.min(subheadChanges * 10, 30);

  // Pricing changes (high impact)
  const pricingChanged = current.pricingBlocks.some(
    (pb, i) => pb !== baseline.pricingBlocks[i]
  );
  if (pricingChanged) {
    score += 20;
  }

  // New vocabulary
  score += Math.min(newWordCount * 2, 20);

  return Math.min(score, 100);
}

function generateBasicImplications(
  baseline: CompetitorSnapshot,
  current: CompetitorSnapshot,
  newNouns: string[],
  newVerbs: string[],
  toneShifts: string[]
): DriftImplication[] {
  const implications: DriftImplication[] = [];

  // Hero text change
  if (baseline.heroText !== current.heroText) {
    implications.push({
      text: `Hero text updated: "${current.heroText.substring(0, 100)}..."`,
      soWhat: 'Primary messaging has changed. Review their new positioning.',
      narrativeTag: 'Trust',
      persona: 'CTO',
      stage: 'Awareness',
      severity: 'high',
    });
  }

  // New terminology
  if (newNouns.length > 0) {
    implications.push({
      text: `New product terms added: ${newNouns.slice(0, 5).join(', ')}`,
      soWhat: 'Competitor is introducing new features or capabilities. Investigate what they launched.',
      narrativeTag: 'Innovation',
      persona: 'VP Engineering',
      stage: 'Consideration',
      severity: 'medium',
    });
  }

  // Tone shifts
  toneShifts.forEach(shift => {
    implications.push({
      text: shift,
      soWhat: 'Strategic positioning change detected. Monitor their messaging evolution.',
      narrativeTag: 'Control',
      persona: 'Product Manager',
      stage: 'Awareness',
      severity: 'medium',
    });
  });

  // Ensure at least one implication
  if (implications.length === 0) {
    implications.push({
      text: 'Minor updates detected in competitor messaging',
      soWhat: 'Small textual changes - likely routine updates.',
      narrativeTag: 'Trust',
      persona: 'CTO',
      stage: 'Awareness',
      severity: 'low',
    });
  }

  return implications.slice(0, 5);
}

export async function generateActionItems(
  implications: DriftImplication[]
): Promise<ActionItem[]> {
  const actionItems: ActionItem[] = [];

  for (const implication of implications) {
    // Search for relevant proof in the vault
    const proofs = await searchProofRecords({
      narrativeTag: implication.narrativeTag,
      persona: implication.persona,
      stage: implication.stage,
    });

    // Generate simple action item
    const status = proofs.length > 0 ? 'VALIDATED' : 'INSUFFICIENT_DATA';
    const proofId = proofs.length > 0 ? proofs[0].proofId : null;

    actionItems.push({
      line: implication.text,
      proofId,
      nextStep: status === 'INSUFFICIENT_DATA'
        ? '[INSUFFICIENT DATA—PROOF NEEDED] Add proof to vault to validate this counter-move'
        : 'Review proof and decide on counter-messaging strategy',
      narrativeTag: implication.narrativeTag,
      persona: implication.persona,
      stage: implication.stage,
      status,
    });
  }

  return actionItems;
}

export async function generateMarketPulseEmail(
  driftAnalyses: DriftAnalysis[],
  actionItems: ActionItem[]
): Promise<{ subject: string; html: string }> {
  const highDriftCompetitors = driftAnalyses.filter(d => d.driftScore >= 30);
  const topImplications = driftAnalyses
    .flatMap(d => d.implications)
    .filter(i => i.severity === 'high' || i.severity === 'medium')
    .slice(0, 5);

  const validatedActions = actionItems.filter(a => a.status === 'VALIDATED');
  const unvalidatedActions = actionItems.filter(a => a.status === 'INSUFFICIENT_DATA');

  const subject = `Market Pulse: ${highDriftCompetitors.length} Competitor Change${highDriftCompetitors.length !== 1 ? 's' : ''} Detected`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #667eea; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 8px; }
    .drift-card { background: #f7fafc; border-left: 4px solid #667eea; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
    .drift-score { font-size: 24px; font-weight: bold; color: #667eea; }
    .implication { background: white; border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 10px; border-radius: 4px; }
    .tag { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px; }
    .tag-narrative { background: #667eea; color: white; }
    .tag-persona { background: #48bb78; color: white; }
    .tag-stage { background: #ed8936; color: white; }
    .action-item { background: #edf2f7; padding: 15px; margin-bottom: 15px; border-radius: 4px; border-left: 4px solid #48bb78; }
    .action-validated { border-left-color: #48bb78; }
    .action-unvalidated { border-left-color: #f56565; background: #fff5f5; }
    .proof-badge { display: inline-block; padding: 4px 8px; background: #48bb78; color: white; border-radius: 4px; font-size: 11px; font-weight: bold; }
    .warning-badge { display: inline-block; padding: 4px 8px; background: #f56565; color: white; border-radius: 4px; font-size: 11px; font-weight: bold; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px; }
    .notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Market Pulse Report</h1>
      <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="notice">
      <strong>Note:</strong> This report uses basic text comparison (no AI analysis). Insights require manual review.
    </div>

    <div class="section">
      <h2>🎯 Detected Changes</h2>
      ${highDriftCompetitors.map(drift => `
        <div class="drift-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong>${drift.competitorName}</strong>
            <span class="drift-score">${drift.driftScore}</span>
          </div>
          ${drift.trajectoryCall ? `<p><strong>Signal:</strong> ${drift.trajectoryCall}</p>` : ''}
          ${drift.newNouns.length > 0 ? `<p><strong>New Terms:</strong> ${drift.newNouns.join(', ')}</p>` : ''}
          ${drift.toneShifts.length > 0 ? `<p><strong>Changes:</strong> ${drift.toneShifts.join('; ')}</p>` : ''}
        </div>
      `).join('')}
      ${highDriftCompetitors.length === 0 ? '<p>No significant changes detected this week.</p>' : ''}
    </div>

    <div class="section">
      <h2>💡 Key Changes</h2>
      ${topImplications.map(imp => `
        <div class="implication">
          <p><strong>${imp.text}</strong></p>
          <p style="color: #4a5568; margin: 8px 0;">${imp.soWhat}</p>
          <div>
            <span class="tag tag-narrative">${imp.narrativeTag}</span>
            <span class="tag tag-persona">${imp.persona}</span>
            <span class="tag tag-stage">${imp.stage}</span>
          </div>
        </div>
      `).join('')}
    </div>

    ${validatedActions.length > 0 ? `
      <div class="section">
        <h2>✅ Validated Counter-Moves (LPNS)</h2>
        ${validatedActions.map(action => `
          <div class="action-item action-validated">
            <p><strong>Line:</strong> ${action.line}</p>
            <p><strong>Proof:</strong> <span class="proof-badge">✓ ${action.proofId}</span></p>
            <p><strong>Next Step:</strong> ${action.nextStep}</p>
            <div style="margin-top: 8px;">
              <span class="tag tag-narrative">${action.narrativeTag}</span>
              <span class="tag tag-persona">${action.persona}</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${unvalidatedActions.length > 0 ? `
      <div class="section">
        <h2>⚠️ Requires Proof Validation</h2>
        ${unvalidatedActions.map(action => `
          <div class="action-item action-unvalidated">
            <p><strong>Line:</strong> ${action.line}</p>
            <p><span class="warning-badge">INSUFFICIENT DATA—PROOF NEEDED</span></p>
            <p><strong>Next Step:</strong> ${action.nextStep.replace('[INSUFFICIENT DATA—PROOF NEEDED] ', '')}</p>
            <div style="margin-top: 8px;">
              <span class="tag tag-narrative">${action.narrativeTag}</span>
              <span class="tag tag-persona">${action.persona}</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div class="footer">
      <p>🤖 Generated by Market Sensor Engine (Simple Mode)</p>
      <p>Built with the "Systems, Not Slides" framework by Ray Beharry</p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}
