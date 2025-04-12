// src/lib/cond8/_core/CoreDomain/Blueprints/CoreBlueprint.ts

export abstract class CoreBlueprint {
  abstract get readonly(): unknown;

  protected constructor(protected readonly key: string) {}

  public close(): void {
    // Close the blueprint to prevent memory leaks
  }
}
