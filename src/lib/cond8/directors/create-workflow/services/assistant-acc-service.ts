import { CoreBlueprint } from '../../../_core';

export class AssistantAccService extends CoreBlueprint {
  private acc = new Set<string>();

  constructor() {
    super('assistAcc');
  }

  get readonly() {
    return Array.from(this.acc);
  }

  add(content: string) {
    this.acc.add(content);
  }

  clear() {
    this.acc.clear();
  }

  getAcc(): string {
    return Array.from(this.acc).join('\n\n---\n\n');
  }
}
