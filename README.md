# Spring Boot Live Streaming

[![CI](https://github.com/hendisantika/spring-boot-live-streaming/actions/workflows/ci.yml/badge.svg)](https://github.com/hendisantika/spring-boot-live-streaming/actions/workflows/ci.yml)

Platform **kelas live** yang bisa ditanam di web maupun aplikasi mobile: host dan co-host tampil di
panggung (kamera, mic, share screen), peserta menyimak, chat, dan sesekali tanya jawab.
Dirancang untuk kelas dengan peserta rata-rata di bawah 100 orang.

Media real-time ditangani [LiveKit](https://livekit.io) (WebRTC SFU). Repo ini berisi:

- **Backend Spring Boot** (root): token server dan pengatur peran peserta.
- **Frontend Next.js** ([`frontend/`](frontend)): halaman kelas untuk web.

## Arsitektur

```
Next.js (web)  ─┐                            ┌─> LiveKit Server (SFU)
Mobile app     ─┼─> Spring Boot (repo ini) ──┤     media: kamera, mic, share screen
                │   - token per peran        │     data : chat, angkat tangan
                │   - promote/demote penanya │
                └──────── connect pakai token ─────────> LiveKit
```

API secret LiveKit hanya disimpan di backend. Client (web atau mobile) cukup meminta token ke
backend lalu terhubung langsung ke LiveKit.

## Fitur

| Peran | Kemampuan |
|---|---|
| **Host** | Kamera, mic, share screen, chat. Melihat daftar angkat tangan, mengizinkan peserta bicara dan menurunkannya lagi. |
| **Co-host** | Kamera, mic, share screen, chat. |
| **Peserta** | Menonton, chat, angkat tangan. Setelah diizinkan host: mic dan kamera (tanpa share screen). |

## Tech Stack

- Java 25, Spring Boot 4.1, LiveKit Server SDK (`io.livekit:livekit-server`)
- Next.js 16, React 19, Tailwind CSS 4, LiveKit React Components
- LiveKit Server (self-host atau LiveKit Cloud)

## Menjalankan Secara Lokal

Prasyarat: JDK 25, Maven, Node.js 20.19+ (disarankan 22/24), dan LiveKit Server.

1. **LiveKit Server** (mode dev, key `devkey` / secret `secret`):
   ```bash
   livekit-server --dev
   # atau dengan Docker:
   docker run --rm -p 7880:7880 -p 7881:7881 -p 7882:7882/udp \
     livekit/livekit-server --dev --bind 0.0.0.0 --node-ip 127.0.0.1
   ```

2. **Backend** (port 8080):
   ```bash
   LIVEKIT_HOST_ACCESS_KEY=rahasia-host mvn spring-boot:run
   ```

3. **Frontend** (port 3000):
   ```bash
   cd frontend
   cp .env.example .env.local
   npm install
   npm run dev
   ```

4. Buka http://localhost:3000, masukkan nama kelas, lalu gabung sebagai **Host** (isi host key) di satu tab
   dan sebagai **Peserta** di tab lain.

## Konfigurasi Backend

Semua diatur lewat environment variable (lihat [`application.properties`](src/main/resources/application.properties)).

| Variabel | Default | Keterangan |
|---|---|---|
| `LIVEKIT_URL` | `ws://localhost:7880` | URL WebSocket LiveKit yang dikirim ke client |
| `LIVEKIT_API_URL` | `http://localhost:7880` | URL HTTP LiveKit untuk server API |
| `LIVEKIT_API_KEY` | `devkey` | API key LiveKit |
| `LIVEKIT_API_SECRET` | `secret` | API secret LiveKit |
| `LIVEKIT_HOST_ACCESS_KEY` | _(kosong)_ | Kunci untuk meminta token Host / Co-host. Kalau kosong, token Host / Co-host tidak bisa diminta. |
| `LIVEKIT_ALLOWED_ORIGINS` | `http://localhost:3000` | Origin frontend yang diizinkan (CORS), pisahkan dengan koma |

> ⚠️ Default `devkey` / `secret` hanya untuk mode dev LiveKit. Di produksi wajib diganti.

## API

| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/api/rooms/{room}/token` | Body `{"identity", "name", "role"}`; `role` = `HOST` / `CO_HOST` / `VIEWER` (default). Host / Co-host wajib header `X-Host-Key`. |
| `POST` | `/api/rooms/{room}/participants/{identity}/promote` | Izinkan peserta bicara (mic & kamera). Header `Authorization: Bearer <token host>`. |
| `POST` | `/api/rooms/{room}/participants/{identity}/demote` | Kembalikan jadi peserta biasa. Header `Authorization: Bearer <token host>`. |

Contoh:

```bash
curl -X POST http://localhost:8080/api/rooms/kelas-1/token \
  -H 'Content-Type: application/json' \
  -d '{"identity":"siswa-1","name":"Budi"}'
```

Error dikembalikan dalam format [Problem Details (RFC 9457)](https://www.rfc-editor.org/rfc/rfc9457).

## Integrasi Mobile

Aplikasi mobile memakai endpoint token yang sama, lalu terhubung dengan SDK LiveKit native:
[React Native](https://github.com/livekit/client-sdk-react-native),
[Flutter](https://github.com/livekit/client-sdk-flutter),
[Swift](https://github.com/livekit/client-sdk-swift), atau
[Android](https://github.com/livekit/client-sdk-android).
Angkat tangan dikirim lewat data channel dengan topic `raise-hand` dan payload `{"raised": true|false}`.

## Deployment (Produksi)

| Komponen | Domain | Hosting |
|---|---|---|
| Frontend Next.js | https://live.jvm.my.id | Vercel (root directory `frontend`, auto deploy dari `main`) |
| Backend Spring Boot | https://streaming.jvm.my.id/api | VPS di belakang nginx |
| LiveKit signaling | wss://streaming.jvm.my.id/rtc | VPS yang sama, di belakang nginx |

### Frontend (Vercel)

- Env Vercel: `NEXT_PUBLIC_API_URL=https://streaming.jvm.my.id`
- DNS (Cloudflare): `CNAME live → <target dari "vercel domains verify live.jvm.my.id">`, mode **DNS only** (awan abu-abu).

### Backend + LiveKit (VPS)

1. Pasang config nginx [`nginx/streaming.jvm.my.id.conf`](nginx/streaming.jvm.my.id.conf) (langkah ada di header file),
   lalu terbitkan sertifikat dengan certbot. Butuh nginx 1.25.1 atau lebih baru (`http2 on`).
2. Jalankan backend:
   ```bash
   LIVEKIT_URL=wss://streaming.jvm.my.id \
   LIVEKIT_API_URL=http://127.0.0.1:7880 \
   LIVEKIT_API_KEY=<key> LIVEKIT_API_SECRET=<secret> \
   LIVEKIT_HOST_ACCESS_KEY=<kunci-host> \
   LIVEKIT_ALLOWED_ORIGINS=https://live.jvm.my.id \
   java -jar target/live-streaming-0.0.1-SNAPSHOT.jar
   ```
3. Jalankan LiveKit Server (non-dev) dengan key/secret yang sama dan `rtc.use_external_ip: true`.
4. Buka firewall: `80/tcp`, `443/tcp`, `7881/tcp`, dan `7882/udp` (atau rentang UDP yang diset di `livekit.yaml`).
   Port `7880` cukup diakses lewat nginx dan tidak perlu dibuka ke publik.

> Kalau `streaming.jvm.my.id` di-proxy Cloudflare (awan oranye), set SSL/TLS ke **Full (strict)**.
> Signaling WebSocket tetap jalan lewat Cloudflare, sedangkan media WebRTC langsung ke IP server.

## Testing

```bash
mvn verify                                  # backend
cd frontend && npm run lint && npm run build  # frontend
```

## CI & Dependabot

- [GitHub Actions](.github/workflows/ci.yml): build dan test backend serta frontend pada setiap push / PR ke `main`,
  dan setiap hari pukul 05.00 WIB.
- [Dependabot](.github/dependabot.yml): cek update Maven, npm, dan GitHub Actions setiap hari pukul 05.00 WIB.

## Keterbatasan Saat Ini

- Host key adalah pengaman sementara. Untuk produksi perlu login / autentikasi sungguhan.
- Daftar angkat tangan disimpan di browser host, jadi akan kosong lagi kalau host me-refresh halaman.
- Belum ada rekaman kelas (bisa ditambahkan dengan LiveKit Egress).

## Author

**Hendi Santika**
- Email: hendisantika@gmail.com
- Telegram: [@hendisantika34](https://t.me/hendisantika34)
- Link: [s.id/hendisantika](https://s.id/hendisantika)
