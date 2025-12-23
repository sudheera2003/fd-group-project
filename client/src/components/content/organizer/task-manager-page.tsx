import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TaskManagerPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const eventName = location.state?.eventName || "Event Tasks";
  const teamId = location.state?.teamId;

  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [newTask, setNewTask] = useState({ description: "", assignedTo: "", priority: "Medium" });

  useEffect(() => {
    if (eventId && teamId) {
      fetchData();
    } else {
        console.warn("Missing teamId or eventId");
    }
  }, [eventId, teamId]);

  const fetchData = async () => {
    try {
      const [taskRes, memberRes] = await Promise.all([
        api.get(`/tasks/event/${eventId}`),
        api.get(`/tasks/members/${teamId}`)
      ]);
      setTasks(taskRes.data);
      setMembers(memberRes.data);
    } catch (error) {
      toast.error("Failed to load task data");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.assignedTo) {
      toast.error("Please select a member");
      return;
    }
    setLoading(true);
    try {
      await api.post("/tasks", { eventId, ...newTask });
      toast.success("Task assigned successfully");
      setIsDialogOpen(false);
      setNewTask({ description: "", assignedTo: "", priority: "Medium" });
      fetchData(); 
    } catch (error) {
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t._id !== id));
      toast.success("Task deleted");
    } catch (e) { toast.error("Could not delete task"); }
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'High': return "bg-red-100 text-red-700 hover:bg-red-100 border-red-200";
      case 'Medium': return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200";
      case 'Low': return "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200";
      default: return "bg-gray-100";
    }
  };

  return (
    <div className="space-y-6"> 
      
      {/* --- Header --- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
               <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
               <h2 className="text-2xl font-bold tracking-tight">{eventName}</h2>
               <p className="text-muted-foreground">Manage and assign tasks.</p>
            </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Assign Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  required 
                  placeholder="What needs to be done?" 
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <select 
                     className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                     value={newTask.assignedTo}
                     onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                     required
                  >
                    <option value="" disabled>Select Member...</option>
                    {members.map(m => (
                        <option key={m._id} value={m._id}>{m.username}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select 
                     className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                     value={newTask.priority}
                     onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Assigning..." : "Assign Task"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- Tasks Table --- */}
      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Description</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No tasks assigned yet.
                    </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                    <TableRow key={task._id}>
                    <TableCell className="font-medium">{task.description}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo?.username}`} />
                            <AvatarFallback>{task.assignedTo?.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{task.assignedTo?.username || "Unassigned"}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                            {task.priority}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${task.status === 'Done' ? 'bg-green-500' : 'bg-orange-400'}`} />
                            <span className="text-sm">{task.status}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="hover:text-red-600" onClick={() => handleDelete(task._id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}