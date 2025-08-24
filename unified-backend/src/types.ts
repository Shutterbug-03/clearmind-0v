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


