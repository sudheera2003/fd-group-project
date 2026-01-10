"use client";

import { useEffect, useState, useCallback } from "react"; // 1. Import useCallback
import { useAuth } from "@/hooks/use-auth";
import { useRealTime } from "@/hooks/use-real-time"; // 2. Import Real-Time Hook
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Send, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function MemberTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  
  // Submit Dialog State
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [submitData, setSubmitData] = useState({ note: "", link: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 3. DEFINE FETCH FUNCTION (Stable Callback) ---
  const fetchTasks = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/tasks/member/${user.id}`);
      setTasks(res.data);
    } catch (error) { 
      console.error("Failed to load tasks", error);
      // Optional: toast.error("Failed to load tasks"); 
    }
  }, [user?.id]);

  // --- 4. INITIAL LOAD ---
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // --- 5. REAL-TIME LISTENER ---
  // When an organizer assigns a task OR status changes, this refreshes the list instantly
  useRealTime("task_update", fetchTasks);

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setIsSubmitting(true);
    
    try {
      await api.post(`/tasks/${selectedTask}/submit`, submitData);
      toast.success("Work submitted for review!");
      
      // We don't necessarily need to manually call fetchTasks() here 
      // because the backend *should* emit "task_update" upon submission.
      // But keeping it for immediate feedback is fine too.
      fetchTasks(); 
      
      setSelectedTask(null);
      setSubmitData({ note: "", link: "" });
    } catch (error) {
      toast.error("Failed to submit work");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusAction = (task: any) => {
    if (task.status === 'Done') {
      return (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-md border border-green-200">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Task Completed</span>
        </div>
      );
    }

    if (task.status === 'In Review') {
      return (
        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-2 rounded-md border border-blue-200">
          <Clock className="h-5 w-5" />
          <span className="text-sm font-medium">Waiting for Organizer Approval</span>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Show Rejection Feedback if it exists */}
        {task.organizerFeedback && (
          <div className="bg-red-50 border border-red-200 p-2 rounded-md flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs uppercase">Needs Revision</p>
              <p>{task.organizerFeedback}</p>
            </div>
          </div>
        )}

        <Dialog open={selectedTask === task._id} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <DialogTrigger asChild>
            <Button className="w-full" onClick={() => setSelectedTask(task._id)}>
              <Send className="mr-2 h-4 w-4" /> Submit Work
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Task for Review</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitWork} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Work Summary / Note</Label>
                <Textarea 
                  placeholder="e.g. Called the venue, they confirmed the date."
                  required
                  value={submitData.note}
                  onChange={(e) => setSubmitData({...submitData, note: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Link (Optional)</Label>
                <Input 
                  placeholder="e.g. Google Drive link"
                  value={submitData.link}
                  onChange={(e) => setSubmitData({...submitData, link: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit for Approval"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">My Tasks</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <Card key={task._id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <Badge variant="outline">{task.priority}</Badge>
                <Badge variant="secondary" className="truncate max-w-[150px]">{task.eventId?.name}</Badge>
              </div>
              <CardTitle className="text-lg mt-2">{task.description}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md space-y-1">
                <div className="flex items-center gap-2"><Calendar className="h-3 w-3" /> {new Date(task.eventId?.date).toLocaleDateString()}</div>
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {task.eventId?.venue?.name || "TBD"}</div>
              </div>

              <div className="mt-auto pt-2">
                {renderStatusAction(task)}
              </div>
            </CardContent>
          </Card>
        ))}
        {tasks.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">No tasks assigned.</div>}
      </div>
    </div>
  );
}