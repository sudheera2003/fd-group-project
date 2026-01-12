"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Update the props interface to include the dialog state control
interface AddUserProps {
  setOpen: (open: boolean) => void;
  isOpen: boolean;
}

type RoleType = {
  _id: string;
  name: string;
};

// Fixed schema
const formSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.string().min(1, "Please select a role"),
});

// Pass the setOpen prop from the parent AppSidebar
export default function AddUser({ setOpen, isOpen }: AddUserProps) {
  const [roles, setRoles] = useState<RoleType[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch("http://localhost:5000/api/roles");
        if (res.ok) {
          const data = await res.json();
          setRoles(data);
        }
      } catch (error) {
        console.error("Failed to load roles", error);
        toast.error("Could not load role options");
      }
    }
    fetchRoles();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        // --- SUCCESS LOGIC ---
        toast.success(data.message || "User registered successfully! 🎉");
        form.reset(); // Reset form fields to default values
        setOpen(false); // Close the dialog
        // ---------------------
      } else {
        // --- ERROR LOGIC ---
        toast.error(data.message || "Registration failed. Check network.");
        // -------------------
      }
    } catch (error) {
      console.error("API call error", error);
      toast.error("Failed to connect to the server. Is the backend running?");
    }
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Add New User</DialogTitle>
        <DialogDescription>
          Fill all the fields to create a new user account.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Username Field */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="ex@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="******"
                      className="pr-10" // Add padding to the right so text doesn't overlap icon
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </button>
                  </div>
                </FormControl>
                <FormDescription>
                  password must be at least 6 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role Selection Field */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        // CHANGE THIS: Use role._id as the value, not role.name
                        <SelectItem key={role._id} value={role._id}>
                          <span className="capitalize">{role.name}</span>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        Loading roles...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save User</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
