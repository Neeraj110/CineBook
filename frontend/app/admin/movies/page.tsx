"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/lib/api/client";
import { Movie, useMovies, useCreateMovie, useUpdateMovie, useDeleteMovie } from "@/lib/api/movies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Search, Loader2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format } from "date-fns";
import Image from "next/image";

import { CursorPagination } from "@/components/ui/cursor-pagination";

type MovieFormData = Omit<Movie, "id">;

export default function AdminMoviesPage() {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);

  const currentCursor = cursorStack[pageIndex] ?? null;

  const { data: moviesData, isLoading, isFetching } = useMovies({
    cursor: currentCursor,
    limit,
    search: search.trim() || undefined,
  });

  const movies = moviesData?.movies ?? [];
  const pagination = moviesData?.pagination;

  const createMutation = useCreateMovie();
  const updateMutation = useUpdateMovie();
  const deleteMutation = useDeleteMovie();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<MovieFormData>();

  // For live preview
  const previewPoster = watch("poster_url");

  const handleSearchChange = (val: string) => {
    setSearch(val);
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

  const openCreate = () => {
    setEditingMovie(null);
    reset({
      title: "", description: "", duration_minutes: 120, release_date: format(new Date(), "yyyy-MM-dd"),
      language: "English", genre: "", poster_url: "", banner_url: "", trailer_url: "",
      certification: "UA", rating: 0, is_released: true
    });
    setIsFormOpen(true);
  };

  const openEdit = (movie: Movie) => {
    setEditingMovie(movie);
    reset({
      ...movie,
      release_date: format(new Date(movie.release_date), "yyyy-MM-dd"),
      rating: Number(movie.rating)
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: MovieFormData) => {
    try {
      // Convert string numbers to actual numbers for API
      const payload = {
        ...data,
        duration_minutes: Number(data.duration_minutes),
        rating: Number(data.rating),
        is_released: String(data.is_released) === "true" || data.is_released === true
      };

      if (editingMovie) {
        await updateMutation.mutateAsync({ id: editingMovie.id, ...payload });
        toast.success("Movie updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Movie created successfully");
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save movie");
    }
  };

  const handleDelete = async () => {
    if (!movieToDelete) return;
    try {
      await deleteMutation.mutateAsync(movieToDelete.id);
      toast.success("Movie deleted successfully");
      setMovieToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete movie");
    }
  };

  const filteredMovies = movies;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-[36px] tracking-[0.03em]">MOVIE CATALOG</h1>
          <p className="text-[13px] text-muted mt-0.5">Manage the cinema catalog, metadata, and release state.</p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Add Movie
        </Button>
      </div>

      <Card className="bg-surface border-border">
        <CardHeader className="py-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-foreground/50" />
            <Input
              placeholder="Search title or genre..."
              className="pl-9 bg-background"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-surface-foreground/50 uppercase bg-surface-hover/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Genre / Lang</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" /></td>
                  </tr>
                ) : filteredMovies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-surface-foreground/60">No movies found.</td>
                  </tr>
                ) : (
                  filteredMovies.map((movie: Movie) => (
                    <tr key={movie.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4 font-medium flex items-center gap-3">
                        <div className="w-10 h-14 bg-background border border-border rounded overflow-hidden shrink-0">
                          {movie.poster_url ? (
                            <Image
                              src={movie.poster_url}
                              alt=""
                              width={40}
                              height={56}
                              sizes="40px"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="flex items-center justify-center h-full w-full font-display text-surface-foreground/30">{movie.title.charAt(0)}</span>
                          )}
                        </div>
                        {movie.title}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={movie.is_released ? "success" : "secondary"}>
                          {movie.is_released ? "Released" : "Upcoming"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div>{movie.genre}</div>
                        <div className="text-xs text-surface-foreground/60">{movie.language}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">★ {Number(movie.rating).toFixed(1)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(movie)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-status-failed hover:bg-status-failed/10 hover:text-status-failed" onClick={() => setMovieToDelete(movie)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <CursorPagination
            limit={limit}
            onLimitChange={handleLimitChange}
            hasNextPage={Boolean(pagination?.has_next_page)}
            hasPreviousPage={pageIndex > 0}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            currentPage={pageIndex + 1}
            totalItems={pagination?.total}
            currentCount={movies.length}
            isLoading={isFetching}
          />
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:h-[90dvh] sm:max-h-[90dvh]">
          <DialogHeader className="px-5 py-4 sm:px-6 border-b border-border shrink-0">
            <DialogTitle>{editingMovie ? "Edit Movie" : "Add New Movie"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              data-lenis-prevent
              onWheel={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6 scrollbar-thin [webkit-overflow-scrolling:touch]"
            >
              <div className="flex flex-col gap-6 md:flex-row">
                {/* Left Column - Image Preview */}
                <div className="w-full shrink-0 space-y-4 md:sticky md:top-0 md:w-56 md:self-start">
                  <div className="mx-auto aspect-2/3 w-full max-w-56 bg-surface border border-border rounded-lg overflow-hidden flex items-center justify-center text-center p-4">
                    {previewPoster ? (
                      <Image
                        src={previewPoster}
                        alt="Preview"
                        width={240}
                        height={360}
                        sizes="(max-width: 768px) 100vw, 240px"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <span className="text-sm text-surface-foreground/50 font-medium">Poster Preview</span>
                    )}
                  </div>
                </div>

                {/* Right Column - Fields */}
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Title</Label>
                    <Input {...register("title", { required: true })} />
                  </div>

                  <div className="space-y-2">
                    <Label>Release Date</Label>
                    <Input type="date" {...register("release_date", { required: true })} />
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (mins)</Label>
                    <Input type="number" {...register("duration_minutes", { required: true })} />
                  </div>

                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Input placeholder="e.g. Action, Drama" {...register("genre")} />
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Input {...register("language")} />
                  </div>

                  <div className="space-y-2">
                    <Label>Certification</Label>
                    <select
                      {...register("certification")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="U">U (General)</option>
                      <option value="UA">UA (Parental Guidance)</option>
                      <option value="A">A (Adults Only)</option>
                      <option value="R">R (Restricted)</option>
                      <option value="PG-13">PG-13</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Rating (0-10)</Label>
                    <Input type="number" step="0.1" max="10" min="0" {...register("rating")} />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <textarea
                      {...register("description")}
                      className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-surface-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Poster URL</Label>
                    <Input {...register("poster_url")} placeholder="https://" />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Banner URL</Label>
                    <Input {...register("banner_url")} placeholder="https://" />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Trailer URL</Label>
                    <Input {...register("trailer_url")} placeholder="YouTube embed URL..." />
                  </div>

                  <div className="space-y-2 md:col-span-2 flex items-center gap-2 pt-2">
                    <input type="checkbox" id="is_released" {...register("is_released")} className="w-4 h-4 accent-primary" />
                    <Label htmlFor="is_released" className="cursor-pointer">Movie is officially released</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="px-5 py-4 sm:px-6 border-t border-border shrink-0 bg-background">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                Save Movie
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!movieToDelete} onOpenChange={(open) => !open && setMovieToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto bg-status-failed/20 p-3 rounded-full mb-4 w-fit">
              <AlertCircle className="h-6 w-6 text-status-failed" />
            </div>
            <DialogTitle className="text-center">Delete Movie?</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete <strong>{movieToDelete?.title}</strong>? Its future shows and their bookings will also be removed. Movies with completed or in-progress shows cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-3">
            <Button variant="outline" onClick={() => setMovieToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
