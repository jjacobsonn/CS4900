import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

async function bootstrap() {
  // MSW is to opt-in for local mock mode; default runtime uses real backend + DB.
  const useMsw = import.meta.env.VITE_USE_MSW === "true";
  const isTest = import.meta.env.MODE === "test";
  if (useMsw && !isTest) {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

bootstrap();
