"use client";

import * as React from "react";
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
});

type FormValues = z.infer<typeof formSchema>;

interface NewEventProps {
  setOpen: (open: boolean) => void;
  isOpen: boolean;
}

export default function NewEvent({ setOpen, isOpen }: NewEventProps) {
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
    },
  });

  React.useEffect(() => {
    if (!isOpen) form.reset();
  }, [isOpen, form]);

  function onSubmit(values: FormValues) {
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

    const formData = {
      ...values,
      duration: formattedDuration, // Save formatted version back to form values
      durationMinutes: totalMinutes,
      durationDisplay: formattedDuration,
    };

    console.log("Form Values:", formData);
    toast.success("Event created successfully! (UI Only)");
    setOpen(false);
  }

  const formatDurationDisplay = (value: string) => {
    if (!value) return "";

    const parts = value.split(".");

    if (parts.length === 2) {
      const minutesPart = parts[1];

      if (minutesPart.length > 2) {
        return parts[0] + "." + minutesPart.slice(0, 2);
      }

      if (parseInt(minutesPart) > 59) {
        return parts[0] + ".59";
      }

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
    if (parts.length > 2) {
      return;
    }

    if (parts.length === 2 && parts[1].length > 2) {
      return;
    }

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
                      className="date-picker-white-icon bg-black text-white placeholder-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

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
                    className="time-picker-white-icon bg-black text-white placeholder-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <FormField
            control={form.control}
            name="eventType"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Event Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venue"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Venue</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="grand-hall">Grand Hall</SelectItem>
                    <SelectItem value="meeting-room-a">
                      Meeting Room A
                    </SelectItem>
                    <SelectItem value="outdoor-plaza">Outdoor Plaza</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    onBlur={() => {
                      if (isNaN(field.value)) {
                        field.onChange(0);
                      }
                    }}
                  />
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
            <Button type="submit">Create Event</Button>
          </DialogFooter>
        </form>
      </Form>
      <style>{`
        .date-picker-white-icon::-webkit-calendar-picker-indicator,
        .time-picker-white-icon::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 1;
          cursor: pointer;
        }
      `}</style>
    </DialogContent>
  );
}
