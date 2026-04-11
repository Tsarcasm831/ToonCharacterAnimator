import { jsx } from "react/jsx-runtime";
import React from "react";
function RoomNavigation({ dungeon, currentRoomId, onMove }) {
  if (!dungeon || !currentRoomId) return null;
  const currentRoom = dungeon.rooms.find((r) => r.id === currentRoomId);
  if (!currentRoom || currentRoom.hasCombat) {
    return null;
  }
  const connections = dungeon.connections[currentRoomId] || [];
  const connectedRooms = connections.map((id) => dungeon.rooms.find((r) => r.id === id));
  const getNavTarget = (direction) => {
    switch (direction) {
      case "up":
        return connectedRooms.find((r) => r.y < currentRoom.y && r.x === currentRoom.x) || connectedRooms.find((r) => r.y < currentRoom.y);
      case "down":
        return connectedRooms.find((r) => r.y > currentRoom.y && r.x === currentRoom.x) || connectedRooms.find((r) => r.y > currentRoom.y);
      case "left":
        return connectedRooms.find((r) => r.x < currentRoom.x && r.y === currentRoom.y) || connectedRooms.find((r) => r.x < currentRoom.x);
      case "right":
        return connectedRooms.find((r) => r.x > currentRoom.x && r.y === currentRoom.y) || connectedRooms.find((r) => r.x > currentRoom.x);
      default:
        return null;
    }
  };
  const nav = {
    up: getNavTarget("up"),
    down: getNavTarget("down"),
    left: getNavTarget("left"),
    right: getNavTarget("right")
  };
  return /* @__PURE__ */ jsx("div", { className: "room-navigation", children: [
    /* @__PURE__ */ jsx("button", { className: "proceed-button", disabled: !nav.up, onClick: () => onMove(nav.up.id), children: "\u25B2" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 38,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsx("div", { children: [
      /* @__PURE__ */ jsx("button", { className: "proceed-button", disabled: !nav.left, onClick: () => onMove(nav.left.id), children: "\u25C4" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 40,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsx("button", { className: "proceed-button", disabled: !nav.down, onClick: () => onMove(nav.down.id), children: "\u25BC" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 41,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsx("button", { className: "proceed-button", disabled: !nav.right, onClick: () => onMove(nav.right.id), children: "\u25BA" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 42,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 39,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 37,
    columnNumber: 9
  }, this);
}
export {
  RoomNavigation as default
};

