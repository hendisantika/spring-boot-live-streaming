#!/usr/bin/env bash
# Dijalankan di server lewat SSH oleh job "deploy" (ci.yml):
#   IMAGE_TAG=<run_number> RAW_BASE=<url raw folder deploy> bash -s < deploy/remote-deploy.sh
set -euo pipefail

: "${IMAGE_TAG:?IMAGE_TAG wajib diisi}"
: "${RAW_BASE:?RAW_BASE wajib diisi}"

mkdir -p ~/live-streaming && cd ~/live-streaming

# File compose dari commit yang sedang di-deploy
for f in compose.yaml livekit.yaml; do
  curl -fsSL "${RAW_BASE}/${f}" -o "${f}.new" && mv "${f}.new" "${f}"
done

test -f .env || { echo "$HOME/live-streaming/.env belum ada (lihat deploy/.env.example)"; exit 1; }
if grep -q '^IMAGE_TAG=' .env; then
  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${IMAGE_TAG}/" .env
else
  echo "IMAGE_TAG=${IMAGE_TAG}" >> .env
fi

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
