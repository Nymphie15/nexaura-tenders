import { describe, it, expect, vi, beforeEach } from "vitest";
import { MessageBuffer, OrderedMessage } from "@/lib/websocket/message-buffer";

describe("MessageBuffer", () => {
  let delivered: OrderedMessage[];
  let buffer: MessageBuffer;

  beforeEach(() => {
    delivered = [];
    buffer = new MessageBuffer((msg) => delivered.push(msg));
  });

  it("should deliver messages without _seq immediately", () => {
    buffer.push({ _seq: undefined as any, type: "test" });
    expect(delivered).toHaveLength(1);
    expect(delivered[0].type).toBe("test");
  });

  it("should deliver in-order messages immediately", () => {
    buffer.push({ _seq: 1, type: "first" });
    buffer.push({ _seq: 2, type: "second" });
    buffer.push({ _seq: 3, type: "third" });

    expect(delivered).toHaveLength(3);
    expect(delivered[0]._seq).toBe(1);
    expect(delivered[1]._seq).toBe(2);
    expect(delivered[2]._seq).toBe(3);
  });

  it("should buffer out-of-order messages and deliver when gap fills", () => {
    buffer.push({ _seq: 1, type: "first" });
    buffer.push({ _seq: 3, type: "third" }); // out of order - buffered
    expect(delivered).toHaveLength(1);

    buffer.push({ _seq: 2, type: "second" }); // fills gap
    expect(delivered).toHaveLength(3);
    expect(delivered[1]._seq).toBe(2);
    expect(delivered[2]._seq).toBe(3);
  });

  it("should flush buffered messages on timeout", async () => {
    const fastBuffer = new MessageBuffer((msg) => delivered.push(msg), 100);

    fastBuffer.push({ _seq: 1, type: "first" });
    fastBuffer.push({ _seq: 3, type: "third" }); // gap at seq 2

    expect(delivered).toHaveLength(1);

    // Wait for flush timeout
    await new Promise((r) => setTimeout(r, 150));

    expect(delivered).toHaveLength(2);
    expect(delivered[1]._seq).toBe(3);
  });

  it("should ignore duplicate/old messages", () => {
    buffer.push({ _seq: 1, type: "first" });
    buffer.push({ _seq: 2, type: "second" });
    buffer.push({ _seq: 1, type: "duplicate" }); // old message

    expect(delivered).toHaveLength(2);
  });

  it("should reset state correctly", () => {
    buffer.push({ _seq: 1, type: "first" });
    buffer.reset();
    buffer.push({ _seq: 1, type: "new-first" });

    expect(delivered).toHaveLength(2);
    expect(delivered[1].type).toBe("new-first");
  });

  it("should handle manual flush", () => {
    buffer.push({ _seq: 1, type: "first" });
    buffer.push({ _seq: 5, type: "fifth" });
    buffer.push({ _seq: 3, type: "third" });

    expect(delivered).toHaveLength(1);

    buffer.flush();
    expect(delivered).toHaveLength(3);
    // Flushed in order: 3, 5
    expect(delivered[1]._seq).toBe(3);
    expect(delivered[2]._seq).toBe(5);
  });
});
