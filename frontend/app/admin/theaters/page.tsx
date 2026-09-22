"use client";

import { useState } from "react";
import { useTheaters, useCreateTheater, useUpdateTheater, useDeleteTheater, useCreateScreen, useDeleteScreen } from "@/lib/api/theaters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, MapPin, MonitorPlay, Loader2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CursorPagination } from "@/components/ui/cursor-pagination";
import { Search } from "lucide-react";

export default function AdminTheatersPage() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [limit, setLimit] = useState(10);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);

  const currentCursor = cursorStack[pageIndex] ?? null;

  const { data: theatersData, isLoading, isFetching } = useTheaters({
    cursor: currentCursor,
    limit,
    search: search.trim() || undefined,
    city: cityFilter.trim() || undefined,
  });

  const theaters = theatersData?.theaters || [];
  const pagination = theatersData?.pagination;

  const createTheater = useCreateTheater();
  const updateTheater = useUpdateTheater();
  const deleteTheater = useDeleteTheater();
  const createScreen = useCreateScreen();
  const deleteScreen = useDeleteScreen();

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCursorStack([null]);
    setPageIndex(0);
  };

  const handleCityFilterChange = (val: string) => {
    setCityFilter(val);
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

  const [isTheaterFormOpen, setIsTheaterFormOpen] = useState(false);
  const [editingTheater, setEditingTheater] = useState<any>(null);
  const [theaterToDelete, setTheaterToDelete] = useState<any>(null);
  
  const [activeTheaterForScreen, setActiveTheaterForScreen] = useState<any>(null);
  const [newScreenName, setNewScreenName] = useState("");
  const [newScreenRows, setNewScreenRows] = useState(10);
  const [newScreenSeatsPerRow, setNewScreenSeatsPerRow] = useState(12);

  const { register, handleSubmit, reset } = useForm();

  const openCreateTheater = () => {
    setEditingTheater(null);
    reset({ name: "", city: "", address: "" });
    setIsTheaterFormOpen(true);
  };

  const openEditTheater = (theater: any) => {
    setEditingTheater(theater);
    reset({ name: theater.name, city: theater.city, address: theater.address });
    setIsTheaterFormOpen(true);
  };

  const onTheaterSubmit = async (data: any) => {
    try {
      if (editingTheater) {
        await updateTheater.mutateAsync({ id: editingTheater.id, ...data });
        toast.success("Theater updated successfully");
      } else {
        await createTheater.mutateAsync(data);
        toast.success("Theater created successfully");
      }
      setIsTheaterFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save theater");
    }
  };

  const handleTheaterDelete = async () => {
    if (!theaterToDelete) return;
    try {
      await deleteTheater.mutateAsync(theaterToDelete.id);
      toast.success("Theater deleted");
      setTheaterToDelete(null);
    } catch (err: any) {
      toast.error("Failed to delete theater");
    }
  };

  const handleAddScreen = async () => {
    if (!activeTheaterForScreen || !newScreenName.trim()) return;
    try {
      await createScreen.mutateAsync({ 
        theaterId: activeTheaterForScreen.id, 
        name: newScreenName,
        rows: newScreenRows,
        seatsPerRow: newScreenSeatsPerRow,
      });
      toast.success("Screen added");
      setNewScreenName("");
      setNewScreenRows(10);
      setNewScreenSeatsPerRow(12);
      setActiveTheaterForScreen(null);
    } catch (err: any) {
      toast.error("Failed to add screen");
    }
  };

  const handleDeleteScreen = async (theaterId: number, screenId: number) => {
    if (confirm("Are you sure you want to delete this screen?")) {
      try {
        await deleteScreen.mutateAsync({ theaterId, screenId });
        toast.success("Screen deleted");
      } catch (err: any) {
        toast.error("Failed to delete screen");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-[36px] tracking-[0.03em]">THEATERS & SCREENS</h1>
          <p className="text-[13px] text-muted mt-0.5">Manage auditorium locations and their screen fleet.</p>
        </div>
        <Button onClick={openCreateTheater} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Add Theater
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-surface p-3 rounded-[10px] border border-border">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <Input
            placeholder="Search theater name..."
            className="pl-9 h-9 text-xs bg-background"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Input
            placeholder="Filter by city..."
            className="h-9 text-xs bg-background"
            value={cityFilter}
            onChange={(e) => handleCityFilterChange(e.target.value)}
          />
        </div>
        {(search || cityFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setCityFilter("");
              setCursorStack([null]);
              setPageIndex(0);
            }}
            className="text-xs h-9 text-muted hover:text-foreground"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
      ) : theaters?.length === 0 ? (
        <Card className="text-center py-20 bg-surface border-border">
          <p className="text-surface-foreground/60 mb-4">No theaters found matching criteria.</p>
          <Button onClick={openCreateTheater} variant="outline">Add Theater</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {theaters?.map((theater) => (
            <Card key={theater.id} className="bg-surface border-border overflow-hidden">
              <CardHeader className="bg-surface-hover/50 border-b border-border flex flex-row items-start justify-between py-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {theater.name}
                  </CardTitle>
                  <p className="text-sm text-surface-foreground/70 mt-1">{theater.city}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditTheater(theater)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-status-failed hover:bg-status-failed/10" onClick={() => setTheaterToDelete(theater)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b border-border/50 bg-background/50 flex justify-between items-center">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-surface-foreground/70 flex items-center gap-2">
                    <MonitorPlay className="h-4 w-4" /> Screens ({theater.screens?.length || 0})
                  </h4>
                  <Button size="sm" variant="secondary" onClick={() => setActiveTheaterForScreen(theater)}>
                    <Plus className="h-3 w-3 mr-1" /> Add Screen
                  </Button>
                </div>
                
                <ul className="divide-y divide-border/50">
                  {theater.screens?.length === 0 ? (
                    <li className="p-4 text-center text-sm text-surface-foreground/50">No screens added.</li>
                  ) : (
                    theater.screens?.map((screen: any) => (
                      <li key={screen.id} className="p-4 flex items-center justify-between hover:bg-surface-hover/30 transition-colors">
                        <span className="font-medium">{screen.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-surface-foreground/50">ID: {screen.id}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-status-failed hover:bg-status-failed/10" onClick={() => handleDeleteScreen(theater.id, screen.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
          </div>

          <div className="rounded-md overflow-hidden border border-border">
            <CursorPagination
              limit={limit}
              onLimitChange={handleLimitChange}
              hasNextPage={Boolean(pagination?.has_next_page)}
              hasPreviousPage={pageIndex > 0}
              onNextPage={handleNextPage}
              onPreviousPage={handlePreviousPage}
              currentPage={pageIndex + 1}
              totalItems={pagination?.total}
              currentCount={theaters.length}
              isLoading={isFetching}
            />
          </div>
        </div>
      )}

      {/* Theater Form Dialog */}
      <Dialog open={isTheaterFormOpen} onOpenChange={setIsTheaterFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTheater ? "Edit Theater" : "Add Theater"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onTheaterSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Theater Name</Label>
              <Input {...register("name", { required: true })} placeholder="e.g. Cineplex Central" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input {...register("address", { required: true })} placeholder="e.g. 123 Cinema Lane" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...register("city", { required: true })} placeholder="e.g. Mumbai" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsTheaterFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createTheater.isPending || updateTheater.isPending}>
                Save Theater
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Screen Form Dialog */}
      <Dialog open={!!activeTheaterForScreen} onOpenChange={(open) => !open && setActiveTheaterForScreen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Screen to {activeTheaterForScreen?.name}</DialogTitle>
            <DialogDescription>
              Configure the screen details and seat layout. The layout will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Screen Name</Label>
              <Input value={newScreenName} onChange={e => setNewScreenName(e.target.value)} placeholder="e.g. Screen 1, IMAX, Gold Class" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of Rows</Label>
                <Input type="number" min="1" max="26" value={newScreenRows} onChange={e => setNewScreenRows(Number(e.target.value) || 10)} />
              </div>
              <div className="space-y-2">
                <Label>Seats Per Row</Label>
                <Input type="number" min="1" max="50" value={newScreenSeatsPerRow} onChange={e => setNewScreenSeatsPerRow(Number(e.target.value) || 12)} />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setActiveTheaterForScreen(null);
                setNewScreenRows(10);
                setNewScreenSeatsPerRow(12);
              }}>Cancel</Button>
              <Button onClick={handleAddScreen} disabled={createScreen.isPending || !newScreenName.trim()}>
                {createScreen.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                Add Screen
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Theater Dialog */}
      <Dialog open={!!theaterToDelete} onOpenChange={(open) => !open && setTheaterToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto bg-status-failed/20 p-3 rounded-full mb-4 w-fit">
               <AlertCircle className="h-6 w-6 text-status-failed" />
            </div>
            <DialogTitle className="text-center">Delete Theater?</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete <strong>{theaterToDelete?.name}</strong>? This will remove all its screens, shows, and related bookings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-3">
            <Button variant="outline" onClick={() => setTheaterToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleTheaterDelete} disabled={deleteTheater.isPending}>
              {deleteTheater.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

