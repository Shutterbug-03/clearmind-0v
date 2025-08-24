import express from 'express';
import { z } from 'zod';
import { analyzeIndiaElectionContent, analyzePoliticalContext, analyzeDeepfakePatterns, analyzeMisinformationPatterns, checkAIProviderHealth } from '../services/analyzer.js';
const router = express.Router();
// Request validation schemas
const textAnalysisSchema = z.object({
    text: z.string().min(1).max(50000),
    specializedAnalysis: z.boolean().optional().default(false)
});
const deepfakeAnalysisSchema = z.object({
    fileBuffer: z.string(), // base64 encoded
    mimetype: z.string(),
    filename: z.string().optional()
});
const politicalContextSchema = z.object({
    text: z.string().min(1).max(50000)
});
// POST /api/election/analyze-text - Specialized India election text analysis
router.post('/analyze-text', async (req, res) => {
    try {
        const { text, specializedAnalysis } = textAnalysisSchema.parse(req.body);
        console.log(`India Election Analysis for ${text.length} characters`);
        let result;
        if (specializedAnalysis) {
            result = await analyzeIndiaElectionContent(text);
        }
        else {
            // Just get political context
            const politicalContext = analyzePoliticalContext(text);
            const misinformationAnalysis = analyzeMisinformationPatterns(text);
            result = {
                politicalContext,
                misinformationAnalysis,
                isElectionRelated: politicalContext?.isElectionRelated || false,
                riskLevel: (misinformationAnalysis?.propagandaPatterns?.length || 0) > 2 ? 'HIGH' :
                    (politicalContext?.biasIndicators?.length || 0) > 1 ? 'MEDIUM' : 'LOW'
            };
        }
        res.json(result);
    }
    catch (error) {
        console.error('India Election analysis failed:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Invalid request data',
                details: error.errors
            });
        }
        res.status(500).json({
            error: 'Election analysis failed',
            message: error?.message || 'Unknown error occurred'
        });
    }
});
// POST /api/election/analyze-deepfake - Advanced deepfake detection
router.post('/analyze-deepfake', async (req, res) => {
    try {
        const { fileBuffer, mimetype, filename } = deepfakeAnalysisSchema.parse(req.body);
        console.log(`Deepfake analysis for ${mimetype} file: ${filename || 'unnamed'}`);
        const buffer = Buffer.from(fileBuffer, 'base64');
        const deepfakeAnalysis = await analyzeDeepfakePatterns(buffer, mimetype);
        // Enhanced response with risk assessment
        const confidenceScore = deepfakeAnalysis?.confidenceScore || 0;
        const response = {
            ...deepfakeAnalysis,
            riskLevel: confidenceScore > 70 ? 'HIGH' :
                confidenceScore > 40 ? 'MEDIUM' : 'LOW',
            recommendations: confidenceScore > 70
                ? ['Immediate expert review recommended', 'Content likely manipulated', 'Verify with original source']
                : confidenceScore > 40
                    ? ['Additional verification recommended', 'Potential manipulation detected', 'Cross-reference with known sources']
                    : ['Low manipulation risk', 'Standard verification sufficient', 'Content appears authentic'],
            timestamp: new Date().toISOString(),
            analysisEngine: 'God-Tier Deepfake Detector v2.0'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Deepfake analysis failed:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Invalid request data',
                details: error.errors
            });
        }
        res.status(500).json({
            error: 'Deepfake analysis failed',
            message: error?.message || 'Unknown error occurred'
        });
    }
});
// POST /api/election/political-context - Extract political context
router.post('/political-context', async (req, res) => {
    try {
        const { text } = politicalContextSchema.parse(req.body);
        console.log(`Political context analysis for ${text.length} characters`);
        const politicalContext = analyzePoliticalContext(text);
        const misinformationAnalysis = analyzeMisinformationPatterns(text);
        // Enhanced response with threat assessment
        const threatLevel = calculateThreatLevel(politicalContext, misinformationAnalysis);
        const response = {
            politicalContext,
            misinformationAnalysis,
            threatAssessment: {
                level: threatLevel,
                score: calculateThreatScore(politicalContext, misinformationAnalysis),
                primaryRisks: identifyPrimaryRisks(politicalContext, misinformationAnalysis),
                recommendations: generateSecurityRecommendations(threatLevel)
            },
            analysisMetadata: {
                timestamp: new Date().toISOString(),
                textLength: text.length,
                analysisEngine: 'India Political Context Analyzer v2.0',
                specialization: 'Indian Election Security & Misinformation Detection'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Political context analysis failed:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Invalid request data',
                details: error.errors
            });
        }
        res.status(500).json({
            error: 'Political context analysis failed',
            message: error?.message || 'Unknown error occurred'
        });
    }
});
// GET /api/election/health - Check god-tier AI provider status
router.get('/health', async (req, res) => {
    try {
        const health = await checkAIProviderHealth();
        // Calculate overall system health
        const totalProviders = Object.keys(health).length;
        const activeProviders = Object.values(health).filter(Boolean).length;
        const healthPercentage = Math.round((activeProviders / totalProviders) * 100);
        const response = {
            providers: health,
            systemHealth: {
                percentage: healthPercentage,
                status: healthPercentage >= 80 ? 'EXCELLENT' :
                    healthPercentage >= 60 ? 'GOOD' :
                        healthPercentage >= 40 ? 'FAIR' : 'POOR',
                activeProviders,
                totalProviders
            },
            capabilities: {
                textAnalysis: health.ollama || health.deepseek || health.openrouter,
                imageAnalysis: health.gpt4Vision || health.huggingface,
                deepfakeDetection: health.deepfakeDetector,
                politicalAnalysis: health.politicalAnalyzer,
                electionSpecific: true,
                multiLanguage: true
            },
            timestamp: new Date().toISOString(),
            version: '2.0-GOD-TIER'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            error: 'Health check failed',
            message: error?.message || 'Unknown error occurred'
        });
    }
});
// Helper functions for threat assessment
function calculateThreatLevel(political, misinformation) {
    let score = 0;
    if (political.isElectionRelated)
        score += 2;
    if (political.detectedParties.length > 2)
        score += 2;
    if (political.biasIndicators.length > 2)
        score += 3;
    if (misinformation.propagandaPatterns.length > 2)
        score += 4;
    if (misinformation.emotionalManipulation.length > 2)
        score += 3;
    if (misinformation.sourcingIssues.length > 1)
        score += 2;
    if (score >= 10)
        return 'CRITICAL';
    if (score >= 7)
        return 'HIGH';
    if (score >= 4)
        return 'MEDIUM';
    return 'LOW';
}
function calculateThreatScore(political, misinformation) {
    return Math.min((political.biasIndicators.length * 10) +
        (misinformation.propagandaPatterns.length * 15) +
        (misinformation.emotionalManipulation.length * 12) +
        (political.detectedParties.length > 2 ? 20 : 0), 100);
}
function identifyPrimaryRisks(political, misinformation) {
    const risks = [];
    if (political.isElectionRelated && misinformation.propagandaPatterns.length > 0) {
        risks.push('Election propaganda detected');
    }
    if (political.biasIndicators.length > 2) {
        risks.push('High political bias');
    }
    if (misinformation.emotionalManipulation.length > 1) {
        risks.push('Emotional manipulation tactics');
    }
    if (misinformation.sourcingIssues.length > 0) {
        risks.push('Unverified information sources');
    }
    return risks;
}
function generateSecurityRecommendations(threatLevel) {
    switch (threatLevel) {
        case 'CRITICAL':
            return [
                'Immediate content quarantine recommended',
                'Expert human review required',
                'Cross-reference with election commission guidelines',
                'Consider legal compliance review',
                'Implement enhanced monitoring'
            ];
        case 'HIGH':
            return [
                'Enhanced verification protocols required',
                'Multiple source cross-checking',
                'Fact-checking integration recommended',
                'Monitor for viral spread patterns'
            ];
        case 'MEDIUM':
            return [
                'Standard verification procedures',
                'Basic fact-checking recommended',
                'Monitor for engagement anomalies'
            ];
        default:
            return [
                'Routine monitoring sufficient',
                'Standard publication guidelines apply'
            ];
    }
}
export default router;
