import "./globals.css";
import { Inter, Archivo, Bodoni_Moda, IBM_Plex_Mono } from "next/font/google";
import { SessionProviderWrapper } from "./SessionProviderWrapper";
import { LanguageProvider } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });

const rrSans = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-rr-sans",
  display: "swap",
});

const rrDisplay = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-rr-display",
  display: "swap",
});

const rrMono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic-ext"],
  weight: ["400", "500"],
  variable: "--font-rr-mono",
  display: "swap",
});

export const metadata = {
  title: "Release Radar",
  description: "Personal action-first release intelligence",
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
