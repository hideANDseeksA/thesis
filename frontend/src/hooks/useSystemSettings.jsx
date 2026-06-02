// src/hooks/useSystemSettings.jsx
import { useEffect, useState } from "react";

const STORAGE_KEY = "admin_settings";

export default function useSystemSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const update = () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        setSettings(cached ? JSON.parse(cached) : null);
      } catch {
        setSettings(null);
      }
    };

    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  return settings;
}
