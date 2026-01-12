import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useRealTime } from "@/hooks/use-real-time";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
// 1. ADD NEW ICONS
import { Calendar, MapPin, Plus, ArrowLeft, Trash2, Pencil, Clock, Banknote, Tag } from "lucide-react";
import { toast } from "sonner";
import NewEvent from "../new-event-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [events, setEvents] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!id) return;
    try {
      const eventRes = await api.get(`/events/${id}`);
      setEvents(eventRes.data);
    } catch (error) {
      console.error("Failed to load events");
    }
  }, [id]);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        await fetchEvents();
        const projectRes = await api.get(`/projects/${id}`);
        setProject(projectRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data");
        toast.error("Failed to load project info");
      }
    };
    if (id) fetchProjectData();
  }, [id, fetchEvents]);

  useRealTime("event_update", fetchEvents);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/events/${deleteId}`);
      toast.success("Event deleted");
      setEvents(events.filter((e: any) => e._id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleEditClick = (event: any) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  // --- HELPER 1: Format Minutes to Hrs/Mins ---
  const formatDuration = (minutes: number) => {
    if (!minutes) return "0m";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins > 0 ? mins + "m" : ""}` : `${mins}m`;
  };

  // --- HELPER 2: Format Currency (LKR) ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // --- HELPER 3: Status Color Map ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed": return "bg-green-100 text-green-700 hover:bg-green-100 border-green-200";
      case "Completed": return "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200";
      case "Cancelled": return "bg-red-100 text-red-700 hover:bg-red-100 border-red-200";
      default: return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200"; // Pending
    }
  };

  return (
    <div className="space-y-6">
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event
              <strong> and all associated tasks</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Project Dashboard</h2>
          <p className="text-muted-foreground">Manage events and assign tasks.</p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold">Events Timeline</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingEvent(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingEvent(null)}>
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </DialogTrigger>
          <NewEvent
            isOpen={isDialogOpen}
            setOpen={setIsDialogOpen}
            onEventCreated={fetchEvents}
            projectId={id}
            eventToEdit={editingEvent}
          />
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event: any) => (
          <Card
            key={event._id}
            // 2. ADD COLORED BORDER LEFT
            className="hover:shadow-md transition-all relative group border-l-[6px]"
            style={{ borderLeftColor: event.color || "#3b82f6" }} 
          >
            {/* Action Buttons (with Mobile Fix) */}
            <div className="absolute top-2 right-2 flex gap-1 transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10">
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                onClick={(e) => { e.stopPropagation(); handleEditClick(event); }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                onClick={(e) => { e.stopPropagation(); setDeleteId(event._id); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <CardHeader className="pb-2">
              <div className="flex justify-between items-start pr-16">
                 {/* Event Name */}
                 <CardTitle className="text-lg truncate" title={event.name}>
                    {event.name}
                 </CardTitle>
              </div>
              {/* 3. STATUS BADGE */}
              <div className="pt-1">
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(event.status)}`}>
                    {event.status?.toUpperCase() || "PENDING"}
                 </span>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground mt-2">
                
                {/* Row 1: Date & Duration */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {new Date(event.date).toLocaleDateString()}
                        <span className="text-xs ml-1 opacity-70">
                            {new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Duration">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs">{formatDuration(event.durationMinutes)}</span>
                    </div>
                </div>

                {/* Row 2: Venue */}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {typeof event.venue === "object" ? event.venue.name : event.venue || "TBD"}
                  </span>
                </div>

                {/* Row 3: Type & Budget */}
                <div className="flex justify-between items-center border-t pt-2 mt-1">
                    <div className="flex items-center gap-2" title="Event Type">
                        <Tag className="h-4 w-4 shrink-0" />
                        <span>
                            {typeof event.eventType === "object" ? event.eventType.name : "General"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-foreground" title="Budget">
                        <Banknote className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>{formatCurrency(event.budget)}</span>
                    </div>
                </div>

              </div>

              <Button
                variant="outline"
                className="w-full mt-4 text-xs h-8 hover:bg-primary/5 hover:text-primary border-primary/20"
                style={{ color: event.color }} 
                onClick={() => {
                  navigate(`/organizer/events/${event._id}/tasks`, {
                    state: { eventName: event.name, teamId: project?.team?.id },
                  });
                }}
              >
                Manage Tasks
              </Button>
            </CardContent>
          </Card>
        ))}

        {events.length === 0 && (
          <div className="col-span-full py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            No events created yet. Click "Add Event" to start.
          </div>
        )}
      </div>
    </div>
  );
}