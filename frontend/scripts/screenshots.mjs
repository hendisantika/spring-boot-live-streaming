// Ambil screenshot web app sebagai Host dan Peserta (kamera palsu bawaan Chrome).
//
//   bun scripts/screenshots.mjs                 # host key ditanya (input tersembunyi)
//   echo "HOST_KEY=..." > .env.screenshots      # atau simpan di file (diabaikan git)
//
// Opsi env: BASE_URL (default https://live.jvm.my.id), ROOM (default demo-kelas),
//           OUT_DIR (default ../../docs/screenshots, relatif ke folder scripts), CHROME_CHANNEL (default chrome)
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const BASE_URL = process.env.BASE_URL ?? "https://live.jvm.my.id";
const ROOM = process.env.ROOM ?? "demo-kelas";
const OUT_DIR = resolve(import.meta.dirname, process.env.OUT_DIR ?? "../../docs/screenshots");
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

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

mkdirSync(OUT_DIR, { recursive: true });
const shot = (page, name, opts = {}) => page.screenshot({ path: `${OUT_DIR}/${name}.png`, ...opts });
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
  channel: process.env.CHROME_CHANNEL ?? "chrome",
  headless: true,
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--auto-accept-this-tab-capture",
    "--auto-select-tab-capture-source-by-title=Kelas Live",
  ],
});

async function newPage(viewport, isMobile = false) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    isMobile,
    hasTouch: isMobile,
    permissions: ["camera", "microphone"],
  });
  return context.newPage();
}

async function join(page, name, role, hostKey) {
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
  const input = page.locator(".lk-chat-form-input");
  await input.fill(text);
  await input.press("Enter");
}

try {
  // Halaman depan & form gabung
  const intro = await newPage(DESKTOP);
  await intro.goto(BASE_URL);
  await shot(intro, "landing");
  await intro.goto(`${BASE_URL}/room/${ROOM}`);
  await intro.getByLabel("Nama kamu").fill("Bu Ratna");
  await intro.getByRole("radio", { name: /^Host/ }).check();
  await pause(300);
  await shot(intro, "gabung");
  await intro.context().close();

  // Host: kamera + share screen
  const host = await newPage(DESKTOP);
  await join(host, "Bu Ratna", "Host", HOST_KEY);
  await host.locator('button[data-lk-source="camera"]').click();
  await host.locator('button[data-lk-source="screen_share"]').click().catch(() => {});
  await sendChat(host, "Selamat pagi! Hari ini kita bahas persamaan linear.");

  // Peserta di desktop & mobile
  const viewer = await newPage(DESKTOP);
  await join(viewer, "Budi", "Peserta");
  const mobile = await newPage(MOBILE, true);
  await join(mobile, "Sari", "Peserta");

  await pause(1500);
  await sendChat(viewer, "Bu, boleh tanya soal nomor 3?");
  await viewer.getByRole("button", { name: "Angkat tangan" }).click();
  await pause(4000); // video & pesan sampai ke semua peserta

  await shot(host, "host");
  await host.getByRole("tab", { name: /Tanya jawab/ }).click();
  await pause(500);
  await shot(host, "host-tanya-jawab");
  await shot(viewer, "peserta");
  await shot(mobile, "peserta-mobile");

  // Host mengizinkan Budi bicara
  await host.getByRole("button", { name: "Izinkan bicara" }).first().click();
  await viewer.getByText("Host mengizinkan kamu bicara").waitFor({ timeout: 10_000 });
  await viewer.locator('button[data-lk-source="camera"]').click();
  await pause(3000);
  await shot(viewer, "peserta-bicara");

  console.log(`Screenshot tersimpan di ${OUT_DIR}`);
} finally {
  await browser.close();
}
