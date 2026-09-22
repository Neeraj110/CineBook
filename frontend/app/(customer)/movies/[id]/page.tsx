"use client";

import { use, useState } from "react";
import { useMovie } from "@/lib/api/movies";
import { useShowsForMovie, Show } from "@/lib/api/shows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Play, Clock, Calendar, Globe, Ticket } from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: movie, isLoading: movieLoading } = useMovie(resolvedParams.id);
  const { data: shows, isLoading: showsLoading } = useShowsForMovie(resolvedParams.id);

  if (movieLoading) {
    return <div className="h-screen animate-pulse bg-surface" />;
  }

  if (!movie) {
    return <div className="container py-20 text-center">Movie not found.</div>;
  }

  // Group shows by Date -> Theater
  const showsByDate = shows?.reduce((acc, show) => {
    const dateStr = format(parseISO(show.start_time), "yyyy-MM-dd");
    if (!acc[dateStr]) acc[dateStr] = {};
    if (!acc[dateStr][show.theatre_name]) acc[dateStr][show.theatre_name] = [];
    acc[dateStr][show.theatre_name].push(show);
    return acc;
  }, {} as Record<string, Record<string, Show[]>>) || {};

  const sortedDates = Object.keys(showsByDate).sort();

  return (
    <div className="pb-20">
      {/* Hero Banner */}
      <div className="relative h-[50vh] min-h-100 w-full bg-surface overflow-hidden">
        {movie.banner_url || movie.poster_url ? (
          <Image
            src={movie.banner_url || movie.poster_url}
            alt={movie.title}
            fill
            priority
            sizes="100vw"
            quality={85}
            className="w-full h-full object-cover object-center opacity-70"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-hover">
            <span className="font-display text-9xl text-surface-foreground/10 select-none">
              {movie.title.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent" />

        <div className="absolute inset-0 container mx-auto px-4 flex items-end pb-8">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            {/* Poster */}
            <div className="hidden md:block w-48 shrink-0 rounded-xl overflow-hidden border-2 border-border shadow-2xl z-10 bg-surface">
              {movie.poster_url ? (
                <Image
                  src={movie.poster_url}
                  alt={movie.title}
                  width={192}
                  height={288}
                  sizes="192px"
                  quality={85}
                  className="w-full aspect-2/3 object-cover"
                />
              ) : (
                <div className="w-full aspect-2/3 flex items-center justify-center">
                  <span className="font-display text-6xl text-surface-foreground/20">{movie.title.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="space-y-4 z-10 mb-2">
              <div className="flex items-center gap-3">
                {movie.certification && (
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-md">
                    {movie.certification}
                  </Badge>
                )}
                {movie.rating && (
                  <span className="text-primary font-bold">★ {Number(movie.rating).toFixed(1)}</span>
                )}
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight drop-shadow-md">
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-surface-foreground/80 font-medium">
                <span className="flex items-center"><Clock className="mr-1 h-4 w-4" /> {movie.duration_minutes} min</span>
                <span className="flex items-center"><Calendar className="mr-1 h-4 w-4" /> {format(new Date(movie.release_date), "MMM d, yyyy")}</span>
                <span className="flex items-center"><Globe className="mr-1 h-4 w-4" /> {movie.language}</span>
                <span>{movie.genre}</span>
              </div>

              <div className="pt-4 flex gap-4">
                <Button size="lg" className="rounded-full" onClick={() => {
                  document.getElementById('showtimes')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <Ticket className="mr-2 h-5 w-5" /> Book Tickets
                </Button>

                {movie.trailer_url && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" variant="outline" className="rounded-full bg-background/50 backdrop-blur-md">
                        <Play className="mr-2 h-5 w-5" /> Watch Trailer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0 bg-black border-none overflow-hidden aspect-video">
                      <iframe
                        src={movie.trailer_url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 grid md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-12">
          {/* Synopsis */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4">Synopsis</h2>
            <p className="text-surface-foreground/80 leading-relaxed text-lg">
              {movie.description}
            </p>
          </section>

          {/* Showtimes */}
          <section id="showtimes" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-bold mb-6">Showtimes</h2>

            {showsLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-surface rounded-xl" />
                <div className="h-20 bg-surface rounded-xl" />
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="bg-surface rounded-xl p-8 text-center border border-border">
                <p className="text-lg text-surface-foreground/80 font-medium">No shows for this movie yet.</p>
                <p className="text-sm text-surface-foreground/60 mt-1">Check back later for updated schedules.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {sortedDates.map(dateStr => (
                  <div key={dateStr} className="space-y-6">
                    <h3 className="text-xl font-bold border-b border-border pb-2 sticky top-16 bg-background/95 backdrop-blur z-20">
                      {format(parseISO(dateStr), "EEEE, MMM d")}
                    </h3>

                    <div className="space-y-6">
                      {Object.entries(showsByDate[dateStr]).map(([theaterName, theaterShows]) => (
                        <div key={theaterName} className="bg-surface border border-border rounded-xl p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-bold text-lg">{theaterName}</h4>
                              <p className="text-xs text-surface-foreground/60">{theaterShows[0].theatre_city}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {theaterShows.map(show => (
                              <Link key={show.id} href={`/booking/${show.id}/seats`}>
                                <div className="group flex flex-col items-center justify-center border border-border rounded-lg p-3 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer bg-background min-w-25">
                                  <span className="text-primary font-bold text-lg group-hover:scale-110 transition-transform">
                                    {format(parseISO(show.start_time), "h:mm a")}
                                  </span>
                                  <div className="flex gap-1 mt-2 text-[10px] text-surface-foreground/60 uppercase tracking-wider font-semibold">
                                    <span>{show.format}</span>
                                    <span>•</span>
                                    <span>{show.language}</span>
                                  </div>
                                  <span className="text-xs mt-1 font-medium">{formatCurrency(show.ticket_price)}</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
