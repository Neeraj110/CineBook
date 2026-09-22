"use client";

import { use, useRef } from "react";
import { useBooking } from "@/lib/api/bookings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Download, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

export default function BookingConfirmationPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const resolvedParams = use(params);
  const { data: booking, isLoading } = useBooking(resolvedParams.bookingId);
  const qrRef = useRef<SVGSVGElement>(null);

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!booking) {
    return <div className="text-center py-20">Booking not found.</div>;
  }

  const showTime = parseISO(booking.start_time);
  const qrValue = JSON.stringify({
    type: "cinebook-ticket",
    bookingId: booking.id,
    movie: booking.movie_title,
    venue: booking.theatre_name,
    city: booking.theatre_city,
    screen: booking.screen_name,
    showTime: booking.start_time,
    seats: booking.seats?.map((seat) => `${seat.row_label}${seat.col_number}`) ?? [],
    amount: booking.total_amount,
    status: booking.status,
  });

  const downloadTicket = () => {
    const escapeHtml = (value: string) =>
      value.replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character);
    const seats = booking.seats?.map((seat) => `${seat.row_label}${seat.col_number}`).join(", ") || "-";
    const qrSvg = qrRef.current?.outerHTML || "";
    const ticketHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>CineBook Ticket CB-${booking.id}</title>
<style>
  body{margin:0;background:#121317;color:#e3e2e8;font:16px Arial,sans-serif;padding:32px}
  .ticket{max-width:720px;margin:auto;background:#1b1c22;border:1px solid #363842;border-radius:16px;overflow:hidden}
  .top{display:flex;gap:28px;align-items:center;padding:32px;background:#202127;border-bottom:1px solid #363842}
  .qr{background:white;border-radius:10px;padding:10px;line-height:0}.qr svg{width:160px;height:160px}
  h1{margin:0 0 12px;font-size:30px}.muted{color:#a5a7b0}.status{color:#10b981;font-weight:bold;text-transform:uppercase;letter-spacing:.08em}
  .details{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:28px}.label{color:#8c8e98;text-transform:uppercase;font-size:11px;letter-spacing:.1em;margin-bottom:6px}.value{font-weight:bold}
  .ref{padding:18px 28px;border-top:1px dashed #4b4d58;color:#a5a7b0}@media(max-width:600px){body{padding:12px}.top{flex-direction:column;align-items:flex-start}.details{grid-template-columns:1fr 1fr}}
</style></head><body><main class="ticket"><section class="top"><div class="qr">${qrSvg}</div><div><div class="status">Confirmed</div><h1>${escapeHtml(booking.movie_title)}</h1><div class="muted">${escapeHtml(format(showTime, "MMM d, yyyy"))} at ${escapeHtml(format(showTime, "h:mm a"))}</div><div class="muted">${escapeHtml(booking.theatre_name)}, ${escapeHtml(booking.theatre_city)}</div></div></section><section class="details"><div><div class="label">Screen</div><div class="value">${escapeHtml(booking.screen_name)}</div></div><div><div class="label">Seats</div><div class="value">${escapeHtml(seats)}</div></div><div><div class="label">Amount Paid</div><div class="value">${escapeHtml(formatCurrency(booking.total_amount))}</div></div></section><div class="ref">Booking reference: <strong>CB-${booking.id}</strong><br>Present this QR code at the cinema entrance.</div></main></body></html>`;
    const url = URL.createObjectURL(new Blob([ticketHtml], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `cinebook-ticket-CB-${booking.id}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-status-success/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-status-success" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Booking Confirmed!</h1>
        <p className="text-surface-foreground/70">
          Your ticket has been booked successfully. Booking ID: <span className="font-mono font-bold text-foreground">#{booking.id}</span>
        </p>
      </div>

      <Card className="overflow-hidden border-border bg-surface">
        <div className="bg-surface-hover p-6 border-b border-border flex flex-col md:flex-row gap-6 items-center">
          <div className="w-32 h-32 bg-white rounded-lg p-2 shrink-0 flex items-center justify-center">
            <QRCodeSVG
              ref={qrRef}
              value={qrValue}
              size={112}
              level="H"
              marginSize={4}
              title={`Ticket QR code for booking ${booking.id}`}
            />
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
            <Badge variant="success" className="mb-2">Confirmed</Badge>
            <h2 className="font-display text-2xl font-bold">{booking.movie_title}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-surface-foreground/80 mt-2">
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {format(showTime, "MMM d, yyyy")}</span>
              <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {format(showTime, "h:mm a")}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start text-sm text-surface-foreground/80 mt-1">
              <MapPin className="w-4 h-4 mr-1 shrink-0" />
              <span>{booking.theatre_name}, {booking.theatre_city}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-surface-foreground/60 uppercase tracking-wider mb-1">Screen</p>
              <p className="font-medium">{booking.screen_name}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-surface-foreground/60 uppercase tracking-wider mb-1">Seats ({booking.seats?.length || 0})</p>
              <div className="flex flex-wrap gap-1">
                {booking.seats?.map(seat => (
                  <span key={seat.id} className="font-medium bg-background border border-border px-2 py-0.5 rounded text-sm">
                    {seat.row_label}{seat.col_number}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-surface-foreground/60 uppercase tracking-wider mb-1">Amount Paid</p>
              <p className="font-bold text-primary">{formatCurrency(booking.total_amount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <Button variant="outline" className="gap-2" onClick={downloadTicket}>
          <Download className="w-4 h-4" /> Download Ticket
        </Button>
        <Link href="/bookings">
          <Button className="w-full sm:w-auto">View All Bookings</Button>
        </Link>
      </div>
    </div>
  );
}
