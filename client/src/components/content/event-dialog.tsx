"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { CalendarEvent } from "@/components/ui/calendar";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  events: CalendarEvent[];
}

export default function EventDialog({
  open,
  onOpenChange,
  date,
  events,
}: EventDialogProps) {
  const formattedDate = date
    ? date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Events on {formattedDate}</DialogTitle>
        </DialogHeader>

        {events.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {events.map((event) => {
              const durationHrs =
                event.durationMinutes != null
                  ? (event.durationMinutes / 60).toFixed(2)
                  : "N/A";

              return (
                <AccordionItem
                  key={event.id}
                  value={event.id}
                  className="border-none"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center w-full">
                      <span className="font-semibold text-sm">
                        {event.title}
                      </span>
                      {/* Badge pushed to right, arrow follows it */}
                      <Badge
                        variant="secondary"
                        className="ml-auto mr-2 font-normal"
                      >
                        {event.time}
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-2 pb-6">
                    <div className="space-y-3 px-1">
                      <EventRow label="Start Time" value={event.time} />
                      <Separator />
                      <EventRow label="Duration" value={`${durationHrs} hrs`} />
                      <Separator />
                      <EventRow
                        label="Budget"
                        value={`LKR ${event.budget ?? 0}`}
                      />
                      <Separator />
                      <EventRow
                        label="Venue"
                        value={event.venue || "Not assigned"}
                      />
                      <Separator />
                      <EventRow
                        label="Event Type"
                        value={event.eventType || "Not specified"}
                      />
                      <Separator />
                      <EventRow
                        label="Status"
                        value={event.status || "Pending"}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No events for this date.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EventRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full items-center justify-between py-0.5">
      <span className="text-sm text-muted-foreground leading-none">
        {label}
      </span>
      <span className="text-sm font-medium text-right leading-none">
        {value}
      </span>
    </div>
  );
}
