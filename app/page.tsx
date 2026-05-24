import { TramaGraph } from "@/components/graph/graph-canvas";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col">
      <header className="absolute top-0 right-0 z-10 flex items-center gap-2 p-3">
        <ThemeToggle />
      </header>
      <main className="flex flex-1">
        <TramaGraph />
      </main>
    </div>
  );
}
