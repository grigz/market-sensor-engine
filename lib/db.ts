import { Redis } from '@upstash/redis';
import type {
  CompetitorSnapshot,
  DriftAnalysis,
  ProofRecord,
  MarketPulseReport,
  CompetitorConfig,
} from './types';

// Initialize Redis client lazily
let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
  }
  return redisClient;
}

export const redis = {
  get: <T = unknown>(key: string) => getRedis().get<T>(key),
  set: (key: string, value: unknown) => getRedis().set(key, value),
  del: (key: string) => getRedis().del(key),
  sadd: (key: string, member: unknown) => getRedis().sadd(key, member),
  smembers: (key: string) => getRedis().smembers(key),
  srem: (key: string, member: unknown) => getRedis().srem(key, member),
  lpush: (key: string, element: unknown) => getRedis().lpush(key, element),
  lrange: (key: string, start: number, stop: number) => getRedis().lrange(key, start, stop),
  ltrim: (key: string, start: number, stop: number) => getRedis().ltrim(key, start, stop),
};

// Redis Key Patterns
const KEYS = {
  competitorConfig: (url: string) => `competitor:config:${url}`,
  competitorConfigs: () => `competitor:configs`,
  snapshot: (id: string) => `snapshot:${id}`,
  snapshotsByCompetitor: (url: string) => `snapshots:${url}`,
  driftAnalysis: (id: string) => `drift:${id}`,
  driftByCompetitor: (url: string) => `drift:${url}`,
  proofRecord: (proofId: string) => `proof:${proofId}`,
  proofRecords: () => `proof:all`,
  marketPulseReport: (id: string) => `report:${id}`,
  marketPulseReports: () => `reports:all`,
};

// Competitor Configuration
export async function addCompetitorConfig(config: CompetitorConfig): Promise<void> {
  await redis.set(KEYS.competitorConfig(config.url), config);
  await redis.sadd(KEYS.competitorConfigs(), config.url);
}

export async function getCompetitorConfigs(): Promise<CompetitorConfig[]> {
  const urls = await redis.smembers(KEYS.competitorConfigs());
  if (!urls || urls.length === 0) return [];

  const configs = await Promise.all(
    urls.map((url) => redis.get<CompetitorConfig>(KEYS.competitorConfig(url as string)))
  );

  return configs.filter((c): c is CompetitorConfig => c !== null);
}

export async function updateCompetitorConfig(url: string, updates: Partial<CompetitorConfig>): Promise<void> {
  const existing = await redis.get<CompetitorConfig>(KEYS.competitorConfig(url));
  if (!existing) throw new Error('Competitor not found');

  await redis.set(KEYS.competitorConfig(url), { ...existing, ...updates });
}

// Snapshots
export async function saveSnapshot(snapshot: CompetitorSnapshot): Promise<void> {
  await redis.set(KEYS.snapshot(snapshot.id), snapshot);
  await redis.lpush(KEYS.snapshotsByCompetitor(snapshot.competitorUrl), snapshot.id);
  // Keep only last 10 snapshots per competitor
  await redis.ltrim(KEYS.snapshotsByCompetitor(snapshot.competitorUrl), 0, 9);
}

export async function getLatestSnapshot(competitorUrl: string): Promise<CompetitorSnapshot | null> {
  const snapshotIds = await redis.lrange(KEYS.snapshotsByCompetitor(competitorUrl), 0, 0);
  if (!snapshotIds || snapshotIds.length === 0) return null;

  return await redis.get<CompetitorSnapshot>(KEYS.snapshot(snapshotIds[0] as string));
}

export async function getBaselineSnapshot(competitorUrl: string): Promise<CompetitorSnapshot | null> {
  // Get the oldest snapshot (baseline)
  const snapshotIds = await redis.lrange(KEYS.snapshotsByCompetitor(competitorUrl), -1, -1);
  if (!snapshotIds || snapshotIds.length === 0) return null;

  return await redis.get<CompetitorSnapshot>(KEYS.snapshot(snapshotIds[0] as string));
}

