"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useRealTime } from "@/hooks/use-real-time"; 
import { Loader2, User as UserIcon, Mail, Shield, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define User Type
type UserType = {
  id: string;
  username: string;
  email: string;
  role: string | { _id: string; name: string };
};

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export default function ProfilePage() {
  const { user: authUser } = useAuth(); // Only used to get the ID
  const [isSaving, setIsSaving] = useState(false);

  // 1. START AS NULL (Forces a loading state, preventing old data from showing)
  const [displayUser, setDisplayUser] = useState<UserType | null>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: "", email: "" },
  });

  // 2. FETCH FRESH DATA
  const refreshProfile = useCallback(async () => {
    if (!authUser?.id) return;

    try {
      const res = await fetch(`http://localhost:5000/api/users/${authUser.id}`);
      const data = await res.json();

      if (res.ok) {
        // Set State
        setDisplayUser({
          id: data._id,
          username: data.username,
          email: data.email,
          role: data.role,
        });

        // Set Form Values
        form.reset({
          username: data.username,
          email: data.email,
        });
      }
    } catch (error) {
      console.error("Failed to refresh profile", error);
      toast.error("Could not load profile data");
    }
  }, [authUser?.id, form]);

  // 3. INITIAL LOAD
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // 4. REAL-TIME LISTENER
  useRealTime("user_update", () => {
    refreshProfile();
  });

  // 5. SUBMIT HANDLER
  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!displayUser) return;
    setIsSaving(true);
    try {
      // Using the URL that you confirmed works
      const res = await fetch(`http://localhost:5000/api/users/${displayUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Profile updated successfully");
        
        // Update Local State Immediately
        const updatedUser = {
            ...displayUser,
            username: values.username,
            email: values.email
        };
        setDisplayUser(updatedUser);
        
        // Reset form with new values to keep it "pristine"
        form.reset({
            username: values.username,
            email: values.email
        });
        
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    } finally {
      setIsSaving(false);
    }
  }

  // 6. LOADING GUARD
  // This prevents the form from rendering until we have FRESH data
  if (!displayUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/10">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  const getRoleName = () => {
    if (!displayUser.role) return "Member";
    if (typeof displayUser.role === 'string') return displayUser.role;
    return displayUser.role.name || "Member";
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-muted/10 p-4 md:p-10">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-[1fr_2fr] items-start">
          
          <div className="md:sticky md:top-6">
            <Card className="overflow-hidden border-muted shadow-sm">
              <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600" />
              
              <CardContent className="flex flex-col items-center -mt-12 pb-8">
                <div className="relative group cursor-pointer">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${form.watch("username") || displayUser.username}`} />
                    <AvatarFallback className="text-2xl font-bold">
                      {displayUser.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="mt-4 text-center space-y-1">
                  <h3 className="text-xl font-semibold">{displayUser.username}</h3>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
                      {getRoleName()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-muted shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your public profile details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" placeholder="Your username" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          This is how your name will appear to other users.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" placeholder="m@example.com" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-3">
                    <FormLabel>Permissions & Role</FormLabel>
                    <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-background rounded-full border">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Current Role</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {getRoleName()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Read-Only</Badge>
                    </div>
                    <p className="text-[0.8rem] text-muted-foreground ml-1">
                      * Contact an administrator to update your permissions.
                    </p>
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => refreshProfile()}
                      disabled={isSaving}
                    >
                      Reset Changes
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>

                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}