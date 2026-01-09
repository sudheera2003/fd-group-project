"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 1. Schema Validation
const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  deadline: z.string().min(1, "Deadline is required"),
  status: z.string(),
  teamId: z.string().min(1, "Team is required"), // We validate that a team is selected
});

interface ProjectDialogProps {
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
  projectToEdit?: any; // If this exists, we are in "Edit Mode"
}

export default function ProjectDialog({
  setOpen,
  onSuccess,
  projectToEdit,
}: ProjectDialogProps) {
  const isEditing = !!projectToEdit;
  const [teams, setTeams] = useState<any[]>([]); // Store real teams here

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      deadline: "",
      status: "Planning",
      teamId: "",
    },
  });

  // 2. Fetch Teams when component mounts
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.get("/teams");
        setTeams(res.data);
      } catch (error) {
        toast.error("Failed to load teams");
      }
    };
    fetchTeams();
  }, []);

  // 3. Populate Form if "Editing"
  useEffect(() => {
    if (projectToEdit) {
      form.reset({
        name: projectToEdit.name,
        description: projectToEdit.description || "",
        deadline: new Date(projectToEdit.deadline).toISOString().split("T")[0],
        status: projectToEdit.status,
        teamId: projectToEdit.team?.id || "", // Pre-select the existing team
      });
    } else {
      // Reset to default for "Create" mode
      form.reset({
        name: "",
        description: "",
        deadline: "",
        status: "Planning",
        teamId: "",
      });
    }
  }, [projectToEdit, form]);

  const onSubmit = async (values: any) => {
    try {
      // Find the full team object based on the selected ID
      const selectedTeam = teams.find((t) => t._id === values.teamId);

      // Construct the payload matching your backend structure
      const payload = {
        name: values.name,
        description: values.description,
        deadline: values.deadline,
        status: values.status,
        // Only send full team details if we are creating, or if the team changed
        team: selectedTeam
          ? {
              id: selectedTeam._id,
              name: selectedTeam.name,
              organizerName: selectedTeam.organizer?.username,
              organizerEmail: selectedTeam.organizer?.email,
            }
          : undefined,
      };

      if (isEditing) {
        // --- UPDATE ---
        await api.put(`/projects/${projectToEdit._id}`, payload);
        toast.success("Project updated successfully");
      } else {
        // --- CREATE ---
        if (!selectedTeam) return toast.error("Please select a valid team");
        await api.post("/projects", payload);
        toast.success("Project created successfully");
      }

      onSuccess(); // Refresh parent table
      setOpen(false); // Close dialog
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Edit Project" : "Create New Project"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update the project details below."
            : "Fill in the form to create a new project."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Project Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Deadline & Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Team Selection Dropdown */}
          <FormField
            control={form.control}
            name="teamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Team</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isEditing}
                >
                  {/* Note: I disabled Team change on Edit to prevent organizer data mismatch. 
                      Remove 'disabled={isEditing}' if you want to allow changing teams later. */}
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team._id} value={team._id}>
                        {team.name} (Org: {team.organizer?.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
