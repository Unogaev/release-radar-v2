import "./globals.css";
import { Inter, Manrope, IBM_Plex_Mono } from "next/font/google";
import { SessionProviderWrapper } from "./SessionProviderWrapper";
import { LanguageProvider } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });

const rrSans = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-rr-sans",
  display: "swap",
});

const rrDisplay = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-rr-display",
  display: "swap",
});

const rrMono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-rr-mono",
  display: "swap",
});

export const metadata = {
  title: "Release Radar",
  description: "Personal action-first release intelligence",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${rrSans.variable} ${rrDisplay.variable} ${rrMono.variable}`}
    >
      <body className="app-shell font-sans min-h-screen">
        <SessionProviderWrapper>
          <LanguageProvider>{children}</LanguageProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
