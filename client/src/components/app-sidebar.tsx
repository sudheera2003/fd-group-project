import * as React from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
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
  PlusCircleIcon,
  PanelLeftIcon,
  DatabaseIcon,
  SettingsIcon,
  MoreVerticalIcon,
  UserCircleIcon,
  CreditCardIcon,
  BellIcon,
  LogOutIcon,
} from "lucide-react";

import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import AddUser from "./content/register";

// --- Data Arrays ---
const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    id: "dashboard",
  },
  {
    title: "Lifecycle",
    url: "/lifecycle",
    id: "lifecycle",
  },
  {
    title: "Analytics",
    url: "/analytics",
    id: "analytics",
  },
  {
    title: "Projects",
    url: "/projects",
    id: "projects",
  },
  {
    title: "Team",
    url: "/team",
    id: "team",
  },
];

const navSecondary = [
  {
    title: "Settings",
    url: "#",
  },
  {
    title: "Get Help",
    url: "#",
  },
  {
    title: "Search",
    url: "#",
  },
];

const documents = [
  {
    name: "Add User",
    url: "#",
  },
  {
    name: "Delete User",
    url: "#",
  },
  {
    name: "View All Users",
    url: "/viewUsers",
  },
];

// --- Main Component ---
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Use location to highlight the active menu item automatically
  const location = useLocation();
  const { user: authUser } = useAuth();

  const userData = {
    name: authUser?.username || "User",
    email: authUser?.email || "user@example.com",
    avatar: "/avatars/avatar-1.jpg",
  };
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
        <NavMain items={navMain} currentPath={location.pathname} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
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
    id: string;
  }[];
  currentPath: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Event Management</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <PlusCircleIcon />
              <span>New Event</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                // Check if current path starts with the item url for active state
                isActive={currentPath === item.url}
              >
                <Link to={item.url}>
                  <PanelLeftIcon />
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
  // 1. Access the context and router
  const { logout } = useAuth();
  const navigate = useNavigate();

  // 2. Create the handler
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return (
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
              <DropdownMenuItem>
                <UserCircleIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
