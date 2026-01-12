"use client";

import { useEffect, useState, useCallback } from "react"; // 1. Import useCallback
import { Calendar, type CalendarEvent } from "@/components/ui/calendar";
import { useRealTime } from "@/hooks/use-real-time"; // 2. Import Real-Time Hook
import api from "@/lib/api";
import EventDialog from "./event-dialog";

export function DashboardContent() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // --- 3. DEFINE FETCH FUNCTION (Stable Callback) ---
  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get("/events");

      const mappedEvents: CalendarEvent[] = res.data.map((event: any) => {
        const eventDate = new Date(event.date);

        return {
          id: event._id,
          title: event.name,
          date: eventDate,
          time: eventDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          color: event.color || "#3b82f6",
          durationMinutes: event.durationMinutes,
          budget: event.budget,
          venue: event.venue?.name,
          eventType: event.eventType?.name,
          status: event.status,
        };
      });

      setEvents(mappedEvents);
    } catch (error) {
      console.error("Failed to load events", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- 4. INITIAL LOAD ---
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // --- 5. REAL-TIME LISTENER ---
  // Listen for "event_update" signal from backend
  useRealTime("event_update", fetchEvents);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const eventsForSelectedDate = selectedDate
    ? events.filter(
        (event) => event.date.toDateString() === selectedDate.toDateString()
      )
    : [];

  if (loading) {
    return <p className="text-muted-foreground">Loading events...</p>;
  }

  return (
    <>
      <Calendar
        currentDate={new Date()}
        events={events}
        onDateClick={handleDateClick}
      />

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDate}
        events={eventsForSelectedDate}
      />
    </>
  );
}
