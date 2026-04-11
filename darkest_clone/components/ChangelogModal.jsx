import { jsx } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
function ChangelogModal({ onClose }) {
  const [changelog, setChangelog] = useState("Loading changelog...");
  useEffect(() => {
    fetch("./CHANGELOG.md").then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.text();
    }).then((text) => setChangelog(text)).catch((error) => {
      console.error("Error fetching changelog:", error);
      setChangelog("Could not load changelog.");
    });
  }, []);
  return /* @__PURE__ */ jsx("div", { className: "modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsx("div", { className: "changelog-modal-content", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsx("button", { className: "modal-close-button", onClick: onClose, children: "\xD7" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 24,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsx("div", { className: "modal-header", children: /* @__PURE__ */ jsx("h2", { children: "Changelog" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 26,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 25,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsx("div", { className: "modal-body", children: /* @__PURE__ */ jsx("pre", { className: "changelog-text", children: changelog }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 29,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 28,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 23,
    columnNumber: 13
  }, this) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 22,
    columnNumber: 9
  }, this);
}
export {
  ChangelogModal as default
};

