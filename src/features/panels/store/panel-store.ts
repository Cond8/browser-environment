import { create } from 'zustand';

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

export const usePanelStore = create<PanelStore>(set => ({
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
}));
