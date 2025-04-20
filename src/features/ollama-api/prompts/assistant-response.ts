// src/features/ollama-api/prompts/assistant-response.ts
export interface StepInterface {
  name: string;
  module: string;
  functionName: string;
  goal: string;
  params: Record<string, { type: string; description: string }>;
  returns: Record<string, { type: string; description: string }>;
}

export interface AlignmentSection {
  enrich: string;
  analyze: string;
  decide: string;
  format: string;
  String: string;
}

export interface GeneratedStep extends StepInterface {
  jsDocs: string;
  jsEnclosure: string;
  String: string;
  code: string;
}

export class AssistantResponse {
  alignment: AlignmentSection | null = null;
  interface: GeneratedStep | null = null;
  enrich: GeneratedStep | null = null;
  analyze: GeneratedStep | null = null;
  decide: GeneratedStep | null = null;
  format: GeneratedStep | null = null;

  constructor(init?: Partial<AssistantResponse>) {
    Object.assign(this, init);
  }

  get interfaceString(): string {
    return this.interface ? JSON.stringify(this.interface, null, 2) : '';
  }

  get alignmentString(): string {
    return this.alignment ? JSON.stringify(this.alignment, null, 2) : '';
  }

  // Optional helpers for templating
  get String() {
    return this.alignmentString;
  }
}
