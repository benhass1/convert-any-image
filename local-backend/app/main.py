"""Local-only heavy image converter. Run on a trusted machine or private network, never as a public upload relay."""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "100")) * 1024 * 1024
ALLOWED_OUTPUTS = {"jpg": "jpg", "png": "png", "webp": "webp", "avif": "avif", "tiff": "tiff", "bmp": "bmp", "gif": "gif", "ico": "ico", "tga": "tga", "pdf": "pdf", "psd": "psd"}

app = FastAPI(title="Convert Any Image Local Backend", docs_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=False, allow_methods=["POST", "GET"], allow_headers=["Content-Type"])

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "local-only"}

@app.post("/api/convert")
async def convert(file: UploadFile = File(...), output_format: str = Form("webp")) -> FileResponse:
    normalized_output = output_format.lower().strip()
    if normalized_output not in ALLOWED_OUTPUTS:
        raise HTTPException(status_code=400, detail="Unsupported output format.")
    if not file.filename:
        raise HTTPException(status_code=400, detail="A file name is required.")
    suffix = Path(file.filename).suffix.lower() or ".bin"
    with tempfile.TemporaryDirectory(prefix="convert-any-image-") as directory:
        source = Path(directory, f"source{suffix}")
        target = Path(directory, f"converted.{ALLOWED_OUTPUTS[normalized_output]}")
        total = 0
        with source.open("wb") as destination:
            while chunk := await file.read(1024 * 1024):
                total += len(chunk)
                if total > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="File exceeds the configured local size limit.")
                destination.write(chunk)
        try:
            subprocess.run(["magick", f"{source}[0]", "-auto-orient", str(target)], check=True, timeout=120, capture_output=True, text=True)
        except subprocess.TimeoutExpired as exc:
            raise HTTPException(status_code=504, detail="Conversion exceeded the local time limit.") from exc
        except subprocess.CalledProcessError as exc:
            raise HTTPException(status_code=422, detail="ImageMagick could not read or convert this file.") from exc
        persisted = Path(tempfile.gettempdir(), f"convert-any-image-{os.urandom(8).hex()}.{ALLOWED_OUTPUTS[normalized_output]}")
        shutil.copy2(target, persisted)
    return FileResponse(persisted, media_type="application/octet-stream", filename=f"{Path(file.filename).stem}.{ALLOWED_OUTPUTS[normalized_output]}", background=BackgroundTask(persisted.unlink, missing_ok=True))
