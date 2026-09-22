"use client";

import Link from "next/link";
import Image from "next/image";
import { Movie } from "@/lib/api/movies";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface MovieCardProps {
  movie: Movie;
  className?: string;
}

export function MovieCard({ movie, className }: MovieCardProps) {
  const initial = movie.title?.charAt(0).toUpperCase() ?? "?";

  return (
    <Link
      href={`/movies/${movie.id}`}
      className={cn("group relative flex flex-col w-50 shrink-0", className)}
    >
      {/* ── Poster Frame ── */}
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-md bg-surface border border-border transition-all duration-300 group-hover:border-[rgba(255,255,255,0.16)] group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]">

        {/* Poster Image */}
        {movie.poster_url ? (
          <Image
            src={movie.poster_url}
            alt={movie.title}
            fill
            sizes="200px"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-surface to-surface-dim">
            <span className="font-display text-[80px] text-surface-foreground/10 select-none leading-none">
              {initial}
            </span>
          </div>
        )}

        {/* Bottom gradient scrim */}
        <div className="absolute inset-0 scrim-card" />

        {/* Top-left format badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {movie.is_released ? (
            <span className="px-1.5 py-0.75 rounded-[3px] bg-surface-elevated/90 backdrop-blur-sm border border-border text-[9px] font-semibold uppercase tracking-widest text-gold">
              NOW SHOWING
            </span>
          ) : (
            <span className="px-1.5 py-0.75 rounded-[3px] bg-primary/90 border border-primary text-[9px] font-semibold uppercase tracking-widest text-white">
              COMING SOON
            </span>
          )}
        </div>

        {/* Bottom info overlay — inside card */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
          <h3 className="font-display text-[18px] leading-[1.05] tracking-[0.03em] text-white uppercase line-clamp-2 drop-shadow">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-surface-foreground/60">{movie.genre || "Feature Film"}</span>
            {movie.rating && (
              <span className="flex items-center gap-0.5 text-gold text-[12px] font-semibold tabular-nums">
                <Star className="h-3 w-3 fill-gold text-gold" />
                {Number(movie.rating).toFixed(1)}
              </span>
            )}
          </div>

        </div>
      </div>
    </Link>
  );
}

