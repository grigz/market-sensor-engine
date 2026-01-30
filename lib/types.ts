// Data Contracts for Market Sensor Engine

export type NarrativeTag = 'Trust' | 'Speed' | 'Control' | 'Innovation' | 'Cost' | 'Security';
export type Persona = 'CTO' | 'CFO' | 'Data Engineer' | 'VP Engineering' | 'Product Manager';
export type Stage = 'Awareness' | 'Consideration' | 'Decision';

// Module A: Language Drift Analyzer
export interface CompetitorSnapshot {
  id: string;
  competitorUrl: string;
  competitorName: string;
  capturedAt: Date;
  heroText: string;
  subheads: string[];
  pricingBlocks: string[];
  rawHtml: string;
}

export interface DriftAnalysis {
  id: string;
  competitorUrl: string;
  competitorName: string;
  analyzedAt: Date;
  driftScore: number; // 0-100
  newNouns: string[];
  newVerbs: string[];
  toneShifts: string[];
  implications: DriftImplication[];
  trajectoryCall?: string; // Material shift detected
}

export interface DriftImplication {
  text: string;
  soWhat: string;
  narrativeTag: NarrativeTag;
  persona: Persona;
  stage: Stage;
  severity: 'low' | 'medium' | 'high';
}

// Module B: Proof Vault
export interface ProofRecord {
  proofId: string;
  evidenceSentence: string;
  sourceLink: string;
  personaTag: Persona;
  narrativeTag: NarrativeTag;
  stage: Stage;
  expiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Module C: Market Pulse Report
export interface MarketPulseReport {
  id: string;
  generatedAt: Date;
  driftAnalyses: DriftAnalysis[];
  topImplications: DriftImplication[];
  recommendedActions: ActionItem[];
  sentViaEmail: boolean;
  sentAt?: Date;
}

export interface ActionItem {
  line: string; // The insight
  proofId: string | null; // Reference to proof vault
  nextStep: string; // What to do about it
  narrativeTag: NarrativeTag;
  persona: Persona;
  stage: Stage;
  status: 'VALIDATED' | 'INSUFFICIENT_DATA';
}

// Competitor Configuration
export interface CompetitorConfig {
  url: string;
  name: string;
  active: boolean;
  lastScanned?: Date;
  addedAt: Date;
}
