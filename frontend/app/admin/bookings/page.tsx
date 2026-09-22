"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/lib/api/client";
import { useAllBookings, Booking } from "@/lib/api/bookings";
import { useCancelBooking } from "@/lib/api/bookings";
import { CursorPagination } from "@/components/ui/cursor-pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Search, Loader2, Eye, Printer, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_ICON: Record<string, string> = {
  confirmed: "●", pending: "○", cancelled: "⊘", expired: "⊘", refunded: "↩"
};

const STATUS_VARIANTS: Record<string, any> = {
  confirmed: "confirmed", pending: "pending", cancelled: "cancelled",
  expired: "expired", refunded: "refunded"
};

export default function AdminBookingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [limit, setLimit] = useState(10);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const cancelMutation = useCancelBooking();

  const currentCursor = cursorStack[pageIndex] ?? null;

  const { data: bookingsData, isLoading, isFetching } = useAllBookings({
    cursor: currentCursor,
    limit,
    status: statusFilter || undefined,
    search: search.trim() || undefined,
  });

  const bookings = bookingsData?.bookings ?? [];
  const pagination = bookingsData?.pagination;
  const filteredBookings = bookings;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCursorStack([null]);
    setPageIndex(0);
  };

  const handleStatusChange = (s: string) => {
    setStatusFilter(s);
    setCursorStack([null]);
    setPageIndex(0);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCursorStack([null]);
    setPageIndex(0);
  };

  const handleNextPage = () => {
    if (pagination?.has_next_page && pagination?.next_cursor) {
      if (pageIndex + 1 < cursorStack.length) {
        setPageIndex(pageIndex + 1);
      } else {
        setCursorStack([...cursorStack, pagination.next_cursor]);
        setPageIndex(pageIndex + 1);
      }
    }
  };

  const handlePreviousPage = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (!window.confirm(`Cancel booking CB-${booking.id}?`)) return;

    try {
      await cancelMutation.mutateAsync(booking.id);
    } catch (error: any) {
      window.alert(error.message || "Unable to cancel booking.");
    }
  };

  const handleExport = () => {
    const header = ["Booking Ref", "Customer", "Movie", "Screen", "Showtime", "Seats", "Amount", "Status"];
    const rows = bookings.map((booking) => [
      `CB-${booking.id}`,
      `User ${booking.user_id}`,
      booking.movie_title,
      booking.screen_name,
      booking.start_time,
      booking.seats?.map((seat) => `${seat.row_label}${seat.col_number}`).join(" ") || "",
      booking.total_amount,
      booking.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cinebook-bookings.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-300 space-y-6">
      <div>
        <h1 className="font-display text-[36px] tracking-[0.03em]">TELEMETRY</h1>
        <p className="text-[13px] text-muted mt-0.5">Complete transaction audit log across all bookings and payment events.</p>
      </div>

      <div className="bg-surface border border-border rounded-md overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-border px-3 py-4 sm:flex-row sm:justify-between sm:px-6">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <Input
              placeholder="Search booking ref, email, movie..."
              className="pl-9 text-[13px] h-9"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
            {["", "confirmed", "pending", "cancelled", "expired", "refunded"].map((s) => (
              <button
                key={s || "all"}
                onClick={() => handleStatusChange(s)}
                className={`flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] text-[11px] font-semibold uppercase tracking-[0.06em] transition-all ${statusFilter === s
                  ? "bg-surface-elevated border border-primary/30 text-foreground"
                  : "border border-border text-muted hover:text-foreground hover:border-border-bright"
                  }`}
              >
                {s && <span className={`w-1.5 h-1.5 rounded-full ${s === "confirmed" ? "bg-status-confirmed" :
                  s === "pending" ? "bg-status-pending" :
                    s === "cancelled" || s === "expired" ? "bg-status-cancelled" :
                      "bg-status-refunded"
                  }`} />}
                {s || "All"}
              </button>
            ))}
            <button type="button" onClick={handleExport} className="flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] border border-border text-[11px] font-semibold text-muted hover:text-foreground hover:border-border-bright transition-all ml-1">
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
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
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-14">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" />
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-muted text-sm">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="border-b border-border/60 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
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
                      <Badge variant={STATUS_VARIANTS[b.status] ?? "secondary"} className="gap-1">
                        <span>{STATUS_ICON[b.status] ?? "•"}</span>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => setViewingBooking(b)} aria-label={`View booking CB-${b.id}`} className="h-7 w-7 rounded-[5px] flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-elevated transition-all">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => window.print()} aria-label={`Print booking CB-${b.id}`} className="h-7 w-7 rounded-[5px] flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-elevated transition-all">
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        {b.status === "pending" && (
                          <button type="button" onClick={() => handleCancel(b)} disabled={cancelMutation.isPending} aria-label={`Cancel booking CB-${b.id}`} className="h-7 w-7 rounded-[5px] flex items-center justify-center text-muted hover:text-status-cancelled hover:bg-status-cancelled/10 transition-all disabled:opacity-50">
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

        {/* Cursor Pagination */}
        <CursorPagination
          limit={limit}
          onLimitChange={handleLimitChange}
          hasNextPage={Boolean(pagination?.has_next_page)}
          hasPreviousPage={pageIndex > 0}
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
          currentPage={pageIndex + 1}
          totalItems={pagination?.total}
          currentCount={bookings.length}
          isLoading={isFetching}
        />
      </div>

      <Dialog open={!!viewingBooking} onOpenChange={(open) => !open && setViewingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking CB-{viewingBooking?.id}</DialogTitle>
          </DialogHeader>
          {viewingBooking && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted">Customer</span><span>User {viewingBooking.user_id}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted">Movie</span><span>{viewingBooking.movie_title}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted">Screen</span><span>{viewingBooking.screen_name}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted">Seats</span><span>{viewingBooking.seats?.map((seat) => `${seat.row_label}${seat.col_number}`).join(", ") || "—"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted">Status</span><span className="capitalize">{viewingBooking.status}</span></div>
              <div className="flex justify-between gap-4 font-semibold"><span>Total</span><span>{formatCurrency(viewingBooking.total_amount)}</span></div>
              {viewingBooking.status === "cancelled" && (viewingBooking.refund_amount ?? 0) > 0 && (
                <div className="flex justify-between gap-4 text-status-confirmed">
                  <span>Refund (50%)</span>
                  <span>{formatCurrency(viewingBooking.refund_amount ?? 0)}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
