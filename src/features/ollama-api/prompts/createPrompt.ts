// src/features/ollama-api/prompts/createPrompt.ts
import { AssistantResponse } from './assistant-response';

export interface PromptContext {
  userReq: string;
  assistantResponse: AssistantResponse;
  step: string;
}

export type CreatePrompt = (ctx: PromptContext) => string;

export const createPrompt = (template: string): CreatePrompt => {
  return ({ userReq, assistantResponse, step }) => {
    return template
      .replace(/{{\s*userReq\s*}}/g, userReq)
      .replace(/{{\s*step\s*}}/g, step)
      .replace(
        /{{\s*assistantResponse\.alignment\.String\s*}}/g,
        assistantResponse.alignment?.String ?? '',
      )
      .replace(
        /{{\s*assistantResponse\.workflowInterface\.String\s*}}/g,
        assistantResponse.workflowInterface?.String ?? '',
      )
      .replace(
        /{{\s*assistantResponse\.enrich\.jsDocs\s*}}/g,
        assistantResponse.enrich?.jsDocs ?? '',
      )
      .replace(
        /{{\s*assistantResponse\.enrich\.jsEnclosure\s*}}/g,
        assistantResponse.enrich?.jsEnclosure ?? '',
      )
      .replace(
        /{{\s*assistantResponse\.analyze\.jsDocs\s*}}/g,
        assistantResponse.analyze?.jsDocs ?? '',
      )
      .replace(
        /{{\s*assistantResponse\.analyze\.jsEnclosure\s*}}/g,
        assistantResponse.analyze?.jsEnclosure ?? '',
      )
      .replace(
        /{{\s*assistantResponse\.decide\.jsDocs\s*}}/g,
        assistantResponse.decide?.jsDocs ?? '',
      )
      .replace(
        /{{\s*assistantResponse\.decide\.jsEnclosure\s*}}/g,
        assistantResponse.decide?.jsEnclosure ?? '',
      )
      .replace(
        /{{\s*assistantResponse\.format\.jsDocs\s*}}/g,
        assistantResponse.format?.jsDocs ?? '',
      )
      .replace(
        /{{\s*assistantResponse\.format\.jsEnclosure\s*}}/g,
        assistantResponse.format?.jsEnclosure ?? '',
      )
      .replace(
        /{{\s*assistantResponse\.enrich\.String\s*}}/g,
        assistantResponse.enrich?.String ?? '',
      )
      .replace(
        /{{\s*assistantResponse\.analyze\.String\s*}}/g,
        assistantResponse.analyze?.String ?? '',
      )
      .replace(
        /{{\s*assistantResponse\.decide\.String\s*}}/g,
        assistantResponse.decide?.String ?? '',
      )
      .replace(/{{\s*assistantResponse\.enrich\.code\s*}}/g, assistantResponse.enrich?.code ?? '')
      .replace(/{{\s*assistantResponse\.analyze\.code\s*}}/g, assistantResponse.analyze?.code ?? '')
      .replace(/{{\s*assistantResponse\.decide\.code\s*}}/g, assistantResponse.decide?.code ?? '');
  };
};
