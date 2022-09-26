import { Queue } from "./Queue";

describe("Queue", () => {
  it("creates a new queue with data", () => {
    const queue = new Queue<{ id: string; value: number }>({
      id: "QUEUE_ID",
      queue: [{ id: "ITEM_ID", value: 1 }],
    });

    expect(queue).toEqual(
      // objectContaining to not having to check private variables
      expect.objectContaining({
        id: "QUEUE_ID",
        queue: [{ id: "ITEM_ID", value: 1 }],
      }),
    );
  });

  it("creates an empty queue", () => {
    const queue = new Queue();

    expect(queue).toEqual(
      expect.objectContaining({
        id: undefined,
        queue: [],
      }),
    );
  });

  it("gets the correct size", () => {
    const emptyQueue = createTestQueue(0);
    const oneItem = createTestQueue(1);
    const twoItems = createTestQueue(2);

    expect(emptyQueue.size).toBe(0);
    expect(oneItem.size).toBe(1);
    expect(twoItems.size).toBe(2);
  });

  it("knows if the queue is empty", () => {
    const emptyQueue = createTestQueue(0);
    const oneItem = createTestQueue(1);

    expect(emptyQueue.empty).toBe(true);
    expect(oneItem.empty).toBe(false);
  });

  it("clears the queue", () => {
    const queue = createTestQueue(2);

    queue.clear();

    expect(queue.empty).toBe(true);
  });

  it("adds an item to the end", () => {
    const queue = createTestQueue(1);

    queue.add({ id: "new item", value: 13 });

    expect(queue.size).toBe(2);
    expect(queue.getAt(1)).toEqual({ id: "new item", value: 13 });
  });

  it("removes an item by comparison", () => {
    const queue = createTestQueue(3);
    const first = queue.getAt(0);
    const middle = queue.getAt(1);
    const last = queue.getAt(2);

    // remove middle item
    const removed = queue.remove(queue.getAt(1));
    expect(middle).toBe(removed);

    expect(queue.size).toBe(2);
    expect(queue.getAt(0)).toEqual(first);
    expect(queue.getAt(1)).toEqual(last);
  });

  it("pops the top item from the queue", () => {
    const queue = new Queue<{ id: string; value: number }>({
      id: "QUEUE_ID",
      queue: [
        { id: "ITEM_1", value: 1 },
        { id: "ITEM_2", value: 2 },
      ],
    });

    expect(queue.size).toBe(2);
    expect(queue.next()).toEqual({ id: "ITEM_1", value: 1 });
    expect(queue.size).toBe(1);
    expect(queue.next()).toEqual({ id: "ITEM_2", value: 2 });
    expect(queue.empty).toBe(true);
  });

  it("gives a different random item every time", () => {
    const testQueueLength = 20;
    const queue = createTestQueue(testQueueLength);

    const itemsInRandomOrder = [];

    for (let i = 0; i < testQueueLength; i++) {
      const randomItem = queue.nextRandomCursor();
      expect(itemsInRandomOrder).not.toContain(randomItem);
      itemsInRandomOrder.push(randomItem);
    }

    // Check that the order is indeed random. This can fail due to
    // chance, but it's very very very unlikely to do so twice in a row
    // - if it does, there's a bug
    expect(queue.queue).not.toEqual(itemsInRandomOrder);
  });

  it("can get more random items than queue length", () => {
    const testQueueLength = 20;
    const queue = createTestQueue(testQueueLength);

    for (let i = 0; i < testQueueLength + 5; i++) {
      const randomItem = queue.nextRandomCursor();
      expect(queue.get(randomItem)).toBeDefined();
    }
  });

  it("gets an item by id", () => {
    const queue = new Queue<{ id: string; value: number }>({
      id: "QUEUE_ID",
      queue: [
        { id: "ITEM_1", value: 1 },
        { id: "ITEM_2", value: 2 },
      ],
    });

    expect(queue.get("ITEM_1")).toEqual({ id: "ITEM_1", value: 1 });
    expect(queue.get({ id: "ITEM_2" })).toEqual({ id: "ITEM_2", value: 2 });
  });

  it("gets an item by index", () => {
    const queue = new Queue<{ id: string; value: number }>({
      id: "QUEUE_ID",
      queue: [
        { id: "ITEM_1", value: 1 },
        { id: "ITEM_2", value: 2 },
      ],
    });

    expect(queue.getAt(0)).toEqual({ id: "ITEM_1", value: 1 });
    expect(queue.getAt(1)).toEqual({ id: "ITEM_2", value: 2 });
    expect(queue.getAt(2)).toBeUndefined();
  });
});

function createTestQueue(length: number, id = "QUEUE") {
  return new Queue<{ id: string; value: number }>({
    id,
    queue: new Array(length)
      .fill(null)
      .map((_, i) => ({ id: `ITEM_${i}`, value: i })),
  });
}
