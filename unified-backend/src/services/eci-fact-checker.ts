// Election Commission of India (ECI) Fact-Checking Service
// Senior Developer Implementation - 20+ Years Experience
// Real-time fact-checking against official ECI data, candidate verification, and misinformation detection

import fetch from 'node-fetch';
import { promisify } from 'util';
import crypto from 'crypto';

export interface ECICandidate {
  candidateId: string;
  name: string;
  party: string;
  constituency: string;
  state: string;
  age: number;
  education: string;
  criminalCases: number;
  assets: number;
  liabilities: number;
  affidavitNumber: string;
  nominationDate: string;
  status: 'ACTIVE' | 'WITHDRAWN' | 'REJECTED';
}

export interface ECIConstituency {
  constituencyId: string;
  name: string;
  state: string;
  type: 'LOK_SABHA' | 'VIDHAN_SABHA';
  reservedFor?: 'SC' | 'ST' | null;
  totalVoters: number;
  pollingStations: number;
  candidates: ECICandidate[];
}

export interface ECIElectionResult {
  constituencyId: string;
  winnerName: string;
  winnerParty: string;
  totalVotes: number;
  margin: number;
  turnoutPercentage: number;
  resultDate: string;
  status: 'DECLARED' | 'COUNTING' | 'PENDING';
}

export interface ECIFactCheckResult {
  isVerified: boolean;
  confidence: number; // 0-100
  verificationStatus: 'VERIFIED' | 'FALSE' | 'MISLEADING' | 'UNVERIFIABLE' | 'PARTIAL';
  factCheckSummary: string;
  sources: string[];
  warnings: string[];
  relatedData?: {
    candidates?: ECICandidate[];
    constituencies?: ECIConstituency[];
    results?: ECIElectionResult[];
  };
  misinformationFlags: string[];
  officialStatement?: string;
}

export interface MyGovNewsItem {
  newsId: string;
  headline: string;
  content: string;
  publishedDate: string;
  source: string;
  category: 'ELECTION' | 'POLICY' | 'ANNOUNCEMENT' | 'ALERT';
  verified: boolean;
  officialUrl: string;
}

export interface MisinformationAlert {
  alertId: string;
  type: 'FAKE_CANDIDATE' | 'FALSE_RESULT' | 'MISLEADING_STATS' | 'DOCTORED_DOCUMENT' | 'IMPERSONATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detectedContent: string;
  officialCorrection: string;
  timestamp: Date;
  reportedBy: 'AI_DETECTION' | 'MANUAL_REVIEW' | 'PUBLIC_REPORT';
  status: 'ACTIVE' | 'RESOLVED' | 'INVESTIGATING';
}

// Mock ECI API endpoints (in production, these would be actual ECI APIs)
const ECI_API_BASE = process.env.ECI_API_BASE || 'https://api.eci.gov.in/v1';
const MYGOV_API_BASE = process.env.MYGOV_API_BASE || 'https://api.mygov.in/v1';
const ECI_API_KEY = process.env.ECI_API_KEY;

// Rate limiting for API calls
const apiRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60000;

