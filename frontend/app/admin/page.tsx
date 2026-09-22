"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/lib/api/client";
import { Booking } from "@/lib/api/bookings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  Film, MonitorPlay, MapPin, TrendingUp, CalendarClock, Loader2,
  Eye, Printer, X, Plus
} from "lucide-react";
import Link from "next/link";

function StatTile({
  label, value, sub, icon: Icon, accent = false, trend
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; accent?: boolean; trend?: string;
}) {
  return (
    <div className="bg-[#15161b] border border-[#282a33] rounded-md p-5 space-y-3">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-foreground/50">{label}</p>
        <div className="h-7 w-7 rounded-sm bg-surface-elevated border border-border flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-muted" />
        </div>
      </div>
      <div>
        <p className={`font-display text-[42px] leading-none tracking-[0.02em] ${accent ? "text-primary" : "text-foreground"}`}>
          {value}
        </p>
        {trend && (
          <p className="text-[12px] text-status-confirmed font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> {trend}
          </p>
        )}
      </div>
      <p className="text-[12px] text-muted">{sub}</p>
      <div className="h-0.5 w-full rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${accent ? "bg-primary" : "bg-status-confirmed"} w-3/4`} />
      </div>
    </div>
  );
}

const STATUS_ICON: Record<string, { dot: string; label: string }> = {
  confirmed: { dot: "●", label: "confirmed" },
  pending: { dot: "○", label: "pending" },
  cancelled: { dot: "⊘", label: "cancelled" },
  expired: { dot: "⊘", label: "expired" },
  refunded: { dot: "↩", label: "refunded" },
};

