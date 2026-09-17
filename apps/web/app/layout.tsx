import "./globals.css";
import { Inter } from "next/font/google";
import { SessionProviderWrapper } from "./SessionProviderWrapper";
import { Nav } from "./Nav";
import { TopBar } from "@/components/TopBar";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });

export const metadata = {
  title: "Release Radar",
  description: "Personal action-first release intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="app-shell font-sans min-h-screen">
        <SessionProviderWrapper>
          <div className="flex flex-col min-h-screen">
            <TopBar />
            <div className="flex flex-col md:flex-row flex-1">
              <Nav />
              <main className="flex-1 p-4 md:p-8 max-w-6xl">{children}</main>
            </div>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
