"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAVIGATIONS } from "@/config/navigations";
import { cn } from "@/lib/utils";

import { Logo } from "./logo";
import { ThemeSelector } from "./theme-selector";
import { Button } from "./ui/button";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky inset-0 flex w-full items-center gap-4 border border-b-primary/40 bg-background p-4">
      <div className="container mx-auto flex items-center justify-between">
        <nav className="flex items-center justify-start gap-4">
          <Logo />
          <div className="hidden items-center gap-4 md:flex">
            {NAVIGATIONS.map(({ label, href }) => (
              <Link href={href} key={href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "px-4 font-semibold text-secondary-foreground/80 text-sm hover:font-bold dark:hover:bg-input/30",
                    pathname === href && "bg-input/30"
                  )}
                >
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        </nav>
        <div className="flex items-center justify-end gap-4">
          <ThemeSelector />
          <Button size="lg" className="px-6 font-bold">
            Connect
          </Button>
        </div>
      </div>
    </header>
  );
}
