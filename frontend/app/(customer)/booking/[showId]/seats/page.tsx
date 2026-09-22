"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useShow } from "@/lib/api/shows";
import { fetchClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Info, AlertCircle, Loader2 } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import gsap from "gsap";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { io } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api/client";

const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export default function SeatSelectionPage({ params }: { params: Promise<{ showId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const { data: show, isLoading: showLoading, refetch: refetchShow } = useShow(resolvedParams.showId);
  const seats = show?.seats ?? [];

  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState(false);
  const seatRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    const showId = resolvedParams.showId;

    socket.emit("join_show", showId);
    socket.on("seat_status_changed", async (event: { showId?: number | string }) => {
      if (String(event.showId) !== showId) return;

      const result = await refetchShow();
      const availableSeatIds = new Set(
        (result.data?.seats ?? [])
          .filter((seat) => seat.status === "available")
          .map((seat) => seat.id),
      );
      setSelectedSeatIds((current) => {
        const next = new Set([...current].filter((id) => availableSeatIds.has(id)));
        return next.size === current.size ? current : next;
      });
    });

    return () => {
      socket.emit("leave_show", showId);
      socket.disconnect();
    };
  }, [refetchShow, resolvedParams.showId]);

  const handleSeatClick = (seat: (typeof seats)[number]) => {
    if (seat.status !== "available") return;
    const isSelected = selectedSeatIds.has(seat.id);
    const seatEl = seatRefs.current[seat.id];

    if (seatEl) {
      gsap.fromTo(
        seatEl,
        { scale: 0.8 },
        {
          scale: 1,
          duration: 0.4,
          ease: "elastic.out(1, 0.3)",
          boxShadow: isSelected ? "none" : "0 0 15px rgba(255, 69, 0, 0.6)"
        }
      );
    }

    setSelectedSeatIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) newSet.delete(seat.id);
      else newSet.add(seat.id);
      return newSet;
    });
  };

  const shakeSeats = () => {
    const selectedEls = Array.from(selectedSeatIds).map(id => seatRefs.current[id]).filter(Boolean);
    gsap.to(selectedEls, {
      x: [-5, 5, -5, 5, 0] as any,
      duration: 0.4,
      ease: "power1.inOut"
    });
  };

  const handleBook = async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push(`/login?redirect=/booking/${resolvedParams.showId}/seats`);
      return;
    }

    if (selectedSeatIds.size === 0) return;

    setIsSubmitting(true);
    setConflictError(false);

    try {
      const response = await fetchClient("/bookings", {
        method: "POST",
        body: JSON.stringify({
          show_id: Number(resolvedParams.showId),
          show_seat_ids: Array.from(selectedSeatIds),
        })
      });

      router.push(`/booking/${resolvedParams.showId}/checkout?bookingId=${response.booking.id}`);
    } catch (err: any) {
      if (err.status === 409) {
        await refetchShow();
        shakeSeats();
        setConflictError(true);
      } else {
        alert("An error occurred while booking. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!show || seats.length === 0) {
    return <div className="container py-20 text-center">Screen data not available.</div>;
  }

  // Group seats by row
  const rows: Record<string, (typeof seats)[number][]> = {};
  seats.forEach(seat => {
    if (!rows[seat.row_label]) rows[seat.row_label] = [];
    rows[seat.row_label].push(seat);
  });

  // Sort rows (A, B, C...) and seats within rows by col_number
  const sortedRowLabels = Object.keys(rows).sort();
  sortedRowLabels.forEach(label => {
    rows[label].sort((a, b) => a.col_number - b.col_number);
  });

  const basePrice = Number(show.ticket_price);

  const totalPrice = Array.from(selectedSeatIds).reduce((total, id) => {
    const seat = seats.find(s => s.id === id);
    return total + (seat ? Number(seat.price) : 0);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-32">
      <div className="bg-surface border-b border-border py-6">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl font-bold">{show.movie_title}</h1>
          <p className="text-surface-foreground/80 mt-1">
            {show.theatre_name} • {new Date(show.start_time).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3 mb-8">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-surface-foreground/90">
            <strong>Live Availability Note:</strong> Seat status refreshes at checkout. If a selected seat is already taken, you'll be prompted to reselect.
          </div>
        </div>

        {/* Screen Indicator */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="h-2 w-full bg-linear-to-r from-transparent via-white/40 to-transparent rounded-[100%] shadow-[0_15px_30px_rgba(255,255,255,0.1)] mb-8" />
          <p className="text-center text-xs tracking-[0.3em] text-surface-foreground/50 uppercase">Screen</p>
        </div>

        {/* Seat Grid */}
        <div className="overflow-x-auto pb-8">
          <div className="min-w-150 flex flex-col items-center gap-4">
            {sortedRowLabels.map(rowLabel => (
              <div key={rowLabel} className="flex items-center gap-4">
                <div className="w-6 font-bold text-surface-foreground/50 text-right">{rowLabel}</div>
                <div className="flex gap-2">
                  {rows[rowLabel].map(seat => {
                    const isSelected = selectedSeatIds.has(seat.id);
                    const isUnavailable = seat.status !== "available";

                    return (
                      <button
                        key={seat.id}
                        ref={el => { seatRefs.current[seat.id] = el; }}
                        onClick={() => handleSeatClick(seat)}
                        disabled={isUnavailable}
                        className={cn(
                          "relative group w-8 h-8 md:w-10 md:h-10 transition-colors duration-200 flex items-center justify-center text-[10px] md:text-xs font-medium",
                          // Shape based on seat type
                          seat.seat_type === "regular" ? "rounded-t-lg rounded-b-sm" :
                            seat.seat_type === "premium" ? "rounded-lg" : "rounded-full", // Recliner

                          isUnavailable
                            ? "cursor-not-allowed bg-surface-dim border-border text-surface-foreground/30"
                            : isSelected
                              ? "bg-primary text-primary-foreground border-transparent"
                              : "bg-surface border-border hover:border-primary/50 text-surface-foreground/70",

                          "border-2"
                        )}
                        aria-label={`Seat ${seat.seat_number}, ${seat.status}`}
                      >
                        {seat.col_number}
                      </button>
                    );
                  })}
                </div>
                <div className="w-6 font-bold text-surface-foreground/50 text-left">{rowLabel}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mt-12 border-t border-border pt-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-lg rounded-b-sm border-2 border-border bg-surface" />
            <span className="text-sm text-surface-foreground/80">Regular ({formatCurrency(basePrice)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg border-2 border-border bg-surface" />
            <span className="text-sm text-surface-foreground/80">Premium ({formatCurrency(basePrice + 100)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-border bg-surface" />
            <span className="text-sm text-surface-foreground/80">Recliner ({formatCurrency(basePrice + 200)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md border-2 border-transparent bg-primary shadow-[0_0_10px_rgba(255,69,0,0.5)]" />
            <span className="text-sm text-surface-foreground/80">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md border-2 border-border bg-surface-dim" />
            <span className="text-sm text-surface-foreground/80">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Sticky Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border p-4 z-40 transform transition-transform duration-300 translate-y-0">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-sm text-surface-foreground/70">Selected Seats</span>
              <span className="font-bold text-lg">{selectedSeatIds.size > 0 ? selectedSeatIds.size : "None"}</span>
            </div>
            <div className="h-10 w-px bg-border hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-sm text-surface-foreground/70">Total Amount</span>
              <span className="font-bold text-xl text-primary">{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full sm:w-auto rounded-full px-8"
            disabled={selectedSeatIds.size === 0 || isSubmitting || authLoading}
            onClick={handleBook}
          >
            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Proceed to Checkout"}
          </Button>
        </div>
      </div>

      {/* Conflict Dialog */}
      <Dialog open={conflictError} onOpenChange={setConflictError}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto bg-status-failed/20 p-3 rounded-full mb-4 w-fit">
              <AlertCircle className="h-6 w-6 text-status-failed" />
            </div>
            <DialogTitle className="text-center">Seats Unavailable</DialogTitle>
            <DialogDescription className="text-center">
              We're sorry, but one or more of your selected seats are no longer available. Please select different seats.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => {
              setConflictError(false);
              setSelectedSeatIds(new Set());
            }}>
              Reselect Seats
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
