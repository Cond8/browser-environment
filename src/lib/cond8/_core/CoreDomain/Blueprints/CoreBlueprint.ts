// src/lib/cond8/_core/CoreDomain/Blueprints/CoreBlueprint.ts

import { FullLifecycleBlueprint } from '../../Lifecycle/LifecycleEventHooks.js';
import { CoreRedprint } from '../Redprints/CoreRedprint.js';

export abstract class CoreBlueprint extends FullLifecycleBlueprint<CoreRedprint> {
  abstract get readonly(): unknown;

  protected constructor(protected readonly key: string) {
    super();
  }

  public close(): void {
    // Close the blueprint to prevent memory leaks
  }
}
