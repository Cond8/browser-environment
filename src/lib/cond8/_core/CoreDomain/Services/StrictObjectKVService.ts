// src/lib/cond8/_core/CoreDomain/Services/StrictObjectKVService.ts
import { StrictKVBlueprintSync } from '../Blueprints/StrictKVBlueprint-Sync.ts';

export class StrictObjectKVService<
  K extends PropertyKey = PropertyKey,
  V = unknown,
> extends StrictKVBlueprintSync<K, V> {
  #store: Readonly<Record<K, V>>;

  constructor(key: string, initial: Record<K, V> = {} as Record<K, V>) {
    super(key);
    this.#store = Object.freeze({ ...initial });
  }

  has(key: K): boolean {
    return key in this.#store;
  }

  optional(key: K): V | undefined {
    return this.#store[key];
  }

  set(key: K, value: V): void {
    this.#store = Object.freeze({ ...this.#store, [key]: value });
  }

  remove(key: K): void {
    const entries = Object.entries(this.#store).filter(([k]) => k !== key);
    this.#store = Object.freeze(Object.fromEntries(entries) as Record<K, V>);
  }

  get readonly(): Record<K, V> {
    return Object.freeze({ ...this.#store });
  }
}
