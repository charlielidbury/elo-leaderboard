"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface DisplayNameSetupProps {
  isOpen: boolean;
  onComplete: (displayName: string) => Promise<boolean>;
}

export function DisplayNameSetup({
  isOpen,
  onComplete,
}: DisplayNameSetupProps) {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a display name",
        variant: "destructive",
      });
      return;
    }

    if (displayName.trim().length < 2) {
      toast({
        title: "Error",
        description: "Display name must be at least 2 characters long",
        variant: "destructive",
      });
      return;
    }

    if (displayName.trim().length > 50) {
      toast({
        title: "Error",
        description: "Display name must be 50 characters or less",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const success = await onComplete(displayName.trim());

    if (success) {
      toast({
        title: "Welcome!",
        description: "Your account has been set up successfully",
      });
      setDisplayName("");
    } else {
      toast({
        title: "Error",
        description: "Failed to create your profile. Please try again.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={isOpen} modal>
      <DialogContent
        className="sm:max-w-md"
        // Prevent closing by clicking outside or pressing escape
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Welcome to ELO Leaderboard!</DialogTitle>
          <DialogDescription>
            Let&apos;s set up your profile. Choose a display name that other
            players will see.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              maxLength={50}
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              This will be displayed alot, so maybe just use a first name.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || !displayName.trim()}
            className="w-full"
          >
            {loading ? "Creating Profile..." : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
