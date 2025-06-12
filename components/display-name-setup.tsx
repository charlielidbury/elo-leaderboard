"use client";

import { useState, useEffect } from "react";
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
  onOpenChange?: (open: boolean) => void;
  initialValue?: string;
  title?: string;
  description?: string;
  isEdit?: boolean;
}

export function DisplayNameSetup({
  isOpen,
  onComplete,
  onOpenChange,
  initialValue = "",
  title = "Welcome to ELO Leaderboard!",
  description = "Let's set up your profile. Choose a display name that other players will see.",
  isEdit = false,
}: DisplayNameSetupProps) {
  const [displayName, setDisplayName] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  // Update displayName when initialValue changes
  useEffect(() => {
    setDisplayName(initialValue);
  }, [initialValue]);

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

    if (success && isEdit && onOpenChange) {
      // For edit mode, close the dialog on success
      onOpenChange(false);
    } else if (!isEdit) {
      // For new profile creation, show success toast and clear form
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
    }

    setLoading(false);
  };

  return (
    <Dialog
      open={isOpen}
      modal
      onOpenChange={isEdit && onOpenChange ? onOpenChange : undefined}
    >
      <DialogContent
        className="sm:max-w-md"
        // For edit mode, allow closing. For setup mode, prevent closing.
        onPointerDownOutside={isEdit ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={isEdit ? undefined : (e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
            {loading
              ? isEdit
                ? "Updating..."
                : "Creating Profile..."
              : isEdit
              ? "Update Name"
              : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
