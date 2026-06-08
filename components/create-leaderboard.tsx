"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLeaderboardMutation } from "@/lib/backend";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { LoginButton } from "@/components/login-button";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreateLeaderboard() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const createMut = useMutation({
    ...createLeaderboardMutation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leaderboards"] });
      toast({
        title: "Leaderboard created!",
        description: `"${data.name}" is ready to go.`,
      });
      router.push(`/leaderboard/${data.slug}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create leaderboard",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground text-lg text-center">
          Must be logged in to create a leaderboard
        </p>
        <LoginButton full />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    createMut.mutate({
      name: name.trim(),
      slug: slug.trim(),
      created_by: user.id,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="lb-name">Leaderboard Name</Label>
        <Input
          id="lb-name"
          placeholder="e.g. Office Ping Pong"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugManuallyEdited) {
              setSlug(slugify(e.target.value));
            }
          }}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lb-slug">URL Slug</Label>
        <Input
          id="lb-slug"
          placeholder="e.g. office-ping-pong"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugManuallyEdited(true);
          }}
          required
        />
        <p className="text-xs text-muted-foreground">
          Your leaderboard will be at /leaderboard/{slug || "..."}
        </p>
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={createMut.isPending}
      >
        {createMut.isPending ? "Creating..." : "Create Leaderboard"}
      </Button>
    </form>
  );
}