export async function getSnapshotHistory(competitorUrl: string, limit = 10): Promise<CompetitorSnapshot[]> {
  const snapshotIds = await redis.lrange(KEYS.snapshotsByCompetitor(competitorUrl), 0, limit - 1);
  if (!snapshotIds || snapshotIds.length === 0) return [];

  const snapshots = await Promise.all(
    snapshotIds.map((id) => redis.get<CompetitorSnapshot>(KEYS.snapshot(id as string)))
  );

  return snapshots.filter((s): s is CompetitorSnapshot => s !== null);
}

// Drift Analysis
export async function saveDriftAnalysis(analysis: DriftAnalysis): Promise<void> {
  await redis.set(KEYS.driftAnalysis(analysis.id), analysis);
  await redis.lpush(KEYS.driftByCompetitor(analysis.competitorUrl), analysis.id);
  await redis.ltrim(KEYS.driftByCompetitor(analysis.competitorUrl), 0, 49); // Keep last 50
}

export async function getLatestDriftAnalysis(competitorUrl: string): Promise<DriftAnalysis | null> {
  const analysisIds = await redis.lrange(KEYS.driftByCompetitor(competitorUrl), 0, 0);
  if (!analysisIds || analysisIds.length === 0) return null;

  return await redis.get<DriftAnalysis>(KEYS.driftAnalysis(analysisIds[0] as string));
}

export async function getAllDriftAnalyses(): Promise<DriftAnalysis[]> {
  const configs = await getCompetitorConfigs();
  const analyses = await Promise.all(
    configs.map((config) => getLatestDriftAnalysis(config.url))
  );

  return analyses.filter((a): a is DriftAnalysis => a !== null);
}

// Proof Vault
export async function saveProofRecord(proof: ProofRecord): Promise<void> {
  await redis.set(KEYS.proofRecord(proof.proofId), proof);
  await redis.sadd(KEYS.proofRecords(), proof.proofId);
}

export async function getProofRecord(proofId: string): Promise<ProofRecord | null> {
  return await redis.get<ProofRecord>(KEYS.proofRecord(proofId));
}

export async function getAllProofRecords(): Promise<ProofRecord[]> {
  const proofIds = await redis.smembers(KEYS.proofRecords());
  if (!proofIds || proofIds.length === 0) return [];

  const proofs = await Promise.all(
    proofIds.map((id) => redis.get<ProofRecord>(KEYS.proofRecord(id as string)))
  );

  return proofs.filter((p): p is ProofRecord => p !== null);
}

export async function searchProofRecords(
  criteria: {
    persona?: string;
    narrativeTag?: string;
    stage?: string;
  }
): Promise<ProofRecord[]> {
  const allProofs = await getAllProofRecords();

  return allProofs.filter((proof) => {
    if (criteria.persona && proof.personaTag !== criteria.persona) return false;
    if (criteria.narrativeTag && proof.narrativeTag !== criteria.narrativeTag) return false;
    if (criteria.stage && proof.stage !== criteria.stage) return false;
    return true;
  });
}

export async function deleteProofRecord(proofId: string): Promise<void> {
  await redis.del(KEYS.proofRecord(proofId));
  await redis.srem(KEYS.proofRecords(), proofId);
}

// Market Pulse Reports
export async function saveMarketPulseReport(report: MarketPulseReport): Promise<void> {
  await redis.set(KEYS.marketPulseReport(report.id), report);
  await redis.lpush(KEYS.marketPulseReports(), report.id);
  await redis.ltrim(KEYS.marketPulseReports(), 0, 99); // Keep last 100 reports
}

export async function getMarketPulseReport(id: string): Promise<MarketPulseReport | null> {
  return await redis.get<MarketPulseReport>(KEYS.marketPulseReport(id));
}

export async function getRecentMarketPulseReports(limit = 10): Promise<MarketPulseReport[]> {
  const reportIds = await redis.lrange(KEYS.marketPulseReports(), 0, limit - 1);
  if (!reportIds || reportIds.length === 0) return [];

  const reports = await Promise.all(
    reportIds.map((id) => redis.get<MarketPulseReport>(KEYS.marketPulseReport(id as string)))
  );

  return reports.filter((r): r is MarketPulseReport => r !== null);
}
