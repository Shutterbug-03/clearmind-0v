from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel

router = APIRouter(prefix="/analyze", tags=["analyze"])


class TextPayload(BaseModel):
    text: str


@router.post("/text")
async def analyze_text(payload: TextPayload):
    # placeholder: integrate RoBERTa/DistilBERT ensemble
    text = payload.text
    confidence = min(98, max(2, int(len(text) / 5)))
    return {
        "id": "temp",
        "type": "text",
        "inputLabel": text[:80],
        "timestamp": "",
        "result": {
            "confidence": confidence,
            "flags": ["heuristic"],
            "summary": "placeholder",
            "provider": {"name": "ensemble", "method": "heuristic", "version": "0.1.0"},
        },
    }


@router.post("/file")
async def analyze_file(file: UploadFile = File(...)):
    # placeholder: image/video pipeline
    label = f"{file.filename}"
    return {
        "id": "temp",
        "type": "image" if (file.content_type or "").startswith("image/") else "video",
        "inputLabel": label,
        "timestamp": "",
        "result": {
            "confidence": 60,
            "flags": ["placeholder"],
            "summary": "placeholder",
            "provider": {"name": "vision", "method": "heuristic", "version": "0.1.0"},
        },
    }


