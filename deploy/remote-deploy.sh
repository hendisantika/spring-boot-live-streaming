#!/usr/bin/env bash
# Dijalankan di server lewat SSH oleh job "deploy" (ci.yml). Semua variabel dikirim lewat
# stdin sebagai baris `export ...` sebelum isi script ini, jadi secret tidak pernah muncul
# di argumen proses (`ps`) maupun tersimpan di file di server.
set -euo pipefail

: "${IMAGE_TAG:?IMAGE_TAG wajib diisi}"
: "${RAW_BASE:?RAW_BASE wajib diisi}"
: "${LIVEKIT_API_KEY:?LIVEKIT_API_KEY wajib diisi}"
: "${LIVEKIT_API_SECRET:?LIVEKIT_API_SECRET wajib diisi}"
: "${LIVEKIT_HOST_ACCESS_KEY:?LIVEKIT_HOST_ACCESS_KEY wajib diisi}"
export IMAGE_TAG LIVEKIT_API_KEY LIVEKIT_API_SECRET LIVEKIT_HOST_ACCESS_KEY

mkdir -p ~/live-streaming && cd ~/live-streaming

# Jangan ada .env di server; compose juga otomatis membaca .env kalau ada, jadi hapus sisa lama
rm -f .env

# File compose dari commit yang sedang di-deploy
for f in compose.yaml livekit.yaml; do
  curl -fsSL "${RAW_BASE}/${f}" -o "${f}.new" && mv "${f}.new" "${f}"
done

docker compose pull
docker compose up -d --remove-orphans
docker compose ps

for _ in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:8020/api/rooms/healthcheck/token \
    -H 'Content-Type: application/json' -d '{"identity":"deploy-check"}' || true)
  if [ "$code" = "200" ]; then
    echo "API sehat (tag ${IMAGE_TAG})"
    exit 0
  fi
  sleep 2
done

echo "API tidak merespons 200 setelah deploy"
docker compose logs --tail 80 api
exit 1
