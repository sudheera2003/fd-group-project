import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

export function SiteHeader() {
  const location = useLocation();

  const getMenuTitle = () => {
    const path = location.pathname.substring(1); // Remove leading slash
    if (!path) return "Dashboard";

    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      lifecycle: "Lifecycle",
      analytics: "Analytics",
      projects: "Projects",
      team: "Team",
      viewUsers: "All Users",
    };
    
    // Default to capitalizing the path if not in the map
    return titles[path] || "";
  };

  return (
    <header className="rounded-t-md sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-white dark:bg-[#0A0A0A] transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)" suppressHydrationWarning>
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{getMenuTitle()}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
            <ModeToggle />
          </Button>
        </div>
      </div>
    </header>
  );
}