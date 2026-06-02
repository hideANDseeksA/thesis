import { MantineProvider } from '@mantine/core'
import { useTheme } from '@/context/ThemeProvider' // your custom hook

export default function MantineRoute({ children }) {
  const { theme } = useTheme()

  const colorScheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme

  return (
    <MantineProvider
      theme={{ colorScheme }}
      withCssVariables={false}
      withGlobalClasses={false}
    >
      {children}
    </MantineProvider>
  )
}