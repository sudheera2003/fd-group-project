import { Calendar, type CalendarEvent } from "@/components/ui/calendar";

interface DashboardContentProps {
  events: CalendarEvent[];
}

export function DashboardContent({ events }: DashboardContentProps) {
  return (
    <Calendar
      currentDate={new Date(2025, 0, 10)}
      events={events}
      onDateClick={(date) => console.log("Date clicked:", date)}
    />
  );
}
