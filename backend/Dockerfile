
FROM python:3.11.9-slim

# System libs that OpenCV + MediaPipe need (prevents libGL.so.1 error)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# HF Spaces runs as a non-root user — create one
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    HF_HOME=/home/user/.cache/huggingface

WORKDIR $HOME/app

# CPU-only torch (free Space has no GPU; keeps image smaller)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch==2.2.2 torchvision==0.17.2 --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir "numpy==1.26.4" --force-reinstall
COPY --chown=user . .

# Port 7860 — the one public door HF opens
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]