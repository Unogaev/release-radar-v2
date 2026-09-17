import { Nav } from "@/app/Nav";
import { TopBar } from "@/components/TopBar";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <div className="flex flex-col md:flex-row flex-1">
        <Nav />
        <main className="flex-1 p-4 md:p-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
