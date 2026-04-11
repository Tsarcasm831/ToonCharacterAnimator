import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { motion } from "framer-motion";
function Curio({ onClick }) {
  return /* @__PURE__ */ jsxDEV(
    motion.div,
    {
      className: "curio-container",
      onClick,
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      whileHover: { scale: 1.1, filter: "drop-shadow(0 0 10px #f0e68c)" },
      children: /* @__PURE__ */ jsxDEV("img", { src: "./assets/images/interactables/chest.png", alt: "Curio", className: "curio-sprite" }, void 0, false, {
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
