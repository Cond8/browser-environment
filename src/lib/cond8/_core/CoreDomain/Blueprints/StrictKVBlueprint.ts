// src/lib/cond8/_core/CoreDomain/Blueprints/StrictKVBlueprint.ts
import { StrictKVBlueprintAsync } from './StrictKVBlueprint-Async.js';
import { StrictKVBlueprintSync } from './StrictKVBlueprint-Sync.js';

export type StrictKVBlueprint = StrictKVBlueprintAsync | StrictKVBlueprintSync;
