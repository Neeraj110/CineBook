"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Film,
  MapPin,
  CalendarDays,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Bell,
  Loader2,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutGrid, label: "Overview", href: "/admin" },
  { icon: Film, label: "Movie Catalog", href: "/admin/movies" },
  { icon: MapPin, label: "Auditorium Manager", href: "/admin/theaters" },
  { icon: CalendarDays, label: "Showtime Matrix", href: "/admin/shows" },
  { icon: BookOpen, label: "Telemetry", href: "/admin/bookings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") return null;

  const activePath = NAV_ITEMS.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
  );

  return (
    <div className="min-h-screen bg-[#0d0e12] flex flex-col">

      {/* ── Top Bar ── */}
      <header className="h-14 border-b border-border bg-[#0d0e12] flex items-center px-4 gap-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[3px] bg-primary flex items-center justify-center">
              <span className="font-display text-[10px] text-white">C</span>
            </div>
            <span className="font-display text-[18px] tracking-[0.06em] text-foreground">CINEBOOK</span>
          </div>
          {/* OPS badge */}
          <span className="px-1.5 py-0.5 rounded-[3px] bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            OPS
          </span>
        </div>

        {/* Live indicator */}
        <div className="hidden md:flex items-center gap-1.5 ml-2">
          <span className="w-2 h-2 rounded-full bg-status-confirmed animate-pulse" />
          <span className="text-[12px] text-surface-foreground/60 font-medium">Projector Grid Online</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bell */}
        <button className="h-9 w-9 rounded-DEFAULT flex items-center justify-center border border-border bg-surface hover:border-border-bright transition-colors relative">
          <Bell className="h-4 w-4 text-muted" />
        </button>

        {/* Operator info */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[13px] font-semibold text-foreground">{user.name}</span>
            <span className="text-[11px] text-muted capitalize">{user.role}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <nav className="flex md:hidden shrink-0 overflow-x-auto border-b border-border bg-[#0d0e12] px-2 py-2 scrollbar-thin">
        <div className="flex min-w-max gap-1">
          {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
            const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-DEFAULT px-3 text-xs font-medium whitespace-nowrap",
                  isActive ? "bg-primary/10 text-primary" : "text-muted",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside
          className={cn(
            "hidden md:flex flex-col bg-[#0d0e12] border-r border-border shrink-0 transition-all duration-300",
            expanded ? "w-60" : "w-16"
          )}
        >
          {/* Nav items */}
          <nav className="flex-1 py-4 space-y-1 px-2">
            {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
              const isActive =
                href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={!expanded ? label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-DEFAULT transition-all duration-150 group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:text-foreground hover:bg-[rgba(255,255,255,0.04)]"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                  {expanded && (
                    <span className="text-[13px] font-medium truncate">{label}</span>
                  )}
                  {expanded && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom: Return to Storefront + Collapse toggle */}
          <div className="py-4 px-2 space-y-1 border-t border-border">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-DEFAULT text-muted hover:text-foreground hover:bg-[rgba(255,255,255,0.04)] transition-all"
            >
              <ArrowLeft className="h-5 w-5 shrink-0" />
              {expanded && <span className="text-[13px] font-medium">Return to Storefront</span>}
            </Link>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-DEFAULT text-muted hover:text-foreground hover:bg-[rgba(255,255,255,0.04)] transition-all"
            >
              <ChevronRight className={cn("h-5 w-5 shrink-0 transition-transform duration-300", expanded && "rotate-180")} />
              {expanded && <span className="text-[13px] font-medium">Collapse</span>}
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-auto scrollbar-thin">
          {/* Sub-header breadcrumb */}
          <div className="sticky top-0 z-20 bg-[#0d0e12]/95 backdrop-blur border-b border-border px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-muted">CineBook Operations</span>
                <span className="text-border">•</span>
                <span className="text-surface-foreground/80 font-medium">
                  {activePath?.label ?? "Operations"}
                </span>
                <span className="flex items-center gap-1 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-confirmed animate-pulse" />
                  <span className="text-status-confirmed font-medium">Live Box Office Sync</span>
                </span>
              </div>
              <div className="hidden md:flex items-center gap-4 text-[12px] font-medium tabular-nums">
                <span className="text-muted">Gross Today: <span className="text-gold">$52,480.00</span></span>
                <span className="text-muted">Occupancy: <span className="text-status-confirmed">87.4%</span></span>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-5 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

