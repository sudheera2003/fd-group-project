import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import MemberTasks from "./components/content/member/member-tasks";
import ProtectedRoute from "./components/protected-route";
import ApprovalsPage from "./components/content/organizer/approvals-page";
import VenuesPage from "./components/content/admin/venues-page";
import EventTypesPage from "./components/content/admin/event-types-page";
import ProfilePage from "./components/content/profile-page";
import AdminProjectDetails from "./components/content/admin/project-details-page";

function App() {
  const { user, isLoading } = useAuth();

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
          {/* --- 1. PUBLIC ROUTES --- */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                  <div className="w-full max-w-sm">
                    <LoginForm />
                  </div>
                </div>
              )
            }
          />
          <Route
            path="/forgot-password"
            element={
              user ? <Navigate to="/" replace /> : <ForgotPasswordPage />
            }
          />
          {/* --- 2. PROTECTED ROUTES (Wrapped in Dashboard Layout) --- */}
          <Route element={<DashboardLayout />}>
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "organizer", "member"]}
                />
              }
            >
              <Route path="/dashboard" element={<DashboardContent />} />

              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            {/* A. ADMIN ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/lifecycle" element={<LifecycleContent />} />
              <Route path="/analytics" element={<AnalyticsContent />} />
              <Route path="/projects" element={<ProjectsContent />} />
              <Route path="/team" element={<TeamsPage />} />
              <Route path="/viewUsers" element={<ViewUsers />} />
              <Route path="/venues" element={<VenuesPage />} />
              <Route path="/event-types" element={<EventTypesPage />} />
              <Route path="/admin/projects/:id" element={<AdminProjectDetails />} />
              {/* Admin Default Redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
            {/* B. ORGANIZER ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={["organizer"]} />}>
              <Route
                path="/organizer/projects"
                element={<OrganizerProjects />}
              />
              <Route
                path="/organizer/projects/:id"
                element={<ProjectDashboard />}
              />
              <Route
                path="/organizer/events/:eventId/tasks"
                element={<TaskManagerPage />}
              />
              <Route path="/organizer/approvals" element={<ApprovalsPage />} />
              {/* Organizer Default Redirect */}
              <Route
                path="/"
                element={<Navigate to="/organizer/projects" replace />}
              />
            </Route>
            {/* C. MEMBER ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={["member"]} />}>
              <Route path="/member/tasks" element={<MemberTasks />} />
              {/* Member Default Redirect */}
              <Route
                path="/"
                element={<Navigate to="/member/tasks" replace />}
              />
            </Route>
          </Route>
          {/* --- 3. CATCH ALL --- */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  );
}

export default App;
