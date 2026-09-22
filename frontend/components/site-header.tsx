"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { fetchClient } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { cn } from "@/lib/utils";
import { Search, Bell, MapPin, ChevronDown, MonitorPlay, LogOut, Ticket } from "lucide-react";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { label: "Discover", href: "/" },
  { label: "Movies", href: "/movies" },
  { label: "Theaters", href: "/theaters" },
  { label: "My Bookings", href: "/bookings" },
];

const FORMAT_FILTERS = ["IMAX", "DOLBY", "4DX", "PRIME"];

export function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetchClient("/auth/logout", { method: "POST" })
      logout();
      router.replace("/login");
    } finally {
      setIsAccountDialogOpen(false);
      router.replace("/login");
    }
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        "border-b border-border",
        scrolled
          ? "bg-[rgba(18,19,23,0.92)] backdrop-blur-lg"
          : "bg-background"
      )}
    >
      <div className="mx-auto px-4 sm:px-6 h-14 flex items-center gap-3 overflow-visible">

        {/* ── Left: Logo + Location ── */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(230,57,70,0.4)]">
              <span className="text-white font-display text-sm leading-none font-bold">C</span>
            </div>
            <span className="font-display text-[22px] tracking-[0.06em] text-foreground group-hover:text-primary transition-colors">
              CINEBOOK
            </span>
          </Link>

          {/* Location Pill */}
          <button className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-surface border border-border text-xs font-medium text-surface-foreground/80 hover:border-border-bright hover:text-foreground transition-all duration-150">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="whitespace-nowrap">Metropolis Central</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </div>

        {/* ── Center: Navigation ── */}
        <nav className="hidden lg:flex items-center gap-1 mx-auto shrink-0">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3 py-1.5 text-sm font-medium transition-all duration-150 rounded-sm whitespace-nowrap",
                  isActive
                    ? "text-foreground bg-surface-elevated font-semibold shadow-sm"
                    : "text-surface-foreground/70 hover:text-foreground hover:bg-[rgba(255,255,255,0.05)]"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(230,57,70,0.9)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Right: Search + Auth ── */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Search icon button (compact) */}
          <button className="hidden md:flex items-center gap-2 h-9 px-3 rounded-DEFAULT bg-surface border border-border hover:border-border-bright transition-colors cursor-text">
            <Search className="h-3.5 w-3.5 text-muted shrink-0" />
            <span className="text-xs text-muted whitespace-nowrap hidden xl:inline">Search movies, format...</span>
            <span className="text-[10px] font-medium text-muted bg-surface-elevated px-1.5 py-0.5 rounded-[3px] border border-border hidden xl:inline">
              ⌘K
            </span>
          </button>

          {isAuthenticated && user ? (
            <>
              {/* Console button for admins */}
              {user.role === "admin" && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 h-8 text-xs">
                    <MonitorPlay className="h-3.5 w-3.5" />
                    Console
                  </Button>
                </Link>
              )}

              {/* Bell */}
              <button className="h-9 w-9 rounded-DEFAULT flex items-center justify-center bg-surface border border-border hover:border-border-bright transition-colors relative shrink-0">
                <Bell className="h-4 w-4 text-surface-foreground/70" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              </button>

              {/* Avatar */}
              <div className="relative">
                <button
                  onClick={() => setIsAccountDialogOpen(true)}
                  className="h-9 w-9 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center hover:border-primary transition-colors shrink-0"
                  title={`Account menu for ${user.name}`}
                  aria-haspopup="dialog"
                >
                  <span className="text-xs font-bold text-primary">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </button>

              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="h-9 text-xs whitespace-nowrap">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="h-9 text-xs px-4 whitespace-nowrap">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      {user && (
        <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>{user.name}</DialogTitle>
              <DialogDescription>{user.email}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Link
                href="/bookings"
                onClick={() => setIsAccountDialogOpen(false)}
                className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm hover:bg-surface-elevated"
              >
                <Ticket className="h-4 w-4" /> My Bookings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-left text-sm text-status-failed hover:bg-surface-elevated"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </header>
  );
}

