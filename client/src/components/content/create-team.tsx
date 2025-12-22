"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X, Search, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Types
type UserResult = {
  _id: string;
  username: string;
  email: string;
  role: string;
};

// Form Schema
const teamSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters"),
  description: z.string().optional(),
});

// 1. ADD PROPS INTERFACE
interface CreateTeamProps {
  setOpen?: (open: boolean) => void;
}

// 2. DESTRUCTURE SETOPEN FROM PROPS
export default function CreateTeam({ setOpen }: CreateTeamProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", description: "" },
  });

  // --- 1. SEARCH LOGIC (Debounced) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(
          `http://localhost:5000/users/search?query=${query}`
        );
        const data = await res.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // --- 2. ADD USER LOGIC ---
  const addUser = (user: UserResult) => {
    if (selectedUsers.some((u) => u._id === user._id)) {
      toast.warning("User already added to the team");
      return;
    }
    setSelectedUsers([...selectedUsers, user]);
    setQuery("");
    setSearchResults([]);
  };

  // --- 3. REMOVE USER LOGIC ---
  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userId));
  };

  // --- 4. SUBMIT LOGIC ---
  async function onSubmit(values: z.infer<typeof teamSchema>) {
    if (!user) {
      toast.error("You must be logged in to create a team.");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Please add at least one member to the team.");
      return;
    }

    try {
      const payload = {
        ...values,
        memberIds: selectedUsers.map((u) => u._id),
        adminId: user.id,
      };

      const res = await fetch("http://localhost:5000/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Team created successfully!");
        form.reset();
        setSelectedUsers([]);
        // 3. CLOSE DIALOG ON SUCCESS
        setOpen?.(false);
      } else {
        toast.error(data.message || "Failed to create team");
      }
    } catch (error) {
      toast.error("Server error");
    }
  }

  return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Team Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Alpha Squad" {...field} />
                    </FormControl>
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="What is this team for?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Search Section */}
              <div className="relative space-y-2">
                <FormLabel>Add Members</FormLabel>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {/* Dropdown */}
                {searchResults.length > 0 && (
                  <div className="w-full rounded-md border bg-popover text-popover-foreground outline-none animate-in fade-in-0 zoom-in-95 mt-2">
                    <div className="group overflow-hidden rounded-md py-1">
                      {searchResults.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => addUser(user)}
                          className="flex cursor-pointer items-center px-4 py-2 hover:bg-accent hover:text-accent-foreground"
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarFallback className="text-[10px]">
                              {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {user.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                          <span className="ml-auto text-xs bg-secondary px-2 py-0.5 rounded-full">
                            {user.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {query.length > 1 &&
                  searchResults.length === 0 &&
                  !isSearching && (
                    <div className="text-sm text-muted-foreground p-2">
                      No users found.
                    </div>
                  )}
              </div>

              {/* Selected Users Area */}
              {selectedUsers.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg border border-dashed">
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    Team Members ({selectedUsers.length})
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {selectedUsers.map((user) => (
                      <div key={user._id} className="relative group">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`}
                          />
                          <AvatarFallback>
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <span className="text-[10px] mt-1 block text-center truncate max-w-[50px]">
                          {user.username}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeUser(user._id)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-md transition-transform hover:scale-110"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. BUTTONS SECTION */}
              <div className="space-y-2">
                <Button type="submit" className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" /> Create Team
                </Button>

                {/* Cancel Button */}
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full text-foreground"
                  onClick={() => setOpen?.(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
  );
}
