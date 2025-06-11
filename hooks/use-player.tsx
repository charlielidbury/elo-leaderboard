"use client";

import { useState, useEffect } from "react";
import { supabase, Player } from "@/lib/database";
import { useAuth } from "./use-auth";

export function usePlayer(): {
  player: Player | null | undefined;
  loading: boolean;
  createPlayer: (displayName: string) => Promise<boolean>;
  refetch: () => Promise<void>;
} {
  const { user } = useAuth();
  const [player, setPlayer] = useState<Player | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchPlayer = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No player found
          setPlayer(null);
        } else {
          console.error("Error fetching player:", error);
        }
      } else {
        // Transform UncheckedPlayer to Player by adding rating property
        const playerWithRating: Player = {
          ...data,
          rating: data.rating_check,
        };
        setPlayer(playerWithRating);
      }
    } catch (error) {
      console.error("Unexpected error fetching player:", error);
    } finally {
      setLoading(false);
    }
  };

  const createPlayer = async (displayName: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from("players")
        .upsert({
          id: user.id,
          name: displayName,
          rating_check: 1000, // Default rating
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating player:", error);
        return false;
      }

      // Update local state with new player
      const playerWithRating: Player = {
        ...data,
        rating: data.rating_check,
      };
      setPlayer(playerWithRating);
      return true;
    } catch (error) {
      console.error("Unexpected error creating player:", error);
      return false;
    }
  };

  const refetch = async () => {
    await fetchPlayer();
  };

  useEffect(() => {
    fetchPlayer();
  }, [user]);

  return {
    player,
    loading,
    createPlayer,
    refetch,
  };
}