function checkApiRateLimit(endpoint: string): boolean {
  const now = Date.now();
  const limit = apiRateLimit.get(endpoint);
  
  if (!limit || now > limit.resetTime) {
    apiRateLimit.set(endpoint, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT) {
    return false;
  }
  
  limit.count++;
  return true;
}

// ECI Candidate Verification Service
export class ECICandidateVerifier {
  private static candidateCache = new Map<string, ECICandidate>();
  private static cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  static async verifyCandidateData(candidateName: string, constituency?: string, party?: string): Promise<ECIFactCheckResult> {
    if (!checkApiRateLimit('candidate-verification')) {
      throw new Error('Rate limit exceeded for candidate verification');
    }

    try {
      // In production, this would call actual ECI APIs
      const candidates = await this.fetchCandidatesFromECI(candidateName, constituency);
      
      if (candidates.length === 0) {
        return {
          isVerified: false,
          confidence: 95,
          verificationStatus: 'FALSE',
          factCheckSummary: `No candidate named "${candidateName}" found in official ECI records${constituency ? ` for ${constituency} constituency` : ''}.`,
          sources: ['ECI Official Database'],
          warnings: ['Potential fake candidate claim'],
          misinformationFlags: ['FAKE_CANDIDATE'],
          officialStatement: 'This candidate name does not appear in official Election Commission records.'
        };
      }

      const exactMatch = candidates.find(c => 
        c.name.toLowerCase() === candidateName.toLowerCase() &&
        (!constituency || c.constituency.toLowerCase().includes(constituency.toLowerCase())) &&
        (!party || c.party.toLowerCase().includes(party.toLowerCase()))
      );

      if (exactMatch) {
        return {
          isVerified: true,
          confidence: 98,
          verificationStatus: 'VERIFIED',
          factCheckSummary: `Candidate "${candidateName}" verified in ECI records for ${exactMatch.constituency} constituency representing ${exactMatch.party}.`,
          sources: ['ECI Official Database', `Affidavit ${exactMatch.affidavitNumber}`],
          warnings: [],
          relatedData: { candidates: [exactMatch] },
          misinformationFlags: []
        };
      }

      // Partial matches found
      const partialMatches = candidates.filter(c => 
        c.name.toLowerCase().includes(candidateName.toLowerCase()) ||
        candidateName.toLowerCase().includes(c.name.toLowerCase())
      );

      return {
        isVerified: false,
        confidence: 70,
        verificationStatus: 'MISLEADING',
        factCheckSummary: `Similar candidate names found but no exact match for "${candidateName}". Possible confusion with: ${partialMatches.map(c => c.name).join(', ')}.`,
        sources: ['ECI Official Database'],
        warnings: ['Name similarity detected - verify exact spelling'],
        relatedData: { candidates: partialMatches },
        misinformationFlags: ['MISLEADING_NAME']
      };

    } catch (error) {
      console.error('ECI candidate verification failed:', error);
      return {
        isVerified: false,
        confidence: 0,
        verificationStatus: 'UNVERIFIABLE',
        factCheckSummary: 'Unable to verify candidate information due to API unavailability.',
        sources: [],
        warnings: ['Verification system temporarily unavailable'],
        misinformationFlags: []
      };
    }
  }

  private static async fetchCandidatesFromECI(name: string, constituency?: string): Promise<ECICandidate[]> {
    // Mock implementation - in production, this would call actual ECI APIs
    const mockCandidates: ECICandidate[] = [
      {
        candidateId: 'ECI_001',
        name: 'Narendra Modi',
        party: 'Bharatiya Janata Party',
        constituency: 'Varanasi',
        state: 'Uttar Pradesh',
        age: 73,
        education: 'Graduate',
        criminalCases: 0,
        assets: 25000000,
        liabilities: 0,
        affidavitNumber: 'AFF_2024_001',
        nominationDate: '2024-03-15',
        status: 'ACTIVE'
      },
      {
        candidateId: 'ECI_002',
        name: 'Rahul Gandhi',
        party: 'Indian National Congress',
        constituency: 'Rae Bareli',
        state: 'Uttar Pradesh',
        age: 53,
        education: 'Post Graduate',
        criminalCases: 2,
        assets: 19000000,
        liabilities: 0,
        affidavitNumber: 'AFF_2024_002',
        nominationDate: '2024-03-16',
        status: 'ACTIVE'
      }
    ];

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return mockCandidates.filter(candidate => 
      candidate.name.toLowerCase().includes(name.toLowerCase()) ||
      (constituency && candidate.constituency.toLowerCase().includes(constituency.toLowerCase()))
    );
  }
}

// Election Results Verification Service
export class ECIResultsVerifier {
  static async verifyElectionResults(constituency: string, claimedWinner?: string, claimedMargin?: number): Promise<ECIFactCheckResult> {
    if (!checkApiRateLimit('results-verification')) {
      throw new Error('Rate limit exceeded for results verification');
    }

    try {
      const officialResult = await this.fetchOfficialResults(constituency);
      
      if (!officialResult) {
        return {
          isVerified: false,
          confidence: 90,
          verificationStatus: 'UNVERIFIABLE',
          factCheckSummary: `No official results found for ${constituency} constituency. Results may not be declared yet.`,
          sources: ['ECI Results Portal'],
          warnings: ['Results not yet declared or constituency name incorrect'],
          misinformationFlags: []
        };
      }

      if (officialResult.status !== 'DECLARED') {
        return {
          isVerified: false,
          confidence: 95,
          verificationStatus: 'FALSE',
          factCheckSummary: `Results for ${constituency} are still ${officialResult.status.toLowerCase()}. Any declared winner is premature.`,
          sources: ['ECI Results Portal'],
          warnings: ['Premature result declaration detected'],
          misinformationFlags: ['FALSE_RESULT'],
          officialStatement: `Official status: ${officialResult.status}`
        };
      }

      if (claimedWinner) {
        const winnerMatch = officialResult.winnerName.toLowerCase() === claimedWinner.toLowerCase();
        
        if (!winnerMatch) {
          return {
            isVerified: false,
            confidence: 98,
            verificationStatus: 'FALSE',
            factCheckSummary: `Incorrect winner claimed for ${constituency}. Official winner is ${officialResult.winnerName} (${officialResult.winnerParty}), not ${claimedWinner}.`,
            sources: ['ECI Official Results'],
            warnings: ['False winner information'],
            relatedData: { results: [officialResult] },
            misinformationFlags: ['FALSE_RESULT'],
            officialStatement: `Official winner: ${officialResult.winnerName} with ${officialResult.totalVotes} votes`
          };
        }
      }

      if (claimedMargin && Math.abs(officialResult.margin - claimedMargin) > officialResult.totalVotes * 0.01) {
        return {
          isVerified: false,
          confidence: 85,
          verificationStatus: 'MISLEADING',
          factCheckSummary: `Victory margin for ${constituency} is significantly different from claimed. Official margin: ${officialResult.margin} votes.`,
          sources: ['ECI Official Results'],
          warnings: ['Margin discrepancy detected'],
          relatedData: { results: [officialResult] },
          misinformationFlags: ['MISLEADING_STATS']
        };
      }

      return {
        isVerified: true,
        confidence: 98,
        verificationStatus: 'VERIFIED',
        factCheckSummary: `Election results for ${constituency} verified against official ECI data.`,
        sources: ['ECI Official Results Portal'],
        warnings: [],
        relatedData: { results: [officialResult] },
        misinformationFlags: []
      };

    } catch (error) {
      console.error('ECI results verification failed:', error);
      return {
        isVerified: false,
        confidence: 0,
        verificationStatus: 'UNVERIFIABLE',
        factCheckSummary: 'Unable to verify election results due to system unavailability.',
        sources: [],
        warnings: ['Verification system temporarily unavailable'],
        misinformationFlags: []
      };
    }
  }

  private static async fetchOfficialResults(constituency: string): Promise<ECIElectionResult | null> {
    // Mock implementation - in production, this would call actual ECI Results API
    const mockResults: ECIElectionResult[] = [
      {
        constituencyId: 'UP_VARANASI',
        winnerName: 'Narendra Modi',
        winnerParty: 'BJP',
        totalVotes: 674664,
        margin: 152513,
        turnoutPercentage: 63.4,
        resultDate: '2024-06-04',
        status: 'DECLARED'
      },
      {
        constituencyId: 'UP_RAEBARELI',
        winnerName: 'Rahul Gandhi',
        winnerParty: 'INC',
        totalVotes: 612079,
        margin: 390676,
        turnoutPercentage: 61.8,
        resultDate: '2024-06-04',
        status: 'DECLARED'
      }
    ];

    await new Promise(resolve => setTimeout(resolve, 200));

    return mockResults.find(result => 
      result.constituencyId.toLowerCase().includes(constituency.toLowerCase()) ||
      constituency.toLowerCase().includes(result.constituencyId.split('_')[1].toLowerCase())
    ) || null;
  }
}

// MyGov Integration Service
export class MyGovIntegration {
  static async fetchOfficialNews(category: 'ELECTION' | 'ALL' = 'ELECTION', limit: number = 10): Promise<MyGovNewsItem[]> {
    if (!checkApiRateLimit('mygov-news')) {
      throw new Error('Rate limit exceeded for MyGov news');
    }

    try {
      // Mock implementation - in production, this would call actual MyGov API
      const mockNews: MyGovNewsItem[] = [
        {
          newsId: 'MG_001',
          headline: 'Election Commission announces polling dates for upcoming by-elections',
          content: 'The Election Commission of India has announced polling dates for by-elections in 13 constituencies across 7 states...',
          publishedDate: '2024-08-23',
          source: 'Election Commission of India',
          category: 'ELECTION',
          verified: true,
          officialUrl: 'https://eci.gov.in/news/polling-dates-announcement'
        },
        {
          newsId: 'MG_002',
          headline: 'Voter registration drive launched in rural areas',
          content: 'A comprehensive voter registration drive has been launched to ensure maximum electoral participation...',
          publishedDate: '2024-08-22',
          source: 'Ministry of Rural Development',
          category: 'ELECTION',
          verified: true,
          officialUrl: 'https://rural.nic.in/voter-registration-drive'
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 150));

      return category === 'ALL' ? mockNews : mockNews.filter(news => news.category === category).slice(0, limit);
    } catch (error) {
      console.error('MyGov news fetch failed:', error);
      return [];
    }
  }

  static async verifyNewsAgainstOfficial(newsContent: string): Promise<ECIFactCheckResult> {
    try {
      const officialNews = await this.fetchOfficialNews('ELECTION', 50);
      
      // Simple similarity check (in production, use more sophisticated NLP)
      const similarities = officialNews.map(news => {
        const contentWords = newsContent.toLowerCase().split(' ');
        const officialWords = news.content.toLowerCase().split(' ');
        const commonWords = contentWords.filter(word => officialWords.includes(word) && word.length > 3);
        const similarity = commonWords.length / Math.max(contentWords.length, officialWords.length);
        
        return { news, similarity };
      });

      const bestMatch = similarities.reduce((best, current) => 
        current.similarity > best.similarity ? current : best
      );

      if (bestMatch.similarity > 0.3) {
        return {
          isVerified: true,
          confidence: Math.round(bestMatch.similarity * 100),
          verificationStatus: 'VERIFIED',
          factCheckSummary: 'Content matches official government communications.',
          sources: [bestMatch.news.source, bestMatch.news.officialUrl],
          warnings: [],
          misinformationFlags: []
        };
      }

      return {
        isVerified: false,
        confidence: 60,
        verificationStatus: 'UNVERIFIABLE',
        factCheckSummary: 'No matching official government communication found for this content.',
        sources: ['MyGov Official Portal'],
        warnings: ['Unable to verify against official sources'],
        misinformationFlags: []
      };

    } catch (error) {
      console.error('MyGov news verification failed:', error);
      return {
        isVerified: false,
        confidence: 0,
        verificationStatus: 'UNVERIFIABLE',
        factCheckSummary: 'Unable to verify against official sources due to system issues.',
        sources: [],
        warnings: ['Verification system unavailable'],
        misinformationFlags: []
      };
    }
  }
}

// Misinformation Alert System
export class MisinformationAlertSystem {
  private static alerts: MisinformationAlert[] = [];

  static async detectMisinformation(content: string): Promise<MisinformationAlert[]> {
    const detectedAlerts: MisinformationAlert[] = [];
    
    // Pattern detection for common misinformation types
    const patterns = {
      FAKE_CANDIDATE: [
        /(?:candidate|contesting|nominated).*(?:fake|fraud|illegal)/i,
        /(?:ECI|election commission).*(?:rejected|disqualified).*but.*(?:still|continue)/i
      ],
      FALSE_RESULT: [
        /(?:won|victory|winner).*(?:before|premature).*(?:counting|declaration)/i,
        /(?:leading|ahead).*(?:confirmed|final|official)/i,
        /(?:result|outcome).*(?:decided|finalized).*(?:before|pre)/i
      ],
      MISLEADING_STATS: [
        /(?:voter turnout|polling percentage).*(?:100%|above 90%)/i,
        /(?:margin|votes).*(?:crore|million).*(?:difference|ahead)/i
      ],
      DOCTORED_DOCUMENT: [
        /(?:ECI|election commission).*(?:notice|order|circular).*(?:viral|shared|spreading)/i
      ],
      IMPERSONATION: [
        /(?:official|ECI|election commission).*(?:account|profile|page).*(?:fake|imposter)/i
      ]
    };

    for (const [type, typePatterns] of Object.entries(patterns)) {
      for (const pattern of typePatterns) {
        if (pattern.test(content)) {
          const severity = this.calculateSeverity(type as keyof typeof patterns, content);
          
          detectedAlerts.push({
            alertId: crypto.randomUUID(),
            type: type as MisinformationAlert['type'],
            severity,
            description: `Potential ${type.toLowerCase().replace('_', ' ')} detected`,
            detectedContent: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
            officialCorrection: await this.generateOfficialCorrection(type as keyof typeof patterns),
            timestamp: new Date(),
            reportedBy: 'AI_DETECTION',
            status: 'ACTIVE'
          });
        }
      }
    }

    // Store alerts
    this.alerts.push(...detectedAlerts);

    return detectedAlerts;
  }

  private static calculateSeverity(type: string, content: string): MisinformationAlert['severity'] {
    const highSeverityKeywords = ['emergency', 'urgent', 'breaking', 'confirmed', 'official'];
    const mediumSeverityKeywords = ['reported', 'sources', 'likely', 'expected'];
    
    const contentLower = content.toLowerCase();
    
    if (highSeverityKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'HIGH';
    }
    
    if (mediumSeverityKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'MEDIUM';
    }
    
    return type === 'FALSE_RESULT' || type === 'FAKE_CANDIDATE' ? 'MEDIUM' : 'LOW';
  }

  private static async generateOfficialCorrection(type: string): Promise<string> {
    const corrections = {
      FAKE_CANDIDATE: 'All candidate information should be verified through the official ECI website at eci.gov.in. Only candidates whose nominations have been accepted by the Returning Officer are eligible to contest.',
      FALSE_RESULT: 'Official election results are declared only by the Election Commission of India after completion of counting. Premature victory claims are misinformation.',
      MISLEADING_STATS: 'Accurate election statistics including voter turnout and victory margins are available only on the official ECI results portal.',
      DOCTORED_DOCUMENT: 'All official ECI communications can be verified on the official website. Citizens should be wary of fake notices and circulars.',
      IMPERSONATION: 'Official ECI social media accounts are verified. Citizens should follow only official handles for authentic information.'
    };
    
    return corrections[type as keyof typeof corrections] || 'Please verify information through official Election Commission sources.';
  }

  static getActiveAlerts(severity?: MisinformationAlert['severity']): MisinformationAlert[] {
    return this.alerts.filter(alert => 
      alert.status === 'ACTIVE' && 
      (!severity || alert.severity === severity)
    );
  }

  static resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.alertId === alertId);
    if (alert) {
      alert.status = 'RESOLVED';
      return true;
    }
    return false;
  }
}

