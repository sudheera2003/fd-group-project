import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, Calendar, MapPin, User, Mail, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [tasksMap, setTasksMap] = useState<Record<string, any[]>>({}); // Map EventID -> Tasks[]

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // 1. Fetch Project & Events
      const [projRes, eventRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/events/${id}`)
      ]);
      setProject(projRes.data);
      setEvents(eventRes.data);

      // 2. Fetch Tasks for ALL events (to avoid N+1 clicks later)
      // Note: A better backend approach would be a single aggregation endpoint.
      // For now, we loop through events.
      const taskPromises = eventRes.data.map((evt: any) => 
        api.get(`/tasks/event/${evt._id}`).then(res => ({ eventId: evt._id, tasks: res.data }))
      );
      
      const tasksResults = await Promise.all(taskPromises);
      
      // Convert array to Map for easy lookup: { "evt_123": [task1, task2] }
      const newMap: Record<string, any[]> = {};
      tasksResults.forEach((item: any) => {
        newMap[item.eventId] = item.tasks;
      });
      setTasksMap(newMap);

    } catch (error) {
      toast.error("Failed to load project details");
    }
  };

  if (!project) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* --- Header Section --- */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit pl-0 hover:pl-2 transition-all" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight">{project.name}</h1>
                <p className="text-lg text-muted-foreground mt-2 max-w-2xl">{project.description}</p>
            </div>
            <Badge className={`text-md px-4 py-1 ${
                project.status === 'Completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                project.status === 'In Progress' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
            }`}>
                {project.status}
            </Badge>
        </div>
      </div>

      <Separator />

      {/* --- Info Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Organizer Card */}
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Organizer</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${project.team?.organizerEmail}`} />
                    <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{project.team?.organizerName || "Unknown"}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 mr-1" /> {project.team?.organizerEmail}
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Timeline</CardTitle></CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">Project created on {new Date(project.createdAt).toLocaleDateString()}</p>
            </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Summary</CardTitle></CardHeader>
            <CardContent className="flex justify-between items-center">
                <div className="text-center">
                    <div className="text-2xl font-bold">{events.length}</div>
                    <div className="text-xs text-muted-foreground">Events</div>
                </div>
                <div className="h-8 w-px bg-border"></div>
                <div className="text-center">
                    <div className="text-2xl font-bold">
                        {Object.values(tasksMap).reduce((acc, t) => acc + t.length, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Tasks</div>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* --- Events & Tasks Section --- */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Events & Tasks</h2>
        {events.length === 0 ? (
            <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">No events found for this project.</div>
        ) : (
            <Accordion type="single" collapsible className="w-full">
                {events.map((event) => (
                    <AccordionItem key={event._id} value={event._id} className="border rounded-lg mb-4 px-4 shadow-sm bg-card">
                        <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center gap-4 text-left">
                                <div className="bg-primary/10 p-2 rounded-md">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{event.name}</h3>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.venue?.name || event.venue}</span>
                                        <span>•</span>
                                        <span>{new Date(event.date).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-6">
                            <div className="ml-2 pl-4 border-l-2 border-dashed space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Tasks</h4>
                                {tasksMap[event._id] && tasksMap[event._id].length > 0 ? (
                                    tasksMap[event._id].map(task => (
                                        <div key={task._id} className="flex items-start justify-between bg-muted/40 p-3 rounded-md">
                                            <div className="flex items-start gap-3">
                                                {task.status === 'Done' ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" /> : <Circle className="h-5 w-5 text-gray-300 mt-0.5" />}
                                                <div>
                                                    <p className={`text-sm font-medium ${task.status === 'Done' ? 'line-through text-muted-foreground' : ''}`}>{task.description}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[10px] h-5">{task.priority}</Badge>
                                                        {task.assignedTo && <span className="text-xs text-muted-foreground">Assigned to: {task.assignedTo.username}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant={task.status === 'Done' ? 'default' : 'secondary'}>{task.status}</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No tasks created for this event yet.</p>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        )}
      </div>
    </div>
  );
}