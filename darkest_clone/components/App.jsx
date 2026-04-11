import { jsx } from "react/jsx-runtime";
import React from "react";
import CombatScreen from "../screens/CombatScreen.jsx";
import DungeonScreen from "../screens/DungeonScreen.jsx";
import MenuScreen from "../screens/MenuScreen.jsx";
import { useGameStore } from "../state/GameState.jsx";
function App() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const renderContent = () => {
    switch (gamePhase) {
      case "menu":
        return /* @__PURE__ */ jsx(MenuScreen, {}, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 13,
          columnNumber: 24
        }, this);
      case "loading":
        return /* @__PURE__ */ jsx("div", { className: "loading-screen", children: /* @__PURE__ */ jsx("h1", { children: "The walls are shifting..." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 57
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 25
        }, this);
      case "dungeon":
        return /* @__PURE__ */ jsx(DungeonScreen, {}, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 17,
          columnNumber: 24
        }, this);
      case "combat":
        return /* @__PURE__ */ jsx(CombatScreen, {}, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 19,
          columnNumber: 24
        }, this);
      default:
        return /* @__PURE__ */ jsx("div", { className: "loading-screen", children: /* @__PURE__ */ jsx("h1", { children: "Lost in the darkness..." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 21,
          columnNumber: 56
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 21,
          columnNumber: 24
        }, this);
    }
  };
  return /* @__PURE__ */ jsx("main", { children: renderContent() }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 26,
    columnNumber: 9
  }, this);
}
export {
  App as default
};

