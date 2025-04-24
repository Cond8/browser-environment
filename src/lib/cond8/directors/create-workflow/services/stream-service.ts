import { useStreamSourceStore } from '@/features/ollama-api/streaming-logic/infra/stream-source-store';
import { CoreBlueprint } from '../../../_core';

export class StreamService extends CoreBlueprint {
  private source = useStreamSourceStore.getState();

  constructor() {
    super('stream');
  }

  get readonly() {
    return null;
  }

  set isStreaming(value: boolean) {
    this.source.setIsStreaming(value);
  }

  addChunk(chunk: string) {
    this.source.addChunk(chunk);
  }
}
