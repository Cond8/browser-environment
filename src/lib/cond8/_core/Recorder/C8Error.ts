// src/lib/cond8/_core/Recorder/C8Error.ts
import { CoreRedprint } from '../CoreDomain/index.ts';
import { LifecyclePayload } from '../Lifecycle/Vacuum.ts';
import { RecorderEntry } from './create-recorder.ts';

export class C8Error<C8 extends CoreRedprint> extends Error {
  constructor(
    error: Error,
    public payload: LifecyclePayload<C8>,
    public directorPayload: LifecyclePayload<C8>,
    public recording: RecorderEntry[] = [],
  ) {
    super(error.message);

    // Preserve the original error name and stack
    this.name = error.name || 'C8Error';
    if (error.stack) this.stack = error.stack;

    // Copy any enumerable custom properties from the original error
    Object.assign(this, error);
  }
}
