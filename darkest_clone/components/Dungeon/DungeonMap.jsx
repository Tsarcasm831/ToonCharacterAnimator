import { jsx } from "react/jsx-runtime";
import React from "react";
import { useGameStore } from "../../state/GameState.jsx";
import { useShallow } from "zustand/react/shallow";
import { useDungeonNavigation } from "../../hooks/useDungeonNavigation.js";
import RoomNode from "./RoomNode.jsx";
function DungeonMap({ onRoomSelect }) {
  const { dungeon, currentRoomId } = useGameStore(useShallow((state) => ({
    dungeon: state.dungeon,
    currentRoomId: state.currentRoomId
  })));
  const { handleMoveTo, getConnections } = useDungeonNavigation();
  if (!dungeon) return /* @__PURE__ */ jsx("div", { children: "No dungeon loaded." }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 14,
    columnNumber: 26
  }, this);
  const handleNodeClick = (roomId) => {
    handleMoveTo(roomId);
    if (onRoomSelect) {
      onRoomSelect(roomId);
    }
  };
  const gridWidth = Math.max(...dungeon.rooms.map((r) => r.x)) + 1;
  const gridHeight = Math.max(...dungeon.rooms.map((r) => r.y)) + 1;
  const connections = getConnections(currentRoomId);
  return /* @__PURE__ */ jsx("div", { className: "dungeon-map-container", children: /* @__PURE__ */ jsx(
    "div",
    {
      className: "dungeon-map",
      style: {
        gridTemplateColumns: `repeat(${gridWidth}, auto)`,
        gridTemplateRows: `repeat(${gridHeight}, auto)`
      },
      children: dungeon.rooms.map((room) => /* @__PURE__ */ jsx(
        RoomNode,
        {
          room,
          isCurrent: room.id === currentRoomId,
          isAdjacent: connections.includes(room.id) && room.id !== currentRoomId,
          onClick: handleNodeClick
        },
        room.id,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 38,
          columnNumber: 21
        },
        this
      ))
    },
    void 0,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 30,
      columnNumber: 13
    },
    this
  ) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 29,
    columnNumber: 9
  }, this);
}
export {
  DungeonMap as default
};

