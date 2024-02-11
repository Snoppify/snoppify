import fs from "fs";
import { ObjectWithID, Repository } from "./Repository";

export class JSONRepository<T extends ObjectWithID> extends Repository<T> {
  readonly path: string = "data/json/";

  private name: string;

  private readonly encoding = "utf8";

  private ModelClass: { new (...args): T };

  private pathExists = false;

  protected store: { [id: string]: T };

  constructor(opts: {
    name: string;
    path?: string;
    modelClass?: { new (data: T): T };
  }) {
    super();

    this.name = opts.name;
    this.ModelClass = opts.modelClass;

    if (opts.path) {
      this.path = opts.path;
    }

    this.init();
  }

  private init() {
    try {
      const fileContent = fs.readFileSync(this.fullPath(), {
        encoding: this.encoding,
      });
      this.store = JSON.parse(fileContent);
      this.pathExists = true;
    } catch (error) {
      this.store = {};
      this.writeRepoToFile(true);
    }
  }

  private writeRepoToFile(synchronous?: false): Promise<void>;
  private writeRepoToFile(synchronous: true): void;
  private writeRepoToFile(synchronous: any): any {
    this.createDirectoryAtPath();

    return (synchronous ? fs.writeFileSync : fs.promises.writeFile)(
      this.fullPath(),
      JSON.stringify(this.store),
      this.encoding,
    );
  }

  private createDirectoryAtPath() {
    if (!this.pathExists) {
      fs.mkdirSync(this.path, { recursive: true });
    }
  }

  private fullPath() {
    return `${this.path + this.name}.json`;
  }

  upsave(object: T): Promise<T> {
    this.store[object.id] = JSON.parse(JSON.stringify(object));
    return this.writeRepoToFile().then(() => this.get(object.id));
  }

  get(id: string): Promise<T> {
    const result = this.store[id] && JSON.parse(JSON.stringify(this.store[id]));
    return Promise.resolve(result ? this.instantiateObject(result) : undefined);
  }

  getBy(key: keyof T, value: any): Promise<T> {
    const storeKeys = Object.keys(this.store);
    for (let i = 0; i < storeKeys.length; i += 1) {
      const entry = this.store[storeKeys[i]];
      if (key in entry && entry[key] === value) {
        const result = entry && JSON.parse(JSON.stringify(entry));
        return Promise.resolve(this.instantiateObject(result));
      }
    }
    return Promise.resolve(undefined);
  }

  private instantiateObject(obj: T) {
    return this.ModelClass ? new this.ModelClass(obj) : obj;
  }

  delete(id: string): Promise<void> {
    delete this.store[id];
    return this.writeRepoToFile();
  }

  getAll(): Promise<T[]> {
    return Promise.resolve(
      Object.values(this.store).map((o) => this.instantiateObject(o)),
    );
  }

  getAllBy(key: keyof T, value: any): Promise<T[]> {
    const storeKeys = Object.keys(this.store);
    return Promise.resolve(
      storeKeys
        .filter(
          (storeKey) =>
            key in this.store[storeKey] && this.store[storeKey][key] === value,
        )
        .map((storeKey) => {
          const result = JSON.parse(JSON.stringify(this.store[storeKey]));
          return this.instantiateObject(result);
        }),
    );
  }
}
