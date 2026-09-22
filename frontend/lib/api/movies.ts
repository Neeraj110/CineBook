import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "./client";

export interface Movie {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  release_date: string;
  language: string;
  genre: string;
  poster_url: string;
  banner_url: string;
  trailer_url: string;
  certification: string;
  rating: string | number;
  is_released: boolean;
}

export interface MovieFilterOptions {
  cursor?: string | null;
  limit?: number;
  search?: string;
  genre?: string;
  language?: string;
  is_released?: boolean;
}

export interface MoviesResponse {
  movies: Movie[];
  pagination?: {
    limit: number;
    next_cursor: string | null;
    has_next_page: boolean;
    total: number;
  };
}

export function normalizeMovie(m: any): Movie {
  if (!m) return m;
  return {
    ...m,
    id: Number(m.id),
    title: m.title ?? "",
    description: m.description ?? "",
    duration_minutes: Number(m.duration_minutes ?? m.durationMinutes ?? 0),
    release_date: m.release_date ?? m.releaseDate ?? "",
    language: m.language ?? "",
    genre: m.genre ?? "",
    poster_url: m.poster_url ?? m.posterUrl ?? "",
    banner_url: m.banner_url ?? m.bannerUrl ?? "",
    trailer_url: m.trailer_url ?? m.trailerUrl ?? "",
    certification: m.certification ?? "",
    rating: m.rating ?? "0",
    is_released: m.is_released !== undefined ? Boolean(m.is_released) : (m.isReleased !== undefined ? Boolean(m.isReleased) : false),
  };
}

export function useMovies(
  searchOrOptions?: string | MovieFilterOptions,
  genre?: string,
) {
  const options: MovieFilterOptions =
    typeof searchOrOptions === "object" && searchOrOptions !== null
      ? searchOrOptions
      : { search: searchOrOptions, genre };

  return useQuery({
    queryKey: ["movies", options],
    queryFn: async (): Promise<MoviesResponse> => {
      const params = new URLSearchParams();
      if (options.cursor) params.set("cursor", options.cursor);
      if (options.limit) params.set("limit", options.limit.toString());
      if (options.search) params.set("search", options.search);
      if (options.genre) params.set("genre", options.genre);
      if (options.language) params.set("language", options.language);
      if (options.is_released !== undefined)
        params.set("is_released", String(options.is_released));

      const qs = params.toString();
      const endpoint = qs ? `/movies?${qs}` : "/movies";
      const data = await fetchClient(endpoint);
      return {
        movies: (data.movies || []).map(normalizeMovie),
        pagination: data.pagination,
      };
    },
  });
}

export function useMovie(id: string) {
  return useQuery({
    queryKey: ["movie", id],
    queryFn: async (): Promise<Movie> => {
      const data = await fetchClient(`/movies/${id}`);
      return normalizeMovie(data.movie);
    },
    enabled: !!id,
  });
}

export function useCreateMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (movie: Partial<Movie>) => {
      const data = await fetchClient("/movies", {
        method: "POST",
        body: JSON.stringify(movie)
      });
      return data.movie;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-movies"] });
    }
  });
}

export function useUpdateMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...movie }: Partial<Movie> & { id: number }) => {
      const data = await fetchClient(`/movies/${id}`, {
        method: "PATCH",
        body: JSON.stringify(movie)
      });
      return data.movie;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-movies"] });
      queryClient.invalidateQueries({ queryKey: ["movie", variables.id.toString()] });
    }
  });
}

export function useDeleteMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const data = await fetchClient(`/movies/${id}`, {
        method: "DELETE"
      });
      return data.movie;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-movies"] });
    }
  });
}
