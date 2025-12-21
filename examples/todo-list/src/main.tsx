import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster } from "@rua/ui";
import "@rua/ui/styles";
import "./style.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);
