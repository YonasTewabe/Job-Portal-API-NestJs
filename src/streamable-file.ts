import { Readable } from 'stream';

export class StreamableFile {
  private readonly file: Readable;

  constructor(file: Readable) {
    this.file = file;
  }

  getStream(): Readable {
    return this.file;
  }
}
