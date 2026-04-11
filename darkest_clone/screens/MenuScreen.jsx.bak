import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState } from "react";
import { useGameStore } from "../state/GameState.jsx";
import ChangelogModal from "../components/ChangelogModal.jsx";
function MenuScreen() {
  const { startGame, isLoading } = useGameStore((state) => ({
    startGame: state.startGame,
    isLoading: state.isLoading
  }));
  const [isChangelogVisible, setChangelogVisible] = useState(false);
  const handleEmbark = () => {
    if (!isLoading) {
      startGame();
    }
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "menu-screen", children: [
    /* @__PURE__ */ jsxDEV("h1", { children: "Descent into Shadow" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 21,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("p", { className: "subtitle", children: "A perilous journey awaits" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 22,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "menu-buttons", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          className: "embark-button",
          onClick: handleEmbark,
          disabled: isLoading,
          children: isLoading ? "Loading..." : "Embark"
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 24,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("button", { className: "changelog-button", onClick: () => setChangelogVisible(true), children: "Changelog" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 31,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 23,
      columnNumber: 13
    }, this),
    isLoading && /* @__PURE__ */ jsxDEV("p", { className: "loading-text", children: "Assembling your ill-fated party..." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 35,
      columnNumber: 27
    }, this),
    isChangelogVisible && /* @__PURE__ */ jsxDEV(ChangelogModal, { onClose: () => setChangelogVisible(false) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 36,
      columnNumber: 36
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 20,
    columnNumber: 9
  }, this);
}
export {
  MenuScreen as default
};
