"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Image from "next/image";
import { Movie } from "@/lib/api/movies";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { Play, Bookmark, Star, ChevronLeft, ChevronRight } from "lucide-react";

const FORMAT_BADGE_CLASSES = "bg-surface-elevated/80 backdrop-blur-sm border-border/60 text-gold text-[10px] tracking-[0.1em]";

export function HeroCarousel({ movies }: { movies: Movie[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Prioritize movies that have images, but fallback gracefully
  const featured = movies.filter((m) => m.banner_url || m.poster_url).length > 0
    ? movies.filter((m) => m.banner_url || m.poster_url).slice(0, 5)
    : movies.slice(0, 5);

  const main = featured[activeIndex] || featured[0];

  useEffect(() => {
    if (featured.length < 2 || isPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rotationTimer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % featured.length);
    }, 6000);

    return () => window.clearInterval(rotationTimer);
  }, [featured.length, isPaused]);

  useEffect(() => {
    if (!containerRef.current || !main) return;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReducedMotion) return;

    const ctx = gsap.context(() => {
      // Ken Burns on backdrop
      if (containerRef.current?.querySelector(".hero-bg-img")) {
        gsap.fromTo(
          ".hero-bg-img",
          { scale: 1 },
          { scale: 1.05, duration: 20, ease: "none", repeat: -1, yoyo: true }
        );
      }

      // Content cascade
      if (containerRef.current?.querySelector(".hero-badge")) {
        gsap.from(".hero-badge", {
          y: 12, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power3.out", delay: 0.1,
        });
      }
      if (containerRef.current?.querySelector(".hero-title")) {
        gsap.from(".hero-title", {
          y: 20, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.25,
        });
      }
      if (containerRef.current?.querySelector(".hero-meta")) {
        gsap.from(".hero-meta", {
          y: 14, opacity: 0, duration: 0.5, ease: "power3.out", delay: 0.4,
        });
      }
      if (containerRef.current?.querySelector(".hero-synopsis")) {
        gsap.from(".hero-synopsis", {
          y: 10, opacity: 0, duration: 0.45, ease: "power3.out", delay: 0.55,
        });
      }
      if (containerRef.current?.querySelector(".hero-actions")) {
        gsap.from(".hero-actions", {
          y: 10, opacity: 0, duration: 0.45, ease: "power3.out", delay: 0.7,
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [main]);

  if (!main) return null;

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[82vh] min-h-145 max-h-225 overflow-hidden bg-surface-dim"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >

      {/* ── Background + Multi-layer scrims ── */}
      <div className="absolute inset-0 z-0">
        {(main.banner_url || main.poster_url) ? (
          <Image
            key={main.id}
            src={main.banner_url || main.poster_url || ""}
            alt={main.title}
            aria-hidden
            fill
            priority
            sizes="100vw"
            quality={85}
            className="hero-bg-img absolute inset-0 w-full h-full  object-contain transition-opacity duration-700"
          />
        ) : (
          <div className="hero-bg-img absolute inset-0 w-full h-full bg-linear-to-tr from-[#0b0c0e] via-[#16171d] to-[#1f212a]" />
        )}
        {/* Bottom scrim — gradual fade to background */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/65 to-transparent" />
        {/* Left scrim — text legibility */}
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/45 to-transparent" />
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,transparent_50%,rgba(18,19,23,0.6))]" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 h-full flex flex-col justify-end">
        <div className="container mx-auto px-6 pb-14">
          <div className="max-w-155 space-y-4">

            {/* Format + Status Badges */}
            <div className="hero-badge flex flex-wrap items-center gap-2">
              {main.certification && (
                <Badge variant="secondary" className={FORMAT_BADGE_CLASSES}>
                  EXCLUSIVE IN IMAX LASER 70MM
                </Badge>
              )}
              {main.is_released && (
                <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] tracking-[0.08em] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  WORLD PREMIERE
                </Badge>
              )}
            </div>

            {/* Title — Bebas Neue */}
            <h1 className="hero-title font-display text-[clamp(44px,7vw,80px)] leading-[0.95] tracking-[0.04em] text-foreground uppercase drop-shadow-xl">
              {main.title}
            </h1>

            {/* Meta Row */}
            <div className="hero-meta flex flex-wrap items-center gap-3 text-[13px] font-medium">
              {main.rating && (
                <span className="flex items-center gap-1 text-gold">
                  <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                  <span className="tabular-nums font-semibold">{Number(main.rating).toFixed(1)}%</span>
                  <span className="text-surface-foreground/50 font-normal ml-0.5">Match</span>
                </span>
              )}
              {main.certification && (
                <span className="px-1.5 py-0.5 rounded-[3px] border border-border text-surface-foreground/70 text-[11px] font-semibold">
                  {main.certification}
                </span>
              )}
              {main.duration_minutes && (
                <span className="text-surface-foreground/70">
                  {Math.floor(main.duration_minutes / 60)}h {main.duration_minutes % 60}m
                </span>
              )}
              {main.genre && (
                <span className="text-surface-foreground/70">{main.genre}</span>
              )}
              <Badge variant="format" className="text-[10px]">Dolby Atmos 9.1</Badge>
            </div>

            {/* Synopsis */}
            <p className="hero-synopsis text-[15px] text-surface-foreground/75 leading-relaxed line-clamp-2 max-w-135">
              {main.description}
            </p>

            {/* CTA Row */}
            <div className="hero-actions flex flex-wrap items-center gap-3 pt-2">
              <Link href={`/movies/${main.id}/shows`}>
                <Button size="lg" className="gap-2 font-display tracking-[0.06em] text-base uppercase">
                  {/* Ticket icon inline */}
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Get Tickets
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2 bg-[rgba(18,19,23,0.6)] backdrop-blur-sm">
                <Play className="h-4 w-4 fill-current" />
                Watch Trailer (4K HDR)
              </Button>
              <button className="h-11 w-11 rounded-DEFAULT flex items-center justify-center bg-[rgba(18,19,23,0.6)] backdrop-blur-sm border border-border hover:border-border-bright transition-colors">
                <Bookmark className="h-4 w-4 text-surface-foreground/70" />
              </button>
            </div>
          </div>

          {/* Slide Indicators & Navigation */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-2">
              {featured.map((item, i) => (
                <button
                  key={item.id || i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${i === activeIndex
                    ? "w-8 bg-primary shadow-[0_0_8px_rgba(230,57,70,0.8)]"
                    : "w-2.5 bg-surface-foreground/30 hover:bg-surface-foreground/60"
                    }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
              <span className="ml-2 text-[11px] text-surface-foreground/60 tabular-nums">
                {String(activeIndex + 1).padStart(2, "0")} / {String(featured.length).padStart(2, "0")}
              </span>
            </div>

            {/* Quick slide titles and chevrons */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 mr-2">
                {featured.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`text-xs px-2.5 py-1 rounded-sm transition-all truncate max-w-32.5 ${idx === activeIndex
                      ? "bg-surface-elevated text-foreground font-medium border border-border-bright"
                      : "text-muted hover:text-surface-foreground hover:bg-surface/50"
                      }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : featured.length - 1))}
                  className="w-8 h-8 rounded-sm bg-surface/80 hover:bg-surface-elevated border border-border flex items-center justify-center text-surface-foreground transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveIndex((prev) => (prev < featured.length - 1 ? prev + 1 : 0))}
                  className="w-8 h-8 rounded-sm bg-surface/80 hover:bg-surface-elevated border border-border flex items-center justify-center text-surface-foreground transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

