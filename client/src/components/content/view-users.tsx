"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRealTime } from "@/hooks/use-real-time"; // <--- 1. IMPORT THIS

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";

export type User = {
  _id: string;
  username: string;
  email: string;
  role: {
    _id: string;
    name: string;
  };
};

export type RoleOption = {
  _id: string;
  name: string;
};

export function ViewUsers() {
  const { user: currentUser } = useAuth();
  const [data, setData] = React.useState<User[]>([]);
  const [roleOptions, setRoleOptions] = React.useState<RoleOption[]>([]);
  const [loading, setLoading] = React.useState(true);

  //DIALOG STATE
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [alertError, setAlertError] = React.useState<string | null>(null);

  // Table State
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // --- 2. WRAP FETCHDATA IN USECALLBACK ---
  // This prevents the function from being recreated every render,
  // keeping the socket connection stable.
  const fetchData = React.useCallback(async () => {
    try {
      // Don't set loading(true) here, or the UI will flash on every update
      const [usersRes, rolesRes] = await Promise.all([
        fetch("http://localhost:5000/users"),
        fetch("http://localhost:5000/api/roles"),
      ]);

      if (!usersRes.ok || !rolesRes.ok) throw new Error("Failed to fetch data");

      const users = await usersRes.json();
      const roles = await rolesRes.json();

      setData(users);
      setRoleOptions(roles);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means it's created once

  // Initial Load
  React.useEffect(() => {
    setLoading(true); // Only show spinner on first mount
    fetchData();
  }, [fetchData]);

  // --- 3. ACTIVATE REAL-TIME UPDATES ---
  // Whenever the server says "user_update", fetchData runs automatically.
  useRealTime("user_update", fetchData);

  // --- HANDLERS ---
  const handleRoleChange = async (userId: string, newRoleName: string) => {
    try {
      const res = await fetch(`http://localhost:5000/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleName: newRoleName }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`User role updated to ${newRoleName}`);
        // No need to manually call fetchData() here anymore!
        // The socket will trigger it automatically.
      } else {
        setAlertError(data.message || "Failed to update role");
      }
    } catch (error) {
      toast.error("Server error");
    }
  };

  // --- DELETE LOGIC ---
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`http://localhost:5000/users/${deleteId}`, {
        method: "DELETE",
      });

      const responseData = await res.json();

      if (res.ok) {
        toast.success("User deleted successfully");
        // No need to manually call fetchData()
        setDeleteId(null);
      } else {
        setDeleteId(null);
        setAlertError(responseData.message || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Server connection error");
      setDeleteId(null);
    }
  };

  const columns = React.useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "_id",
        header: "ID",
        cell: ({ row }) => (
          <div className="w-[80px] truncate font-mono text-xs mx-auto">
            {row.getValue("_id")}
          </div>
        ),
      },
      {
        accessorKey: "username",
        header: "Name",
        cell: ({ row }) => (
          <div className="font-medium capitalize">
            {row.getValue("username")}
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Email
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="lowercase">{row.getValue("email")}</div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const roleName = row.original.role?.name || "No Role";
          const colors: Record<string, string> = {
            admin: "bg-purple-100 text-purple-800",
            organizer: "bg-blue-100 text-blue-800",
            member: "bg-green-100 text-green-800",
          };
          const badgeClass = colors[roleName] || "bg-gray-100 text-gray-800";

          return (
            <div
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${badgeClass}`}
            >
              {roleName}
            </div>
          );
        },
        filterFn: (row, _id, value) => {
          const roleName = row.original.role?.name;
          return value === "all" ? true : roleName === value;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        header: "Actions",
        cell: ({ row }) => {
          const userRow = row.original;
          const currentRole = userRow.role?.name;
          const isSelf = currentUser?.id === userRow._id;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(userRow._id)}
                >
                  Copy User ID
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isSelf}>
                    {isSelf ? (
                      <span className="text-muted-foreground">
                        Cannot Change Own Role
                      </span>
                    ) : (
                      <>Change Role</>
                    )}
                  </DropdownMenuSubTrigger>
                  {!isSelf && (
                    <DropdownMenuSubContent>
                      {roleOptions.length > 0 ? (
                        roleOptions.map((role) => (
                          <DropdownMenuItem
                            key={role._id}
                            disabled={role.name === currentRole}
                            onClick={() =>
                              handleRoleChange(userRow._id, role.name)
                            }
                            className="capitalize"
                          >
                            {role.name === currentRole && "✓ "}
                            {role.name}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled>
                          Loading roles...
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuSubContent>
                  )}
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  disabled={isSelf}
                  onClick={() => setDeleteId(userRow._id)}
                >
                  Delete User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [roleOptions, currentUser]
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    autoResetPageIndex: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (loading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full px-16">
      {/* 1. CONFIRMATION DIALOG (Standard Delete) */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 2. ERROR DIALOG */}
      <AlertDialog
        open={!!alertError}
        onOpenChange={(open) => !open && setAlertError(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Action Blocked
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

      {/* --- TABLE CONTROLS --- */}
      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <Select
          onValueChange={(value) =>
            table
              .getColumn("role")
              ?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roleOptions.map((role) => (
              <SelectItem
                key={role._id}
                value={role.name}
                className="capitalize"
              >
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-center">
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
                    <TableCell key={cell.id} className="text-center">
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
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
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
