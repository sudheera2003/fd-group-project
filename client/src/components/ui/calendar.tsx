import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface CalendarEvent {
  id: string
  title: string
  date: Date
  time: string
  color?: string
}

interface CalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  currentDate?: Date
  events?: CalendarEvent[]
  onDateClick?: (date: Date) => void
  onPrevMonth?: () => void
  onNextMonth?: () => void
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      className,
      currentDate = new Date(),
      events = [],
      onDateClick,
      onPrevMonth,
      onNextMonth,
      ...props
    },
    ref
  ) => {
    const [displayDate, setDisplayDate] = React.useState(new Date(currentDate))

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
    
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    
    const daysInMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    const firstDayOfMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const handlePrevMonth = () => {
      setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1))
      onPrevMonth?.()
    }

    const handleNextMonth = () => {
      setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1))
      onNextMonth?.()
    }

    const getEventsForDate = (day: number) => {
      return events.filter((event) => {
        const eventDate = new Date(event.date)
        return (
          eventDate.getDate() === day &&
          eventDate.getMonth() === displayDate.getMonth() &&
          eventDate.getFullYear() === displayDate.getFullYear()
        )
      })
    }



    const getEventColor = (color?: string) => {
      const colorMap: Record<string, string> = {
        red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        pink: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
        orange: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      }
      return colorMap[color || "blue"] || colorMap.blue
    }

    const month = displayDate.getMonth()
    const year = displayDate.getFullYear()
    const totalDays = daysInMonth(displayDate)
    const firstDay = firstDayOfMonth(displayDate)

    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i)
    }

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                {monthNames[month]} {year}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Jan 1, 2025 - Jan 31, 2025
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDisplayDate(new Date())}>
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b">
            <button className="px-3 py-2 text-sm font-medium border-b-2 border-blue-500 text-blue-600">
              All events
            </button>
            <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              Shared
            </button>
            <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              Public
            </button>
            <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              Archived
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Day Names */}
            <div className="grid grid-cols-7 gap-0 bg-gray-50 dark:bg-gray-900 border-b">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0">
              {days.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative border-r border-b last:border-r-0 min-h-32 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer",
                    !day && "bg-gray-50 dark:bg-gray-900",
                    index % 7 === 6 && "border-r-0"
                  )}
                  onClick={() => day && onDateClick?.(new Date(year, month, day))}
                >
                  {day && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-gray-400">{day}</div>
                      <div className="space-y-1">
                        {getEventsForDate(day).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs p-1 rounded truncate font-medium leading-tight",
                              getEventColor(event.color)
                            )}
                            title={`${event.title} - ${event.time}`}
                          >
                            <div className="truncate">{event.title}</div>
                            <div className="text-xs opacity-75">{event.time}</div>
                          </div>
                        ))}
                        {getEventsForDate(day).length > 2 && (
                          <div className="text-xs text-gray-500 px-1">
                            +{getEventsForDate(day).length - 2} more...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

Calendar.displayName = "Calendar"

export { Calendar }
