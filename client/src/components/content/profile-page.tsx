"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, User as UserIcon, Mail, Shield, Save, Camera } from "lucide-react";
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

// Validation Schema
const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export default function ProfilePage() {
  const { user } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);

  // Cast user
  const currentUser = user as unknown as UserType; 

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: "", email: "" },
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({
        username: currentUser.username,
        email: currentUser.email,
      });
    }
  }, [currentUser, form]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Profile updated successfully");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!currentUser) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getRoleName = () => {
    if (!currentUser.role) return "Member";
    if (typeof currentUser.role === 'string') return currentUser.role;
    return currentUser.role.name || "Member";
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-muted/10 p-4 md:p-10">
      {/* Centered Container */}
      <div className="w-full max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information
          </p>
        </div>
        

        <div className="grid gap-8 md:grid-cols-[1fr_2fr] items-start">
          
          {/* --- LEFT COLUMN: AVATAR CARD --- */}
          <div className="md:sticky md:top-6">
            <Card className="overflow-hidden border-muted shadow-sm">
              {/* Decorative Gradient Banner */}
              <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600" />
              
              <CardContent className="flex flex-col items-center -mt-12 pb-8">
                <div className="relative group cursor-pointer">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${form.watch("username")}`} />
                    <AvatarFallback className="text-2xl font-bold">
                      {currentUser.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="mt-4 text-center space-y-1">
                  <h3 className="text-xl font-semibold">{currentUser.username}</h3>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
                      {getRoleName()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --- RIGHT COLUMN: FORM --- */}
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
                  
                  {/* Username */}
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

                  {/* Email */}
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

                  {/* Read-Only Role */}
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

                  {/* Actions */}
                  <div className="flex justify-end gap-4 pt-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => form.reset()}
                      disabled={isLoading}
                    >
                      Discard
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
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