// Comprehensive ECI Fact-Checking Service
export class ECIFactChecker {
  static async comprehensiveFactCheck(content: string): Promise<ECIFactCheckResult> {
    try {
      // Extract potential claims from content
      const claims = this.extractClaims(content);
      const results: ECIFactCheckResult[] = [];

      // Check for misinformation patterns
      const misinformationAlerts = await MisinformationAlertSystem.detectMisinformation(content);

      // Verify against different ECI services
      for (const claim of claims) {
        if (claim.type === 'CANDIDATE') {
          const result = await ECICandidateVerifier.verifyCandidateData(
            claim.candidateName!,
            claim.constituency,
            claim.party
          );
          results.push(result);
        } else if (claim.type === 'RESULT') {
          const result = await ECIResultsVerifier.verifyElectionResults(
            claim.constituency!,
            claim.winner,
            claim.margin
          );
          results.push(result);
        }
      }

      // Verify against MyGov official communications
      const mygovResult = await MyGovIntegration.verifyNewsAgainstOfficial(content);
      results.push(mygovResult);

      // Aggregate results
      const overallConfidence = results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length)
        : 50;

      const hasVerifiedClaims = results.some(r => r.isVerified);
      const hasFalseClaims = results.some(r => r.verificationStatus === 'FALSE');
      const allWarnings = results.flatMap(r => r.warnings);
      const allFlags = [
        ...results.flatMap(r => r.misinformationFlags),
        ...misinformationAlerts.map(alert => alert.type)
      ];

      return {
        isVerified: hasVerifiedClaims && !hasFalseClaims,
        confidence: overallConfidence,
        verificationStatus: hasFalseClaims ? 'FALSE' : 
                          hasVerifiedClaims ? 'VERIFIED' : 
                          allFlags.length > 0 ? 'MISLEADING' : 'UNVERIFIABLE',
        factCheckSummary: this.generateComprehensiveSummary(results, misinformationAlerts),
        sources: [...new Set(results.flatMap(r => r.sources))],
        warnings: [...new Set(allWarnings)],
        misinformationFlags: [...new Set(allFlags)]
      };

    } catch (error) {
      console.error('Comprehensive fact-check failed:', error);
      return {
        isVerified: false,
        confidence: 0,
        verificationStatus: 'UNVERIFIABLE',
        factCheckSummary: 'Unable to perform fact-check due to system error.',
        sources: [],
        warnings: ['Fact-checking system temporarily unavailable'],
        misinformationFlags: []
      };
    }
  }

  private static extractClaims(content: string): Array<{
    type: 'CANDIDATE' | 'RESULT' | 'NEWS';
    candidateName?: string;
    constituency?: string;
    party?: string;
    winner?: string;
    margin?: number;
  }> {
    const claims = [];
    
    // Extract candidate claims
    const candidatePattern = /(?:candidate|contesting|nominated)\s+([A-Za-z\s]+?)(?:\s+from\s+([A-Za-z\s]+?))?(?:\s+(?:of|representing)\s+([A-Za-z\s]+?))?/gi;
    let match;
    while ((match = candidatePattern.exec(content)) !== null) {
      claims.push({
        type: 'CANDIDATE' as const,
        candidateName: match[1].trim(),
        constituency: match[2]?.trim(),
        party: match[3]?.trim()
      });
    }

    // Extract result claims
    const resultPattern = /([A-Za-z\s]+?)\s+(?:won|victory|winner).*?(?:from\s+)?([A-Za-z\s]+?)(?:\s+by\s+(\d+)\s+votes)?/gi;
    while ((match = resultPattern.exec(content)) !== null) {
      claims.push({
        type: 'RESULT' as const,
        winner: match[1].trim(),
        constituency: match[2].trim(),
        margin: match[3] ? parseInt(match[3]) : undefined
      });
    }

    return claims;
  }

  private static generateComprehensiveSummary(
    results: ECIFactCheckResult[], 
    alerts: MisinformationAlert[]
  ): string {
    const verifiedCount = results.filter(r => r.isVerified).length;
    const falseCount = results.filter(r => r.verificationStatus === 'FALSE').length;
    const alertCount = alerts.length;

    let summary = `Comprehensive fact-check completed. `;

    if (falseCount > 0) {
      summary += `${falseCount} false claim(s) detected. `;
    }

    if (verifiedCount > 0) {
      summary += `${verifiedCount} claim(s) verified against official sources. `;
    }

    if (alertCount > 0) {
      summary += `${alertCount} misinformation pattern(s) detected. `;
    }

    if (falseCount === 0 && verifiedCount === 0 && alertCount === 0) {
      summary += `No specific claims could be verified against ECI databases. Content should be cross-referenced with official sources.`;
    }

    return summary;
  }
}

export default ECIFactChecker;