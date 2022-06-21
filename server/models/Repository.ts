export interface Repository<T extends ObjectWithID> {
  upsave(object: T): Promise<void>;
  get(id: string): Promise<T>;
  delete(id: string): Promise<void>;
  getAll?(): Promise<T[]>;
}

export interface ObjectWithID {
  id: string;
}
