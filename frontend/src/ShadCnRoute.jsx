// ShadCnRoute.jsx
import { useTheme } from "@/context/ThemeProvider";
import { useEffect, useState } from "react";

/**
 * Wrap ShadCN/Tailwind components and apply dark/light mode automatically.
 * Works like MantineProvider but for Tailwind/ShadCN.
 */
export default function ShadCnRoute({ children }) {
  const { theme } = useTheme(); // "light" | "dark" | "system"
  const [colorScheme, setColorScheme] = useState("light");

  useEffect(() => {
    const root = document.documentElement;

    const resolveTheme = () => {
      let activeTheme = theme;

      // If system mode, detect preference
      if (theme === "system") {
        activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }

      setColorScheme(activeTheme);

      // Apply Tailwind dark/light class globally
      root.classList.remove("light", "dark");
      root.classList.add(activeTheme);
    };

    // Initial theme setup
    resolveTheme();

    // Listen to system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => resolveTheme();
    mediaQuery.addEventListener("change", listener);

    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);

  // Now all children automatically adopt Tailwind dark/light mode
  return <>{children}</>;
}
