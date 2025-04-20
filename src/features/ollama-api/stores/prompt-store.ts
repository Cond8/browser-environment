// src/features/ollama-api/stores/prompt-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createPrompt, PromptContext } from '../prompts/createPrompt';
import {
  DEFAULT_ASSISTANT_PROMPTS,
  DEFAULT_SYSTEM_PROMPTS,
  DEFAULT_USER_PROMPTS,
} from '../prompts/prompts';

type PromptKey =
  | 'alignment'
  | 'interface'
  | 'steps'
  | 'codegen'
  | 'codegen_enrich'
  | 'codegen_analyze'
  | 'codegen_decide'
  | 'codegen_format'
  | 'user_alignment'
  | 'user_interface'
  | 'user_enrich'
  | 'user_analyze'
  | 'user_decide'
  | 'user_format'
  | 'assistant_enrich'
  | 'assistant_analyze'
  | 'assistant_decide'
  | 'assistant_codegen_enrich'
  | 'assistant_codegen_analyze'
  | 'assistant_codegen_decide';

type PromptStore = {
  makePrompt: (key: PromptKey, ctx: PromptContext) => string;
  setPromptByKey: (key: PromptKey, value: string) => void;
} & {
  [K in PromptKey]: string;
};

export const usePromptStore = create<PromptStore>()(
  persist(
    immer((set, get) => {
      const internal: { [K in PromptKey]: string } = {
        alignment: DEFAULT_SYSTEM_PROMPTS.ALIGNMENT,
        interface: DEFAULT_SYSTEM_PROMPTS.INTERFACE,
        steps: DEFAULT_SYSTEM_PROMPTS.STEPS,
        codegen: DEFAULT_SYSTEM_PROMPTS.CODEGEN,
        codegen_enrich: DEFAULT_USER_PROMPTS.CODEGEN_ENRICH,
        codegen_analyze: DEFAULT_USER_PROMPTS.CODEGEN_ANALYZE,
        codegen_decide: DEFAULT_USER_PROMPTS.CODEGEN_DECIDE,
        codegen_format: DEFAULT_USER_PROMPTS.CODEGEN_FORMAT,
        user_alignment: DEFAULT_USER_PROMPTS.ALIGNMENT,
        user_interface: DEFAULT_USER_PROMPTS.INTERFACE,
        user_enrich: DEFAULT_USER_PROMPTS.ENRICH,
        user_analyze: DEFAULT_USER_PROMPTS.ANALYZE,
        user_decide: DEFAULT_USER_PROMPTS.DECIDE,
        user_format: DEFAULT_USER_PROMPTS.FORMAT,
        assistant_enrich: DEFAULT_ASSISTANT_PROMPTS.ENRICH,
        assistant_analyze: DEFAULT_ASSISTANT_PROMPTS.ANALYZE,
        assistant_decide: DEFAULT_ASSISTANT_PROMPTS.DECIDE,
        assistant_codegen_enrich: DEFAULT_ASSISTANT_PROMPTS.CODEGEN_ENRICH,
        assistant_codegen_analyze: DEFAULT_ASSISTANT_PROMPTS.CODEGEN_ANALYZE,
        assistant_codegen_decide: DEFAULT_ASSISTANT_PROMPTS.CODEGEN_DECIDE,
      };

      return {
        ...internal,
        makePrompt: (key, ctx) => {
          const template = get()[key];
          return createPrompt(template)(ctx);
        },
        setPromptByKey: (key, template) => {
          set(state => {
            state[key] = template;
          });
        },
      };
    }),
    {
      name: 'prompt-store',
    },
  ),
);
