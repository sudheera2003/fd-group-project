import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useRealTime } from "@/hooks/use-real-time"; // Assuming you want real-time here too!
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, MapPin, Plus, ArrowLeft, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import NewEvent from "../new-event-dialog";

// 1. IMPORT ALERT DIALOG COMPONENTS
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

  // 2. DELETE STATE (Stores the ID of event to be deleted)
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Define fetch function (wrapped in useCallback for real-time hook)
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

  // Real-time listener (Optional but recommended)
  useRealTime("event_update", fetchEvents);

  // 3. CONFIRM DELETE LOGIC (Triggered by Dialog)
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/events/${deleteId}`);
      toast.success("Event deleted");
      
      // Update local state immediately for snappy UI
      setEvents(events.filter((e: any) => e._id !== deleteId));
      
      // Close Dialog
      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleEditClick = (event: any) => {
    setEditingEvent(event); 
    setIsDialogOpen(true);  
  };

  return (
    <div className="space-y-6">
      {/* 4. ALERT DIALOG COMPONENT */}
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

      {/* Header code ... (unchanged) */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Project Dashboard</h2>
          <p className="text-muted-foreground">Manage events and assign tasks.</p>
        </div>
      </div>

      {/* Action Bar */}
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

      {/* Events Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event: any) => (
          <Card
            key={event._id}
            className="hover:border-primary transition-colors relative group"
          >
            {/* ACTION BUTTONS WRAPPER */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(event);
                    }}
                >
                    <Pencil className="h-4 w-4" />
                </Button>

                {/* 5. UPDATE DELETE BUTTON TO SET STATE */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(event._id); // Set ID, don't delete yet!
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="text-lg pr-16">{event.name}</CardTitle> 
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(event.date).toLocaleDateString()} at{" "}
                  {new Date(event.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {typeof event.venue === "object"
                    ? event.venue.name
                    : event.venue || "TBD"}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 text-xs h-8"
                onClick={() => {
                  navigate(`/organizer/events/${event._id}/tasks`, {
                    state: {
                      eventName: event.name,
                      teamId: project?.team?.id,
                    },
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