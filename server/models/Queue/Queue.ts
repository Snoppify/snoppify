import { QueueTrack } from "./QueueTrack";

interface QueueParams<ItemType> {
  id: string;
  queue: ItemType[];
}

export class Queue<ItemType extends { id: string } = QueueTrack> {
  id: string;

  queue: ItemType[];

  private cursor: number;

  private random: number[];

  constructor(opts: Partial<QueueParams<ItemType>> = {}) {
    this.id = opts?.id;
    this.queue = opts?.queue || [];
    this.resetCursor();
  }

  get top() {
    return this.queue[0];
  }

  get size() {
    return this.queue.length;
  }

  get empty() {
    return this.size === 0;
  }

  clear() {
    this.queue = [];
  }

  resetCursor() {
    this.cursor = 0;
    this.random = this.queue.map((e, i) => i);
  }

  /**
   * @param  {mixed} item Item
   */
  add(item: ItemType) {
    this.queue.push(item);
  }

  /**
   * @param  {mixed} item Item or identifier
   */
  remove(item: ItemType) {
    const index = this.indexOf(item);
    if (index === -1) {
      return null;
    }
    return this.queue.splice(index, 1)[0];
  }

  removeAt(index: number) {
    const item = this.getAt(index);
    if (!item) {
      return null;
    }
    return this.queue.splice(index, 1)[0];
  }

  next() {
    return this.queue.shift() || null;
  }

  nextAtCursor() {
    const item = this.getAt(this.cursor);
    if (item) {
      // increment cursor
      this.cursor = (this.cursor + 1) % this.size;
    } else {
      // something went wrong
      this.resetCursor();
    }
    return item;
  }

  nextRandomCursor() {
    if (this.random.length === 0) {
      this.resetCursor();
    }
    const i = Math.floor(Math.random() * this.random.length);
    const item = this.getAt(this.random[i]);
    if (item) {
      // remove index
      this.random.splice(i, 1);
    } else {
      // something went wrong
      this.resetCursor();
    }
    return item;
  }

  /**
   * @param  {mixed} item Item or identifier
   * @return {mixed}      Item
   */
  get(item: string | { id: string }) {
    if (!item) {
      return undefined;
    }

    return this.queue.find((qItem) =>
      typeof item === "string" ? qItem.id === item : qItem.id === item.id,
    );
  }

  /**
   * @param  {int}   index Index
   * @return {mixed}       Item
   */
  getAt(index: number) {
    return this.queue[index] || null;
  }

  /**
   * @param  {mixed} item Item or identifier
   * @return {int}        Index of item
   */
  indexOf(item: ItemType) {
    if (typeof this.id !== "undefined") {
      return this.queue.findIndex(
        (i) => i[this.id] === item[this.id] || i[this.id] === item,
      );
    } else {
      return this.queue.indexOf(item);
    }
  }

  /**
   * @param  {mixed} item Item or identifier
   * @return {boolean}    True if the item is at the end of the queue
   */
  isLast(item: ItemType) {
    const index = this.indexOf(item);
    return index === this.size - 1;
  }

  toString() {
    return JSON.stringify(this.queue);
  }
}
