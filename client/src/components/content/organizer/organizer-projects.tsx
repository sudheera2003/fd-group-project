import { useEffect, useState, useCallback } from "react"; // 1. Import useCallback
import { useAuth } from "@/hooks/use-auth";
import { useRealTime } from "@/hooks/use-real-time"; // 2. Import Real-Time Hook
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function OrganizerProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  // --- 3. DEFINE FETCH FUNCTION (Stable Callback) ---
  const fetchProjects = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      // Fetch ONLY projects assigned to this organizer
      const res = await api.get(`/projects/my-projects?email=${user.email}`);
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  }, [user?.email]);

  // --- 4. INITIAL LOAD ---
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // --- 5. REAL-TIME LISTENER ---
  // If an admin assigns you a new project or updates one, this refreshes the list.
  useRealTime("project_update", fetchProjects);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">My Assigned Projects</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length > 0 ? projects.map((project: any) => (
          <Card 
            key={project._id} 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={() => navigate(`/organizer/projects/${project._id}`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {project.status}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.name}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Deadline: {new Date(project.deadline).toLocaleDateString()}
              </p>
              <Button className="mt-4 w-full" variant="outline">
                Manage Events & Tasks
              </Button>
            </CardContent>
          </Card>
        )) : (
          <p className="text-muted-foreground">You haven't been assigned any projects yet.</p>
        )}
      </div>
    </div>
  );
}