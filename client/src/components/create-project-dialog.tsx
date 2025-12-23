import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import api from "@/lib/api"; // Ensure this is configured with baseURL: 'http://localhost:5000/api'
import { toast } from "sonner";

// Type definition matches your backend response
interface Team {
  _id: string;
  name: string;
  organizer: {
    _id: string;
    username: string;
    email: string;
  };
}

export function CreateProjectDialog({ onProjectCreated }: { onProjectCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // New State for Real Teams
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deadline: "",
    teamId: ""
  });

  // 1. Fetch Real Teams when dialog opens
  useEffect(() => {
    if (open) {
      const fetchTeams = async () => {
        try {
          const res = await api.get("/teams"); // Hits http://localhost:5000/api/teams
          setTeams(res.data);
        } catch (error) {
          console.error("Failed to fetch teams");
          toast.error("Could not load teams list");
        }
      };
      fetchTeams();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 2. Find the full team object from the real list
      const selectedTeam = teams.find(t => t._id === formData.teamId);

      if (!selectedTeam) {
        toast.error("Please select a valid team");
        setIsLoading(false);
        return;
      }

      // 3. Send to Backend
      // We explicitly save organizerEmail so "My Projects" works for the organizer later
      await api.post("/projects", {
        name: formData.name,
        description: formData.description,
        deadline: formData.deadline,
        team: {
          id: selectedTeam._id,
          name: selectedTeam.name,
          organizerName: selectedTeam.organizer.username,
          organizerEmail: selectedTeam.organizer.email // <--- CRITICAL for filtering
        }
      });

      toast.success("Project created successfully!");
      setFormData({ name: "", description: "", deadline: "", teamId: "" });
      setOpen(false);
      onProjectCreated(); 
    } catch (error) {
      toast.error("Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Add a new project and assign a real team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name</Label>
            <Input 
              id="name" 
              required 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea 
              id="desc" 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          {/* Dynamic Team Dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="team">Assign Team</Label>
            <select
              id="team"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
              value={formData.teamId}
              onChange={(e) => setFormData({...formData, teamId: e.target.value})}
            >
              <option value="" disabled>Select a team...</option>
              {teams.length > 0 ? (
                teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name} (Org: {team.organizer?.username || "Unknown"})
                  </option>
                ))
              ) : (
                <option value="" disabled>No teams found. Create one first.</option>
              )}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input 
              id="deadline" 
              type="date" 
              required 
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}