import { CoreBlueprint } from '../../../_core';

export class AssistantAccService extends CoreBlueprint {
  private acc = new Set<string>();

  constructor() {
    super('assistAcc');
  }

  get readonly() {
    return this.getAccArray();
  }

  add(content: string) {
    this.acc.add(content);
  }

  clear() {
    this.acc.clear();
  }

  getAcc(): string {
    return this.getAccArray().join('\n\n---\n\n');
  }

  getAccArray(): string[] {
    return Array.from(this.acc);
  }
}
