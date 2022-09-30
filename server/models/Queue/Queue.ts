interface QueueParams<ItemType> {
  id: string;
  queue: ItemType[];
}

export class Queue<ItemType extends { id: string }> {
  id: string;

  queue: ItemType[];

  private random: number[];

  constructor(opts: Partial<QueueParams<ItemType>> = {}) {
    this.id = opts?.id;
    this.queue = opts?.queue || [];
    this.resetRandom();
  }

  get size(): number {
    return this.queue.length;
  }

  get empty(): boolean {
    return this.size === 0;
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

  get(item: string | { id: string }): ItemType {
    if (!item) {
      return undefined;
    }

    return this.queue.find(findItemPredicate(item));
  }

  getAt(index: number): ItemType {
    return this.queue[index];
  }

  private indexOf(item: ItemType): number {
    if (item.id) {
      return this.queue.findIndex(findItemPredicate(item.id));
    } else {
      return this.queue.indexOf(item);
    }
  }
}

function findItemPredicate(identifier: string | { id: string }) {
  return (qItem: { id: string }) =>
    typeof identifier === "string"
      ? qItem.id === identifier
      : qItem.id === identifier.id;
}
