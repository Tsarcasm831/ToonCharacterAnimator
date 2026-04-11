import { jsx } from "react/jsx-runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App.jsx";
const container = document.getElementById("root");
const root = createRoot(container);
root.render(/* @__PURE__ */ jsx(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 7,
  columnNumber: 13
}));

