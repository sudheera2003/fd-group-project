"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import api from "@/lib/api"; 
import { Check } from "lucide-react"; // Import Check icon for selection

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

// --- 1. Define Color Options ---
const COLOR_OPTIONS = [
  { name: "blue", hex: "#3b82f6" },
  { name: "green", hex: "#22c55e" },
  { name: "red", hex: "#ef4444" },
  { name: "purple", hex: "#a855f7" },
  { name: "orange", hex: "#f97316" },
  { name: "pink", hex: "#ec4899" },
  { name: "yellow", hex: "#eab308" },
];

// --- Zod Schema ---
const formSchema = z.object({
  eventName: z.string().min(2, "Event name is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  duration: z
    .string()
    .min(1, "Duration is required")
    .refine(
      (val) => {
        const parts = val.split(".");
        const hours = parseInt(parts[0] || "0");
        const minutes = parseInt(parts[1] || "0");
        const totalMinutes = hours * 60 + minutes;
        return totalMinutes >= 30;
      },
      { message: "Minimum duration is 30 minutes" }
    )
    .refine(
      (val) => {
        return /^\d+(\.\d{1,2})?$/.test(val);
      },
      {
        message:
          "Invalid format. Use hours.minutes (e.g., 1.45 for 1 hour 45 minutes)",
      }
    ),
  eventType: z.string().min(1, "Please select an event type"),
  venue: z.string().min(1, "Please select a venue"),
  budget: z.number().min(0, "Budget must be positive"),
  color: z.string().min(1, "Please select a color"), // --- 2. Add Color Field ---
});

type FormValues = z.infer<typeof formSchema>;

interface NewEventProps {
  setOpen: (open: boolean) => void;
  isOpen: boolean;
  onEventCreated?: () => void;
  projectId?: string;
}

export default function NewEvent({ setOpen, isOpen, onEventCreated, projectId }: NewEventProps) {
  const [venues, setVenues] = React.useState<any[]>([]);
  const [eventTypes, setEventTypes] = React.useState<any[]>([]);
  const [loadingData, setLoadingData] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventName: "",
      date: "",
      startTime: "",
      duration: "",
      eventType: "",
      venue: "",
      budget: 0,
      color: "blue", // Default to Blue
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoadingData(true);
        try {
          const [venueRes, typeRes] = await Promise.all([
             api.get("/venues"),     
             api.get("/event-types") 
          ]);

          setVenues(venueRes.data);
          setEventTypes(typeRes.data);
        } catch (error) {
          console.error("Failed to fetch form data", error);
        } finally {
          setLoadingData(false);
        }
      };

      fetchData();
    } else {
        form.reset();
    }
  }, [isOpen, form]);

  async function onSubmit(values: FormValues) {
    // Duration formatting logic
    const parts = values.duration.split(".");
    let formattedDuration = values.duration;

    if (!values.duration.includes(".")) {
      formattedDuration = values.duration + ".00";
    } else if (parts[1].length === 1) {
      formattedDuration = parts[0] + "." + parts[1] + "0";
    } else if (parts[1].length === 0) {
      formattedDuration = parts[0] + ".00";
    }

    const formattedParts = formattedDuration.split(".");
    const hours = parseInt(formattedParts[0] || "0");
    const minutes = parseInt(formattedParts[1] || "0");
    const totalMinutes = hours * 60 + minutes;

    try {
        await api.post("/events", {
            name: values.eventName,
            date: new Date(`${values.date}T${values.startTime}`), 
            venue: values.venue, 
            eventType: values.eventType, 
            budget: values.budget,
            durationMinutes: totalMinutes,
            color: values.color, // --- 3. Send Color to API ---
            projectId: projectId 
        });

        toast.success("Event created successfully!");
        setOpen(false);
        if (onEventCreated) onEventCreated(); 
    } catch (error) {
        toast.error("Failed to create event");
    }
  }

  // --- Helpers ---
  const formatDurationDisplay = (value: string) => {
    if (!value) return "";
    const parts = value.split(".");
    if (parts.length === 2) {
      const minutesPart = parts[1];
      if (minutesPart.length > 2) return parts[0] + "." + minutesPart.slice(0, 2);
      if (parseInt(minutesPart) > 59) return parts[0] + ".59";
      return value;
    }
    return value;
  };

  const handleDurationChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: any
  ) => {
    let value = e.target.value.replace(/[^0-9.]/g, "");
    const parts = value.split(".");
    if (parts.length > 2) return;
    if (parts.length === 2 && parts[1].length > 2) return;
    if (parts[0].length > 1 && parts[0].startsWith("0")) {
      value = parseInt(parts[0]).toString() + (parts[1] ? "." + parts[1] : "");
    }
    field.onChange(value);
  };

  return (
    <DialogContent className="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>Create New Event</DialogTitle>
        <DialogDescription>
          Enter the details for your upcoming event.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {/* Event Name */}
          <FormField
            control={form.control}
            name="eventName"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Event Name</FormLabel>
                <FormControl>
                  <Input placeholder="Annual Gala 2026" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => {
              const today = new Date();
              const localDate = new Date(
                today.getTime() - today.getTimezoneOffset() * 60000
              );
              const minDate = localDate.toISOString().split("T")[0];

              return (
                <FormItem className="sm:col-span-1">
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      min={minDate}
                      className="bg-secondary/50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 dark:[&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Time */}
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem className="sm:col-span-1">
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    {...field}
                    className="bg-secondary/50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 dark:[&::-webkit-calendar-picker-indicator]:invert"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duration */}
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem className="sm:col-span-1">
                <FormLabel>Duration (Hrs.Min)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="1.30"
                    value={formatDurationDisplay(field.value)}
                    onChange={(e) => handleDurationChange(e, field)}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value && !value.includes(".")) {
                        field.onChange(value + ".00");
                      } else if (value.includes(".")) {
                        const parts = value.split(".");
                        if (parts[1].length === 1) {
                          field.onChange(parts[0] + "." + parts[1] + "0");
                        }
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Event Type */}
          <FormField
            control={form.control}
            name="eventType"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Event Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingData ? "Loading..." : "Select type"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {eventTypes.length > 0 ? (
                        eventTypes.map((type: any) => (
                            <SelectItem key={type._id || type.id} value={type._id || type.name}>
                                {type.name}
                            </SelectItem>
                        ))
                    ) : (
                        <SelectItem value="none" disabled>No types available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Venue */}
          <FormField
            control={form.control}
            name="venue"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Venue</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingData ? "Loading..." : "Select venue"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {venues.length > 0 ? (
                        venues.map((venue: any) => (
                            <SelectItem key={venue._id || venue.id} value={venue._id || venue.name}>
                                {venue.name}
                            </SelectItem>
                        ))
                    ) : (
                        <SelectItem value="none" disabled>No venues available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Budget */}
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Estimated Budget (LKR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- 4. Color Picker Section --- */}
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Event Color</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4 pt-1">
                    {COLOR_OPTIONS.map((option) => (
                      <div
                        key={option.name}
                        onClick={() => field.onChange(option.name)} 
                        className={`cursor-pointer rounded-full w-8 h-8 flex items-center justify-center transition-all shadow-sm hover:scale-110 ${
                          field.value === option.name
                            ? "ring-2 ring-offset-2 ring-primary ring-offset-background scale-110"
                            : ""
                        }`}
                        style={{ backgroundColor: option.hex }} // Display the Hex
                      >
                        {field.value === option.name && (
                          <Check className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />
                        )}
                      </div>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="sm:col-span-3 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}