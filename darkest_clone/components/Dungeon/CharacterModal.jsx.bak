import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
function CharacterModal({ character, onClose }) {
  if (!character) return null;
  const stats = [
    { label: "HP", value: `${character.hp} / ${character.maxHp}` },
    { label: "Damage", value: character.damage },
    { label: "Speed", value: character.speed },
    { label: "Position", value: character.position }
  ];
  if (character.type === "hero") {
    stats.splice(1, 0, { label: "Stress", value: `${character.stress} / ${character.maxStress}` });
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxDEV("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxDEV("button", { className: "modal-close-button", onClick: onClose, children: "\xD7" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 20,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
      /* @__PURE__ */ jsxDEV("h2", { children: character.name }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 22,
        columnNumber: 21
      }, this),
      character.affliction && /* @__PURE__ */ jsxDEV("div", { className: "modal-affliction", children: character.affliction }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 23,
        columnNumber: 47
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 21,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "modal-sprite-container", children: /* @__PURE__ */ jsxDEV("img", { src: character.image, alt: character.name, className: `modal-sprite ${character.type === "enemy" ? "enemy-sprite" : ""}` }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 27,
        columnNumber: 25
      }, this) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 26,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "modal-stats", children: [
        /* @__PURE__ */ jsxDEV("h3", { children: "Stats" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 30,
          columnNumber: 25
        }, this),
        /* @__PURE__ */ jsxDEV("ul", { children: stats.map((stat) => /* @__PURE__ */ jsxDEV("li", { children: [
          /* @__PURE__ */ jsxDEV("span", { children: [
            stat.label,
            ":"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 34,
            columnNumber: 37
          }, this),
          /* @__PURE__ */ jsxDEV("span", { children: stat.value }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 35,
            columnNumber: 37
          }, this)
        ] }, stat.label, true, {
          fileName: "<stdin>",
          lineNumber: 33,
          columnNumber: 33
        }, this)) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 29,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 25,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "modal-skills", children: [
      /* @__PURE__ */ jsxDEV("h3", { children: "Skills" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 42,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("ul", { children: character.skills.map((skill) => /* @__PURE__ */ jsxDEV("li", { children: skill.name }, skill.name, false, {
        fileName: "<stdin>",
        lineNumber: 45,
        columnNumber: 29
      }, this)) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 43,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 41,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 19,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 18,
    columnNumber: 9
  }, this);
}
export {
  CharacterModal as default
};
