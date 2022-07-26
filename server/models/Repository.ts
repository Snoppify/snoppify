export abstract class Repository<T extends ObjectWithID> {
  abstract upsave(object: T): Promise<void>;
  abstract get(id: string): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract getAll?(): Promise<T[]>;
}

export interface ObjectWithID {
  id: string;
}
