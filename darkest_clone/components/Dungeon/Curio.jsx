import { jsx } from "react/jsx-runtime";
import React from "react";
function Curio({ onClick }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "curio-container",
      onClick,
      children: /* @__PURE__ */ jsx("img", { src: "./assets/images/interactables/chest.png", alt: "Curio", className: "curio-sprite" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 13,
        columnNumber: 13
      }, this)
    },
    void 0,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 6,
      columnNumber: 9
    },
    this
  );
}
export {
  Curio as default
};

