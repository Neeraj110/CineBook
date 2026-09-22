"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/lib/api/client";
import { useAllShows, useCreateShow, useDeleteShow, Show } from "@/lib/api/shows";
import { useTheaters } from "@/lib/api/theaters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Calendar, Clock, Loader2, Trash2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";

import { CursorPagination } from "@/components/ui/cursor-pagination";

export default function AdminShowsPage() {
  const [selectedMovieFilter, setSelectedMovieFilter] = useState<string>("");
  const [selectedTheaterFilter, setSelectedTheaterFilter] = useState<string>("");
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<string>("");
  const [limit, setLimit] = useState(10);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);

  const currentCursor = cursorStack[pageIndex] ?? null;

  const { data: showsData, isLoading: showsLoading, isFetching: showsFetching } = useAllShows({
    cursor: currentCursor,
    limit,
    movie_id: selectedMovieFilter ? Number(selectedMovieFilter) : undefined,
    theatre_id: selectedTheaterFilter ? Number(selectedTheaterFilter) : undefined,
    format: selectedFormatFilter || undefined,
  });

  const shows = showsData?.shows ?? [];
  const pagination = showsData?.pagination;

  const { data: theatersData, isLoading: theatersLoading } = useTheaters();
  const theaters = theatersData?.theaters || [];

  const { data: moviesData, isLoading: moviesLoading } = useQuery({
    queryKey: ["admin-movies-list"],
    queryFn: () => fetchClient("/movies?limit=100").then(d => d.movies)
  });
  const movies = moviesData || [];

  const createShow = useCreateShow();
  const deleteShowMutation = useDeleteShow();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showToDelete, setShowToDelete] = useState<Show | null>(null);
  const { register, handleSubmit, reset, watch } = useForm();

  const selectedTheaterId = watch("theatre_id");
  const selectedTheater = theaters?.find((t: any) => t.id === Number(selectedTheaterId));
  const availableScreens = selectedTheater?.screens || [];

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCursorStack([null]);
    setPageIndex(0);
  };

  const handleMovieFilterChange = (val: string) => {
    setSelectedMovieFilter(val);
    setCursorStack([null]);
    setPageIndex(0);
  };

  const handleTheaterFilterChange = (val: string) => {
    setSelectedTheaterFilter(val);
    setCursorStack([null]);
    setPageIndex(0);
  };

  const handleFormatFilterChange = (val: string) => {
    setSelectedFormatFilter(val);
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
    reset({
      movie_id: "",
      theatre_id: "",
      screen_id: "",
      start_time: "",
      ticket_price: 200,
      format: "2D",
      language: "Hindi",
      has_subtitles: false
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      if (!data.movie_id || !data.screen_id || !data.start_time) {
        toast.error("Please fill in all required fields.");
        return;
      }

      // Auto-calculate end_time from movie duration
      const selectedMovie = movies?.find((m: any) => String(m.id) === String(data.movie_id));
      const durationMinutes = selectedMovie?.duration_minutes || 120;
      const startDate = new Date(data.start_time);
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      
      const payload = {
        movie_id: Number(data.movie_id),
        screen_id: Number(data.screen_id),
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        ticket_price: Number(data.ticket_price),
        format: data.format,
        language: data.language,
        has_subtitles: String(data.has_subtitles) === "true" || data.has_subtitles === true
      };

      await createShow.mutateAsync(payload);
      toast.success("Show scheduled successfully");
      setIsFormOpen(false);
    } catch (err: any) {
      if (err.status === 409) {
        toast.error("Conflict: Screen is already booked during this time period.");
      } else {
        toast.error(err.message || "Failed to schedule show");
      }
    }
  };

  const isLoading = showsLoading || theatersLoading || moviesLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Show Scheduling</h1>
          <p className="text-surface-foreground/70">Schedule movies across theaters and screens.</p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Schedule Show
        </Button>
      </div>

      <Card className="bg-surface border-border">
        {/* Filter Toolbar */}
        <CardHeader className="py-3 px-6 border-b border-border">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-48">
              <select
                value={selectedMovieFilter}
                onChange={(e) => handleMovieFilterChange(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All Movies</option>
                {movies?.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-48">
              <select
                value={selectedTheaterFilter}
                onChange={(e) => handleTheaterFilterChange(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All Theaters</option>
                {theaters?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-36">
              <select
                value={selectedFormatFilter}
                onChange={(e) => handleFormatFilterChange(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All Formats</option>
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="IMAX">IMAX</option>
                <option value="4DX">4DX</option>
              </select>
            </div>

            {(selectedMovieFilter || selectedTheaterFilter || selectedFormatFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedMovieFilter("");
                  setSelectedTheaterFilter("");
                  setSelectedFormatFilter("");
                  setCursorStack([null]);
                  setPageIndex(0);
                }}
                className="text-xs h-9 text-muted hover:text-foreground"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-surface-foreground/50 uppercase bg-surface-hover/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4">Movie</th>
                  <th className="px-6 py-4">Theater & Screen</th>
                  <th className="px-6 py-4">Schedule</th>
                  <th className="px-6 py-4">Format / Lang</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" /></td>
                  </tr>
                ) : shows?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-surface-foreground/60">No shows scheduled.</td>
                  </tr>
                ) : (
                  shows?.map((show) => (
                    <tr key={show.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4 font-bold">{show.movie_title}</td>
                      <td className="px-6 py-4">
                        <div>{show.theatre_name}</div>
                        <div className="text-xs text-surface-foreground/60">{show.screen_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-surface-foreground/50" />
                          {format(parseISO(show.start_time), "MMM d, yyyy")}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-primary font-medium">
                          <Clock className="h-3 w-3 text-primary" />
                          {format(parseISO(show.start_time), "h:mm a")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="uppercase tracking-wider text-xs font-semibold">{show.format}</div>
                        <div className="text-surface-foreground/70">{show.language} {show.has_subtitles && "(Sub)"}</div>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {formatCurrency(show.ticket_price)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="text-status-cancelled hover:bg-status-cancelled/10 hover:text-status-cancelled" onClick={() => setShowToDelete(show)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
            currentCount={shows.length}
            isLoading={showsFetching}
          />
        </CardContent>
      </Card>

      {/* Schedule Form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Schedule New Show</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Movie</Label>
                <select 
                  {...register("movie_id", { required: true })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a movie...</option>
                  {movies?.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Theater</Label>
                <select 
                  {...register("theatre_id", { required: true })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select theater...</option>
                  {theaters?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Screen</Label>
                <select 
                  {...register("screen_id", { required: true })}
                  disabled={!selectedTheaterId}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  <option value="">Select screen...</option>
                  {availableScreens.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="datetime-local" {...register("start_time", { required: true })} />
              </div>

              <div className="space-y-2">
                <Label>Base Ticket Price</Label>
                <Input type="number" {...register("ticket_price", { required: true })} />
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <select 
                  {...register("format")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                  <option value="IMAX">IMAX</option>
                  <option value="4DX">4DX</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Input {...register("language")} />
              </div>
              
              <div className="space-y-2 md:col-span-2 flex items-center gap-2 pt-2">
                <input type="checkbox" id="has_subtitles" {...register("has_subtitles")} className="w-4 h-4 accent-primary" />
                <Label htmlFor="has_subtitles" className="cursor-pointer">Includes Subtitles</Label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createShow.isPending}>
                {createShow.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                Schedule Show
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showToDelete} onOpenChange={(open) => !open && setShowToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto bg-status-cancelled/20 p-3 rounded-full mb-4 w-fit">
               <AlertCircle className="h-6 w-6 text-status-cancelled" />
            </div>
            <DialogTitle className="text-center">Delete Show?</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete the show for <strong>{showToDelete?.movie_title}</strong> at <strong>{showToDelete?.theatre_name}</strong>? This will also remove all associated seat bookings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-3">
            <Button variant="outline" onClick={() => setShowToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              if (!showToDelete) return;
              try {
                await deleteShowMutation.mutateAsync(showToDelete.id);
                toast.success("Show deleted successfully");
                setShowToDelete(null);
              } catch (err: any) {
                toast.error(err.message || "Failed to delete show");
              }
            }} disabled={deleteShowMutation.isPending}>
              {deleteShowMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

