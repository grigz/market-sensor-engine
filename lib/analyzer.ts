import { anthropic } from '@ai-sdk/anthropic';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import type { CompetitorSnapshot, DriftAnalysis, DriftImplication, ActionItem, ProofRecord } from './types';
import { searchProofRecords } from './db';

const DriftImplicationSchema = z.object({
  text: z.string(),
  soWhat: z.string(),
  narrativeTag: z.enum(['Trust', 'Speed', 'Control', 'Innovation', 'Cost', 'Security']),
  persona: z.enum(['CTO', 'CFO', 'Data Engineer', 'VP Engineering', 'Product Manager']),
  stage: z.enum(['Awareness', 'Consideration', 'Decision']),
  severity: z.enum(['low', 'medium', 'high']),
});

export async function analyzeDrift(
  baseline: CompetitorSnapshot,
  current: CompetitorSnapshot
): Promise<DriftAnalysis> {
  // Build the comparison prompt
  const prompt = `You are a competitive intelligence analyst. Compare two snapshots of a competitor's website and identify language drift.

BASELINE SNAPSHOT (90 days ago):
Hero: ${baseline.heroText}
Subheads: ${baseline.subheads.join(', ')}
Pricing: ${baseline.pricingBlocks.join(' | ')}

CURRENT SNAPSHOT:
Hero: ${current.heroText}
Subheads: ${current.subheads.join(', ')}
Pricing: ${current.pricingBlocks.join(' | ')}

Analyze the drift and provide:
1. newNouns: New nouns or product terms that appeared
2. newVerbs: New action words or verbs that appeared
3. toneShifts: Changes in tone, positioning, or framing
4. driftScore: A score from 0-100 indicating magnitude of change (0=no change, 100=complete repositioning)
5. implications: An array of 2-5 key implications with "So What?" analysis

For each implication:
- text: What changed
- soWhat: Why it matters and what it signals about their strategy
- narrativeTag: Which narrative theme (Trust, Speed, Control, Innovation, Cost, Security)
- persona: Who cares most (CTO, CFO, Data Engineer, VP Engineering, Product Manager)
- stage: Where in buyer journey (Awareness, Consideration, Decision)
- severity: How significant (low, medium, high)

Be specific and actionable. Focus on strategic signals, not cosmetic changes.`;

  const result = await generateObject({
    model: anthropic('claude-3-5-sonnet-20241022'),
    schema: z.object({
      newNouns: z.array(z.string()),
      newVerbs: z.array(z.string()),
      toneShifts: z.array(z.string()),
      driftScore: z.number().min(0).max(100),
      implications: z.array(DriftImplicationSchema),
      trajectoryCall: z.string().optional(),
    }),
    prompt,
  });

  const analysis: DriftAnalysis = {
    id: `drift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    competitorUrl: current.competitorUrl,
    competitorName: current.competitorName,
    analyzedAt: new Date(),
    driftScore: result.object.driftScore,
    newNouns: result.object.newNouns,
    newVerbs: result.object.newVerbs,
    toneShifts: result.object.toneShifts,
    implications: result.object.implications as DriftImplication[],
    trajectoryCall: result.object.trajectoryCall,
  };

  return analysis;
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

    // Generate action item with LPNS pattern
    const prompt = `You are a strategic advisor. Given this competitive insight, generate a recommended action.

INSIGHT: ${implication.text}
SO WHAT: ${implication.soWhat}
NARRATIVE: ${implication.narrativeTag}
PERSONA: ${implication.persona}
STAGE: ${implication.stage}

Generate a concise action recommendation following this pattern:
- Line: The strategic insight in one sentence
- Next Step: A specific, actionable next step

Be direct and actionable. Focus on counter-moves, not just observations.`;

    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      prompt,
    });

    const lines = result.text.split('\n').filter(l => l.trim());
    const line = lines.find(l => l.includes('Line:'))?.replace('Line:', '').trim() || implication.text;
    const nextStep = lines.find(l => l.includes('Next Step:'))?.replace('Next Step:', '').trim() ||
      'Review and validate with proof from vault';

    // Apply Safety Stop Rule: Only validate if we have proof
    const status = proofs.length > 0 ? 'VALIDATED' : 'INSUFFICIENT_DATA';
    const proofId = proofs.length > 0 ? proofs[0].proofId : null;

    actionItems.push({
      line,
      proofId,
      nextStep: status === 'INSUFFICIENT_DATA'
        ? '[INSUFFICIENT DATA—PROOF NEEDED] ' + nextStep
        : nextStep,
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

  const subject = `Market Pulse: ${highDriftCompetitors.length} Trajectory Call${highDriftCompetitors.length !== 1 ? 's' : ''} Detected`;

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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Market Pulse Report</h1>
      <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="section">
      <h2>🎯 Trajectory Calls</h2>
      ${highDriftCompetitors.map(drift => `
        <div class="drift-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong>${drift.competitorName}</strong>
            <span class="drift-score">${drift.driftScore}</span>
          </div>
          ${drift.trajectoryCall ? `<p><strong>Signal:</strong> ${drift.trajectoryCall}</p>` : ''}
          ${drift.newNouns.length > 0 ? `<p><strong>New Terms:</strong> ${drift.newNouns.join(', ')}</p>` : ''}
          ${drift.toneShifts.length > 0 ? `<p><strong>Tone Shifts:</strong> ${drift.toneShifts.join('; ')}</p>` : ''}
        </div>
      `).join('')}
      ${highDriftCompetitors.length === 0 ? '<p>No high-drift signals detected this week.</p>' : ''}
    </div>

    <div class="section">
      <h2>💡 Key Implications</h2>
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
      <p>🤖 Generated by Market Sensor Engine</p>
      <p>Built with the "Systems, Not Slides" framework by Ray Beharry</p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}
