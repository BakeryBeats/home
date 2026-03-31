from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import librosa
import shutil
import os

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ HOMEPAGE FIX (Render 404 oplossen)
@app.get("/")
def home():
    return FileResponse("index.html")


def detect_bpm(file_path):
    print("Loading file:", file_path)

    # stabiele audio load
    y, sr = librosa.load(file_path, sr=None, mono=True)

    print("Audio loaded:", len(y), sr)

    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)

    print("Raw tempo:", tempo)

    bpm = float(tempo.item() if hasattr(tempo, "item") else tempo)

    if bpm < 90:
        bpm *= 2

    return round(bpm)


@app.post("/upload/")
async def upload(file: UploadFile = File(...)):
    filepath = f"temp_{file.filename}"

    try:
        print("Received file:", file.filename)

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        bpm = detect_bpm(filepath)

        print("Final BPM:", bpm)

        return {
            "bpm": bpm,
            "file": file.filename
        }

    except Exception as e:
        print("ERROR:", str(e))
        return {"error": str(e)}

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)
