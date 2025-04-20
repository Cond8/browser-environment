// src/features/ollama-api/prompts/assistant-response.ts
import { jsonToDsl } from '../../editor/transpilers-dsl-source/json-to-dsl';
import { WorkflowStep } from '../streaming-logic/phases/types';

export interface AlignmentSection {
  enrich: string;
  analyze: string;
  decide: string;
  format: string;
  String: string;
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

  constructor(step: WorkflowStep) {
    this.name = step.name;
    this.module = step.module;
    this.functionName = step.functionName;
    this.goal = step.goal;
    this.params = step.params;
    this.returns = step.returns;
  }

  set code(code: string) {
    this._code = code;
  }

  get code(): string {
    return this._code;
  }
}

export class AssistantResponse {
  _alignment: AlignmentSection | null = null;
  _workflowInterface: GeneratedStep | null = null;
  _enrich: GeneratedStep | null = null;
  _analyze: GeneratedStep | null = null;
  _decide: GeneratedStep | null = null;
  _format: GeneratedStep | null = null;

  constructor(init?: Partial<AssistantResponse>) {
    Object.assign(this, init);
  }

  get alignment(): AlignmentSection | null {
    return this._alignment;
  }
  set alignment(alignment: AlignmentSection | null) {
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
