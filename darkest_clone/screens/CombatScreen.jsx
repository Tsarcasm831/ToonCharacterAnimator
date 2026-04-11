import { jsx } from "react/jsx-runtime";
import React from "react";
import { useGameStore } from "../state/GameState.jsx";
import { useShallow } from "zustand/react/shallow";
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
  } = useGameStore(useShallow((state) => ({
    combatState: state.combatState,
    characterModalId: state.characterModalId,
    setCharacterModalId: state.setCharacterModalId,
    heroes: state.heroes,
    enemies: state.enemies,
    endCombat: state.endCombat
  })));
  const handleProceed = () => {
    endCombat();
  };
  const handleRestart = () => {
    window.location.reload();
  };
  const characterForModal = characterModalId ? [...heroes, ...enemies].find((c) => c.combatId === characterModalId) : null;
  return /* @__PURE__ */ jsx("div", { className: "combat-screen", children: [
    /* @__PURE__ */ jsx(CombatScene, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 40,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsx(CombatUI, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 41,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsx(AttackAnimation, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 42,
      columnNumber: 13
    }, this),
    combatState !== "ongoing" && /* @__PURE__ */ jsx("div", { className: "combat-overlay", children: /* @__PURE__ */ jsx("div", { className: "combat-result-popup", children: [
      /* @__PURE__ */ jsx("h1", { children: combatState === "victory" ? "Victory Achieved" : "A Fateful Defeat" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 46,
        columnNumber: 25
      }, this),
      /* @__PURE__ */ jsx("p", { children: combatState === "victory" ? "The fiends are vanquished... for now." : "Ruin has come to our family." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 47,
        columnNumber: 25
      }, this),
      combatState === "victory" ? /* @__PURE__ */ jsx("button", { onClick: handleProceed, children: "Proceed" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 49,
        columnNumber: 30
      }, this) : /* @__PURE__ */ jsx("button", { onClick: handleRestart, children: "Try Again" }, void 0, false, {
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
    characterForModal && /* @__PURE__ */ jsx(
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

