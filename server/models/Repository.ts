export abstract class Repository<T extends ObjectWithID> {
  abstract upsave(object: T): Promise<T>;
  abstract get(id: string): Promise<T>;
  abstract getBy(key: keyof T, value: any): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract getAll?(): Promise<T[]>;
  abstract getAllBy?(key: keyof T, value: any): Promise<T[]>;
}

export interface ObjectWithID {
  id: string;
}
