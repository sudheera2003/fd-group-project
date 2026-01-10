"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, MoreHorizontal, ChevronDown, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import CreateTeamForm from "./admin/create-team";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import Alert Dialog
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
  organizer: { _id: string; username: string; email: string };
  members: { _id: string; username: string; email: string; role: string }[];
  createdBy: { _id: string; username: string };
  createdAt: string;
};

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [transferInfo, setTransferInfo] = useState<string | null>(null);

  // --- DELETE STATE ---
  const [deleteId, setDeleteId] = useState<string | null>(null); // Stores ID pending deletion
  const [alertError, setAlertError] = useState<string | null>(null); // Stores error message

  // Table State
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/teams");
      const data = await res.json();
      if (res.ok) setTeams(data);
    } catch (error) {
      toast.error("Failed to load teams");
    }
  };

  // --- DELETE LOGIC ---
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/teams/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Team deleted successfully");
        fetchTeams();
        setDeleteId(null);
      } else {
        // Backend returned error (e.g., Team assigned to Project)
        setDeleteId(null); // Close confirmation dialog
        setAlertError(data.message || "Failed to delete team"); // Open Error Alert
      }
    } catch (error) {
      toast.error("Server connection error");
      setDeleteId(null);
    }
  };

  const handleEdit = (team: Team) => {
    setSelectedTeam(team);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTeam(null);
    setIsDialogOpen(true);
  };

  const handleTeamOperationSuccess = (message?: string) => {
    fetchTeams(); // Reload the table
    setIsDialogOpen(false); // Close the Edit/Create form

    // If the backend/form sent a special message about transfers, show the alert
    if (message) {
      setTransferInfo(message);
    }
  };

  const columns = useMemo<ColumnDef<Team>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Team Name",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
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
        accessorKey: "organizer",
        header: "Organizer",
        cell: ({ row }) => {
          const organizer = row.original.organizer;
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>
                  {organizer?.username?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {organizer?.username || "N/A"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "members",
        header: "Members",
        cell: ({ row }) => {
          const members = row.original.members;
          return (
            <div className="flex items-center -space-x-3">
              {members.slice(0, 5).map((member) => (
                <Avatar
                  key={member._id}
                  className="h-8 w-8 border-2 border-background"
                >
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.username}`}
                  />
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
        accessorKey: "createdBy",
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
        header: ({}) => <div className="text-right">Actions</div>,
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
                    <DropdownMenuItem onClick={() => handleEdit(team)}>
                      Edit Team
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setDeleteId(team._id)} // <--- TRIGGER DELETE
                    >
                      Delete Team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  View Only
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [user]
  );

  const table = useReactTable({
    data: teams,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: { columnFilters, columnVisibility },
  });

  return (
    <div className="p-8 w-full space-y-6">
      {/* 1. CONFIRMATION DIALOG (Standard Delete) */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this team?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All members will be removed from the
              team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 2. ERROR DIALOG (Project Conflict) */}
      <AlertDialog
        open={!!alertError}
        onOpenChange={(open) => !open && setAlertError(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Cannot Delete Team
            </AlertDialogTitle>
            <AlertDialogDescription>{alertError}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertError(null)}>
              Okay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 3. INFO DIALOG (Ownership Transfer Success) */}
      <AlertDialog
        open={!!transferInfo}
        onOpenChange={(open) => !open && setTransferInfo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-600 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Ownership Transferred
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              {transferInfo}
            </AlertDialogDescription>
            <AlertDialogDescription className="text-xs text-muted-foreground mt-2">
              The previous organizer has been removed from these projects, and full access has been granted to the new organizer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setTransferInfo(null)}
            >
              Acknowledged
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Create New Team
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px] overflow-y-auto p-8 [&>button]:hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>
                {selectedTeam ? "Edit Team" : "Create Team"}
              </DialogTitle>
              <DialogDescription>
                {selectedTeam
                  ? "Modify team details below."
                  : "Fill out the form below to create a new team."}
              </DialogDescription>
            </DialogHeader>
            <CreateTeamForm
              setOpen={setIsDialogOpen}
              teamToEdit={selectedTeam}
              onSuccess={handleTeamOperationSuccess}
            />
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
            <Button variant="outline">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id === "name" ? "Team Name" : column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- TABLE --- */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
