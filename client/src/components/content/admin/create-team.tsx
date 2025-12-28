import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X, Search, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api"; // Assuming you have this set up
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

// Types
type UserResult = { _id: string; username: string; email: string; role: string; };

const teamSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters"),
  description: z.string().optional(),
});

export default function CreateTeamForm({ setOpen }: { setOpen?: (open: boolean) => void }) {
  const { user } = useAuth();
  
  // Search State
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  
  // Selection State
  const [organizer, setOrganizer] = useState<UserResult | null>(null);
  const [members, setMembers] = useState<UserResult[]>([]);

  const form = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", description: "" },
  });

  // --- Search Logic ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 2) { setSearchResults([]); return; }
      try {
        // Assume you have a generic user search endpoint
        const res = await fetch(`http://localhost:5000/api/users/search?query=${query}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (error) { console.error(error); }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // --- Add User Logic ---
  const handleAddUser = (selectedUser: UserResult) => {
    // 1. Check if trying to add organizer
    if (selectedUser.role === 'organizer') {
      if (organizer) { toast.warning("Only one organizer per team."); return; }
      setOrganizer(selectedUser);
      setQuery(""); setSearchResults([]);
      return;
    }
    
    // 2. Add normal member
    if (members.some(u => u._id === selectedUser._id)) {
        toast.warning("User already added."); return;
    }
    setMembers([...members, selectedUser]);
    setQuery(""); setSearchResults([]);
  };

  // --- Submit ---
  async function onSubmit(values: z.infer<typeof teamSchema>) {
    if (!organizer) { toast.error("Please select an Organizer."); return; }
    if (members.length === 0) { toast.error("Please add at least one member."); return; }

    try {
      await api.post("http://localhost:5000/api/teams", {
        ...values,
        organizerId: organizer._id,
        memberIds: members.map(u => u._id),
        adminId: user?.id
      });
      toast.success("Team created successfully!");
      setOpen?.(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create team");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Team Name</FormLabel>
            <FormControl><Input placeholder="e.g. Alpha Squad" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Input placeholder="Optional" {...field} /></FormControl>
            </FormItem>
          )} />

        {/* --- Search & Select --- */}
        <div className="space-y-3">
            <FormLabel>Assign Members</FormLabel>
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search user by email..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
            </div>

            {/* Results Dropdown */}
            {searchResults.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto bg-popover p-1 shadow-md">
                    {searchResults.map(u => (
                        <div key={u._id} onClick={() => handleAddUser(u)} className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer rounded-sm">
                            <Avatar className="h-6 w-6"><AvatarFallback>{u.username[0]}</AvatarFallback></Avatar>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{u.username}</p>
                                <p className="text-xs text-muted-foreground">{u.role}</p>
                            </div>
                            <UserPlus className="h-4 w-4 opacity-50" />
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* --- Display Selected Organizer --- */}
        {organizer && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">Selected Organizer</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarFallback>{organizer.username[0]}</AvatarFallback></Avatar>
                        <div>
                            <p className="text-sm font-medium">{organizer.username}</p>
                            <p className="text-xs text-muted-foreground">{organizer.email}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setOrganizer(null)} className="h-6 w-6"><X className="h-4 w-4" /></Button>
                </div>
            </div>
        )}

        {/* --- Display Selected Members --- */}
        {members.length > 0 && (
            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Members ({members.length})</p>
                <div className="flex flex-wrap gap-2">
                    {members.map(m => (
                        <div key={m._id} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs">
                            <Avatar className="h-4 w-4"><AvatarFallback>{m.username[0]}</AvatarFallback></Avatar>
                            <span>{m.username}</span>
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setMembers(members.filter(x => x._id !== m._id))} />
                        </div>
                    ))}
                </div>
            </div>
        )}

        <Button type="submit" className="w-full">Create Team</Button>
      </form>
    </Form>
  );
}