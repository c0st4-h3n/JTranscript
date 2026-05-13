import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Settings } from "./components/Settings";
import "./styles.css";

function getWindowLabel(): string {
  try {
    // Importação assíncrona evita falha em browser puro (vite dev sem tauri shell)
    // mas usamos só pra detectar a janela atual — fallback seguro pra "main".
    const w = (window as unknown as { __TAURI_INTERNALS__?: { metadata?: { currentWindow?: { label?: string } } } })
      .__TAURI_INTERNALS__;
    return w?.metadata?.currentWindow?.label ?? "main";
  } catch {
    return "main";
  }
}

const label = getWindowLabel();
const Root = label === "settings" ? Settings : App;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
