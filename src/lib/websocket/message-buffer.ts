/**
 * WebSocket Message Buffer with ordering support.
 *
 * Buffers incoming WebSocket messages and delivers them in order
 * based on the _seq field. If a message arrives out of order,
 * it's held in the buffer until the gap is filled or a timeout expires.
 */

export interface OrderedMessage {
  _seq: number;
  _topic?: string;
  _timestamp?: string;
  [key: string]: unknown;
}

export class MessageBuffer {
  private nextExpectedSeq = 1;
  private buffer: Map<number, OrderedMessage> = new Map();
  private onMessage: (msg: OrderedMessage) => void;
  private flushTimeout: number;
  private timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * @param onMessage Callback for delivering ordered messages
   * @param flushTimeout Max ms to wait for missing messages before flushing (default 5000ms)
   */
  constructor(onMessage: (msg: OrderedMessage) => void, flushTimeout = 5000) {
    this.onMessage = onMessage;
    this.flushTimeout = flushTimeout;
  }

  /**
   * Accept an incoming message. If it has no _seq, deliver immediately.
   * If it's the next expected seq, deliver it and any buffered follow-ups.
   * If it's out of order, buffer it and set a flush timeout.
   */
  push(msg: OrderedMessage): void {
    const seq = msg._seq;

    // Messages without _seq are delivered immediately
    if (seq == null) {
      this.onMessage(msg);
      return;
    }

    // If this is the first message, sync our counter
    if (this.nextExpectedSeq === 1 && this.buffer.size === 0) {
      this.nextExpectedSeq = seq;
    }

    if (seq === this.nextExpectedSeq) {
      // In order - deliver immediately
      this.onMessage(msg);
      this.nextExpectedSeq = seq + 1;

      // Deliver any buffered messages that are now in order
      while (this.buffer.has(this.nextExpectedSeq)) {
        const buffered = this.buffer.get(this.nextExpectedSeq)!;
        this.buffer.delete(this.nextExpectedSeq);
        this.onMessage(buffered);
        this.nextExpectedSeq++;
      }

      // Clear flush timer if buffer is empty
      if (this.buffer.size === 0 && this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    } else if (seq > this.nextExpectedSeq) {
      // Out of order - buffer it
      this.buffer.set(seq, msg);

      // Start flush timer if not already running
      if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.flushTimeout);
      }
    }
    // seq < nextExpectedSeq means duplicate/old message - ignore
  }

  /**
   * Force-flush all buffered messages in order, regardless of gaps.
   */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.buffer.size === 0) return;

    const sorted = [...this.buffer.entries()].sort((a, b) => a[0] - b[0]);
    for (const [seq, msg] of sorted) {
      this.onMessage(msg);
      this.buffer.delete(seq);
      this.nextExpectedSeq = seq + 1;
    }
  }

  /**
   * Reset the buffer state.
   */
  reset(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.buffer.clear();
    this.nextExpectedSeq = 1;
  }
}
