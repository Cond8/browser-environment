// src/lib/cond8/_core/CoreDomain/Blueprints/StrictKVBlueprint.ts
import { StrictKVBlueprintAsync } from './StrictKVBlueprint-Async.ts';
import { StrictKVBlueprintSync } from './StrictKVBlueprint-Sync.ts';

export type StrictKVBlueprint = StrictKVBlueprintAsync | StrictKVBlueprintSync;
