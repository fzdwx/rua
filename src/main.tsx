import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import 'virtual:uno.css';
import '@radix-ui/themes/styles.css';
import './assets/command.css'


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
