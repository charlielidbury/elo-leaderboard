"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { usePlayer } from "@/hooks/use-player";
import { LogOut, User, Edit } from "lucide-react";
import { DisplayNameSetup } from "./display-name-setup";
import { toast } from "@/hooks/use-toast";

export function UserDropdown() {
  const { user, signOut } = useAuth();
  const { player, updatePlayer } = usePlayer();
  const [editNameOpen, setEditNameOpen] = useState(false);

  if (!user) return null;

  const displayName =
    player?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "User";
  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleEditName = async (newName: string): Promise<boolean> => {
    const success = await updatePlayer(newName);
    if (success) {
      toast({
        title: "Name updated!",
        description: "Your display name has been updated successfully.",
      });
    } else {
      toast({
        title: "Update failed",
        description: "Failed to update your name. Please try again.",
        variant: "destructive",
      });
    }
    return success;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditNameOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Name</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DisplayNameSetup
        isOpen={editNameOpen}
        onComplete={handleEditName}
        onOpenChange={setEditNameOpen}
        initialValue={player?.name || ""}
        title="Edit Display Name"
        description="Update your display name that other players will see."
        isEdit={true}
      />
    </>
  );
}
