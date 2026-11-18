# Frontend Kelas Live (Next.js + LiveKit)

Frontend untuk kelas live: host & co-host tampil di panggung (kamera, mic, share screen),
peserta menyimak, chat, dan angkat tangan untuk tanya jawab.

## Menjalankan

1. Jalankan LiveKit server (mode dev):
   ```bash
   livekit-server --dev            # atau: docker run --rm -p 7880:7880 -p 7881:7881 -p 7882:7882/udp livekit/livekit-server --dev --bind 0.0.0.0 --node-ip 127.0.0.1
   ```
2. Jalankan backend Spring Boot dari root repo:
   ```bash
   LIVEKIT_HOST_ACCESS_KEY=rahasia-host mvn spring-boot:run
   ```
3. Jalankan frontend:
   ```bash
   cp .env.example .env.local
   bun install
   bun run dev
   ```
4. Buka http://localhost:3000, masukkan nama kelas.
   - **Host / Co-host**: pilih perannya dan isi host key (`LIVEKIT_HOST_ACCESS_KEY`).
   - **Peserta**: cukup isi nama.

## Alur tanya jawab

1. Peserta menekan **Angkat tangan** (dikirim lewat data channel LiveKit).
2. Host melihatnya di panel **Angkat tangan** lalu menekan **Izinkan bicara**:
   backend `POST /api/rooms/{room}/participants/{identity}/promote` memberi izin mic & kamera.
3. Setelah selesai, host menekan **Selesai** (`/demote`) dan track peserta otomatis dilepas.

## Konfigurasi

| Variabel | Default | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | URL backend Spring Boot |

## Catatan

- Daftar angkat tangan disimpan di browser host; kalau host me-refresh halaman, daftar kosong lagi.
- Host key adalah pengaman sementara sampai ada login/auth.

## Membuat ulang screenshot

Script [`scripts/screenshots.mjs`](scripts/screenshots.mjs) membuka Chrome headless sebagai Host dan dua Peserta,
lalu menyimpan screenshot ke `docs/screenshots/`. Video kamera dan share screen dibuat dari HTML
(slide pelajaran dan siluet peserta) supaya hasilnya rapi.

Butuh Google Chrome, `ffmpeg`, dan Node.js 22 atau lebih baru.

```bash
echo "HOST_KEY=<host key>" > .env.screenshots   # diabaikan git
node scripts/screenshots.mjs
```

Opsi lewat env: `BASE_URL` (default https://live.jvm.my.id), `ROOM`, `OUT_DIR`, `CHROME_CHANNEL`.
Jangan jalankan saat workflow CI/CD sedang men-deploy backend, karena koneksi kelas akan terputus.

