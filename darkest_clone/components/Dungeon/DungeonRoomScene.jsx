import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { useGameStore } from "../../state/GameState.jsx";
import { motion } from "framer-motion";
import Curio from "./Curio.jsx";
import RoomNavigation from "./RoomNavigation.jsx";
const getRoomBackground = (room) => {
  if (!room) return "url(./assets/images/backgrounds/corridor.png)";
  if (room.isStart) return "url(./assets/images/backgrounds/start-room.png)";
  if (room.hasBoss) return "url(./assets/images/backgrounds/boss-room.png)";
  if (room.hasCombat) return "url(./assets/images/backgrounds/combat-background.png)";
  if (room.hasTrap) return "url(./assets/images/backgrounds/trap-room.png)";
  if (room.hasCurio) return "url(./assets/images/backgrounds/curio-room.png)";
  return "url(./assets/images/backgrounds/corridor.png)";
};
const PartyMember = ({ char, onClick }) => {
  return /* @__PURE__ */ jsxDEV(
    motion.div,
    {
      className: "character hero info-clickable",
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0, transition: { delay: char.position * 0.1 } },
      exit: { opacity: 0 },
      onClick: () => onClick(char.combatId),
      children: /* @__PURE__ */ jsxDEV("img", { src: char.image, alt: char.name, className: "character-sprite" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 28,
        columnNumber: 13
      })
    },
    void 0,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 21,
      columnNumber: 9
    }
  );
};
function DungeonRoomScene() {
  const {
    heroes,
    dungeon,
    currentRoomId,
    setCharacterModalId,
    interactWithCurio,
    moveToRoom
  } = useGameStore((state) => ({
    heroes: state.heroes,
    dungeon: state.dungeon,
    currentRoomId: state.currentRoomId,
    setCharacterModalId: state.setCharacterModalId,
    interactWithCurio: state.interactWithCurio,
    moveToRoom: state.moveToRoom
  }));
  const currentRoom = dungeon.rooms.find((r) => r.id === currentRoomId);
  const backgroundImage = getRoomBackground(currentRoom);
  const livingHeroes = heroes.filter((h) => h.hp > 0);
  const handleCharacterClick = (id) => {
    setCharacterModalId(id);
  };
  const handleCurioClick = () => {
    interactWithCurio(currentRoomId);
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "dungeon-room-scene", style: { backgroundImage }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "party-view", children: livingHeroes.sort((a, b) => a.position - b.position).map((hero) => /* @__PURE__ */ jsxDEV(PartyMember, { char: hero, onClick: handleCharacterClick }, hero.combatId, false, {
      fileName: "<stdin>",
      lineNumber: 69,
      columnNumber: 25
    }, this)) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 65,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(
      RoomNavigation,
      {
        dungeon,
        currentRoomId,
        onMove: moveToRoom
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 73,
        columnNumber: 13
      },
      this
    ),
    currentRoom && currentRoom.hasCurio && !currentRoom.curioInteracted && /* @__PURE__ */ jsxDEV(Curio, { onClick: handleCurioClick }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 80,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 64,
    columnNumber: 9
  }, this);
}
export {
  DungeonRoomScene as default
};
