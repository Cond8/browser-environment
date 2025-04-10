import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light' | 'system';

interface SettingsState {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  applyTheme: () => void;
}

const getResolvedTheme = (theme: Theme): 'dark' | 'light' => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: getResolvedTheme('system'),
      setTheme: theme => {
        set({ theme });
        get().applyTheme();
        // Update localStorage theme
        if (theme === 'system') {
          localStorage.removeItem('theme');
        } else {
          localStorage.theme = theme;
        }
      },
      applyTheme: () => {
        const t = get().theme;
        const root = document.documentElement;
        const resolved = getResolvedTheme(t);
        set({ resolvedTheme: resolved });

        if (resolved === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      },
    }),
    {
      name: 'settings-storage',
      // Only persist the theme setting
      partialize: state => ({ theme: state.theme }),
    },
  ),
);
