import "./globals.css";
import { Spectral, Inter } from "next/font/google";
import { SessionProviderWrapper } from "./SessionProviderWrapper";
import { Nav } from "./Nav";

const fraunces = Fraunces({ subsets: ["latin", "cyrillic"], variable: "--font-display", weight: ["400", "500", "600"] });
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });

export const metadata = {
  title: "Release Radar",
  description: "Personal action-first release intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="app-shell font-sans min-h-screen">
        <SessionProviderWrapper>
          <div className="flex flex-col md:flex-row min-h-screen">
            <Nav />
            <main className="flex-1 p-4 md:p-8 max-w-5xl">{children}</main>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
