// src/lib/cond8/_core/Metadata/filter-meta-hooks.ts
import { CoreRedprint } from '../CoreDomain/index.ts';
import {
  ActorTestInput,
  ActorTestOutput,
  DirectorTestInput,
  DirectorTestOutput,
  MetaHook,
} from './hooks.ts';

export const filterMetaHooksActor = <C8 extends CoreRedprint>(
  ...metadataRest: unknown[]
): {
  hooks: MetaHook[];
  inputMock?: C8;
  assertFn?: (c8: C8) => void;
} => {
  const hooks: MetaHook[] = [];
  let inputMock: C8 | undefined;
  let assertFn: ((c8: C8) => void) | undefined;

  for (const entry of metadataRest) {
    if (entry instanceof MetaHook) {
      hooks.push(entry);

      if (entry instanceof ActorTestInput) {
        inputMock = entry.inputC8 as C8;
      }

      if (entry instanceof ActorTestOutput) {
        assertFn = entry.outputC8 as (c8: C8) => void;
      }
    }
  }

  return { hooks, inputMock, assertFn };
};

export const filterMetaHooksDirector = <
  In extends Record<string, unknown> = Record<string, unknown>,
  Out = unknown,
>(
  ...metadataRest: unknown[]
): {
  hooks: MetaHook[];
  inputMock?: In;
  assertFn?: (val: Out) => void;
} => {
  const hooks: MetaHook[] = [];
  let inputMock: In | undefined;
  let outputAssertFn: ((val: Out) => void) | undefined;

  for (const entry of metadataRest) {
    if (entry instanceof MetaHook) {
      hooks.push(entry);

      if (isDirectorTestInput<In>(entry)) {
        inputMock = entry.input;
      }

      if (entry instanceof DirectorTestOutput) {
        outputAssertFn = entry.output;
      }
    }
  }

  return { hooks, inputMock, assertFn: outputAssertFn };
};

function isDirectorTestInput<In extends Record<string, unknown> = Record<string, unknown>>(
  hook: MetaHook,
): hook is DirectorTestInput<In> {
  return hook.kind === 'DirectorTestInput';
}
