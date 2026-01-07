import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Calendar, 
  Users, 
  Trash2, 
  Eye, 
  Edit,
  Plus 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog } from "@/components/ui/dialog"; // Import Root Dialog
import ProjectDialog from "./project-dialog"; // Import your NEW reusable dialog
import api from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Types
interface Project {
  _id: string;
  name: string;
  description: string;
  deadline: string;
  status: string;
  // Updated team interface to include _id for the Edit Form
  team?: {
    _id: string; 
    id?: string; // Handle potential backend naming inconsistencies
    name: string;
    organizerName: string;
    organizerEmail: string;
  };
}

export function ProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- NEW STATE FOR DIALOG ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (error) {
      console.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success("Project deleted");
      fetchProjects();
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  // --- HANDLERS FOR ACTIONS ---
  const handleCreateClick = () => {
    setEditingProject(null); // Clear data -> Create Mode
    setIsDialogOpen(true);
  };

  const handleEditClick = (project: Project) => {
    // We normalize the team ID here to ensure the form reads it correctly
    // Some backends return ._id, some .id depending on population
    const preparedProject = {
        ...project,
        team: project.team ? {
            ...project.team,
            id: project.team._id || project.team.id // Ensure 'id' property exists for the form
        } : undefined
    };
    
    setEditingProject(preparedProject); // Load data -> Edit Mode
    setIsDialogOpen(true);
  };

  // Helper for status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Planning": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">Manage your event projects and teams.</p>
        </div>
        
        {/* 👇 UPDATED: Uses standard button to trigger shared dialog */}
        <Button onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading projects...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div 
              key={project._id} 
              className="group relative flex flex-col justify-between rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                    <h3 className="font-semibold leading-none tracking-tight text-lg pt-2">
                      {project.name}
                    </h3>
                  </div>
                  
                  {/* Three Dots Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      
                      {/* View Details */}
                      <DropdownMenuItem onClick={() => navigate(`/admin/projects/${project._id}`)}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      
                      {/* 👇 UPDATED: Edit Button */}
                      <DropdownMenuItem onClick={() => handleEditClick(project)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDelete(project._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[40px]">
                  {project.description || "No description provided."}
                </p>
              </div>

              <div className="p-6 pt-0">
                <div className="flex flex-col gap-2 text-sm text-muted-foreground border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 opacity-70" />
                    <span>Deadline: {formatDate(project.deadline)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 opacity-70" />
                    <span>
                      {project.team ? (
                        <>Team: {project.team.name} <span className="text-xs opacity-70">({project.team.organizerName})</span></>
                      ) : (
                        "No Team Assigned"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-medium">No projects found</h3>
              <p className="text-sm text-muted-foreground">Get started by creating a new project.</p>
            </div>
          )}
        </div>
      )}

      {/* 👇 NEW: The Reusable Project Dialog Component */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {isDialogOpen && (
            <ProjectDialog 
                setOpen={setIsDialogOpen} 
                onSuccess={fetchProjects} 
                projectToEdit={editingProject} 
            />
        )}
      </Dialog>
    </div>
  );
}