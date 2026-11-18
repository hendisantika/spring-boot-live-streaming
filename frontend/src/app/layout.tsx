import type { Metadata, Viewport } from "next";
import { Caveat, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Plus Jakarta Sans: dirancang untuk identitas kota Jakarta, untuk seluruh teks antarmuka
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// Caveat: tulisan tangan kapur, hanya untuk judul yang "ditulis di papan"
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Kelas Live",
  description: "Kelas live: host dan co-host di panggung, peserta menyimak, chat, dan tanya jawab.",
};

export const viewport: Viewport = {
  themeColor: "#183b33",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} ${caveat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
