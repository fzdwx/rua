import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ToastProvider, NavigationProvider } from "@rua/ui";
import "./style.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ToastProvider>
    <NavigationProvider>
      <React.StrictMode>
        <App />
      </React.StrictMode>
      ,
    </NavigationProvider>
  </ToastProvider>
);
