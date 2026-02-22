import { Globe } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground tracking-tight">
            One World
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            The world's voice, unfiltered.
          </span>
        </nav>
      </div>
    </header>
  );
}
