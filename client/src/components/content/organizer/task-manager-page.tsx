import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
// 👇 1. IMPORT ALERT DIALOG COMPONENTS
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, UserPlus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function TaskManagerPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const eventName = location.state?.eventName || "Event Tasks";
  const teamId = location.state?.teamId;

  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  
  // Create Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ description: "", assignedTo: "", priority: "Medium" });

  // Reassign Dialog State
  const [reassignTask, setReassignTask] = useState<any>(null);
  const [newAssignee, setNewAssignee] = useState("");

  // 👇 2. DELETE STATE (Stores the ID of the task to be deleted)
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventId && teamId) fetchData();
  }, [eventId, teamId]);

  const fetchData = async () => {
    try {
      const [taskRes, memberRes] = await Promise.all([
        api.get(`/tasks/event/${eventId}`),
        api.get(`/tasks/members/${teamId}`)
      ]);
      setTasks(taskRes.data);
      setMembers(memberRes.data);
    } catch (error) { toast.error("Failed to load data"); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.assignedTo) return toast.error("Please select a member");
    setLoading(true);
    try {
      await api.post("/tasks", { eventId, ...newTask });
      toast.success("Task assigned successfully");
      setIsDialogOpen(false);
      setNewTask({ description: "", assignedTo: "", priority: "Medium" });
      fetchData(); 
    } catch (error) { toast.error("Failed to create task"); } 
    finally { setLoading(false); }
  };

  // 👇 3. NEW DELETE LOGIC (Triggered by the Dialog)
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/tasks/${deleteId}`);
      setTasks(tasks.filter(t => t._id !== deleteId));
      toast.success("Task deleted");
    } catch (e) { 
      toast.error("Could not delete task"); 
    } finally {
      setDeleteId(null); // Close the dialog
    }
  };

  const handleReassign = async () => {
    if (!reassignTask || !newAssignee) return toast.error("Select a member");
    
    try {
      await api.patch(`/tasks/${reassignTask._id}/assign`, { memberId: newAssignee });
      toast.success("Task reassigned successfully");
      setReassignTask(null);
      setNewAssignee("");
      fetchData(); 
    } catch (error) {
      toast.error("Failed to reassign task");
    }
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'High': return "bg-red-100 text-red-700 border-red-200";
      case 'Medium': return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getStatusColor = (s: string) => {
    if (s === 'Done') return "bg-green-100 text-green-700";
    if (s === 'In Review') return "bg-purple-100 text-purple-700";
    return "bg-secondary text-secondary-foreground";
  };

  return (
    <div className="space-y-6">
      {/* --- 4. ALERT DIALOG COMPONENT --- */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this task from the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
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
            <Button><Plus className="mr-2 h-4 w-4" /> Assign New Task</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader><DialogTitle>Assign Task</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Input required placeholder="Task details..." value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newTask.assignedTo} onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})} required>
                    <option value="" disabled>Select Member...</option>
                    {members.map(m => <option key={m._id} value={m._id}>{m.username}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Assigning..." : "Assign Task"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reassign Dialog */}
      <Dialog open={!!reassignTask} onOpenChange={(open) => !open && setReassignTask(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
               <AlertCircle className="h-5 w-5" /> Reassign Task
            </DialogTitle>
            <DialogDescription>
               The previous owner of this task was removed. Please select a new member for: <br/>
               <span className="font-bold text-foreground block mt-1">"{reassignTask?.description}"</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
             <div className="space-y-2">
                <Label>Select New Member</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                  value={newAssignee} 
                  onChange={(e) => setNewAssignee(e.target.value)}
                >
                    <option value="" disabled>Choose member...</option>
                    {members.map(m => <option key={m._id} value={m._id}>{m.username}</option>)}
                </select>
             </div>
             <Button onClick={handleReassign} className="w-full">Confirm Reassignment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task List */}
      <Card>
        <CardHeader><CardTitle>Task List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[350px]">Description</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No tasks assigned yet.</TableCell></TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task._id}>
                    <TableCell className="font-medium">{task.description}</TableCell>
                    <TableCell>
                        {task.assignedTo ? (
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo.username}`} />
                                    <AvatarFallback>{task.assignedTo.username[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground">{task.assignedTo.username}</span>
                            </div>
                        ) : (
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                className="h-7 text-xs gap-1 shadow-sm animate-pulse"
                                onClick={() => setReassignTask(task)}
                            >
                                <UserPlus className="h-3 w-3" /> Assign Member
                            </Button>
                        )}
                    </TableCell>

                    <TableCell>
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className={getStatusColor(task.status)}>{task.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {/* 👇 5. UPDATE CLICK HANDLER TO SET ID INSTEAD OF DELETE IMMEDIATELY */}
                        <Button variant="ghost" size="icon" className="hover:text-red-600" onClick={() => setDeleteId(task._id)}>
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