/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

// Tokenni customization: the site is dark-only. There is no light / system
// theme choice anywhere in the UI, so this provider always resolves to dark,
// ignoring any previously stored theme preference or OS setting.
type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = Exclude<Theme, 'system'>

const DEFAULT_THEME: Theme = 'dark'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  defaultTheme: Theme
  resolvedTheme: ResolvedTheme
  theme: Theme
  setTheme: (theme: Theme) => void
  resetTheme: () => void
}

const initialState: ThemeProviderState = {
  defaultTheme: DEFAULT_THEME,
  resolvedTheme: 'dark',
  theme: DEFAULT_THEME,
  setTheme: () => null,
  resetTheme: () => null,
}

const ThemeContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  ...props
}: ThemeProviderProps) {
  const [theme] = useState<Theme>('dark')
  const [resolvedTheme] = useState<ResolvedTheme>('dark')

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add('dark')
  }, [])

  // Kept for API compatibility with existing callers; theme is locked to dark.
  const setTheme = useCallback((_theme: Theme) => {
    // No-op: Tokenni is dark-only.
  }, [])

  const resetTheme = useCallback(() => {
    // No-op: Tokenni is dark-only.
  }, [])

  const contextValue = useMemo(
    () => ({
      defaultTheme,
      resolvedTheme,
      resetTheme,
      theme,
      setTheme,
    }),
    [defaultTheme, resolvedTheme, resetTheme, theme, setTheme]
  )

  return (
    <ThemeContext value={contextValue} {...props}>
      {children}
    </ThemeContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
