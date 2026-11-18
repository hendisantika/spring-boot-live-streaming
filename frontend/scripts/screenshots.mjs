// Ambil screenshot web app sebagai Host dan Peserta.
//
//   node scripts/screenshots.mjs                # host key ditanya (input tersembunyi)
//   echo "HOST_KEY=..." > .env.screenshots      # atau simpan di file (diabaikan git)
//
// Butuh: Google Chrome, ffmpeg, Node >= 22.
// Video palsu dibuat dari HTML (slide pelajaran untuk share screen host, kartu avatar untuk
// kamera peserta) lalu dikonversi ke .y4m untuk --use-file-for-fake-video-capture Chrome.
//
// Opsi env: BASE_URL (default https://live.jvm.my.id), ROOM (default matematika-kelas-7),
//           OUT_DIR (default ../../docs/screenshots, relatif ke folder scripts),
//           CHROME_CHANNEL (default chrome)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { chromium } from "playwright-core";

const BASE_URL = process.env.BASE_URL ?? "https://live.jvm.my.id";
const ROOM = process.env.ROOM ?? "matematika-kelas-7";
const OUT_DIR = resolve(import.meta.dirname, process.env.OUT_DIR ?? "../../docs/screenshots");
const CHANNEL = process.env.CHROME_CHANNEL ?? "chrome";
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

// ---------- Host key ----------
function hostKeyFromFile() {
  const file = resolve(import.meta.dirname, "../.env.screenshots");
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, "utf8").split("\n").find((l) => l.startsWith("HOST_KEY="));
  return line?.slice("HOST_KEY=".length).trim() || undefined;
}

async function askHidden(question) {
  if (!process.stdin.isTTY) return undefined;
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (s) => rl.output.write(s.startsWith(question) ? s : "");
  const answer = await new Promise((r) => rl.question(question, r));
  rl.close();
  process.stdout.write("\n");
  return answer.trim() || undefined;
}

const HOST_KEY = process.env.HOST_KEY ?? hostKeyFromFile() ?? (await askHidden("Host key: "));
if (!HOST_KEY) {
  console.error("Host key tidak ada. Isi HOST_KEY di frontend/.env.screenshots atau jalankan di terminal interaktif.");
  process.exit(1);
}

// ---------- Video palsu ----------
const FONTS =
  '<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:wght@500;700&display=block" rel="stylesheet">';

const SLIDE_HTML = `<!doctype html><html><head>${FONTS}<style>
  body{margin:0;width:1280px;height:720px;background:#183b33;color:#eef2ec;font-family:'Plus Jakarta Sans';
    background-image:radial-gradient(ellipse 70% 60% at 15% 0%,rgb(238 242 236/.08),transparent 60%);
    display:flex;flex-direction:column;padding:72px 96px;box-sizing:border-box}
  .topic{font-size:26px;color:#a9bab2}
  h1{font-family:Caveat;font-size:96px;line-height:1;margin:12px 0 48px}
  .steps{font-family:Caveat;font-size:64px;line-height:1.25}
  .answer{display:inline-block;border-bottom:6px solid #f5c443;color:#f5c443}
</style></head><body>
  <div class="topic">Matematika kelas 7</div>
  <h1>Persamaan linear satu variabel</h1>
  <div class="steps">2x + 3 = 11<br>2x = 11 − 3<br>2x = 8<br><span class="answer">x = 4</span></div>
</body></html>`;

// Siluet simetris tanpa teks: pratinjau kamera lokal dicerminkan, jadi teks akan terbaca terbalik
const AVATAR_HTML = `<!doctype html><html><head><style>
  body{margin:0;width:640px;height:480px;background:#23493f;display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
  .person{position:relative;width:300px;height:380px}
  .head{position:absolute;left:90px;top:0;width:120px;height:120px;border-radius:50%;background:#f5c443}
  .body{position:absolute;left:0;bottom:-60px;width:300px;height:260px;border-radius:150px 150px 0 0;background:#f5c443}
</style></head><body><div class="person"><div class="head"></div><div class="body"></div></div></body></html>`;

const workDir = mkdtempSync(join(tmpdir(), "kelas-live-shots-"));

async function renderFakeVideo(html, size, name) {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await browser.newPage({ viewport: size });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const png = join(workDir, `${name}.png`);
  await page.screenshot({ path: png });
  await browser.close();
  const y4m = join(workDir, `${name}.y4m`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-loop", "1", "-i", png, "-t", "1", "-r", "10",
    "-vf", "format=yuv420p", y4m]);
  return y4m;
}

const slideVideo = await renderFakeVideo(SLIDE_HTML, { width: 1280, height: 720 }, "slide");
const budiVideo = await renderFakeVideo(AVATAR_HTML, { width: 640, height: 480 }, "budi");

const launch = (videoFile) =>
  chromium.launch({
    channel: CHANNEL,
    headless: true,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      ...(videoFile ? [`--use-file-for-fake-video-capture=${videoFile}`] : []),
    ],
  });

// ---------- Helper ----------
mkdirSync(OUT_DIR, { recursive: true });
const shot = (page, name) => page.screenshot({ path: `${OUT_DIR}/${name}.png` });
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function newPage(browser, viewport, isMobile = false, { screenFromCamera = false } = {}) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    isMobile,
    hasTouch: isMobile,
    permissions: ["camera", "microphone"],
  });
  if (screenFromCamera) {
    // Chrome headless memakai sumber layar palsu bawaan untuk getDisplayMedia (bukan file video).
    // Arahkan ke kamera palsu (berisi slide) agar share screen menampilkan slide pelajaran.
    await context.addInitScript(() => {
      navigator.mediaDevices.getDisplayMedia = () =>
        navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
    });
  }
  return context.newPage();
}

