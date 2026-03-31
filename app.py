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

# Homepage
@app.get("/")
def home():
    return FileResponse("index.html")


def detect_bpm(file_path):
    print("Loading file:", file_path)

    try:
        # 🔥 FIX: stabielere + snellere load op Render
        y, sr = librosa.load(file_path, sr=22050, mono=True)

        print("Audio loaded:", len(y), sr)

        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)

        print("Raw tempo:", tempo)

        bpm = float(tempo.item() if hasattr(tempo, "item") else tempo)

        if bpm < 90:
            bpm *= 2

        return round(bpm)

    except Exception as e:
        print("BPM ERROR:", str(e))
        return 0


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
        print("UPLOAD ERROR:", str(e))
        return {
            "error": str(e),
            "bpm": 0
        }

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)
