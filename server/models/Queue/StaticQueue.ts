interface QueueParams<ItemType> {
  id: string;
  queue: ItemType[];
}

/** "Readonly" queue */
export class StaticQueue<ItemType extends { id: string }> {
  id: string;

  queue: ItemType[];

  constructor(opts: Partial<QueueParams<ItemType>> = {}) {
    this.id = opts?.id;
    this.queue = opts?.queue || [];
  }

  get size(): number {
    return this.queue.length;
  }

  get empty(): boolean {
    return this.size === 0;
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
}

export function findItemPredicate(identifier: string | { id: string }) {
  return (qItem: { id: string }) =>
    typeof identifier === "string"
      ? qItem.id === identifier
      : qItem.id === identifier.id;
}
