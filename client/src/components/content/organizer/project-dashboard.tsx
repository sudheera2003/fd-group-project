import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ProjectDashboard() {
  const { id } = useParams(); // Get Project ID from URL
  const navigate = useNavigate();

  const [selectedEvent, setSelectedEvent] = useState<any>(null); // Stores the full event object
  const [project, setProject] = useState<any>(null);
  const [events, setEvents] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [newEvent, setNewEvent] = useState({ name: "", date: "", venue: "" });

  // 1. Fetch Data on Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Events
        const eventRes = await api.get(`/events/${id}`);
        setEvents(eventRes.data);
        // Fetch Project Info
        const projectRes = await api.get(`/projects/${id}`);
        setProject(projectRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data");
        toast.error("Failed to load project info");
      }
    };
    fetchData();
  }, [id]);

  // 2. Handle Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/events", { ...newEvent, projectId: id });
      toast.success("Event created successfully!");

      // Refresh list
      const res = await api.get(`/events/${id}`);
      setEvents(res.data);

      setIsDialogOpen(false);
      setNewEvent({ name: "", date: "", venue: "" });
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Project Dashboard
          </h2>
          <p className="text-muted-foreground">
            Manage events and assign tasks.
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold">Events Timeline</h3>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label>Event Name</Label>
                <Input
                  required
                  value={newEvent.name}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, name: e.target.value })
                  }
                  placeholder="e.g. Opening Ceremony"
                />
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                  type="datetime-local"
                  required
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Venue</Label>
                <Input
                  value={newEvent.venue}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, venue: e.target.value })
                  }
                  placeholder="e.g. Grand Hall"
                />
              </div>
              <Button type="submit" className="w-full">
                Create Event
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event: any) => (
          <Card
            key={event._id}
            className="hover:border-primary transition-colors cursor-pointer"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{event.name}</CardTitle>
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
                  {event.venue || "TBD"}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 text-xs h-8"
                onClick={() => {
                  // Navigate to the new page
                  // We pass eventName and teamId in 'state' so we don't have to re-fetch them immediately
                  navigate(`/organizer/events/${event._id}/tasks`, {
                    state: {
                      eventName: event.name,
                      teamId: project.team.id,
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
