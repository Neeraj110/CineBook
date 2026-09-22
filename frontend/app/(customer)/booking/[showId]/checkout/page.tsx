"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBooking } from "@/lib/api/bookings";
import { fetchClient } from "@/lib/api/client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { Clock, CreditCard, Loader2 } from "lucide-react";

function CheckoutContent({ showId }: { showId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  
  const { data: booking, isLoading, refetch } = useBooking(bookingId || undefined);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!booking || booking.status !== "pending") return;
    
    // 10 minutes hold
    const expiryTime = new Date(booking.created_at).getTime() + 10 * 60 * 1000;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeLeft(diff);
      
      if (diff === 0) {
        clearInterval(interval);
        refetch(); // Should fetch updated status (expired)
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [booking, refetch]);

  const handlePayment = async () => {
    if (!bookingId) return;
    setIsPaying(true);
    try {
      // Simulate payment method
      await fetchClient("/payments", {
        method: "POST",
        body: JSON.stringify({
          booking_id: Number(bookingId),
          payment_method: "card",
          transaction_id: `txn_${Math.random().toString(36).substring(2, 9)}`
        })
      });
      router.push(`/confirmation/${bookingId}`);
    } catch (err) {
      alert("Payment failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!booking) {
    return <div className="text-center py-20">Booking not found.</div>;
  }

  if (booking.status !== "pending") {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Booking {booking.status}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-surface-foreground/80 mb-4">
              This booking is no longer pending payment.
            </p>
            {booking.status === "confirmed" && (
              <Button onClick={() => router.push(`/confirmation/${booking.id}`)} className="w-full">
                View Ticket
              </Button>
            )}
            {booking.status === "expired" && (
              <Button variant="outline" onClick={() => router.push(`/movies`)} className="w-full">
                Browse Movies
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Progress percentage for the ring
  const progress = timeLeft !== null ? (timeLeft / 600) * 100 : 100;
  
  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto py-8">
      {/* Summary Side */}
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold">Checkout</h1>
        <Card>
          <CardHeader className="bg-surface-hover/50 pb-4 border-b border-border">
            <CardTitle className="text-xl">{booking.movie_title}</CardTitle>
            <p className="text-sm text-surface-foreground/70">
              {booking.theatre_name}, {booking.theatre_city}
            </p>
            <p className="text-sm text-surface-foreground/70">
              {new Date(booking.start_time).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3">Selected Seats</h4>
            <div className="flex flex-wrap gap-2 mb-6">
              {booking.seats?.map(seat => (
                <Badge key={seat.id} variant="outline" className="px-3 py-1">
                  {seat.row_label}{seat.col_number}
                </Badge>
              ))}
            </div>
            
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-surface-foreground/70">Tickets ({booking.seats?.length || 0})</span>
                <span>{formatCurrency(booking.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-foreground/70">Convenience Fee</span>
                <span>Included</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-border">
                <span>Total Amount</span>
                <span className="text-primary">{formatCurrency(booking.total_amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Side */}
      <div className="space-y-6 md:pt-[3.25rem]">
        {/* Timer Card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-hover stroke-current"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={cn(
                    "stroke-current transition-all duration-1000 ease-linear",
                    timeLeft !== null && timeLeft < 60 ? "text-status-failed" : "text-primary"
                  )}
                  strokeWidth="3"
                  strokeDasharray={`${progress}, 100`}
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="text-sm font-bold font-mono">
                {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <Clock className="h-5 w-5" /> Seats Reserved
              </h3>
              <p className="text-sm text-surface-foreground/80 mt-1">
                Complete your payment within 10 minutes to secure these seats.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Fake Payment Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border-2 border-primary bg-primary/5 rounded-xl cursor-pointer">
                <input type="radio" name="payment" defaultChecked className="hidden" />
                <CreditCard className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Credit / Debit Card</p>
                  <p className="text-xs text-surface-foreground/60">Demo payment processor</p>
                </div>
                <div className="w-5 h-5 rounded-full border-4 border-primary bg-background" />
              </label>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              size="lg" 
              className="w-full text-lg h-14" 
              disabled={isPaying || (timeLeft !== null && timeLeft <= 0)}
              onClick={handlePayment}
            >
              {isPaying ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
              Pay {formatCurrency(booking.total_amount)}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutPage({ params }: { params: Promise<{ showId: string }> }) {
  const resolvedParams = use(params);
  
  return (
    <div className="container mx-auto px-4">
      <Suspense fallback={<div className="py-20 text-center">Loading checkout...</div>}>
        <CheckoutContent showId={resolvedParams.showId} />
      </Suspense>
    </div>
  );
}
