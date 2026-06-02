import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./routes/App";
import "./index.css";

import { ThemeProvider,useTheme } from "./context/ThemeProvider";
import { SystemSettingsProvider } from "@/hooks/SystemSettingsProvider";
import { SearchProvider } from "./context/SearchContext";
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "./auth/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext"
import { GoogleOAuthProvider } from "@react-oauth/google";

function ToasterWithTheme() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}    
      position="top-center"
    />
  );
}
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Bootstrap() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <SearchProvider>
          <AuthProvider>
            <NotificationProvider>
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <App />
              </GoogleOAuthProvider>
            </NotificationProvider>
          </AuthProvider>
            <ToasterWithTheme /> 
        </SearchProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SystemSettingsProvider>
      <Bootstrap />
    </SystemSettingsProvider>
  </React.StrictMode>
);

// ── Service Worker Registration ──────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("✅ SW registered:", reg.scope))
      .catch((err) => console.error("❌ SW registration failed:", err));
  });
}