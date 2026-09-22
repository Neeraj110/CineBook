import type { Metadata } from "next";
import "./globals.css";
import { RootProvider } from "@/components/providers/root-provider";

export const metadata: Metadata = {
  title: "CineBook — Premium Cinema Booking",
  description:
    "The premier architectural cinema portal for festival showcases, high-fidelity premium projection, and direct ticketing reserved seating.",
  keywords: ["cinema", "tickets", "IMAX", "booking", "movies"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark"
      style={{ colorScheme: "dark" }}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
