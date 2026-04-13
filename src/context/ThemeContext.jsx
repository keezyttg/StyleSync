import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, DARK_COLORS } from '../constants/theme';

const THEME_KEY = 'stylesync_dark_mode';

const ThemeContext = createContext({
  isDark: false,
  colors: COLORS,
  toggleDark: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then(val => { if (val === 'true') setIsDark(true); })
      .catch(() => {});
  }, []);

  function toggleDark() {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, String(next)).catch(() => {});
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
