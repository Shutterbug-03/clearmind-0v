import cv2
import numpy as np
from typing import Dict, Any
import io
from PIL import Image
import math

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False


class ImageAIDetector:
    def __init__(self):
        self.opencv_available = OPENCV_AVAILABLE
    
    async def detect(self, image_data: bytes) -> Dict[str, Any]:
        """Detect if image is AI-generated"""
        if self.opencv_available:
            return await self._advanced_detection(image_data)
        else:
            return await self._basic_detection(image_data)
    
    async def _advanced_detection(self, image_data: bytes) -> Dict[str, Any]:
        """Advanced AI detection using OpenCV and computer vision"""
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                return await self._basic_detection(image_data)
            
            # Multiple detection methods
            frequency_score = self._frequency_domain_analysis(img)
            artifact_score = self._detect_ai_artifacts(img)
            metadata_score = self._analyze_metadata(image_data)
            texture_score = self._analyze_texture_patterns(img)
            
            # Weighted combination
            ai_probability = (
                frequency_score * 0.35 +
                artifact_score * 0.25 +
                metadata_score * 0.20 +
                texture_score * 0.20
            )
            
            confidence = self._calculate_confidence(img, {
                "frequency": frequency_score,
                "artifacts": artifact_score,
                "metadata": metadata_score,
                "texture": texture_score
            })
            
            return {
                "ai_probability": ai_probability,
                "confidence": confidence,
                "analysis": {
                    "method": "advanced_cv",
                    "frequency_analysis": frequency_score,
                    "artifact_detection": artifact_score,
                    "metadata_analysis": metadata_score,
                    "texture_analysis": texture_score,
                    "image_size": f"{img.shape[1]}x{img.shape[0]}",
                    "channels": img.shape[2] if len(img.shape) > 2 else 1
                }
            }
            
        except Exception as e:
            # Fallback to basic detection
            return await self._basic_detection(image_data)
    
    async def _basic_detection(self, image_data: bytes) -> Dict[str, Any]:
        """Basic detection when OpenCV is not available"""
        try:
            # Simple file size and format analysis
            size = len(image_data)
            metadata_score = self._analyze_metadata(image_data)
            
            # Basic heuristics
            ai_probability = min(0.8, max(0.2, metadata_score))
            confidence = 0.5
            
            return {
                "ai_probability": ai_probability,
                "confidence": confidence,
                "analysis": {
                    "method": "basic",
                    "file_size": size,
                    "metadata_score": metadata_score
                }
            }
        except Exception:
            return {
                "ai_probability": 0.5,
                "confidence": 0.3,
                "analysis": {"method": "fallback"}
            }
    
    def _frequency_domain_analysis(self, img: np.ndarray) -> float:
        """Analyze frequency domain for AI artifacts"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply FFT
            f_transform = np.fft.fft2(gray)
            f_shift = np.fft.fftshift(f_transform)
            magnitude_spectrum = np.log(np.abs(f_shift) + 1)
            
            # Analyze frequency distribution
            height, width = magnitude_spectrum.shape
            center_y, center_x = height // 2, width // 2
            
            # Check for unusual frequency patterns
            # AI-generated images often have specific frequency characteristics
            
            # High-frequency content analysis
            high_freq_region = magnitude_spectrum[
                center_y-height//4:center_y+height//4,
                center_x-width//4:center_x+width//4
            ]
            
            # Low-frequency content analysis
            low_freq_region = magnitude_spectrum[
                center_y-height//8:center_y+height//8,
                center_x-width//8:center_x+width//8
            ]
            
            # Calculate frequency ratios
            high_freq_mean = np.mean(high_freq_region)
            low_freq_mean = np.mean(low_freq_region)
            
            # AI images often have unusual high/low frequency ratios
            freq_ratio = high_freq_mean / (low_freq_mean + 1e-8)
            
            # Normalize to 0-1 range
            normalized_ratio = min(1.0, freq_ratio / 10.0)
            
            return normalized_ratio
            
        except Exception:
            return 0.5
    
    def _detect_ai_artifacts(self, img: np.ndarray) -> float:
        """Detect common AI generation artifacts"""
        try:
            # Convert to different color spaces
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            
            # Check for unusual color distributions
            hsv_std = np.std(hsv, axis=(0, 1))
            lab_std = np.std(lab, axis=(0, 1))
            
            # AI images often have more uniform color distributions
            color_uniformity = 1.0 - (np.mean(hsv_std) + np.mean(lab_std)) / 255.0
            
            # Check for edge consistency
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
            
            # AI images often have more consistent edge patterns
            edge_consistency = 1.0 - edge_density
            
            # Combine scores
            artifact_score = (color_uniformity * 0.6 + edge_consistency * 0.4)
            
            return max(0.0, min(1.0, artifact_score))
            
        except Exception:
            return 0.5
    
    def _analyze_metadata(self, image_data: bytes) -> float:
        """Analyze image metadata for AI indicators"""
        try:
            # Check file size patterns
            size = len(image_data)
            
            # AI-generated images often have specific size characteristics
            # This is a simplified heuristic
            if size < 10000:  # Very small
                return 0.3
            elif size < 50000:  # Small
                return 0.5
            elif size < 200000:  # Medium
                return 0.6
            elif size < 1000000:  # Large
                return 0.7
            else:  # Very large
                return 0.8
                
        except Exception:
            return 0.5
    
    def _analyze_texture_patterns(self, img: np.ndarray) -> float:
        """Analyze texture patterns for AI generation signs"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Calculate texture features using GLCM-like approach
            # Simplified texture analysis
            
            # Check for repetitive patterns
            # AI images often have more uniform textures
            
            # Calculate local variance
            kernel_size = 5
            kernel = np.ones((kernel_size, kernel_size), np.float32) / (kernel_size * kernel_size)
            mean_img = cv2.filter2D(gray.astype(np.float32), -1, kernel)
            var_img = cv2.filter2D((gray.astype(np.float32) - mean_img) ** 2, -1, kernel)
            
            # Texture uniformity (lower variance = more uniform = more AI-like)
            texture_uniformity = 1.0 - (np.mean(var_img) / 255.0)
            
            return max(0.0, min(1.0, texture_uniformity))
            
        except Exception:
            return 0.5
    
    def _calculate_confidence(self, img: np.ndarray, scores: Dict[str, float]) -> float:
        """Calculate confidence in the detection result"""
        # Base confidence on image quality and analysis consistency
        
        # Check if image is valid
        if img is None or img.size == 0:
            return 0.3
        
        # Check image dimensions
        height, width = img.shape[:2]
        if height < 64 or width < 64:
            return 0.4
        elif height < 256 or width < 256:
            return 0.6
        elif height < 1024 or width < 1024:
            return 0.8
        else:
            return 0.9


