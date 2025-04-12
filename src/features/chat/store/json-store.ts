import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface CodeStoreState {
  jsonByMessageId: Record<number, string>;
  saveJson: (messageId: number, json: string) => void;
  clearJson: (messageId: number) => void;
}

export const useCodeStore = create<CodeStoreState>()(
  immer(set => ({
    jsonByMessageId: {},

    saveJson: (messageId, json) =>
      set(state => {
        state.jsonByMessageId[messageId] = json;
      }),

    clearJson: messageId =>
      set(state => {
        delete state.jsonByMessageId[messageId];
      }),
  })),
); 