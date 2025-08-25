export type ScanType = 'text' | 'image' | 'video' | 'link' | 'file';

export interface ScanDTO {
  id: string;
  type: ScanType;
  inputLabel: string;
  timestamp: string | Date;
  result: {
    confidence: number;
    flags: string[];
    summary: string;
  }
}

export interface ScanResult {
  confidence: number; // 0-100
  flags: string[];
  summary: string;
  verdict: 'HUMAN' | 'AI' | 'UNCERTAIN';
  aiProviders: string[];
  detailAnalysis: {
    textPatterns: number;
    languageModel: number;
    semanticCoherence: number;
    humanLikeness: number;
    deepfakeScore?: number;
    manipulationDetection?: number;
  };
  provider?: {
    name: string;
    method: 'ollama' | 'deepseek' | 'huggingface' | 'openrouter' | 'heuristic' | 'gpt4-vision' | 'claude';
    version?: string;
    model?: string;
  };
  meta?: Record<string, unknown>;
}