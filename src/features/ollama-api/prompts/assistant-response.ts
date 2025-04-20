// src/features/ollama-api/prompts/assistant-response.ts
import { jsonToDsl } from '../../editor/transpilers-dsl-source/json-to-dsl';
import { processJsonChunk } from '../../editor/transpilers-json-source/my-json-parser';
import { WorkflowStep } from '../streaming-logic/phases/types';

export interface AlignmentResponseImpl {
  enrich: string;
  analyze: string;
  decide: string;
  format: string;
  String: string;
}

export class AlignmentResponse {
  enrich: string = '';
  analyze: string = '';
  decide: string = '';
  format: string = '';
  String: string;

  constructor(alignmentResponse: string) {
    this.String = alignmentResponse;

    const planSection = this.extractPlanSection(alignmentResponse);
    if (!planSection) return;

    const lines = planSection
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);

    for (const line of lines) {
      if (line.startsWith('1. **Enrich**')) {
        this.enrich = this.extractStepContent(line);
      } else if (line.startsWith('2. **Analyze**')) {
        this.analyze = this.extractStepContent(line);
      } else if (line.startsWith('3. **Decide**')) {
        this.decide = this.extractStepContent(line);
      } else if (line.startsWith('4. **Format**')) {
        this.format = this.extractStepContent(line);
      }
    }
  }

  private extractPlanSection(markdown: string): string | null {
    const planMatch = markdown.match(/### Plan\s*([\s\S]*?)---/);
    return planMatch ? planMatch[1].trim() : null;
  }

  private extractStepContent(line: string): string {
    const match = line.match(/\*\*(.*?)\*\*\s*(.*)/);
    return match ? match[2].trim() : '';
  }
}

export class GeneratedStep implements WorkflowStep {
  readonly name: string;
  readonly module: string;
  readonly functionName: string;
  readonly goal: string;
  readonly params: Record<string, { type: string; description: string }>;
  readonly returns: Record<string, { type: string; description: string }>;

  private getStep(): WorkflowStep {
    return {
      name: this.name,
      module: this.module,
      functionName: this.functionName,
      goal: this.goal,
      params: this.params,
      returns: this.returns,
    };
  }

  private getParamsString(): string {
    return Object.keys(this.params).join(', ');
  }

  private getReturnsString(): string {
    // this returns a string that starts with 'return {...}'
    return `return {${Object.keys(this.returns).join(', ')}}`;
  }

  private _code: string = '';

  get jsDocs(): string {
    return jsonToDsl(this);
  }
  get jsEnclosure(): string {
    return `const ${this.functionName} = (${this.getParamsString()}) => {\n\n${this.getReturnsString}}\n`;
  }
  get String(): string {
    return JSON.stringify(this.getStep());
  }

  constructor(step: string) {
    const json = processJsonChunk(step);

    this.name = json.name;
    this.module = json.module;
    this.functionName = json.functionName;
    this.goal = json.goal;
    this.params = json.params;
    this.returns = json.returns;
  }

  set code(code: string) {
    this._code = code;
  }

  get code(): string {
    return this._code;
  }
}

export class AssistantResponse {
  _alignment: AlignmentResponse | null = null;
  _workflowInterface: GeneratedStep | null = null;
  _enrich: GeneratedStep | null = null;
  _analyze: GeneratedStep | null = null;
  _decide: GeneratedStep | null = null;
  _format: GeneratedStep | null = null;

  constructor(init?: Partial<AssistantResponse>) {
    Object.assign(this, init);
  }

  get alignment(): AlignmentResponse | null {
    return this._alignment;
  }
  set alignment(alignment: AlignmentResponse | null) {
    this._alignment = alignment;
  }

  get workflowInterface(): GeneratedStep | null {
    return this._workflowInterface;
  }
  set workflowInterface(workflowInterface: GeneratedStep | null) {
    this._workflowInterface = workflowInterface;
  }

  get enrich(): GeneratedStep | null {
    return this._enrich;
  }
  set enrich(enrich: GeneratedStep | null) {
    this._enrich = enrich;
  }

  get analyze(): GeneratedStep | null {
    return this._analyze;
  }
  set analyze(analyze: GeneratedStep | null) {
    this._analyze = analyze;
  }

  get decide(): GeneratedStep | null {
    return this._decide;
  }
  set decide(decide: GeneratedStep | null) {
    this._decide = decide;
  }

  get format(): GeneratedStep | null {
    return this._format;
  }
  set format(format: GeneratedStep | null) {
    this._format = format;
  }

  get steps(): Record<string, GeneratedStep | null> {
    return {
      enrich: this.enrich,
      analyze: this.analyze,
      decide: this.decide,
      format: this.format,
    };
  }
}
