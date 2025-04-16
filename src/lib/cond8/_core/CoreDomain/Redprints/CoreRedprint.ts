// src/lib/cond8/_core/CoreDomain/Redprints/CoreRedprint.ts
import { CoreBlueprint } from '../Blueprints/CoreBlueprint.ts';
import { StrictKVBlueprintSync } from '../Blueprints/StrictKVBlueprint-Sync.ts';
import { StrictKVBlueprint } from '../Blueprints/StrictKVBlueprint.ts';
import { ConduitUtils, VarUtilsType } from './ConduitUtils.ts';

export abstract class CoreRedprint<T extends object = object> {
  public readonly utils: ConduitUtils<this>;

  public abstract locals: StrictKVBlueprintSync;
  public cache?: StrictKVBlueprint;
  [key: symbol]: CoreBlueprint;

  protected constructor(readonly body: T) {
    this.utils = new ConduitUtils(this);
  }

  get var(): VarUtilsType<this> {
    return this.utils.var;
  }
}
