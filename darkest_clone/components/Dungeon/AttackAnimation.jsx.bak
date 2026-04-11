import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { useGameStore } from "../../state/GameState.jsx";
import { motion, AnimatePresence } from "framer-motion";
function AttackAnimation() {
  const { attackAnimation, setAttackAnimation } = useGameStore((state) => ({
    attackAnimation: state.attackAnimation,
    setAttackAnimation: state.setAttackAnimation
  }));
  const onAnimationComplete = () => {
    setAttackAnimation(null);
  };
  return /* @__PURE__ */ jsxDEV(AnimatePresence, { children: attackAnimation && attackAnimation.attacker && /* @__PURE__ */ jsxDEV(
    motion.div,
    {
      className: "attack-animation-overlay",
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.2 } },
      exit: { opacity: 0, transition: { duration: 0.5, delay: 0.5 } },
      onAnimationComplete,
      children: /* @__PURE__ */ jsxDEV("div", { className: "attack-animation-content", children: [
        /* @__PURE__ */ jsxDEV(
          motion.img,
          {
            src: attackAnimation.attacker.image,
            alt: attackAnimation.attacker.name,
            className: `attacker-portrait ${attackAnimation.attacker.type === "hero" ? "hero" : "enemy"}`,
            initial: { scale: 1.5, opacity: 0, x: "-50%", y: "-50%" },
            animate: {
              scale: 1,
              opacity: 1,
              x: "-50%",
              y: "-50%",
              scaleX: attackAnimation.attacker.type === "hero" ? -1 : 1,
              transition: { type: "spring", stiffness: 100, damping: 10, delay: 0.1 }
            }
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 26,
            columnNumber: 25
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          motion.h1,
          {
            initial: { y: 50, opacity: 0 },
            animate: { y: 0, opacity: 1, transition: { duration: 0.4, delay: 0.3 } },
            children: attackAnimation.skill.name
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 40,
            columnNumber: 25
          },
          this
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 25,
        columnNumber: 21
      }, this)
    },
    void 0,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 18,
      columnNumber: 17
    },
    this
  ) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 16,
    columnNumber: 9
  }, this);
}
export {
  AttackAnimation as default
};
