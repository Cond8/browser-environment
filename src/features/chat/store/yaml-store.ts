// src/features/chat/store/yaml-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface CodeStoreState {
  yamlByMessageId: Record<number, string>;
  saveYaml: (messageId: number, yaml: string) => void;
  clearYaml: (messageId: number) => void;
}

export const useCodeStore = create<CodeStoreState>()(
  immer(set => ({
    yamlByMessageId: {},

    saveYaml: (messageId, yaml) =>
      set(state => {
        state.yamlByMessageId[messageId] = yaml;
      }),

    clearYaml: messageId =>
      set(state => {
        delete state.yamlByMessageId[messageId];
      }),
  })),
);
