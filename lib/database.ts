import { createClient } from "@supabase/supabase-js";
import { Database } from "../database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Export types for use in components
export type UncheckedPlayer = Database["public"]["Tables"]["players"]["Row"];

export type Player = UncheckedPlayer & {
  rating: number;
};

export type UnpopulatedGame = Database["public"]["Tables"]["games"]["Row"];

export type Game = UnpopulatedGame & {
  charlie: Player;
  rushil: Player;
  winner: Player | null;
};
