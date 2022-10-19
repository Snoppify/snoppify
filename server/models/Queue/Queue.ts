import { findItemPredicate, StaticQueue } from "./StaticQueue";

interface QueueParams<ItemType> {
  id: string;
  queue: ItemType[];
}

export class Queue<
  ItemType extends { id: string },
> extends StaticQueue<ItemType> {
  private random: number[];

  constructor(opts: Partial<QueueParams<ItemType>> = {}) {
    super(opts);
    this.resetRandom();
  }

  clear() {
    this.queue = [];
    this.random = [];
  }

  private resetRandom() {
    this.random = this.queue.map((e, i) => i);
  }

  add(item: ItemType) {
    this.queue.push(item);
  }

  /**
   * @return  {ItemType} The removed item
   */
  remove(item: ItemType): ItemType {
    const index = this.indexOf(item);
    if (index === -1) {
      return undefined;
    }
    return this.queue.splice(index, 1)[0];
  }

  /** Pops and removes the next song from the queue */
  next(): ItemType | undefined {
    return this.queue.shift();
  }

  nextRandomCursor(): ItemType {
    if (this.random.length === 0) {
      this.resetRandom();
    }
    const i = Math.floor(Math.random() * this.random.length);
    const item = this.getAt(this.random[i]);
    if (item) {
      // remove index
      this.random.splice(i, 1);
    } else {
      // something went wrong
      this.resetRandom();
    }
    return item;
  }

  private indexOf(item: ItemType): number {
    if (item.id) {
      return this.queue.findIndex(findItemPredicate(item.id));
    } else {
      return this.queue.indexOf(item);
    }
  }
}
