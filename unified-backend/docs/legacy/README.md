This folder preserves useful logic from the previous Python backends for future porting:
- text_detector.py / image_detector.py: heuristics and optional ML/OpenCV outlines
- api_v1_detection.py: routes and rate-limit patterns
- fastapi_analyze_router.py / fastapi_models.py: minimal API and DB schema references

Nothing here is executed by the server; it is reference material only.