"use client";

import * as React from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useRealTime } from "@/hooks/use-real-time"; // <--- 1. IMPORT HOOK
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayersIcon,
  DatabaseIcon,
  SettingsIcon,
  MoreVerticalIcon,
  UserCircleIcon,
  LogOutIcon,
  CheckSquareIcon,
  type LucideIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import AddUser from "./content/register";

// --- Data Arrays ---

const navSecondary = [
  {
    title: "Venues",
    url: "/venues",
  },
  {
    title: "Event Types",
    url: "/event-types",
  },
];

const documents = [
  {
    name: "Add User",
    url: "#",
  },
  {
    name: "View All Users",
    url: "/viewUsers",
  },
];

// --- Main Component ---
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { user: authUser } = useAuth(); // Use this only for ID and initial state

  // --- 2. LOCAL STATE FOR LIVE UPDATES ---
  // Start with session data so it's not empty, but we'll update it instantly
  const [liveUser, setLiveUser] = React.useState({
    name: authUser?.username || "User",
    email: authUser?.email || "user@example.com",
    avatar: "/avatars/avatar-1.jpg",
    role: authUser?.role || "member", // Keep track of role too
  });

  // --- 3. FETCH FRESH DATA ---
  const refreshUserData = React.useCallback(async () => {
    if (!authUser?.id) return;

    try {
      const res = await fetch(`http://localhost:5000/users/${authUser.id}`);
      const data = await res.json();

      if (res.ok) {
        setLiveUser({
          name: data.username,
          email: data.email,
          avatar: "/avatars/avatar-1.jpg", // You can update this if you add real avatar URLs later
          role: data.role?.name || data.role || "member", // Handle populated role object or string ID
        });
      }
    } catch (error) {
      console.error("Failed to refresh sidebar user data");
    }
  }, [authUser?.id]);

  // Initial Load
  React.useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  // --- 4. REAL-TIME LISTENER ---
  // When you update your profile on the Profile Page, this Sidebar will now hear it!
  useRealTime("user_update", () => {
    refreshUserData();
  });

  // Define menus for different roles (Using liveUser.role now)
  const adminMenu = [
    { title: "Dashboard", url: "/dashboard", icon: LayersIcon },
    { title: "All Projects", url: "/projects", icon: LayersIcon },
    { title: "Team", url: "/team", icon: UserCircleIcon },
  ];

  const organizerMenu = [
    { title: "Dashboard", url: "/dashboard", icon: LayersIcon },
    { title: "My Projects", url: "/organizer/projects", icon: LayersIcon },
    { title: "Approvals", url: "/organizer/approvals", icon: CheckSquareIcon },
    { title: "Team", url: "/view-team", icon: UserCircleIcon },
  ];

  const memberMenu = [
    { title: "Dashboard", url: "/dashboard", icon: LayersIcon },
    { title: "My Tasks", url: "/member/tasks", icon: CheckSquareIcon },
    { title: "Team", url: "/view-team", icon: UserCircleIcon },
  ];

  // Determine Menu based on LIVE role
  let currentMenu = memberMenu;
  // Normalize role check (handle objects or strings)
  const roleName = typeof liveUser.role === 'string' ? liveUser.role : (liveUser.role as any).name;
  
  if (roleName === "admin") {
    currentMenu = adminMenu;
  } else if (roleName === "organizer") {
    currentMenu = organizerMenu;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/dashboard">
                <LayersIcon className="!size-5" />
                <span className="text-base font-semibold">
                  Event Managment.
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={currentMenu} currentPath={location.pathname} />
        {/* Check Live Role for Admin Menu */}
        {roleName === "admin" && (
          <>
            <NavDocuments items={documents} />
            <NavSecondary items={navSecondary} className="mt-auto" />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        {/* Pass the LIVE user data to the footer */}
        <NavUser user={liveUser} />
      </SidebarFooter>
    </Sidebar>
  );
}

// --- Sub Components ---

function NavMain({
  items,
  currentPath,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
  currentPath: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Event Management</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={currentPath === item.url}
              >
                <Link to={item.url}>
                  {React.createElement(item.icon)}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NavDocuments({
  items,
}: {
  items: {
    name: string;
    url: string;
  }[];
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>User Management</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            {item.name === "Add User" ? (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <SidebarMenuButton>
                    <DatabaseIcon />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </DialogTrigger>
                <AddUser setOpen={setIsDialogOpen} isOpen={isDialogOpen} />
              </Dialog>
            ) : (
              <SidebarMenuButton asChild>
                <Link to={item.url}>
                  <DatabaseIcon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>Event Form Settings</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link to={item.url}>
                  <SettingsIcon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = React.useState(false);

  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  const editProfile = () => {
    navigate("/profile");
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
                <MoreVerticalIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side="right"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">
                      {user.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={editProfile}
                  className="cursor-pointer"
                >
                  <UserCircleIcon />
                  Account
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsLogoutOpen(true)}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AlertDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}