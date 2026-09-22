"use client";

import { useRef } from "react";
import { useMovies } from "@/lib/api/movies";
import { useTheaters } from "@/lib/api/theaters";
import { HeroCarousel } from "@/components/hero-carousel";
import { MovieCard } from "@/components/movie-card";
import { ChevronRight, ChevronLeft, Zap, Armchair, Music } from "lucide-react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    icon: Zap,
    title: "Zero-Fee Cancellation",
    desc: "Full automated refund or rebooking credit up to 2 hours before scheduled exhibition start time with single-tap ease.",
  },
  {
    icon: Armchair,
    title: "Reserved Laser Recliners",
    desc: "Precision motorized high-angle heated recliners paired with individual calibrated acoustic headrest baffles.",
  },
  {
    icon: Music,
    title: "Curated Soundscapes",
    desc: "Every auditorium acoustically tuned to sub-10Hz frequency response with dual 21\" continuous sub-bass transducers.",
  },
];

function SectionHeader({ label, viewAllHref, count }: { label: string; viewAllHref?: string; count?: number }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
          {label === "NOW SHOWING" ? "CURRENT THEATRICAL RUN" : "ADVANCED RESERVATIONS"}
        </p>
        <h2 className="font-display text-[40px] leading-none tracking-[0.03em] text-foreground">
          {label}
        </h2>
      </div>
      {viewAllHref && (
        <Link href={viewAllHref} className="flex items-center gap-1 text-sm text-surface-foreground/60 hover:text-primary transition-colors group">
          View All {count ? `(${count})` : ""}
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}

function HorizontalRail({ movies, isLoading }: { movies: any[]; isLoading: boolean }) {
  const railRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!railRef.current) return;
    railRef.current.scrollBy({ left: dir === "right" ? 440 : -440, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 pb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-50 shrink-0 aspect-2/3 rounded-md bg-surface animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative group/rail">
      {movies.length > 4 && (
        <>
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center opacity-0 group-hover/rail:opacity-100 transition-opacity shadow-elevated hover:border-border-bright"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center opacity-0 group-hover/rail:opacity-100 transition-opacity shadow-elevated hover:border-border-bright"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
      <div
        ref={railRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
      >
        {movies.map((movie) => (
          <div key={movie.id} className="snap-start">
            <MovieCard movie={movie} />
          </div>
        ))}
        {movies.length === 0 && (
          <p className="text-surface-foreground/40 italic text-sm py-8">No movies in this section.</p>
        )}
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const { data: moviesData, isLoading, error } = useMovies();
  const { data: theatersData } = useTheaters({ limit: 1 });
  const movies = moviesData?.movies ?? [];
  const theaters = theatersData?.theaters ?? [];
  const genreFilters = [
    "All Movies",
    ...Array.from(new Set(movies.map((movie) => movie.genre).filter(Boolean))),
  ];
  const [activeGenre, setActiveGenre] = useState("All Movies");
  const railsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!railsRef.current || isLoading || !movies) return;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.from(".section-reveal", {
        y: 30, opacity: 0, duration: 0.7, stagger: 0.15, ease: "power3.out",
        scrollTrigger: { trigger: railsRef.current, start: "top 85%" },
      });
    }, railsRef);

    return () => ctx.revert();
  }, [isLoading, movies]);

  const filteredMovies =
    activeGenre === "All Movies"
      ? movies
      : movies.filter((m) =>
        m.genre?.toLowerCase().includes(activeGenre.toLowerCase())
      );

  const nowShowing = filteredMovies?.filter((m) => m.is_released) ?? [];
  const comingSoon = filteredMovies?.filter((m) => !m.is_released) ?? [];

  return (
    <div className="pb-24">
      {/* Hero */}
      {isLoading ? (
        <div className="h-[82vh] min-h-145 bg-surface animate-pulse" />
      ) : error ? (
        <div className="h-[60vh] flex items-center justify-center">
          <p className="text-status-cancelled font-semibold">Failed to load movies. Check your API connection.</p>
        </div>
      ) : (
        <HeroCarousel movies={movies ?? []} />
      )}

      {/* Genre Filter Strip */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
            {genreFilters.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`shrink-0 px-4 py-1.5 rounded-sm text-[13px] font-medium transition-all duration-150 whitespace-nowrap ${activeGenre === genre
                    ? "bg-primary text-white"
                    : "text-surface-foreground/70 hover:text-foreground hover:bg-surface-elevated"
                  }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Rails */}
      <div ref={railsRef} className="container mx-auto px-6 mt-12 space-y-16">

        {/* Now Showing */}
        <section className="section-reveal">
          <SectionHeader label="NOW SHOWING" viewAllHref="/movies" count={nowShowing.length} />
          <HorizontalRail movies={nowShowing} isLoading={isLoading} />
        </section>

        {/* Coming Soon */}
        <section className="section-reveal">
          <SectionHeader label="COMING SOON & PRE-SALES" viewAllHref="/movies" count={comingSoon.length} />
          <HorizontalRail movies={comingSoon} isLoading={isLoading} />
        </section>

        {/* Features Strip */}
        <section className="section-reveal grid grid-cols-1 md:grid-cols-3 gap-px bg-border rounded-md overflow-hidden border border-border">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-surface p-8 space-y-3">
                <div className="w-10 h-10 rounded-DEFAULT bg-surface-elevated border border-border flex items-center justify-center">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-surface-foreground/60 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </section>

        {/* Selected Cinema Card */}
        {theaters[0] && <section className="section-reveal bg-surface border border-border rounded-md p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-DEFAULT bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-surface-foreground/50 font-semibold">Selected Cinema Complex</p>
              <h4 className="font-display text-[22px] tracking-[0.03em]">{theaters[0].name}</h4>
              <p className="text-xs text-surface-foreground/50 mt-0.5">{theaters[0].address}, {theaters[0].city} • {theaters[0].screens?.length ?? 0} Screens</p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <button className="h-9 px-4 rounded-DEFAULT border border-border bg-surface-elevated text-sm font-medium hover:border-border-bright transition-colors">
              Switch Location
            </button>
            <button className="h-9 px-4 rounded-DEFAULT border border-border bg-surface-elevated text-sm font-medium hover:border-border-bright transition-colors">
              Screen Details
            </button>
          </div>
        </section>}
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-border">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <span className="font-display text-xl tracking-[0.06em]">CINEBOOK</span>
              <p className="text-sm text-surface-foreground/50 leading-relaxed max-w-55">
                The premier architectural cinema portal for festival showcases, high-fidelity premium projection, and direct ticketing reserved seating.
              </p>
            </div>
            <div>
              <h5 className="text-[11px] uppercase tracking-widest font-semibold text-surface-foreground/50 mb-3">Experience Formats</h5>
              <ul className="space-y-2 text-sm text-surface-foreground/70">
                {["IMAX with Laser", "Dolby Cinema Atmos", "4DX Motion Theater", "ScreenX 270° Panoramic"].map((f) => (
                  <li key={f} className="hover:text-foreground transition-colors cursor-pointer">{f}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-[11px] uppercase tracking-widest font-semibold text-surface-foreground/50 mb-3">Quick Reservation</h5>
              <ul className="space-y-2 text-sm text-surface-foreground/70">
                {["Now Playing Schedules", "Upcoming Premieres", "VIP Private Screening Rooms", "Gift Cards & Memberships"].map((l) => (
                  <li key={l} className="hover:text-foreground transition-colors cursor-pointer">{l}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-[11px] uppercase tracking-widest font-semibold text-surface-foreground/50 mb-3">Mobile Tickets</h5>
              <p className="text-sm text-surface-foreground/50 mb-3">Scanless entry and contactless concessions direct from your phone wallet.</p>
              <div className="space-y-2">
                {["Apple Wallet Ready", "Download CineBook App"].map((l) => (
                  <button key={l} className="flex w-full items-center gap-2 h-9 px-3 rounded-DEFAULT border border-border bg-surface-elevated text-sm text-surface-foreground/70 hover:text-foreground hover:border-border-bright transition-all">
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border text-xs text-surface-foreground/40">
            <span>© 2024 CineBook Theatrical Systems Inc. All rights reserved.</span>
            <div className="flex items-center gap-6">
              {["Privacy Policy", "Terms of Exhibition", "Box Office Telemetry"].map((l) => (
                <span key={l} className="hover:text-surface-foreground/70 transition-colors cursor-pointer">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

