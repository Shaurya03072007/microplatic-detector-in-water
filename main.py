import os
import time
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import database
import analyze
from database import AnalysisResult

app = FastAPI(title="Microplastics Monitor API")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount the static files directory to serve images directly
app.mount("/images", StaticFiles(directory=UPLOAD_DIR), name="images")

# Endpoints
@app.get("/api/health")
def read_root():
    return {"status": "Camera backend running."}

@app.post("/upload")
async def upload_image(image: UploadFile = File(...), db: Session = Depends(database.get_db)):
    if not image.filename:
        raise HTTPException(status_code=400, detail="No file received.")
        
    # Generate unique filename
    timestamp = int(time.time() * 1000)
    safe_filename = f"frame_{timestamp}.jpg"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Save the uploaded file
    try:
        content = await image.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")
        
    # Analyze the image using the imported Python module
    try:
        analysis_data = analyze.analyze_image(file_path)
        percentage = analysis_data.get("percentage", 0.0)
        detected_path = analysis_data.get("detected_path")
        
        # Determine the relative filename of the detected image
        detected_filename = None
        if detected_path and os.path.exists(detected_path):
            detected_filename = os.path.basename(detected_path)
            
        # Logging to SQLite
        db_result = AnalysisResult(
            original_filename=safe_filename,
            detected_filename=detected_filename,
            percentage=percentage
        )
        db.add(db_result)
        db.commit()
        db.refresh(db_result)
        
        print(f"Image saved and analyzed. Microplastics: {percentage:.4f}%")
        return {"status": "OK", "percentage": percentage}
        
    except Exception as e:
        print(f"Analysis failed: {e}")
        # Even if analysis fails, we return 200 so the Pi doesn't retry infinitely or crash
        return {"status": "OK (Analysis Failed)", "error": str(e)}

@app.get("/api/history")
def get_history(limit: int = 50, db: Session = Depends(database.get_db)):
    results = db.query(AnalysisResult).order_by(AnalysisResult.timestamp.desc()).limit(limit).all()
    
    # Format the data for the frontend
    history_data = []
    for r in results:
        history_data.append({
            "id": r.id,
            "timestamp": r.timestamp.isoformat() + "Z", # Ensure UTC timezone notation
            "percentage": r.percentage,
            "original_filename": r.original_filename,
            "original_image": f"/images/{r.original_filename}" if r.original_filename else None,
            "detected_image": f"/images/{r.detected_filename}" if r.detected_filename else None
        })
        
    return history_data


# --- FRONTEND SERVING ---
# Mount the React build directory LAST so it doesn't override /api routes
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    print("WARNING: frontend/dist not found. Did you run `npm run build`?")
