// src/features/panels/store/panel-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface PanelSettings {
  isCollapsed: boolean;
  position: 'left' | 'right';
  width: number;
}

interface PanelStore {
  settings: PanelSettings;
  setSettings: (settings: Partial<PanelSettings>) => void;
  toggleCollapse: () => void;
}

const defaultSettings: PanelSettings = {
  isCollapsed: false,
  position: 'right',
  width: 300,
};

export const usePanelStore = create<PanelStore>()(
  persist(
    immer(set => ({
      settings: defaultSettings,
      setSettings: newSettings =>
        set(state => ({
          settings: { ...state.settings, ...newSettings },
        })),
      toggleCollapse: () =>
        set(state => ({
          settings: {
            ...state.settings,
            isCollapsed: !state.settings.isCollapsed,
          },
        })),
    })),
    {
      name: 'panel-storage',
      partialize: state => ({
        settings: state.settings,
      }),
    },
  ),
);