async function joinRoom(page, name, role, hostKey) {
  await page.goto(`${BASE_URL}/room/${ROOM}`);
  await page.getByLabel("Nama kamu").fill(name);
  await page.getByRole("radio", { name: new RegExp(`^${role}`) }).check();
  if (hostKey) await page.getByLabel("Host key").fill(hostKey);
  await page.getByRole("button", { name: "Gabung ke kelas" }).click();

  // Tunggu masuk kelas, atau tampilkan pesan error dari aplikasi (mis. host key salah)
  const live = page.getByText("Live", { exact: true });
  const alert = page.getByRole("alert").filter({ hasText: /\S/ });
  await Promise.race([live.waitFor({ timeout: 20_000 }), alert.waitFor({ timeout: 20_000 })]);
  if (await alert.isVisible()) {
    throw new Error(`${name} (${role}) gagal masuk kelas: ${(await alert.innerText()).trim()}`);
  }
}

async function sendChat(page, text) {
  await page.getByLabel("Pesan").fill(text);
  await page.getByRole("button", { name: "Kirim" }).click();
}

/** Tunggu sampai minimal `count` elemen video benar-benar menampilkan gambar. */
const waitForVideos = (page, count) =>
  page.waitForFunction(
    (n) => [...document.querySelectorAll("video")].filter((v) => v.readyState >= 2 && v.videoWidth > 0).length >= n,
    count,
    { timeout: 20_000 },
  );

/** Tunggu jumlah orang di kelas (ikon di header) sesuai, supaya tidak ada sesi lama yang ikut terfoto. */
const waitForPeople = (page, count) =>
  page.waitForFunction(
    (n) => document.querySelector('header [title="Jumlah orang di kelas"]')?.textContent?.trim() === String(n),
    count,
    { timeout: 45_000 },
  );

// ---------- Skenario ----------
const hostBrowser = await launch(slideVideo);
const budiBrowser = await launch(budiVideo);
const sariBrowser = await launch();

try {
  // Halaman depan & form gabung
  const intro = await newPage(sariBrowser, DESKTOP);
  await intro.goto(BASE_URL);
  await intro.evaluate(() => document.fonts.ready);
  await shot(intro, "landing");
  await intro.goto(`${BASE_URL}/room/${ROOM}`);
  await intro.getByLabel("Nama kamu").fill("Bu Ratna");
  await intro.getByRole("radio", { name: /^Host/ }).check();
  await intro.getByLabel("Host key").waitFor();
  await shot(intro, "gabung");
  await intro.context().close();

  // Host membagikan slide (share screen), kamera mati
  const host = await newPage(hostBrowser, DESKTOP, false, { screenFromCamera: true });
  await joinRoom(host, "Bu Ratna", "Host", HOST_KEY);
  await host.locator('button[data-lk-source="screen_share"]').click();

  // Peserta di desktop & mobile
  const budi = await newPage(budiBrowser, DESKTOP);
  await joinRoom(budi, "Budi", "Peserta");
  const sari = await newPage(sariBrowser, MOBILE, true);
  await joinRoom(sari, "Sari", "Peserta");

  await waitForPeople(host, 3);
  await waitForVideos(budi, 1);
  await waitForVideos(sari, 1);

  // Chat dikirim setelah semua masuk (riwayat chat tidak dikirim ke peserta yang datang belakangan)
  await sendChat(host, "Selamat pagi! Hari ini kita bahas persamaan linear satu variabel.");
  await budi.getByText("Selamat pagi!").waitFor();

  await sendChat(budi, "Bu, kenapa 3-nya pindah jadi minus?");
  await budi.getByRole("button", { name: "Angkat tangan" }).click();
  await host.getByRole("tab", { name: /Tanya jawab\s*1/ }).waitFor({ timeout: 10_000 });
  await pause(1000);

  await shot(host, "host");
  await shot(budi, "peserta");
  await shot(sari, "peserta-mobile");
  await host.getByRole("tab", { name: /Tanya jawab/ }).click();
  await host.getByRole("button", { name: "Izinkan bicara" }).waitFor();
  await shot(host, "host-tanya-jawab");

  // Host mengizinkan Budi bicara, Budi menyalakan kamera
  await host.getByRole("button", { name: "Izinkan bicara" }).first().click();
  await budi.getByText("Host mengizinkan kamu bicara").waitFor({ timeout: 10_000 });
  await budi.locator('button[data-lk-source="camera"]').click();
  await waitForVideos(budi, 2);
  await pause(1000);
  await shot(budi, "peserta-bicara");

  // Sisi host: Budi di panel "Sedang bicara" dan kameranya tampil di panggung
  await host.getByRole("button", { name: "Selesai" }).waitFor({ timeout: 10_000 });
  await waitForVideos(host, 2);
  await pause(1000);
  await shot(host, "host-penanya");

  console.log(`Screenshot tersimpan di ${OUT_DIR}`);
} finally {
  await Promise.all([hostBrowser.close(), budiBrowser.close(), sariBrowser.close()]);
  rmSync(workDir, { recursive: true, force: true });
}
