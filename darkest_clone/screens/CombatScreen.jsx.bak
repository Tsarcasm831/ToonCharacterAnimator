import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { useGameStore } from "../state/GameState.jsx";
import CombatScene from "../components/Dungeon/CombatScene.jsx";
import CombatUI from "../components/Dungeon/CombatUI.jsx";
import CharacterModal from "../components/Dungeon/CharacterModal.jsx";
import AttackAnimation from "../components/Dungeon/AttackAnimation.jsx";
function CombatScreen() {
  const {
    combatState,
    characterModalId,
    setCharacterModalId,
    heroes,
    enemies,
    endCombat
  } = useGameStore((state) => ({
    combatState: state.combatState,
    characterModalId: state.characterModalId,
    setCharacterModalId: state.setCharacterModalId,
    heroes: state.heroes,
    enemies: state.enemies,
    endCombat: state.endCombat
  }));
  const handleProceed = () => {
    endCombat();
  };
  const handleRestart = () => {
    window.location.reload();
  };
  const characterForModal = characterModalId ? [...heroes, ...enemies].find((c) => c.combatId === characterModalId) : null;
  return /* @__PURE__ */ jsxDEV("div", { className: "combat-screen", children: [
    /* @__PURE__ */ jsxDEV(CombatScene, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 40,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(CombatUI, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 41,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(AttackAnimation, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 42,
      columnNumber: 13
    }, this),
    combatState !== "ongoing" && /* @__PURE__ */ jsxDEV("div", { className: "combat-overlay", children: /* @__PURE__ */ jsxDEV("div", { className: "combat-result-popup", children: [
      /* @__PURE__ */ jsxDEV("h1", { children: combatState === "victory" ? "Victory Achieved" : "A Fateful Defeat" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 46,
        columnNumber: 25
      }, this),
      /* @__PURE__ */ jsxDEV("p", { children: combatState === "victory" ? "The fiends are vanquished... for now." : "Ruin has come to our family." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 47,
        columnNumber: 25
      }, this),
      combatState === "victory" ? /* @__PURE__ */ jsxDEV("button", { onClick: handleProceed, children: "Proceed" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 49,
        columnNumber: 30
      }, this) : /* @__PURE__ */ jsxDEV("button", { onClick: handleRestart, children: "Try Again" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 51,
        columnNumber: 30
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 45,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 44,
      columnNumber: 17
    }, this),
    characterForModal && /* @__PURE__ */ jsxDEV(
      CharacterModal,
      {
        character: characterForModal,
        onClose: () => setCharacterModalId(null)
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 57,
        columnNumber: 17
      },
      this
    )
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 39,
    columnNumber: 9
  }, this);
}
export {
  CombatScreen as default
};
