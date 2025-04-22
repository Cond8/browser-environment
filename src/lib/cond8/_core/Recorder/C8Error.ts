// src/lib/cond8/_core/Recorder/C8Error.ts
import { CoreRedprint } from '../CoreDomain/index.js';
import { LifecyclePayload } from '../Lifecycle/Vacuum.js';
import { RecorderEntry } from './create-recorder.js';

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
    if (error.stack != null) this.stack = error.stack;

    // Copy any enumerable custom properties from the original error
    Object.assign(this, error);
  }
}
