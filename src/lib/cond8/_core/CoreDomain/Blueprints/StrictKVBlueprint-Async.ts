// src/lib/cond8/_core/CoreDomain/Blueprints/StrictKVBlueprint-Async.ts
import { CoreBlueprint } from './CoreBlueprint.ts';

export abstract class StrictKVBlueprintAsync<
  K extends PropertyKey = PropertyKey,
  V = unknown,
> extends CoreBlueprint {
  abstract has(key: K): Promise<boolean>;
  abstract optional(key: K): Promise<V | undefined>;
  abstract set(key: K, value: V): Promise<void>;
  abstract remove(key: K): Promise<void>;

  async get(key: K, error: Error = new Error(`Key ${String(key)} does not exist`)): Promise<V> {
    if (!(await this.has(key))) throw error;
    return (await this.optional(key)) as V;
  }

  async add(
    key: K,
    value: V,
    error: Error = new Error(`Key ${String(key)} already exists`),
  ): Promise<void> {
    if (await this.has(key)) throw error;
    await this.set(key, value);
  }

  async override(
    key: K,
    value: V,
    error: Error = new Error(`Cannot override key ${String(key)} because it does not exist`),
  ): Promise<void> {
    if (!(await this.has(key))) throw error;
    await this.set(key, value);
  }

  async delete(
    key: K,
    error: Error = new Error(`Cannot delete key ${String(key)} because it does not exist`),
  ): Promise<void> {
    if (!(await this.has(key))) throw error;
    await this.remove(key);
  }
}
