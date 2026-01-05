"use client";

import { useEffect, useState } from "react";
import { Calendar, type CalendarEvent } from "@/components/ui/calendar";
import api from "@/lib/api";

export function DashboardContent() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <p className="text-muted-foreground">Loading events...</p>;
  }

  return (
    <Calendar
      currentDate={new Date()}
      events={events}
      onDateClick={(date) => console.log("Date clicked:", date)}
    />
  );
}
