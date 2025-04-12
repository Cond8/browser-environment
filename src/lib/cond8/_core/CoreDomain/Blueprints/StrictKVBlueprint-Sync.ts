// src/lib/cond8/_core/CoreDomain/Blueprints/StrictKVBlueprint-Sync.ts
import { CoreBlueprint } from './CoreBlueprint.ts';

export abstract class StrictKVBlueprintSync<
  K extends PropertyKey = PropertyKey,
  V = unknown,
> extends CoreBlueprint {
  abstract has(key: K): boolean;
  abstract optional(key: K): V | undefined;
  abstract set(key: K, value: V): void;
  abstract remove(key: K): void;

  get(key: K, error: Error = new Error(`Key ${String(key)} does not exist`)): V {
    if (!this.has(key)) throw error;
    return this.optional(key) as V;
  }

  add(key: K, value: V, error: Error = new Error(`Key ${String(key)} already exists`)): void {
    if (this.has(key)) throw error;
    this.set(key, value);
  }

  override(
    key: K,
    value: V,
    error: Error = new Error(`Cannot override key ${String(key)} because it does not exist`),
  ): void {
    if (!this.has(key)) throw error;
    this.set(key, value);
  }

  delete(
    key: K,
    error: Error = new Error(`Cannot delete key ${String(key)} because it does not exist`),
  ): void {
    if (!this.has(key)) throw error;
    this.remove(key);
  }
}
