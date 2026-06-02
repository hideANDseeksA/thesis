import { createContext, useContext, useEffect, useRef, useState } from "react";
import {api} from '@/lib/axios';
import { useTheme } from "@/context/ThemeProvider";

const SystemSettingsContext = createContext(null);

const STORAGE_KEY = "admin_settings";
const FIRST_OPEN_KEY = "first_open_theme_initialized";

/* ---------------- helpers ---------------- */
function hexToHsl(hex) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyPresetTheme(theme) {
  const root = document.documentElement;
  root.style.removeProperty("--primary");
  root.style.removeProperty("--ring");
  root.style.removeProperty("--primary-foreground");
  root.setAttribute("data-theme", theme);
}

function applyCustomTheme(hex) {
  const hsl = hexToHsl(hex);
  const root = document.documentElement;

  root.removeAttribute("data-theme");
  root.style.setProperty("--custom-primary", hsl);
  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--ring", hsl);
  root.style.setProperty("--primary-foreground", "0 0% 100%");
}

function forceLightModeOnce(setTheme) {
  if (localStorage.getItem(FIRST_OPEN_KEY)) return;

  const root = document.documentElement;
  root.setAttribute("data-toolpad-color-scheme", "light");
  setTheme("light");

  localStorage.setItem(FIRST_OPEN_KEY, "true");
}

function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

function setMeta(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

/* ---------------- provider ---------------- */
export function SystemSettingsProvider({ children }) {
  const didRun = useRef(false);
  const { setTheme } = useTheme();

  const [settings, setSettings] = useState(null);
  const [ready, setReady] = useState(false); // NEW

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const sync = async () => {
      try {
        const { data } = await api.get("/system");
        if (!data) return;

        const normalized = {
          appName: data.web_name || "My App",
          slogan: data.slogan || "",
          logoUrl: data.logo_url || "",
          themeColor: data.web_color || "default",
          ticketPrefix: data.residentPrefix || "T-",
          ticketNumberType: data.residentNumberType || "sequential",
          ticketNumberLength: data.residentNumberLength || 6,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

        const finishInit = () => {
          setSettings(normalized);

          document.title = normalized.appName;
          document.documentElement.lang = "en";

          if (normalized.slogan) {
            setMeta("description", normalized.slogan);
          }

          forceLightModeOnce(setTheme);

          if (normalized.themeColor.startsWith("#")) {
            applyCustomTheme(normalized.themeColor);
            setMeta("theme-color", normalized.themeColor);
          } else {
            applyPresetTheme(normalized.themeColor);
          }

          setReady(true); // allow render
        };

        // preload logo
        if (normalized.logoUrl) {
          const img = new Image();
          img.src = normalized.logoUrl;

          img.onload = () => {
            setFavicon(normalized.logoUrl);
            finishInit();
          };

          img.onerror = () => {
            console.warn("Logo failed to load:", normalized.logoUrl);
            setFavicon("/fallback-logo.png");
            finishInit();
          };
        } else {
          finishInit();
        }

      } catch {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          setSettings(JSON.parse(cached));
          setReady(true);
        }
      }
    };

    sync();
  }, [setTheme]);

  if (!ready) return null; // ⬅️ block rendering until assets ready

  return (
    <SystemSettingsContext.Provider value={settings}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  return useContext(SystemSettingsContext);
}
