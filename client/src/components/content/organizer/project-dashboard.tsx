import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, MapPin, Plus, ArrowLeft, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import NewEvent from "../new-event-dialog"; // Ensure path is correct

export default function ProjectDashboard() {
  const { id } = useParams(); // Get Project ID from URL
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [events, setEvents] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // 1. Define fetch function so it can be reused by the child component
  const fetchEvents = async () => {
    try {
      const eventRes = await api.get(`/events/${id}`);
      setEvents(eventRes.data);
    } catch (error) {
      console.error("Failed to load events");
    }
  };

  // 2. Initial Data Load
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        await fetchEvents(); // Load events

        // Load Project Info
        const projectRes = await api.get(`/projects/${id}`);
        setProject(projectRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data");
        toast.error("Failed to load project info");
      }
    };
    if (id) fetchProjectData();
  }, [id]);

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure? This will delete the event and ALL its tasks."))
      return;

    try {
      await api.delete(`/events/${eventId}`);
      toast.success("Event deleted");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleEditClick = (event: any) => {
    setEditingEvent(event); // Set the event data
    setIsDialogOpen(true);  // Open the dialog
  };

  return (
    <div className="space-y-6">
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
            // Reset editing state when dialog closes
            if (!open) setEditingEvent(null);
        }}>
          <DialogTrigger asChild>
            {/* Make sure creating new clears the editing state */}
            <Button onClick={() => setEditingEvent(null)}>
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </DialogTrigger>

          <NewEvent
            isOpen={isDialogOpen}
            setOpen={setIsDialogOpen}
            onEventCreated={fetchEvents}
            projectId={id}
            eventToEdit={editingEvent} // 3. PASS THE EDITING EVENT
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
                
                {/* 4. EDIT BUTTON */}
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

                {/* DELETE BUTTON */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event._id);
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="text-lg pr-16">{event.name}</CardTitle> {/* Increased pr padding to fit 2 buttons */}
            </CardHeader>
            <CardContent>
              {/* Content remains unchanged */}
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