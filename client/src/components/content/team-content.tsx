"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Edit, MoreHorizontal, ChevronDown, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import CreateTeam from "./create-team";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Import Table Utilities
import {
  type ColumnDef,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

// Define Types
type Team = {
  _id: string;
  name: string;
  description: string;
  members: {
    _id: string;
    username: string;
    email: string;
    role: string;
  }[];
  createdBy: {
    _id: string;
    username: string;
  };
  createdAt: string;
};

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Table State
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    fetchTeams();
  }, [isDialogOpen]);

  const fetchTeams = async () => {
    try {
      const res = await fetch("http://localhost:5000/teams");
      const data = await res.json();
      if (res.ok) setTeams(data);
    } catch (error) {
      toast.error("Failed to load teams");
    }
  };

  // Define Columns (Memoized to access 'user' scope for Owner check)
  const columns = useMemo<ColumnDef<Team>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Team Name",
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="text-muted-foreground truncate max-w-[300px]">
            {row.getValue("description") || "—"}
          </div>
        ),
      },
      {
        accessorKey: "members",
        header: "Members",
        cell: ({ row }) => {
          const members = row.original.members;
          return (
            <div className="flex items-center -space-x-3">
              {members.slice(0, 5).map((member) => (
                <Avatar key={member._id} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.username}`} />
                  <AvatarFallback>{member.username.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
              {members.length > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium z-10">
                  +{members.length - 5}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "createdBy", // Accessing the object to display username
        header: "Created By",
        cell: ({ row }) => {
          const creator = row.original.createdBy;
          return (
            <Badge variant="outline" className="font-normal">
              {creator?.username || "Unknown"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: ({ column }) => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const team = row.original;
          const isOwner = user?.id === team.createdBy?._id;

          return (
            <div className="text-right">
              {isOwner ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => alert("Edit Coming Soon")}>
                      Edit Team
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => alert("Delete Coming Soon")}>
                      Delete Team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="text-xs text-muted-foreground italic">View Only</span>
              )}
            </div>
          );
        },
      },
    ],
    [user] // Re-render columns if user changes
  );

  const table = useReactTable({
    data: teams,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className="p-8 w-full space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization's teams and members.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create New Team
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px] overflow-y-auto p-8 [&>button]:hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Create Team</DialogTitle>
              <DialogDescription>
                Fill out the form below to create a new team.
              </DialogDescription>
            </DialogHeader>
            <CreateTeam setOpen={setIsDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

      {/* --- FILTER & COLUMN VISIBILITY BAR --- */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter teams by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id === "name" ? "Team Name" : column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- TABLE --- */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No teams found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- PAGINATION CONTROLS --- */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}