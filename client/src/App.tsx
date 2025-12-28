import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { type CalendarEvent } from "@/components/ui/calendar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "./hooks/use-auth";

// Layouts & Components
import DashboardLayout from "@/layouts/dashboard-layout";
import { LoginForm } from "./components/content/login-form";
import { DashboardContent } from "@/components/content/dashboard-content";
import { LifecycleContent } from "@/components/content/lifecycle-content";
import { AnalyticsContent } from "@/components/content/analytics-content";
import { ProjectsContent } from "@/components/content/admin/projects-content";
import TeamsPage from "@/components/content/team-content";
import { ViewUsers } from "./components/content/view-users";
import ProjectDashboard from "@/components/content/organizer/project-dashboard";
import ForgotPasswordPage from "@/components/content/forgot-password";
import OrganizerProjects from "./components/content/organizer/organizer-projects";
import TaskManagerPage from "@/components/content/organizer/task-manager-page";

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  // events data preserved here
  const [events] = useState<CalendarEvent[]>([
    // January 1-5
    {
      id: "1",
      title: "Meeting standup",
      date: new Date(2025, 0, 1),
      time: "10:00 AM",
      color: "blue",
    },
    {
      id: "2",
      title: "Confirm with Alex",
      date: new Date(2025, 0, 1),
      time: "11:30 AM",
      color: "blue",
    },
    {
      id: "3",
      title: "Marketing sync",
      date: new Date(2025, 0, 2),
      time: "3:00 PM",
      color: "purple",
    },

    // January 6-10
    {
      id: "4",
      title: "Meeting standup",
      date: new Date(2025, 0, 7),
      time: "10:00 AM",
      color: "blue",
    },
    {
      id: "5",
      title: "One-on-one w...",
      date: new Date(2025, 0, 7),
      time: "10:00 AM",
      color: "red",
    },
    {
      id: "6",
      title: "Design sprint",
      date: new Date(2025, 0, 8),
      time: "10:00 AM",
      color: "blue",
    },
    {
      id: "7",
      title: "Cancel up or Adm",
      date: new Date(2025, 0, 8),
      time: "2:00 PM",
      color: "purple",
    },
    {
      id: "8",
      title: "Deep work",
      date: new Date(2025, 0, 9),
      time: "8:00 AM",
      color: "orange",
    },
    {
      id: "9",
      title: "Design sync",
      date: new Date(2025, 0, 9),
      time: "9:00 AM",
      color: "green",
    },
    {
      id: "10",
      title: "SEO planning",
      date: new Date(2025, 0, 9),
      time: "1:30 PM",
      color: "purple",
    },

    // January 11-15
    {
      id: "11",
      title: "Meeting standup",
      date: new Date(2025, 0, 13),
      time: "10:00 AM",
      color: "blue",
    },
    {
      id: "12",
      title: "Town lunch",
      date: new Date(2025, 0, 14),
      time: "10:15 PM",
      color: "green",
    },
    {
      id: "13",
      title: "Product planning",
      date: new Date(2025, 0, 15),
      time: "10:00 AM",
      color: "blue",
    },
    {
      id: "14",
      title: "Analytics retro",
      date: new Date(2025, 0, 16),
      time: "10:00 AM",
      color: "red",
    },
    {
      id: "15",
      title: "Friday standup",
      date: new Date(2025, 0, 17),
      time: "9:00 AM",
      color: "blue",
    },
    {
      id: "16",
      title: "All-hands meeti...",
      date: new Date(2025, 0, 17),
      time: "4:00 PM",
      color: "red",
    },
    {
      id: "17",
      title: "Design feedback",
      date: new Date(2025, 0, 17),
      time: "2:30 PM",
      color: "green",
    },
    {
      id: "18",
      title: "Hall meeting",
      date: new Date(2025, 0, 18),
      time: "7:00 AM",
      color: "red",
    },
    {
      id: "19",
      title: "Coffees w/ Andria",
      date: new Date(2025, 0, 18),
      time: "9:00 AM",
      color: "green",
    },

    // January 20-24
    {
      id: "20",
      title: "Meeting standup",
      date: new Date(2025, 0, 20),
      time: "10:00 AM",
      color: "blue",
    },
    {
      id: "21",
      title: "Deep work",
      date: new Date(2025, 0, 21),
      time: "9:30 AM",
      color: "orange",
    },
    {
      id: "22",
      title: "Saturday meeting",
      date: new Date(2025, 0, 22),
      time: "9:00 AM",
      color: "blue",
    },
    {
      id: "23",
      title: "Lunch with Zaha",
      date: new Date(2025, 0, 22),
      time: "10:00 AM",
      color: "orange",
    },
    {
      id: "24",
      title: "Deep work",
      date: new Date(2025, 0, 23),
      time: "9:00 AM",
      color: "orange",
    },
    {
      id: "25",
      title: "Audible cefee",
      date: new Date(2025, 0, 23),
      time: "10:00 AM",
      color: "red",
    },
    {
      id: "26",
      title: "Design sync",
      date: new Date(2025, 0, 23),
      time: "9:00 PM",
      color: "green",
    },

    // January 27-31
    {
      id: "27",
      title: "Meeting standup",
      date: new Date(2025, 0, 27),
      time: "9:00 AM",
      color: "blue",
    },
    {
      id: "28",
      title: "Content standup",
      date: new Date(2025, 0, 28),
      time: "9:30 AM",
      color: "blue",
    },
    {
      id: "29",
      title: "Project planning",
      date: new Date(2025, 0, 29),
      time: "9:00 AM",
      color: "blue",
    },
    {
      id: "30",
      title: "Audible coffee",
      date: new Date(2025, 0, 30),
      time: "10:00 AM",
      color: "red",
    },
    {
      id: "31",
      title: "All-hands meeti...",
      date: new Date(2025, 0, 30),
      time: "4:00 PM",
      color: "red",
    },
    {
      id: "32",
      title: "Team dinner",
      date: new Date(2025, 0, 30),
      time: "6:30 PM",
      color: "purple",
    },
    {
      id: "33",
      title: "Friday standup",
      date: new Date(2025, 0, 31),
      time: "9:00 AM",
      color: "blue",
    },
  ]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          {/* Public Route: Login */}
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                  <div className="w-full max-w-sm">
                    {/* Pass a function to simulate logging in */}
                    <LoginForm />
                  </div>
                </div>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/forgot-password"
            element={
              !isAuthenticated ? (
                <ForgotPasswordPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* Protected Routes: Dashboard Group */}
          {isAuthenticated ? (
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={<DashboardContent events={events} />}
              />
              <Route path="/lifecycle" element={<LifecycleContent />} />
              <Route path="/analytics" element={<AnalyticsContent />} />
              <Route path="/projects" element={<ProjectsContent />} />
              <Route path="/team" element={<TeamsPage />} />
              <Route path="/viewUsers" element={<ViewUsers />} />
              {/* Organizer Routes */}
              <Route
                path="/organizer/projects"
                element={<OrganizerProjects />}
              />
              {/* The :id param allows us to grab the ID in the component */}
              <Route
                path="/organizer/projects/:id"
                element={<ProjectDashboard />}
              />
              <Route path="/organizer/events/:eventId/tasks" element={<TaskManagerPage />} />
            </Route>
          ) : (
            // Redirect any unknown or protected path to login if not authenticated
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  );
}

export default App;
