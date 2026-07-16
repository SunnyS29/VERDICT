import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Verdict from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Verdict />
  </StrictMode>
);
