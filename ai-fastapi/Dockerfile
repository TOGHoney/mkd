# Use lightweight official Python 3.11 runtime
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    OMP_NUM_THREADS=1 \
    HF_HOME=/app/cache \
    FASTEMBED_CACHE_PATH=/app/cache

# Set working directory
WORKDIR /app

# Install minimal OS dependencies for lxml / web parsing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download the FastEmbed embedding model into the image cache
# This ensures zero cold-start model download latency at runtime
RUN mkdir -p /app/cache && \
    python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='BAAI/bge-small-en-v1.5', cache_dir='/app/cache', threads=1)" && \
    chmod -R 777 /app/cache

# Copy application source code
COPY . .

# Expose default port (7860 for Hugging Face Spaces; dynamically overridden on Render/Railway)
EXPOSE 7860

# Launch FastAPI with Uvicorn (reads $PORT dynamically with 7860 fallback)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
