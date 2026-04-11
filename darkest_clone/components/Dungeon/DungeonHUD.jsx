import { jsx } from "react/jsx-runtime";
import React from "react";
import { useGameStore } from "../../state/GameState.jsx";
function DungeonHUD({ onToggleMap }) {
  const lightLevel = useGameStore((state) => state.lightLevel);
  return /* @__PURE__ */ jsx("div", { className: "dungeon-hud", children: [
    /* @__PURE__ */ jsx("button", { onClick: onToggleMap, className: "map-button", children: "Map" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 9,
      columnNumber: 14
    }, this),
    /* @__PURE__ */ jsx("div", { className: "light-meter", children: [
      /* @__PURE__ */ jsx("div", { className: "light-meter-icon", children: "\u{1F56F}\uFE0F" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsx("div", { className: "light-bar-bg", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: "light-bar-fg",
          style: { width: `${lightLevel}%` }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 13,
          columnNumber: 21
        },
        this
      ) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 10,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 8,
    columnNumber: 9
  }, this);
}
export {
  DungeonHUD as default
};

