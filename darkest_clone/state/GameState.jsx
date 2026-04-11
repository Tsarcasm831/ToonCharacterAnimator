import { create } from "zustand";
import { createGameSlice } from "./gameSlice.js";
import { createDungeonSlice } from "./dungeonSlice.js";
import { createCombatSlice } from "./combatSlice.js";
import { createUiSlice } from "./uiSlice.js";
const useGameStore = create((set, get) => ({
  ...createGameSlice(set, get),
  ...createDungeonSlice(set, get),
  ...createCombatSlice(set, get),
  ...createUiSlice(set, get)
}));
export {
  useGameStore
};
