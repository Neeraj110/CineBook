"use client";

import { useState } from "react";
import { useMovies } from "@/lib/api/movies";
import { MovieCard } from "@/components/movie-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

import { CursorPagination } from "@/components/ui/cursor-pagination";

export default function MovieCatalogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [limit, setLimit] = useState(12);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);

  const currentCursor = cursorStack[pageIndex] ?? null;

  const { data: moviesData, isLoading, isFetching, error } = useMovies({
    cursor: currentCursor,
    limit,
    search: activeQuery.trim() || undefined,
    genre: genreFilter.trim() || undefined,
  });

  const movies = moviesData?.movies ?? [];
  const pagination = moviesData?.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchTerm);
    setGenreFilter(""); // Reset genre on search
    setCursorStack([null]);
    setPageIndex(0);
  };

  const handleGenreClick = (genre: string) => {
    if (genreFilter === genre) {
      setGenreFilter("");
    } else {
      setGenreFilter(genre);
      setActiveQuery("");
      setSearchTerm("");
    }
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
        setPageIndex(pageIndex + 1);
      } else {
        setCursorStack([...cursorStack, pagination.next_cursor]);
        setPageIndex(pageIndex + 1);
      }
    }
  };

  const handlePreviousPage = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    }
  };

  const genres = Array.from(new Set(movies.map((movie) => movie.genre).filter(Boolean)));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Movie Catalog</h1>
            <p className="text-surface-foreground/70 mt-1">Discover what's playing and what's coming soon.</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-foreground/50" />
              <Input
                placeholder="Search movies..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2 pb-4">
          <Button
            variant={!genreFilter ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => handleGenreClick("")}
          >
            All
          </Button>
          {genres.map(g => (
            <Button
              key={g}
              variant={genreFilter === g ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => handleGenreClick(g)}
            >
              {g}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 animate-pulse">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-2/3 bg-surface rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-surface rounded-xl border border-border">
            <h2 className="text-xl font-bold text-status-failed">Error loading movies</h2>
            <p className="text-surface-foreground/70">Please check your connection and try again.</p>
          </div>
        ) : movies && movies.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {movies.map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            <div className="rounded-xl overflow-hidden border border-border">
              <CursorPagination
                limit={limit}
                onLimitChange={handleLimitChange}
                limitOptions={[6, 12, 24, 48]}
                hasNextPage={Boolean(pagination?.has_next_page)}
                hasPreviousPage={pageIndex > 0}
                onNextPage={handleNextPage}
                onPreviousPage={handlePreviousPage}
                currentPage={pageIndex + 1}
                totalItems={pagination?.total}
                currentCount={movies.length}
                isLoading={isFetching}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-xl border border-border">
            <h2 className="text-xl font-bold mb-2">No movies found</h2>
            <p className="text-surface-foreground/70">Try adjusting your search or filters.</p>
            {(activeQuery || genreFilter) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setActiveQuery("");
                  setSearchTerm("");
                  setGenreFilter("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

