// src/lib/cond8/_core/CoreDomain/Redprints/CoreRedprint.ts
import { CoreBlueprint } from '../Blueprints/CoreBlueprint.js';
import { StrictKVBlueprintSync } from '../Blueprints/StrictKVBlueprint-Sync.js';
import { StrictKVBlueprint } from '../Blueprints/StrictKVBlueprint.js';
import { ConduitUtils, VarUtilsType } from './ConduitUtils.js';

export abstract class CoreRedprint<T extends object = object> {
  public readonly utils: ConduitUtils<this>;

  public abstract locals: StrictKVBlueprintSync;
  public cache?: StrictKVBlueprint;
  [key: symbol]: CoreBlueprint;

  protected constructor(public readonly body: T) {
    this.utils = new ConduitUtils(this);
  }

  get var(): VarUtilsType {
    return this.utils.var;
  }
}