export default function AdminDashboardPage() {
  const { data: movies, isLoading: mL } = useQuery({
    queryKey: ["admin-movies"],
    queryFn: () => fetchClient("/movies").then((d) => d.movies),
  });
  const { data: shows, isLoading: sL } = useQuery({
    queryKey: ["admin-shows"],
    queryFn: () => fetchClient("/shows").then((d) => d.shows),
  });
  const { data: bookings, isLoading: bL } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => fetchClient("/bookings").then((d) => d.bookings as Booking[]),
  });
  const { data: theaters, isLoading: tL } = useQuery({
    queryKey: ["admin-theaters"],
    queryFn: () => fetchClient("/theaters").then((d) => d.theaters),
  });

  const isLoading = mL || sL || bL || tL;

  const totalRevenue = (bookings ?? []).reduce(
    (acc, b) => (b.status === "confirmed" ? acc + Number(b.total_amount) : acc),
    0
  );
  const seatsTotal = (bookings ?? []).filter((b) => b.status === "confirmed").length * 2; // approx

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const recentBookings = (bookings ?? []).slice(0, 8);

  return (
    <div className="w-full max-w-300 space-y-6 sm:space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest font-semibold text-surface-foreground/50 mb-1">
            Real-time floor state, multiplex projection arrays, and transaction auditing telemetry.
          </p>
          <h1 className="font-display text-[30px] tracking-[0.03em] sm:text-[38px]">OVERVIEW</h1>
        </div>
        <div className="flex items-center gap-2">
          {["Today", "Last 7 Days", "Month-to-date", "Custom"].map((t, i) => (
            <button
              key={t}
              className={`h-8 px-3 rounded-sm text-[12px] font-medium transition-all ${i === 0
                  ? "bg-surface-elevated border border-primary/30 text-primary"
                  : "border border-border text-muted hover:text-foreground hover:border-border-bright"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <StatTile
          label="Active Titles"
          value={movies?.length ?? 0}
          sub="+2 Premieres slotted this week"
          icon={Film}
          trend="+2 Premieres slotted"
        />
        <StatTile
          label="Upcoming Shows"
          value={shows?.length ?? 0}
          sub={`Across ${theaters?.length ?? 0} physical auditoriums`}
          icon={CalendarClock}
        />
        <StatTile
          label="Floor Utilization"
          value={seatsTotal.toLocaleString()}
          sub="82% capacity booked today"
          icon={MapPin}
          trend="82% capacity booked today"
        />
        <StatTile
          label="Computed Net Gross"
          value={`$${(totalRevenue / 1000).toFixed(1)}K`}
          sub="Reconciled Stripe & Cash terminals"
          icon={TrendingUp}
          accent
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
        <Link href="/admin/shows">
          <button className="flex items-center gap-2 h-10 px-4 rounded-DEFAULT border border-border bg-surface text-[13px] font-medium hover:border-border-bright transition-all">
            <MonitorPlay className="h-4 w-4 text-primary" />
            Live Schedule & Auditoriums
          </button>
        </Link>
        <Link href="/admin/bookings">
          <button className="flex items-center gap-2 h-10 px-4 rounded-DEFAULT border border-border bg-surface text-[13px] font-medium hover:border-border-bright transition-all">
            <Film className="h-4 w-4 text-muted" />
            All Bookings & Transactions
          </button>
        </Link>
        <Link href="/admin/movies">
          <button className="flex items-center gap-2 h-10 px-4 rounded-DEFAULT border border-border bg-surface text-[13px] font-medium hover:border-border-bright transition-all">
            <Film className="h-4 w-4 text-muted" />
            Movie Catalog
          </button>
        </Link>
        <Link href="/admin/shows">
          <Button className="flex items-center gap-2 h-10">
            <Plus className="h-4 w-4" />
            Schedule New Show
          </Button>
        </Link>
      </div>

      {/* Booking Transactions Table */}
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        {/* Table header */}
        <div className="flex flex-col gap-3 border-b border-border px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-[15px]">All Bookings & Transactions</h2>
          </div>
          {/* Filter tabs */}
          <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
            {["All", "Confirmed", "Pending", "Cancelled", "Expired", "Refunded"].map((s, i) => (
              <button
                key={s}
                className={`flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] text-[11px] font-semibold uppercase tracking-[0.06em] transition-all ${i === 0
                    ? "bg-surface-elevated border border-border text-foreground"
                    : "text-muted hover:text-foreground"
                  }`}
              >
                {i > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full ${i === 1 ? "bg-status-confirmed" :
                      i === 2 ? "bg-status-pending" :
                        i === 3 ? "bg-status-cancelled" :
                          i === 4 ? "bg-muted" : "bg-status-refunded"
                    }`} />
                )}
                {s}
              </button>
            ))}
            <button className="ml-2 flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] border border-border text-[11px] font-semibold text-muted hover:text-foreground hover:border-border-bright transition-all">
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Booking Ref</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Customer</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Movie & Screen</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Showtime</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Seats</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Net Amount</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Explicit Status</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted text-sm">No bookings recorded.</td>
                </tr>
              ) : (
                recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-border/60 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <span className="font-mono font-bold text-primary text-[12px]">#{`CB-${b.id}`}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-foreground">User {b.user_id}</div>
                      <div className="text-[11px] text-muted font-mono">u{b.user_id}***@cinebook</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-foreground truncate max-w-40">{b.movie_title}</div>
                      <div className="text-[11px] text-muted">{b.screen_name ?? "Screen 1"}</div>
                    </td>
                    <td className="px-6 py-3.5 tabular-nums text-muted text-[12px]">
                      {b.start_time ? format(parseISO(b.start_time), "MMM d, p") : "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {b.seats?.slice(0, 3).map((s) => (
                          <span key={s.id} className="px-1 py-0.5 rounded-[3px] bg-surface-elevated border border-border text-[11px] font-mono">
                            {s.row_label}{s.col_number}
                          </span>
                        )) ?? <span className="text-muted">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold tabular-nums">
                      {formatCurrency(b.total_amount)}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={b.status as any} className="gap-1">
                        <span>{STATUS_ICON[b.status]?.dot ?? "•"}</span>
                        <span>{b.status}</span>
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button className="h-7 w-7 rounded-[5px] flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-elevated transition-all">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button className="h-7 w-7 rounded-[5px] flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-elevated transition-all">
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        {b.status === "pending" && (
                          <button className="h-7 w-7 rounded-[5px] flex items-center justify-center text-muted hover:text-status-cancelled hover:bg-status-cancelled/10 transition-all">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="flex flex-col gap-3 border-t border-border px-3 py-3 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Showing 1–{recentBookings.length} of {bookings?.length ?? 0} recorded transactions today</span>
          <div className="flex items-center gap-2">
            <button className="h-7 w-7 rounded-[5px] border border-border flex items-center justify-center hover:border-border-bright transition-all text-[10px]">‹</button>
            <span className="px-2 font-medium text-foreground">Page 1 / {Math.ceil((bookings?.length ?? 1) / 8)}</span>
            <button className="h-7 w-7 rounded-[5px] border border-border flex items-center justify-center hover:border-border-bright transition-all text-[10px]">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

