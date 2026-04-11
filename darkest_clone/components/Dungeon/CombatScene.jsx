import { Fragment, jsx } from "react/jsx-runtime";
import React from "react";
import { useGameStore } from "../../state/GameState.jsx";
import { useShallow } from "zustand/react/shallow";
import { useCombatLogic } from "../../hooks/useCombatLogic.js";
import { useTurnSystem } from "../../hooks/useTurnSystem.js";
const reverseHeroOrder = false;
const Character = ({ char, isActive, onTarget, isTargetable, onInfoClick, isShuddering }) => {
  const hpPercentage = char.maxHp > 0 ? char.hp / char.maxHp * 100 : 0;
  const stressPercentage = char.type === "hero" && char.maxStress > 0 ? char.stress / char.maxStress * 100 : 0;
  const isDead = char.hp <= 0;
  const getCharacterClass = () => {
    let classes = `character ${char.type}`;
    if (isActive) classes += " active";
    if (isTargetable) classes += " targetable";
    if (isDead) {
      classes += " dead";
      if (char.corpseImage) {
        classes += " has-corpse";
      }
    }
    if (!isTargetable && !isDead) classes += " info-clickable";
    return classes;
  };
  const handleClick = () => {
    if (isTargetable) {
      onTarget(char.combatId);
    } else if (onInfoClick && !isDead) {
      onInfoClick(char.combatId);
    }
  };
  const imageSrc = isDead && char.corpseImage ? char.corpseImage : char.image;
  const shudderVariants = {
    idle: { x: 0 },
    shudder: {
      x: [-1, 1, -1, 1, -1, 1, 0].map((x) => x * 5),
      transition: { duration: 0.3 }
    }
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: getCharacterClass(),
      onClick: handleClick,
      children: [
        char.affliction && !isDead && /* @__PURE__ */ jsx("div", { className: "affliction-text", children: char.affliction }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 55,
          columnNumber: 44
        }),
        /* @__PURE__ */ jsx("div", { className: "character-name", children: char.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 56,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsx("img", { src: imageSrc, alt: char.name, className: "character-sprite" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 57,
          columnNumber: 13
        }),
        !isDead && /* @__PURE__ */ jsx(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "character-info-bars", children: [
            /* @__PURE__ */ jsx("div", { className: "health-bar-bg", children: /* @__PURE__ */ jsx("div", { className: "health-bar-fg", style: { width: `${hpPercentage}%` } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 62,
              columnNumber: 29
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 61,
              columnNumber: 25
            }),
            char.type === "hero" && /* @__PURE__ */ jsx("div", { className: "stress-bar-bg", children: /* @__PURE__ */ jsx("div", { className: "stress-bar-fg", style: { width: `${stressPercentage}%` } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 66,
              columnNumber: 33
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 65,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 60,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsx("div", { className: "hp-text", children: [
            char.hp,
            " / ",
            char.maxHp
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 70,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 59,
          columnNumber: 17
        })
      ]
    },
    void 0,
    true,
    {
      fileName: "<stdin>",
      lineNumber: 49,
      columnNumber: 10
    }
  );
};
function CombatScene() {
  const { heroes, enemies, setCharacterModalId, attackAnimation } = useGameStore(useShallow((state) => ({
    heroes: state.heroes,
    enemies: state.enemies,
    setCharacterModalId: state.setCharacterModalId,
    attackAnimation: state.attackAnimation
  })));
  const { activeCharacter, isPlayerTurn } = useTurnSystem();
  const { selectedSkill, isMoving, handleTargetSelect } = useCombatLogic();
  const isTargetable = (character) => {
    if (!isPlayerTurn) return false;
    if (character.hp <= 0) return false;
    if (isMoving) {
      return character.type === "hero" && character.combatId !== activeCharacter.combatId;
    }
    if (!selectedSkill) return false;
    if (selectedSkill.target === "enemy" && character.type === "enemy") return true;
    if (selectedSkill.target === "hero" && character.type === "hero") {
      if (selectedSkill.heal && character.hp === character.maxHp) return false;
      if (selectedSkill.stress_damage && character.affliction) return false;
      return true;
    }
    return false;
  };
  const handleInfoClick = (characterId) => {
    if (isPlayerTurn || !isPlayerTurn) {
      setCharacterModalId(characterId);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "combat-scene", children: [
    /* @__PURE__ */ jsx("div", { className: "party", children: [...heroes].sort((a, b) => reverseHeroOrder ? b.position - a.position : a.position - b.position).map((hero) => /* @__PURE__ */ jsx(
      Character,
      {
        char: hero,
        isActive: activeCharacter?.combatId === hero.combatId,
        onTarget: handleTargetSelect,
        isTargetable: isTargetable(hero),
        onInfoClick: handleInfoClick,
        isShuddering: attackAnimation?.targetId === hero.combatId
      },
      hero.combatId,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 124,
        columnNumber: 21
      },
      this
    )) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 120,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsx("div", { className: "enemies", children: [...enemies].sort((a, b) => a.position - b.position).map((enemy) => /* @__PURE__ */ jsx(
      Character,
      {
        char: enemy,
        isActive: activeCharacter?.combatId === enemy.combatId,
        onTarget: handleTargetSelect,
        isTargetable: isTargetable(enemy),
        onInfoClick: handleInfoClick,
        isShuddering: attackAnimation?.targetId === enemy.combatId
      },
      enemy.combatId,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 137,
        columnNumber: 21
      },
      this
    )) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 135,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 119,
    columnNumber: 9
  }, this);
}
export {
  CombatScene as default
};

