import React from "react";
import ReactDOM from "react-dom/client";
import Page from "./page";
import clipboard from "tauri-plugin-clipboard-api"

clipboard.startListening()

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
