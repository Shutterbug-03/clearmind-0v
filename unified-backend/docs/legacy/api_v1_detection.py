from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings
from app.core.database import get_db
from app.services.detection.text_detector import TextAIDetector
from app.services.detection.image_detector import ImageAIDetector
from typing import List, Optional
import json

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class TextRequest(BaseModel):
    text: str


class ScanResponse(BaseModel):
    id: int
    content_type: str
    content: Optional[str]
    file_path: Optional[str]
    url: Optional[str]
    ai_probability: float
    confidence: float
    analysis: dict
    created_at: str


@router.post("/text")
@limiter.limit("10/minute")
async def detect_text(request: Request, text_request: TextRequest, db: AsyncSession = Depends(get_db)):
    if not text_request.text or not text_request.text.strip():
        raise HTTPException(400, "Empty text")
    
    det = TextAIDetector()
    result = await det.detect(text_request.text)
    
    # Save to database
    await db.execute(
        text("""
            INSERT INTO content_scans (content_type, content, ai_probability, confidence, analysis)
            VALUES (:content_type, :content, :ai_probability, :confidence, :analysis)
        """),
        {
            "content_type": "text",
            "content": text_request.text[:1000],  # Limit content length
            "ai_probability": result["ai_probability"],
            "confidence": result["confidence"],
            "analysis": json.dumps(result["analysis"])
        }
    )
    await db.commit()
    
    return result


@router.post("/image")
@limiter.limit("5/minute")
async def detect_image(request: Request, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(400, "Unsupported image format")
    
    data = await file.read()
    if len(data) > settings.MAX_FILE_SIZE:
        raise HTTPException(400, "File too large")
    
    det = ImageAIDetector()
    result = await det.detect(data)
    
    # Save to database
    await db.execute(
        text("""
            INSERT INTO content_scans (content_type, file_path, ai_probability, confidence, analysis)
            VALUES (:content_type, :file_path, :ai_probability, :confidence, :analysis)
        """),
        {
            "content_type": "image",
            "file_path": file.filename,
            "ai_probability": result["ai_probability"],
            "confidence": result["confidence"],
            "analysis": json.dumps(result["analysis"])
        }
    )
    await db.commit()
    
    return result


@router.post("/social")
@limiter.limit("20/minute")
async def detect_social(request: Request, url: str, db: AsyncSession = Depends(get_db)):
    # TODO: scrape + analyze
    result = {"ai_probability": 0.4, "confidence": 0.6, "analysis": {"url": url}}
    
    # Save to database
    await db.execute(
        text("""
            INSERT INTO content_scans (content_type, url, ai_probability, confidence, analysis)
            VALUES (:content_type, :url, :ai_probability, :confidence, :analysis)
        """),
        {
            "content_type": "social",
            "url": url,
            "ai_probability": result["ai_probability"],
            "confidence": result["confidence"],
            "analysis": json.dumps(result["analysis"])
        }
    )
    await db.commit()
    
    return result


@router.get("/history", response_model=List[ScanResponse])
@limiter.limit("30/minute")
async def get_scan_history(request: Request, db: AsyncSession = Depends(get_db), limit: int = 50):
    """Get scan history"""
    result = await db.execute(
        text("SELECT * FROM content_scans ORDER BY created_at DESC LIMIT :limit"),
        {"limit": limit}
    )
    rows = result.fetchall()
    
    scans = []
    for row in rows:
        scans.append(ScanResponse(
            id=row[0],
            content_type=row[1],
            content=row[2],
            file_path=row[3],
            url=row[4],
            ai_probability=row[5],
            confidence=row[6],
            analysis=json.loads(row[7]) if row[7] else {},
            created_at=row[8]
        ))
    
    return scans


