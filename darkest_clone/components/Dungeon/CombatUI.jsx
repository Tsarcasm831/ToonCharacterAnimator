import { Fragment, jsx } from "react/jsx-runtime";
import React from "react";
import { useGameStore } from "../../state/GameState.jsx";
import { useShallow } from "zustand/react/shallow";
import { useTurnSystem } from "../../hooks/useTurnSystem.js";
import { useCombatLogic } from "../../hooks/useCombatLogic.js";
function CombatUI() {
  const { combatLog, _killAllEnemies } = useGameStore(useShallow((state) => ({
    combatLog: state.combatLog,
    _killAllEnemies: state._killAllEnemies
  })));
  const { activeCharacter, isPlayerTurn, combatState } = useTurnSystem();
  const { selectedSkill, isMoving, handleSelectSkill, handleMoveButtonClick } = useCombatLogic();
  const getTurnText = () => {
    if (combatState !== "ongoing") return "Combat Over";
    if (!activeCharacter) return "Determining turn...";
    return `${activeCharacter.name}'s Turn`;
  };
  return /* @__PURE__ */ jsx("div", { className: "combat-ui", children: [
    /* @__PURE__ */ jsx("div", { className: "turn-tracker", children: /* @__PURE__ */ jsx("h2", { children: getTurnText() }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 23,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 22,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsx("div", { className: "action-bar", children: [
      /* @__PURE__ */ jsx("h3", { children: "Actions" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 27,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsx("div", { className: "skills", children: [
        isPlayerTurn && activeCharacter && /* @__PURE__ */ jsx(Fragment, { children: [
          activeCharacter.skills.map((skill) => /* @__PURE__ */ jsx(
            "button",
            {
              className: `skill-button ${selectedSkill?.name === skill.name ? "selected" : ""}`,
              onClick: () => handleSelectSkill(skill),
              disabled: combatState !== "ongoing",
              children: skill.name
            },
            skill.name,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 32,
              columnNumber: 33
            },
            this
          )),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: `move-button ${isMoving ? "selected" : ""}`,
              onClick: handleMoveButtonClick,
              disabled: combatState !== "ongoing",
              children: "Move"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 41,
              columnNumber: 30
            },
            this
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              style: { backgroundColor: "#8B0000", borderColor: "#ff4444" },
              className: "dev-button",
              onClick: _killAllEnemies,
              disabled: combatState !== "ongoing",
              children: "Kill All (DEV)"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 48,
              columnNumber: 29
            },
            this
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 30,
          columnNumber: 25
        }, this),
        !isPlayerTurn && combatState === "ongoing" && /* @__PURE__ */ jsx("p", { children: "Awaiting enemy action..." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 58,
          columnNumber: 68
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 28,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 26,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsx("div", { className: "combat-log", children: [
      /* @__PURE__ */ jsx("h3", { children: "Log" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 63,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsx("ul", { children: combatLog.slice(0, 10).map((msg, index) => /* @__PURE__ */ jsx("li", { children: msg }, index, false, {
        fileName: "<stdin>",
        lineNumber: 66,
        columnNumber: 25
      }, this)) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 64,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 62,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 21,
    columnNumber: 9
  }, this);
}
export {
  CombatUI as default
};

