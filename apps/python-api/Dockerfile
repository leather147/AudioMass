FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install --no-install-recommends --yes ffmpeg libsndfile1 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 audiomass

WORKDIR /srv/audiomass
COPY requirements.txt ./
RUN python -m pip install --requirement requirements.txt

COPY app ./app
USER audiomass
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
