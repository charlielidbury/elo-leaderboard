import { createClient } from "@supabase/supabase-js";
import { Database } from "../database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Export types for use in components
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type GameResult = Database["public"]["Tables"]["games"]["Row"] & {
  player1?: Player;
  player2?: Player;
  winner?: Player;
};

export type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];
export type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
