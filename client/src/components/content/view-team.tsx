"use client";

import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import { useAuth } from "@/hooks/use-auth";
import { useRealTime } from "@/hooks/use-real-time"; // <--- 1. IMPORT THIS
import {
  Loader2,
  Crown,
  User as UserIcon,
  Mail,
  Shield,
  CalendarDays,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// 1. Define Types
type AuthUser = {
  id: string;
  username: string;
  email: string;
  teamId?: string;
};

type TeamMember = {
  _id: string;
  username: string;
  email: string;
  role: string;
};

type TeamData = {
  _id: string;
  name: string;
  description: string;
  organizer: TeamMember;
  members: TeamMember[];
  createdAt: string;
};

export default function ViewTeamPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const currentUser = user as unknown as AuthUser;

  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 2. DEFINE FETCH FUNCTION (Stable Callback) ---
  const fetchFreshData = useCallback(async () => {
    if (!userId) return;

    try {
      // 1. Fetch FRESH User Data to get current teamId
      const userRes = await api.get(`/users/${userId}`);
      const freshUser = userRes.data;

      // 2. Check if the fresh user has a team
      if (!freshUser.teamId) {
        setTeam(null); // Clear team data if removed
        setLoading(false);
        return;
      }

      // 3. Fetch Team Details
      const teamRes = await api.get(`/teams/${freshUser.teamId}`);
      setTeam(teamRes.data);
    } catch (error) {
      console.error("Error fetching team data:", error);
      // Optional: Don't toast on every background refresh, only on initial load error if needed
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // --- 3. INITIAL LOAD ---
  useEffect(() => {
    setLoading(true);
    fetchFreshData();
  }, [fetchFreshData]);

  // --- 4. REAL-TIME LISTENERS ---
  // Update if the Team itself changes (name/desc)
  useRealTime("team_update", fetchFreshData);
  // Update if Users change (someone added/removed/role changed)
  useRealTime("user_update", fetchFreshData);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="p-4 bg-muted rounded-full">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">No Team Found</h3>
        <p className="text-muted-foreground text-center max-w-md">
          You are not currently assigned to any team. Please contact an
          administrator or create a new team if you have permission.
        </p>
      </div>
    );
  }

  // Combine organizer and members
  const allMembers = [
    { ...team.organizer, role: "organizer" },
    ...team.members.map((m) => ({ ...m, role: "member" })),
  ];

  return (
    <div className="p-8 w-full max-w-6xl mx-auto space-y-8">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950 border-blue-100 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {team.name}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-background text-blue-600 border-blue-200"
                >
                  Active Team
                </Badge>
              </div>
              <CardDescription className="text-base text-blue-700/80 dark:text-blue-200/60 mt-2">
                {team.description || "No description provided for this team."}
              </CardDescription>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-background/50 p-2 rounded-md border">
              <CalendarDays className="h-4 w-4" />
              <span>
                Created: {new Date(team.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Team Roster Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Roster
          </CardTitle>
          <CardDescription>
            A list of all active members in <strong>{team.name}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allMembers.map((member) => {
                const isOrganizer = member._id === team.organizer._id;
                const isMe = currentUser?.id === member._id;

                return (
                  <TableRow
                    key={member._id}
                    className={isMe ? "bg-muted/30" : ""}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar
                          className={`h-9 w-9 border-2 ${
                            isOrganizer
                              ? "border-yellow-400"
                              : "border-transparent"
                          }`}
                        >
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.username}`}
                          />
                          <AvatarFallback>{member.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2">
                            {member.username}
                            {isMe && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-4 px-1"
                              >
                                You
                              </Badge>
                            )}
                          </span>
                          {isOrganizer && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-500 font-medium flex items-center gap-1">
                              <Crown className="h-3 w-3" /> Team Lead
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 opacity-50" />
                        {member.email}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {isOrganizer ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          <Shield className="h-3 w-3" />
                          Organizer
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                          <UserIcon className="h-3 w-3" />
                          Member
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
