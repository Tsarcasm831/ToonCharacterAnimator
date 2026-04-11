import { supabase, isSupabaseEnabled } from "@/lib/supabase";
import { PlayerConfig } from "@/types";
import { InventoryItem } from "@/types";
import { Quest } from "@/types";

export type SavedPlayerState = {
  coins: number;
  config: PlayerConfig;
};

export type SavedInventoryState = {
  inventory: (InventoryItem | null)[];
  equipmentSlots: Record<string, string | null>;
};

export type SavedQuestState = {
  quests: Quest[];
};

export type GameSaveData = {
  version: number;
  playerState: SavedPlayerState;
  inventoryState: SavedInventoryState;
  questState: SavedQuestState;
};

export type GameSaveRow = {
  id: string;
  user_id: string;
  slot_name: string;
  version: number;
  save_data: GameSaveData;
  created_at: string;
  updated_at: string;
};

export async function loadGameSave(slotName = "main"): Promise<GameSaveRow | null> {
  if (!isSupabaseEnabled) return null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("game_saves")
    .select("*")
    .eq("user_id", user.id)
    .eq("slot_name", slotName)
    .maybeSingle();

  if (error) throw error;
  return data as GameSaveRow | null;
}

export async function saveGame(slotName: string, saveData: GameSaveData): Promise<GameSaveRow> {
  if (!isSupabaseEnabled) throw new Error("Supabase is not configured");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("game_saves")
    .upsert(
      {
        user_id: user.id,
        slot_name: slotName,
        version: saveData.version,
        save_data: saveData,
      },
      { onConflict: "user_id,slot_name" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as GameSaveRow;
}