// src/features/ollama-api/streaming-logic/phases/js/wrapper.ts
import { useVFSStore } from '@/features/vfs/store/vfs-store';
import { WorkflowStep } from '../types';

export async function* generateCodeFunction(
  curriedChatFn: () => AsyncGenerator<string, string, unknown>,
  step: WorkflowStep,
): AsyncGenerator<string, string, unknown> {
  const code = useVFSStore.getState().getServiceImplementation(step);
  if (code) {
    yield code;
    return '';
  }
  return yield* curriedChatFn();
}
