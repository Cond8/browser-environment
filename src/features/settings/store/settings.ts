// src/features/settings/store/settings.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type Theme = 'dark' | 'light' | 'system';

interface SettingsState {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  showShortcuts: boolean;
  setTheme: (theme: Theme) => void;
  applyTheme: () => void;
  setShowShortcuts: (show: boolean) => void;
}

const getResolvedTheme = (theme: Theme): 'dark' | 'light' => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set, get) => ({
      theme: 'system',
      resolvedTheme: getResolvedTheme('system'),
      showShortcuts: true,
      setTheme: theme => {
        set(state => {
          state.theme = theme;
          // Update localStorage theme
          if (theme === 'system') {
            localStorage.removeItem('theme');
          } else {
            localStorage.theme = theme;
          }
        });
        get().applyTheme();
      },
      setShowShortcuts: show => {
        set(state => {
          state.showShortcuts = show;
        });
      },
      applyTheme: () => {
        const t = get().theme;
        const root = document.documentElement;
        const resolved = getResolvedTheme(t);

        set(state => {
          state.resolvedTheme = resolved;
        });

        if (resolved === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      },
    })),
    {
      name: 'settings-storage',
      // Only persist the theme setting
      partialize: state => ({
        theme: state.theme,
      }),
    },
  ),
);
