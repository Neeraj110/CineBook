"use client";

import { useState } from "react";
import { useMyBookings, useCancelBooking, Booking } from "@/lib/api/bookings";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Clock, MapPin, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export default function MyBookingsPage() {
  const { data: bookings, isLoading } = useMyBookings();
  const cancelMutation = useCancelBooking();
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const handleCancel = async () => {
    if (!bookingToCancel) return;
    try {
      await cancelMutation.mutateAsync(bookingToCancel.id);
      toast.success("Booking cancelled successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel booking.");
    } finally {
      setBookingToCancel(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="font-display text-4xl font-bold mb-8">My Bookings</h1>

      {!bookings || bookings.length === 0 ? (
        <Card className="text-center py-20 border-border">
          <CardHeader>
            <h2 className="text-2xl font-bold">No Bookings Yet</h2>
          </CardHeader>
          <CardContent>
            <p className="text-surface-foreground/70 mb-6">Looks like you haven't booked any movies yet.</p>
            <Link href="/movies">
              <Button>Browse Movies</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const showTime = parseISO(booking.start_time);

            return (
              <Card key={booking.id} className="overflow-hidden border-border bg-surface transition-colors hover:bg-surface-hover">
                <div className="p-6 flex flex-col md:flex-row gap-6">
                  {/* Left Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between md:justify-start gap-4">
                      <Badge variant={booking.status as any}>{booking.status}</Badge>
                      <span className="font-mono text-xs text-surface-foreground/50">#{booking.id}</span>
                    </div>
                    <h3 className="font-display text-2xl font-bold">{booking.movie_title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-surface-foreground/80 mt-2">
                      <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {format(showTime, "MMM d, yyyy")}</span>
                      <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {format(showTime, "h:mm a")}</span>
                      <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {booking.theatre_name}</span>
                    </div>
                  </div>

                  {/* Right Actions / Price */}
                  <div className="flex flex-col items-start md:items-end justify-between border-t border-border pt-4 md:border-t-0 md:pt-0 md:pl-6 md:border-l">
                    <div className="mb-4 md:mb-0">
                      <p className="text-xs text-surface-foreground/60 uppercase tracking-wider mb-1">Total Amount</p>
                      <p className="font-bold text-xl text-primary">{formatCurrency(booking.total_amount)}</p>
                      {booking.status === "cancelled" && (booking.refund_amount ?? 0) > 0 && (
                        <p className="mt-1 text-xs text-status-confirmed">
                          50% refund: {formatCurrency(booking.refund_amount ?? 0)}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                      {booking.status === "pending" && (
                        <Link href={`/booking/${booking.show_id}/checkout?bookingId=${booking.id}`} className="flex-1">
                          <Button className="w-full">Pay Now</Button>
                        </Link>
                      )}

                      {booking.status === "confirmed" && (
                        <Link href={`/confirmation/${booking.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">View Ticket</Button>
                        </Link>
                      )}

                      {(booking.status === "pending" || booking.status === "confirmed") && (
                        <Button
                          variant="destructive"
                          onClick={() => setBookingToCancel(booking)}
                          disabled={cancelMutation.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!bookingToCancel} onOpenChange={(open) => !open && setBookingToCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto bg-status-failed/20 p-3 rounded-full mb-4 w-fit">
              <AlertCircle className="h-6 w-6 text-status-failed" />
            </div>
            <DialogTitle className="text-center">Cancel Booking?</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to cancel your booking for <strong>{bookingToCancel?.movie_title}</strong>?
              {bookingToCancel?.status === "confirmed" && " A 50% refund will be initiated to your original payment method."}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-3">
            <Button variant="outline" onClick={() => setBookingToCancel(null)}>Keep Booking</Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

