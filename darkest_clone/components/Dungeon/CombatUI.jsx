import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { useGameStore } from "../../state/GameState.jsx";
import { useTurnSystem } from "../../hooks/useTurnSystem.js";
import { useCombatLogic } from "../../hooks/useCombatLogic.js";
function CombatUI() {
  const { combatLog, _killAllEnemies } = useGameStore((state) => ({
    combatLog: state.combatLog,
    _killAllEnemies: state._killAllEnemies
  }));
  const { activeCharacter, isPlayerTurn, combatState } = useTurnSystem();
  const { selectedSkill, isMoving, handleSelectSkill, handleMoveButtonClick } = useCombatLogic();
  const getTurnText = () => {
    if (combatState !== "ongoing") return "Combat Over";
    if (!activeCharacter) return "Determining turn...";
    return `${activeCharacter.name}'s Turn`;
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "combat-ui", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "turn-tracker", children: /* @__PURE__ */ jsxDEV("h2", { children: getTurnText() }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 23,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 22,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "action-bar", children: [
      /* @__PURE__ */ jsxDEV("h3", { children: "Actions" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 27,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "skills", children: [
        isPlayerTurn && activeCharacter && /* @__PURE__ */ jsxDEV(Fragment, { children: [
          activeCharacter.skills.map((skill) => /* @__PURE__ */ jsxDEV(
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
          /* @__PURE__ */ jsxDEV(
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
          /* @__PURE__ */ jsxDEV(
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
        !isPlayerTurn && combatState === "ongoing" && /* @__PURE__ */ jsxDEV("p", { children: "Awaiting enemy action..." }, void 0, false, {
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
    /* @__PURE__ */ jsxDEV("div", { className: "combat-log", children: [
      /* @__PURE__ */ jsxDEV("h3", { children: "Log" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 63,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("ul", { children: combatLog.slice(0, 10).map((msg, index) => /* @__PURE__ */ jsxDEV("li", { children: msg }, index, false, {
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
