import re
import math
from typing import Dict, Any
import numpy as np

try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False


class TextAIDetector:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        if TRANSFORMERS_AVAILABLE:
            self._load_model()
    
    def _load_model(self):
        """Load the AI detection model"""
        try:
            # Use a smaller model for faster inference
            model_name = "microsoft/DialoGPT-medium"  # Smaller alternative
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
        except Exception as e:
            print(f"Failed to load model: {e}")
            TRANSFORMERS_AVAILABLE = False
    
    async def detect(self, text: str) -> Dict[str, Any]:
        """Detect if text is AI-generated"""
        if TRANSFORMERS_AVAILABLE and self.model:
            return await self._ml_detection(text)
        else:
            return await self._heuristic_detection(text)
    
    async def _ml_detection(self, text: str) -> Dict[str, Any]:
        """ML-based detection using transformers"""
        try:
            # Tokenize and get model predictions
            inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probabilities = torch.softmax(logits, dim=-1)
                
            # Calculate AI probability based on perplexity and other features
            ai_prob = self._calculate_ai_probability(text, probabilities)
            confidence = self._calculate_confidence(text, probabilities)
            
            return {
                "ai_probability": ai_prob,
                "confidence": confidence,
                "analysis": {
                    "method": "ml_model",
                    "model": "transformers",
                    "features": self._extract_writing_features(text),
                    "perplexity": self._calculate_perplexity(text)
                }
            }
        except Exception as e:
            # Fallback to heuristic
            return await self._heuristic_detection(text)
    
    def _calculate_ai_probability(self, text: str, probabilities) -> float:
        """Calculate AI probability from model outputs"""
        try:
            # Use the last token probability as a base
            base_prob = float(probabilities[0][-1])
            
            # Combine with heuristic features
            features = self._extract_writing_features(text)
            repetition_score = self._analyze_repetition(text)
            vocab_score = self._analyze_vocabulary_diversity(text)
            
            # Weighted combination
            heuristic_score = (repetition_score * 0.4 + vocab_score * 0.3 + 
                             (1.0 - features.get("vocabulary_diversity", 0.5)) * 0.3)
            
            # Combine ML and heuristic (70% ML, 30% heuristic)
            final_prob = base_prob * 0.7 + heuristic_score * 0.3
            return min(1.0, max(0.0, final_prob))
            
        except Exception:
            # Fallback to heuristic
            return 0.5
    
    async def _heuristic_detection(self, text: str) -> Dict[str, Any]:
        """Heuristic-based AI detection"""
        features = self._extract_writing_features(text)
        
        # Calculate AI probability based on multiple heuristics
        ai_score = 0.0
        total_weight = 0.0
        
        # Repetition patterns (AI tends to repeat)
        repetition_score = self._analyze_repetition(text)
        ai_score += repetition_score * 0.3
        total_weight += 0.3
        
        # Vocabulary diversity
        vocab_score = self._analyze_vocabulary_diversity(text)
        ai_score += vocab_score * 0.2
        total_weight += 0.2
        
        # Sentence structure consistency
        structure_score = self._analyze_sentence_structure(text)
        ai_score += structure_score * 0.25
        total_weight += 0.25
        
        # Perplexity (lower = more AI-like)
        perplexity_score = self._calculate_perplexity(text)
        ai_score += perplexity_score * 0.25
        total_weight += 0.25
        
        # Normalize and calculate final probability
        ai_probability = min(1.0, max(0.0, ai_score / total_weight))
        confidence = self._calculate_confidence(text, features)
        
        return {
            "ai_probability": ai_probability,
            "confidence": confidence,
            "analysis": {
                "method": "heuristic",
                "features": features,
                "repetition_score": repetition_score,
                "vocab_score": vocab_score,
                "structure_score": structure_score,
                "perplexity": perplexity_score
            }
        }
    
    def _extract_writing_features(self, text: str) -> Dict[str, Any]:
        """Extract various writing style features"""
        sentences = re.split(r'[.!?]+', text.strip())
        words = re.findall(r'\b\w+\b', text.lower())
        
        return {
            "word_count": len(words),
            "sentence_count": len([s for s in sentences if s.strip()]),
            "avg_sentence_length": len(words) / max(len([s for s in sentences if s.strip()]), 1),
            "unique_words": len(set(words)),
            "vocabulary_diversity": len(set(words)) / max(len(words), 1),
            "avg_word_length": sum(len(word) for word in words) / max(len(words), 1)
        }
    
    def _analyze_repetition(self, text: str) -> float:
        """Analyze text repetition patterns"""
        words = re.findall(r'\b\w+\b', text.lower())
        if len(words) < 10:
            return 0.5
        
        # Check for repeated phrases
        bigrams = [' '.join(words[i:i+2]) for i in range(len(words)-1)]
        trigrams = [' '.join(words[i:i+3]) for i in range(len(words)-2)]
        
        bigram_repetition = len(bigrams) - len(set(bigrams))
        trigram_repetition = len(trigrams) - len(set(trigrams))
        
        # Normalize by text length
        repetition_score = (bigram_repetition + trigram_repetition) / max(len(words), 1)
        return min(1.0, repetition_score * 10)  # Scale appropriately
    
    def _analyze_vocabulary_diversity(self, text: str) -> float:
        """Analyze vocabulary diversity"""
        words = re.findall(r'\b\w+\b', text.lower())
        if len(words) < 5:
            return 0.5
        
        unique_ratio = len(set(words)) / len(words)
        # Lower diversity suggests AI (more repetitive)
        return 1.0 - unique_ratio
    
    def _analyze_sentence_structure(self, text: str) -> float:
        """Analyze sentence structure consistency"""
        sentences = re.split(r'[.!?]+', text.strip())
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if len(sentences) < 2:
            return 0.5
        
        # Check for consistent sentence lengths
        lengths = [len(s.split()) for s in sentences]
        mean_length = np.mean(lengths)
        std_length = np.std(lengths)
        
        # Lower variance suggests AI (more consistent)
        cv = std_length / mean_length if mean_length > 0 else 1.0
        return max(0.0, 1.0 - cv)
    
    def _calculate_perplexity(self, text: str) -> float:
        """Calculate text perplexity (simplified)"""
        words = re.findall(r'\b\w+\b', text.lower())
        if len(words) < 10:
            return 0.5
        
        # Simple n-gram model for perplexity
        bigrams = [' '.join(words[i:i+2]) for i in range(len(words)-1)]
        bigram_freq = {}
        
        for bigram in bigrams:
            bigram_freq[bigram] = bigram_freq.get(bigram, 0) + 1
        
        # Calculate average log probability
        total_prob = 0
        for bigram in bigrams:
            prob = bigram_freq[bigram] / len(bigrams)
            total_prob += math.log(prob) if prob > 0 else -10
        
        avg_log_prob = total_prob / len(bigrams)
        perplexity = math.exp(-avg_log_prob)
        
        # Normalize perplexity to 0-1 range (lower = more AI-like)
        normalized_perplexity = max(0.0, min(1.0, 1.0 - (perplexity / 100)))
        return normalized_perplexity
    
    def _calculate_confidence(self, text: str, features: Dict[str, Any]) -> float:
        """Calculate confidence in the detection result"""
        # Base confidence on text length and feature quality
        word_count = features.get("word_count", 0)
        
        if word_count < 10:
            return 0.3
        elif word_count < 50:
            return 0.6
        elif word_count < 200:
            return 0.8
        else:
            return 0.9


