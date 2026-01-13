import { useEffect, useState, useCallback } from "react"; // 1. Import useCallback
import api from "@/lib/api";
import { useRealTime } from "@/hooks/use-real-time"; // 2. Import Real-Time Hook
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { 
  CheckCircle2, XCircle, ExternalLink, Clock, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  
  // Rejection State
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  // --- 3. DEFINE FETCH FUNCTION (Stable Callback) ---
  const fetchReviews = useCallback(async () => {
    try {
      if (user?.id) {
        // Pass the ID explicitly in the URL
        const res = await api.get(`/tasks/reviews/pending/${user.id}`);
        setReviews(res.data);
    }
    } catch (error) { 
      // Optional: console.error(error); 
      // Avoid toasting on background updates to keep UI clean
    }
  }, []);

  // --- 4. INITIAL LOAD ---
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // --- 5. REAL-TIME LISTENER ---
  // When a member submits a task -> it appears here.
  // When you (or another admin) approve/reject -> it disappears from here.
  useRealTime("task_update", fetchReviews);

  const handleApprove = async (task: any) => {
    try {
      await api.post(`/tasks/${task._id}/review`, { status: 'Done' });
      toast.success("Task Approved");
      // fetchReviews(); // Removed manual call, socket handles it
    } catch (e) { 
      toast.error("Approval failed"); 
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      await api.post(`/tasks/${rejectId}/review`, { 
        status: 'In Progress', 
        feedback: feedback 
      });
      toast.success("Task Rejected");
      setRejectId(null);
      setFeedback("");
      // fetchReviews(); // Removed manual call, socket handles it
    } catch (e) { 
      toast.error("Rejection failed"); 
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Approvals</h2>
        <p className="text-muted-foreground">Review work submitted by team members.</p>
      </div>

      {/* --- Rejection Dialog --- */}
      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reject Submission</DialogTitle>
                <DialogDescription>Give feedback on why this was rejected.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <Textarea 
                    placeholder="e.g. Missing required files..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                />
                <Button variant="destructive" className="w-full" onClick={handleReject}>
                    Confirm Rejection
                </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* --- List of Pending Approvals --- */}
      <div className="grid gap-6">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/10 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mb-2 opacity-20" />
            <p>All caught up! No pending approvals.</p>
          </div>
        ) : (
          reviews.map((task) => (
            <Card key={task._id} className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="bg-muted/10 pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-background">{task.eventId?.name || "Unknown Event"}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Submitted {new Date(task.submittedAt).toLocaleDateString()}
                        </span>
                    </div>
                    <CardTitle className="text-lg">{task.description}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo?.username}`} />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                        <p className="font-medium leading-none">{task.assignedTo?.username}</p>
                        <p className="text-xs text-muted-foreground">{task.assignedTo?.email}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 grid gap-4 md:grid-cols-[1fr_200px]">
                {/* Submission Content */}
                <div className="space-y-3 bg-muted/30 p-3 rounded-md">
                   <div className="flex gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <span className="font-semibold text-xs uppercase tracking-wide text-muted-foreground block mb-1">Member Note</span>
                        <p className="text-foreground/90">{task.submissionNote || "No note provided."}</p>
                      </div>
                   </div>
                   
                   {task.submissionLink && (
                     <div className="flex gap-2 text-sm border-t pt-2 mt-2">
                        <ExternalLink className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                            <span className="font-semibold text-xs uppercase tracking-wide text-muted-foreground block mb-1">Attached Link</span>
                            <a href={task.submissionLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                                {task.submissionLink}
                            </a>
                        </div>
                     </div>
                   )}
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-center gap-3 border-l pl-0 md:pl-4 border-dashed md:border-solid md:border-border mt-2 md:mt-0 pt-4 md:pt-0">
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleApprove(task)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 border-red-200" onClick={() => setRejectId(task._id)}>
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}