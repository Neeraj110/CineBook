"use client";

import { useState } from "react";
import { useTheaters } from "@/lib/api/theaters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CursorPagination } from "@/components/ui/cursor-pagination";
import { Search, MapPin, Film, Sparkles, Navigation, Tv, Armchair } from "lucide-react";
import Link from "next/link";

export default function TheatersCustomerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [activeQuery, setActiveQuery] = useState("");
  const [limit, setLimit] = useState(9);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);

  const currentCursor = cursorStack[pageIndex] ?? null;

  const { data: theatersData, isLoading, isFetching } = useTheaters({
    cursor: currentCursor,
    limit,
    city: selectedCity === "All Cities" ? undefined : selectedCity,
    search: activeQuery.trim() || undefined,
  });

  const theaters = theatersData?.theaters ?? [];
  const cities = ["All Cities", ...Array.from(new Set(theaters.map((theater: any) => theater.city).filter(Boolean)))];
  const pagination = theatersData?.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchTerm);
    setCursorStack([null]);
    setPageIndex(0);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setActiveQuery("");
    setSearchTerm("");
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
        const nextStack = [...cursorStack];
        nextStack[pageIndex + 1] = pagination.next_cursor;
        setCursorStack(nextStack);
      } else {
        setCursorStack([...cursorStack, pagination.next_cursor]);
      }
      setPageIndex((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (pageIndex > 0) {
      setPageIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* ── Hero Banner ── */}
      <div className="relative border-b border-border bg-linear-to-b from-surface/60 via-background to-background py-14">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              Flagship Exhibition Venues
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-[0.04em] text-foreground">
              CINEMA THEATRES & AUDITORIUMS
            </h1>
            <p className="text-surface-foreground/70 text-base max-w-2xl leading-relaxed">
              Experience the pinnacle of audio-visual engineering. Discover world-class IMAX Laser,
              Dolby Atmos, and ultra-plush motorized recliner screens in your city.
            </p>
          </div>

          {/* Search & City Filter Bar */}
          <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* City Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCityChange(city)}
                  className={`px-3.5 py-1.5 rounded-sm text-xs font-medium transition-all duration-150 whitespace-nowrap ${selectedCity === city
                      ? "bg-primary text-white shadow-[0_0_12px_rgba(230,57,70,0.5)]"
                      : "bg-surface border border-border text-surface-foreground/70 hover:text-foreground hover:bg-surface-elevated"
                    }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-80">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  placeholder="Search theatre or area..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 bg-surface border-border focus:border-primary text-sm rounded-DEFAULT"
                />
              </div>
              <Button type="submit" size="sm" className="h-10 px-4">
                Find
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Theatres List ── */}
      <div className="container mx-auto px-6 mt-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-md bg-surface border border-border animate-pulse p-6 space-y-4"
              >
                <div className="h-6 w-3/4 bg-surface-elevated rounded" />
                <div className="h-4 w-1/2 bg-surface-elevated rounded" />
                <div className="h-20 bg-surface-elevated rounded" />
              </div>
            ))}
          </div>
        ) : theaters.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center mx-auto text-muted">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl uppercase tracking-wider text-foreground">No Theatres Found</h3>
            <p className="text-sm text-surface-foreground/60">
              We couldn&apos;t find any cinema venues matching your search criteria. Try choosing &quot;All Cities&quot; or refining your keywords.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCity("All Cities");
                setActiveQuery("");
                setSearchTerm("");
              }}
              className="mt-2"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {theaters.map((theater: any) => {
              const screens = theater.screens ?? [];
              return (
                <div
                  key={theater.id}
                  className="group relative flex flex-col justify-between rounded-md bg-surface border border-border hover:border-border-bright p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
                >
                  {/* Card Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-DEFAULT bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Film className="w-5 h-5 text-primary" />
                      </div>
                      <Badge
                        variant="outline"
                        className="border-gold/30 text-gold bg-gold/5 text-[10px] uppercase font-bold tracking-wider"
                      >
                        {theater.city}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-display text-2xl tracking-[0.03em] text-foreground group-hover:text-primary transition-colors">
                        {theater.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-surface-foreground/60 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{theater.address}</span>
                      </div>
                    </div>

                    {/* Screens preview */}
                    <div className="pt-3 border-t border-border/70 space-y-2">
                      <div className="flex items-center justify-between text-xs text-surface-foreground/60">
                        <span className="flex items-center gap-1">
                          <Tv className="w-3.5 h-3.5 text-muted" />
                          Auditoriums
                        </span>
                        <span className="font-medium text-foreground">
                          {screens.length} {screens.length === 1 ? "Screen" : "Screens"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {screens.slice(0, 3).map((screen: any) => (
                          <span
                            key={screen.id}
                            className="px-2 py-0.5 rounded-xs bg-surface-elevated text-[11px] text-surface-foreground/80 border border-border"
                          >
                            {screen.name}
                          </span>
                        ))}
                        {screens.length > 3 && (
                          <span className="px-2 py-0.5 rounded-xs bg-surface-elevated text-[11px] text-muted border border-border">
                            +{screens.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="flex items-center gap-2 pt-2 text-[11px] text-surface-foreground/50">
                      <span className="flex items-center gap-1">
                        <Armchair className="w-3 h-3 text-gold" />
                        Dolby 7.1
                      </span>
                      <span>•</span>
                      <span>Laser 4K Projection</span>
                      <span>•</span>
                      <span>Café</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 mt-4 border-t border-border flex items-center justify-between gap-3">
                    <Link href={`/movies`} className="w-full">
                      <Button className="w-full h-9 text-xs font-display tracking-wider uppercase gap-1.5">
                        <Navigation className="w-3.5 h-3.5" />
                        Explore Shows
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cursor Pagination */}
        <div className="mt-12">
          <CursorPagination
            currentPage={pageIndex + 1}
            currentCount={theaters.length}
            hasNextPage={pagination?.has_next_page ?? false}
            hasPreviousPage={pageIndex > 0}
            onNextPage={handleNextPage}
            onPreviousPage={handlePrevPage}
            isLoading={isLoading || isFetching}
            limit={limit}
            onLimitChange={handleLimitChange}
            totalItems={pagination?.total}
          />
        </div>
      </div>
    </div>
  );
}
