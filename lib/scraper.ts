import * as cheerio from 'cheerio';
import type { CompetitorSnapshot } from './types';

export async function scrapeCompetitorPage(url: string, name: string): Promise<CompetitorSnapshot> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MarketSensorBot/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove script and style tags
  $('script, style, noscript').remove();

  // Extract hero text (usually in h1, first large heading, or hero section)
  const heroText =
    $('h1').first().text().trim() ||
    $('[class*="hero"] h1, [class*="hero"] h2').first().text().trim() ||
    $('h1, h2').first().text().trim() ||
    '';

  // Extract subheads (h2, h3 tags)
  const subheads: string[] = [];
  $('h2, h3').each((_, elem) => {
    const text = $(elem).text().trim();
    if (text && text.length > 5 && text.length < 200) {
      subheads.push(text);
    }
  });

  // Extract pricing blocks (look for pricing-related sections)
  const pricingBlocks: string[] = [];
  $('[class*="pricing"], [class*="price"], [id*="pricing"], [id*="price"]').each((_, elem) => {
    const text = $(elem).text().trim();
    if (text && text.length > 10 && text.length < 500) {
      pricingBlocks.push(text);
    }
  });

  // Also check for common pricing patterns
  $('*').filter((_, elem) => {
    const text = $(elem).text().toLowerCase();
    return (
      text.includes('$') &&
      (text.includes('month') || text.includes('year') || text.includes('/mo'))
    );
  }).each((_, elem) => {
    const text = $(elem).text().trim();
    if (text && text.length > 10 && text.length < 200 && !pricingBlocks.includes(text)) {
      pricingBlocks.push(text);
    }
  });

  const snapshot: CompetitorSnapshot = {
    id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    competitorUrl: url,
    competitorName: name,
    capturedAt: new Date(),
    heroText,
    subheads: subheads.slice(0, 10), // Keep top 10
    pricingBlocks: pricingBlocks.slice(0, 5), // Keep top 5
    rawHtml: html,
  };

  return snapshot;
}

export function extractKeyPhrases(text: string): string[] {
  // Simple extraction of noun phrases and key terms
  const words = text.toLowerCase().split(/\s+/);
  const keyPhrases: string[] = [];

  // Extract capitalized phrases (likely product names, features)
  const capitalizedMatches = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
  if (capitalizedMatches) {
    keyPhrases.push(...capitalizedMatches);
  }

  // Extract quoted phrases
  const quotedMatches = text.match(/"([^"]+)"/g);
  if (quotedMatches) {
    keyPhrases.push(...quotedMatches.map(q => q.replace(/"/g, '')));
  }

  // Extract common marketing terms
  const marketingTerms = [
    'ai', 'platform', 'solution', 'enterprise', 'cloud', 'real-time',
    'automation', 'analytics', 'security', 'integration', 'scalable',
    'fast', 'simple', 'powerful', 'trusted', 'innovative'
  ];

  words.forEach((word, i) => {
    if (marketingTerms.includes(word)) {
      // Get context (3 words before and after)
      const context = words.slice(Math.max(0, i - 3), i + 4).join(' ');
      keyPhrases.push(context);
    }
  });

  return [...new Set(keyPhrases)]; // Remove duplicates
}
