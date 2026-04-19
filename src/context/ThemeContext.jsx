import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, DARK_COLORS } from '../constants/theme';

const THEME_KEY = 'fashiq_dark_mode';
const LEGACY_THEME_KEY = 'stylesync_dark_mode';

const ThemeContext = createContext({
  isDark: false,
  colors: COLORS,
  toggleDark: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([THEME_KEY, LEGACY_THEME_KEY])
      .then(entries => {
        const values = new Map(entries);
        const next = values.get(THEME_KEY) ?? values.get(LEGACY_THEME_KEY);
        if (next === 'true') setIsDark(true);
        if (values.get(LEGACY_THEME_KEY) != null) {
          if (values.get(THEME_KEY) == null && next != null) AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
          AsyncStorage.removeItem(LEGACY_THEME_KEY).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  function toggleDark() {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, String(next)).catch(() => {});
      AsyncStorage.removeItem(LEGACY_THEME_KEY).catch(() => {});
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? DARK_COLORS : COLORS, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
