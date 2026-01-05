"use client";

import { useEffect, useState } from "react";
import { Calendar, type CalendarEvent } from "@/components/ui/calendar";
import api from "@/lib/api";
import EventDialog from "./event-dialog";

export function DashboardContent() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
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
          };
        });

        setEvents(mappedEvents);
      } catch (error) {
        console.error("Failed to load events", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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
